import json
from datetime import date
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth import authenticate

from .models import Estudiante, Asistencia, Nota, Alerta, Material
from .services.detector import evaluar_riesgo_estudiante, evaluar_todos_los_estudiantes
from src.notifier import NotificationService


def dashboard_view(request):
    """Renderiza la aplicación de frontend principal (AldaEdu)."""
    return render(request, "index.html")


@csrf_exempt
@require_http_methods(["POST"])
def api_login(request):
    """Autenticación para docentes y tutores."""
    try:
        body = json.loads(request.body.decode("utf-8")) if request.body else {}
    except json.JSONDecodeError:
        return JsonResponse({"success": False, "message": "JSON inválido"}, status=400)

    username = body.get("username", "").strip()
    password = body.get("password", "")

    # Credenciales de demostración por defecto
    if username in ["docente@aldaedu.pe", "docente@aldaedu.edu", "docente@edusync.edu"] and password == "123456":
        return JsonResponse({
            "success": True,
            "token": "aldaedu-token-demo-docente-2026",
            "user": {
                "name": "Profesor Alejandro Rivera",
                "email": "docente@aldaedu.pe",
                "role": "docente"
            }
        })

    # Intentar con usuario registrado en Django
    user = authenticate(username=username, password=password)
    if user:
        return JsonResponse({
            "success": True,
            "token": f"aldaedu-auth-token-{user.id}",
            "user": {
                "name": user.get_full_name() or user.username,
                "email": user.email or username,
                "role": "admin" if user.is_staff else "docente"
            }
        })

    return JsonResponse({"success": False, "message": "Credenciales inválidas. Usa docente@aldaedu.pe / 123456"}, status=401)


def _serialize_student(student):
    """Calcula métricas académicas para un estudiante."""
    asistencias = student.asistencias.all()
    total_asist = asistencias.count()
    presentes = asistencias.filter(presente=True).count()
    tasa_asistencia = round((presentes / total_asist * 100), 1) if total_asist > 0 else 100.0

    notas = student.notas.all()
    promedio_notas = round(sum(float(n.calificacion) for n in notas) / notas.count(), 1) if notas.exists() else None
    ultima_nota = float(notas.order_by("-fecha").first().calificacion) if notas.exists() else None

    # Participación estimada
    if tasa_asistencia >= 85 and (promedio_notas is None or promedio_notas >= 14):
        participacion = "Alta"
    elif tasa_asistencia >= 70 or (promedio_notas is not None and promedio_notas >= 11):
        participacion = "Media"
    else:
        participacion = "Nula"

    alerta_activa = student.alertas.filter(atendida=False).order_by("-fecha").first()
    nivel_riesgo = alerta_activa.nivel_riesgo if alerta_activa else ("bajo" if (tasa_asistencia >= 75 and (promedio_notas or 14) >= 11) else "medio")

    return {
        "id": student.id,
        "nombre": student.nombre,
        "grado": student.grado,
        "tutor_nombre": student.tutor_nombre or "No asignado",
        "tutor_email": student.tutor_email or "",
        "tutor_telefono": student.tutor_telefono or "",
        "asistencia": tasa_asistencia,
        "nota": ultima_nota if ultima_nota is not None else (promedio_notas or 14.0),
        "promedio": promedio_notas or ultima_nota or 14.0,
        "participacion": participacion,
        "nivel_riesgo": nivel_riesgo,
        "alerta_descripcion": alerta_activa.descripcion if alerta_activa else "",
        "alerta_id": alerta_activa.id if alerta_activa else None,
    }


@csrf_exempt
@require_http_methods(["GET", "POST"])
def api_students(request):
    """Listar o crear estudiantes."""
    if request.method == "GET":
        students = Estudiante.objects.prefetch_related("asistencias", "notas", "alertas").all()
        return JsonResponse([_serialize_student(s) for s in students], safe=False)

    try:
        body = json.loads(request.body.decode("utf-8")) if request.body else {}
        nombre = body.get("nombre", "").strip()
        grado = body.get("grado", "5to Secundaria").strip()
        if not nombre:
            return JsonResponse({"success": False, "message": "El nombre es obligatorio"}, status=400)

        student = Estudiante.objects.create(
            nombre=nombre,
            grado=grado,
            tutor_nombre=body.get("tutor_nombre", "").strip(),
            tutor_email=body.get("tutor_email", "").strip(),
            tutor_telefono=body.get("tutor_telefono", "").strip(),
        )

        # Si se enviaron datos iniciales
        if "asistencia" in body:
            Asistencia.objects.create(estudiante=student, fecha=date.today(), presente=float(body["asistencia"]) >= 70)
        if "nota" in body:
            Nota.objects.create(estudiante=student, curso=body.get("curso", "General"), calificacion=float(body["nota"]), fecha=date.today())

        # Evaluar riesgo inicial
        evaluar_riesgo_estudiante(student)

        return JsonResponse({"success": True, "data": _serialize_student(student)}, status=201)
    except Exception as e:
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@csrf_exempt
@require_http_methods(["GET", "DELETE"])
def api_student_detail(request, pk):
    """Detalle o eliminación de un estudiante."""
    try:
        student = Estudiante.objects.get(pk=pk)
    except Estudiante.DoesNotExist:
        return JsonResponse({"success": False, "message": "Estudiante no encontrado"}, status=404)

    if request.method == "DELETE":
        student.delete()
        return JsonResponse({"success": True, "message": "Estudiante eliminado"})

    notas = list(student.notas.values("id", "curso", "calificacion", "fecha"))
    asistencias = list(student.asistencias.values("id", "fecha", "presente"))
    alertas = list(student.alertas.values("id", "nivel_riesgo", "descripcion", "fecha", "atendida"))

    data = _serialize_student(student)
    data["historial_notas"] = notas
    data["historial_asistencias"] = asistencias
    data["historial_alertas"] = alertas
    return JsonResponse(data)


