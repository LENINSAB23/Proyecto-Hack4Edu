"""
detector.py
Motor analítico para la detección temprana de riesgo de abandono escolar (EduSync).
Incluye análisis por asignatura, cálculo de score 0-100 y serialización nativa.
"""
from typing import Dict, Any, List
from decimal import Decimal
import pandas as pd
from django.db import transaction
from estudiantes.models import Estudiante, Asistencia, Nota, Alerta


def analizar_asistencia(df_asistencias: pd.DataFrame) -> Dict[str, Any]:
    """Evalúa inasistencia global y rachas recientes de faltas."""
    if df_asistencias.empty:
        return {"riesgo": False, "motivos": [], "tasa": 100.0, "faltas_seguidas": 0, "penalizacion": 0}

    df_asistencias = df_asistencias.sort_values(by="fecha")
    total_clases = len(df_asistencias)
    presentes = int(df_asistencias["presente"].sum())
    tasa = float(round((presentes / total_clases) * 100, 2))

    motivos = []
    penalizacion = 0

    # 1. Regla de porcentaje mínimo (70%)
    if tasa < 70.0:
        penalizacion += 40
        motivos.append(f"Asistencia crítica del {tasa}% (mínimo: 70%)")
    elif tasa < 85.0:
        penalizacion += 15
        motivos.append(f"Asistencia irregular del {tasa}%")

    # 2. Regla de inasistencias consecutivas recientes
    ultimas_asistencias = df_asistencias["presente"].tolist()
    faltas_seguidas = 0
    for estado in reversed(ultimas_asistencias):
        if not estado:
            faltas_seguidas += 1
        else:
            break

    if faltas_seguidas >= 3:
        penalizacion += 30
        motivos.append(f"{faltas_seguidas} inasistencias consecutivas recientes")

    return {
        "riesgo": penalizacion >= 30,
        "motivos": motivos,
        "tasa": tasa,
        "faltas_seguidas": faltas_seguidas,
        "penalizacion": penalizacion
    }


def analizar_calificaciones(df_notas: pd.DataFrame) -> Dict[str, Any]:
    """Evalúa rendimiento global y descensos críticos por materia."""
    if df_notas.empty:
        return {"riesgo": False, "motivos": [], "promedio": None, "penalizacion": 0}

    df_notas = df_notas.sort_values(by="fecha")
    df_notas["calificacion"] = df_notas["calificacion"].astype(float)

    motivos = []
    penalizacion = 0

    # 1. Promedio general
    promedio = float(round(df_notas["calificacion"].mean(), 2))
    if promedio < 11.0:
        penalizacion += 35
        motivos.append(f"Promedio general reprobatorio ({promedio})")
    elif promedio < 13.0:
        penalizacion += 15

    # 2. Análisis por curso (detecta caídas bruscas individuales)
    cursos = df_notas["curso"].unique()
    for curso in cursos:
        df_curso = df_notas[df_notas["curso"] == curso]
        if len(df_curso) >= 2:
            ultimas_notas = df_curso["calificacion"].tail(2).tolist()
            caida = float(round(ultimas_notas[0] - ultimas_notas[1], 2))
            if caida >= 2.0:
                penalizacion += 20
                motivos.append(f"Caída de {caida} pts en {curso} ({ultimas_notas[0]} -> {ultimas_notas[1]})")

    return {
        "riesgo": penalizacion >= 20,
        "motivos": motivos,
        "promedio": promedio,
        "penalizacion": min(penalizacion, 50)  # Tope para balancear con asistencia
    }


def evaluar_riesgo_estudiante(estudiante: Estudiante, persistir_alerta: bool = True) -> Dict[str, Any]:
    """
    Calcula un Score de Riesgo (0 a 100) y clasifica al alumno.
    Guarda o actualiza la alerta correspondiente en la BD de Supabase.
    """
    asistencias_qs = estudiante.asistencias.values("fecha", "presente")
    notas_qs = estudiante.notas.values("fecha", "calificacion", "curso")

    df_asist = pd.DataFrame(list(asistencias_qs))
    df_notas = pd.DataFrame(list(notas_qs))

    res_asist = analizar_asistencia(df_asist)
    res_notas = analizar_calificaciones(df_notas)

    # Cálculo del score total (0 = excelente, 100 = riesgo inminente de deserción)
    score_riesgo = min(100, res_asist["penalizacion"] + res_notas["penalizacion"])

    if score_riesgo >= 50:
        nivel = "alto"
    elif score_riesgo >= 25:
        nivel = "medio"
    else:
        nivel = "bajo"

    todos_motivos = res_asist["motivos"] + res_notas["motivos"]
    descripcion = " | ".join(todos_motivos) if todos_motivos else "Sin factores críticos detectados"

    # Persistencia transaccional en Supabase
    if persistir_alerta and nivel in ["medio", "alto"]:
        with transaction.atomic():
            alerta_pendiente = Alerta.objects.filter(
                estudiante=estudiante,
                atendida=False
            ).first()

            if alerta_pendiente:
                # Si ya existía, actualizamos el nivel y motivo con los nuevos datos
                alerta_pendiente.nivel_riesgo = nivel
                alerta_pendiente.descripcion = descripcion
                alerta_pendiente.save()
            else:
                Alerta.objects.create(
                    estudiante=estudiante,
                    nivel_riesgo=nivel,
                    descripcion=descripcion,
                    atendida=False
                )

    return {
        "estudiante_id": estudiante.id,
        "estudiante_nombre": estudiante.nombre,
        "grado": estudiante.grado,
        "score_riesgo": score_riesgo,
        "nivel_riesgo": nivel,
        "descripcion": descripcion,
        "detalles": {
            "tasa_asistencia": res_asist["tasa"],
            "faltas_consecutivas": res_asist["faltas_seguidas"],
            "promedio_general": res_notas["promedio"]
        }
    }


def evaluar_todos_los_estudiantes() -> List[Dict[str, Any]]:
    """Procesa a todo el alumnado."""
    return [evaluar_riesgo_estudiante(e) for e in Estudiante.objects.all()]