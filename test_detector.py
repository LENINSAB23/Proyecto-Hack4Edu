import os
import django

# Inicializar configuración de Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "edusync_backend.settings")
django.setup()

from datetime import date
from estudiantes.models import Estudiante, Asistencia, Nota, Alerta
from estudiantes.services.detector import evaluar_riesgo_estudiante

# 1. Crear estudiante de prueba
alumno, _ = Estudiante.objects.get_or_create(nombre="Carlos Mendoza", grado="5to Secundaria")

# 2. Agregar asistencias críticas (3 faltas seguidas)
Asistencia.objects.create(estudiante=alumno, fecha=date(2026, 3, 1), presente=True)
Asistencia.objects.create(estudiante=alumno, fecha=date(2026, 3, 2), presente=False)
Asistencia.objects.create(estudiante=alumno, fecha=date(2026, 3, 3), presente=False)
Asistencia.objects.create(estudiante=alumno, fecha=date(2026, 3, 4), presente=False)

# 3. Agregar notas con descenso abrupto (14 -> 10)
Nota.objects.create(estudiante=alumno, curso="Matemáticas", calificacion=14.0, fecha=date(2026, 3, 1))
Nota.objects.create(estudiante=alumno, curso="Matemáticas", calificacion=10.0, fecha=date(2026, 3, 15))

# 4. Ejecutar evaluación
resultado = evaluar_riesgo_estudiante(alumno)

print("\n--- Diagnóstico del Estudiante ---")
print(f"Estudiante: {resultado['estudiante_nombre']}")
print(f"Nivel de Riesgo: {resultado['nivel_riesgo']}")
print(f"Descripción: {resultado['descripcion']}")
print(f"Detalles: {resultado['detalles']}")

# Verificar alerta guardada en la base de datos
ultima_alerta = Alerta.objects.filter(estudiante=alumno).last()
if ultima_alerta:
    print(f"\nAlerta creada con éxito en la BD:")
    print(f"- Riesgo: {ultima_alerta.nivel_riesgo}")
    print(f"- Motivo: {ultima_alerta.descripcion}")