@csrf_exempt
@require_http_methods(["POST"])
def api_evaluar_estudiante(request, pk):
    """Ejecuta el motor de reglas/IA para un estudiante en particular."""
    try:
        student = Estudiante.objects.get(pk=pk)
        resultado = evaluar_riesgo_estudiante(student)
        return JsonResponse({"success": True, "evaluacion": resultado, "data": _serialize_student(student)})
    except Estudiante.DoesNotExist:
        return JsonResponse({"success": False, "message": "Estudiante no encontrado"}, status=404)
    except Exception as e:
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST", "PUT"])
def api_grades(request):
    """Registrar o actualizar evaluación de un estudiante."""
    try:
        body = json.loads(request.body.decode("utf-8")) if request.body else {}
        student_id = body.get("estudiante_id") or body.get("id")
        
        # Soporte para bulk update o actualización simple
        if "students" in body and isinstance(body["students"], list):
            for s_data in body["students"]:
                s_id = s_data.get("id")
                if s_id:
                    s_obj = Estudiante.objects.filter(pk=s_id).first()
                    if s_obj:
                        if "nota" in s_data:
                            Nota.objects.create(estudiante=s_obj, curso=s_data.get("curso", "Matemáticas"), calificacion=float(s_data["nota"]), fecha=date.today())
                        if "asistencia" in s_data:
                            Asistencia.objects.create(estudiante=s_obj, fecha=date.today(), presente=float(s_data["asistencia"]) >= 70)
                        evaluar_riesgo_estudiante(s_obj)
            return JsonResponse({"success": True, "message": "Evaluaciones actualizadas en bloque"})

        student = Estudiante.objects.get(pk=student_id)
        if "nota" in body:
            Nota.objects.create(
                estudiante=student,
                curso=body.get("curso", "Matemáticas"),
                calificacion=float(body["nota"]),
                fecha=date.today()
            )
        if "asistencia" in body:
            Asistencia.objects.create(
                estudiante=student,
                fecha=date.today(),
                presente=float(body["asistencia"]) >= 70
            )

        # Ejecutar evaluación analítica inmediata
        resultado = evaluar_riesgo_estudiante(student)

        return JsonResponse({
            "success": True,
            "message": "Evaluación guardada y analizada correctamente",
            "evaluacion": resultado,
            "data": _serialize_student(student)
        })
    except Estudiante.DoesNotExist:
        return JsonResponse({"success": False, "message": "Estudiante no encontrado"}, status=404)
    except Exception as e:
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def api_attendance(request):
    """Registrar asistencia individual o masiva."""
    try:
        body = json.loads(request.body.decode("utf-8")) if request.body else {}
        student_id = body.get("estudiante_id")
        student = Estudiante.objects.get(pk=student_id)
        presente = bool(body.get("presente", True))
        fecha_reg = body.get("fecha", str(date.today()))

        asistencia = Asistencia.objects.create(estudiante=student, fecha=fecha_reg, presente=presente)
        evaluar_riesgo_estudiante(student)

        return JsonResponse({"success": True, "asistencia_id": asistencia.id})
    except Exception as e:
        return JsonResponse({"success": False, "message": str(e)}, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def api_evaluar_todos(request):
    """Ejecuta el motor analítico de detección de abandono sobre todos los alumnos."""
    try:
        resultados = evaluar_todos_los_estudiantes()
        total = len(resultados)
        altos = sum(1 for r in resultados if r["nivel_riesgo"] == "alto")
        medios = sum(1 for r in resultados if r["nivel_riesgo"] == "medio")
        bajos = sum(1 for r in resultados if r["nivel_riesgo"] == "bajo")

        return JsonResponse({
            "success": True,
            "total_analizados": total,
            "riesgo_alto": altos,
            "riesgo_medio": medios,
            "riesgo_bajo": bajos,
            "resultados": resultados
        })
    except Exception as e:
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@csrf_exempt
@require_http_methods(["GET", "POST"])
def api_alerts(request):
    """Listar alertas o marcar una alerta como atendida."""
    if request.method == "GET":
        solo_activas = request.GET.get("activas", "true").lower() == "true"
        qs = Alerta.objects.select_related("estudiante").all()
        if solo_activas:
            qs = qs.filter(atendida=False)

        data = [
            {
                "id": a.id,
                "estudiante_id": a.estudiante.id,
                "estudiante_nombre": a.estudiante.nombre,
                "grado": a.estudiante.grado,
                "tutor_nombre": a.estudiante.tutor_nombre,
                "tutor_email": a.estudiante.tutor_email,
                "tutor_telefono": a.estudiante.tutor_telefono,
                "nivel_riesgo": a.nivel_riesgo,
                "descripcion": a.descripcion,
                "fecha": a.fecha.strftime("%Y-%m-%d %H:%M"),
                "atendida": a.atendida
            }
            for a in qs
        ]
        return JsonResponse(data, safe=False)

    try:
        body = json.loads(request.body.decode("utf-8")) if request.body else {}
        alerta_id = body.get("alerta_id")
        alerta = Alerta.objects.get(pk=alerta_id)
        alerta.atendida = body.get("atendida", True)
        alerta.save()
        return JsonResponse({"success": True, "message": "Estado de alerta actualizado"})
    except Alerta.DoesNotExist:
        return JsonResponse({"success": False, "message": "Alerta no encontrada"}, status=404)
    except Exception as e:
        return JsonResponse({"success": False, "message": str(e)}, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def api_notificar_tutor(request):
    """Envía notificación real por Email y/o WhatsApp al tutor del estudiante."""
    try:
        body = json.loads(request.body.decode("utf-8")) if request.body else {}
        student_id = body.get("estudiante_id")
        motivo = body.get("motivo", "Bajo rendimiento o faltas reiteradas detectadas por el sistema")
        email_destino = body.get("email")
        telefono_destino = body.get("telefono")

        student = Estudiante.objects.get(pk=student_id) if student_id else None
        student_name = student.nombre if student else body.get("nombre", "Estudiante")
        tutor_name = (student.tutor_nombre if student and student.tutor_nombre else body.get("tutor_nombre")) or "Tutor / Padre de Familia"
        tutor_email = email_destino or (student.tutor_email if student else "")
        tutor_phone = telefono_destino or (student.tutor_telefono if student else "")

        notifier = NotificationService()
        student_data = {"name": student_name, "reason": motivo}
        tutor_data = {"name": tutor_name, "email": tutor_email, "phone": tutor_phone}

        notifier.notify_tutor(student_data, tutor_data)

        return JsonResponse({
            "success": True,
            "message": f"Notificación despachada para {student_name} a {tutor_name}",
            "destinatarios": {
                "email": tutor_email or "No configurado",
                "whatsapp": tutor_phone or "No configurado"
            }
        })
    except Exception as e:
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@csrf_exempt
@require_http_methods(["GET", "POST"])
def api_materials(request):
    """Listar o crear materiales del aula."""
    if request.method == "GET":
        materials = Material.objects.all().order_by("-fecha_creacion")
        data = [
            {
                "id": m.id,
                "title": m.titulo,
                "type": m.tipo,
                "desc": m.descripcion,
                "url": m.enlace,
                "fecha": m.fecha_creacion.strftime("%Y-%m-%d"),
            }
            for m in materials
        ]
        return JsonResponse(data, safe=False)

    try:
        body = json.loads(request.body.decode("utf-8")) if request.body else {}
        titulo = body.get("title") or body.get("titulo", "")
        if not titulo:
            return JsonResponse({"success": False, "message": "El título es requerido"}, status=400)

        material = Material.objects.create(
            titulo=titulo,
            tipo=body.get("type") or body.get("tipo", "Material"),
            descripcion=body.get("desc") or body.get("descripcion", ""),
            enlace=body.get("url") or body.get("enlace", "")
        )
        return JsonResponse({
            "success": True,
            "data": {
                "id": material.id,
                "title": material.titulo,
                "type": material.tipo,
                "desc": material.descripcion,
                "url": material.enlace,
                "fecha": material.fecha_creacion.strftime("%Y-%m-%d")
            }
        }, status=201)
    except Exception as e:
        return JsonResponse({"success": False, "message": str(e)}, status=400)


def api_stats(request):
    """Estadísticas globales para el panel de control."""
    total_estudiantes = Estudiante.objects.count()
    alertas_activas = Alerta.objects.filter(atendida=False).count()
    alertas_criticas = Alerta.objects.filter(atendida=False, nivel_riesgo="alto").count()

    asistencias = Asistencia.objects.all()
    total_asist = asistencias.count()
    presentes = asistencias.filter(presente=True).count()
    tasa_promedio = round((presentes / total_asist * 100), 1) if total_asist > 0 else 88.5

    notas = Nota.objects.all()
    promedio_gral = round(sum(float(n.calificacion) for n in notas) / notas.count(), 1) if notas.exists() else 14.2

    return JsonResponse({
        "total_estudiantes": total_estudiantes,
        "alertas_activas": alertas_activas,
        "alertas_criticas": alertas_criticas,
        "asistencia_promedio": tasa_promedio,
        "promedio_calificaciones": promedio_gral,
        "total_materiales": Material.objects.count()
    })
