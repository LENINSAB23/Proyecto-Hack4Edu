"""
Management command para ejecutar el motor analítico de detección de abandono escolar.
Uso: python manage.py evaluar_riesgo
"""
from django.core.management.base import BaseCommand
from estudiantes.services.detector import evaluar_todos_los_estudiantes

class Command(BaseCommand):
    help = "Ejecuta el motor analítico de detección de abandono escolar sobre todos los estudiantes"

    def handle(self, *args, **kwargs):
        self.stdout.write("Iniciando análisis de abandono escolar...")
        resultados = evaluar_todos_los_estudiantes()
        alertas = sum(1 for r in resultados if r["nivel_riesgo"] in ["medio", "alto"])
        self.stdout.write(
            self.style.SUCCESS(
                f"Análisis completado exitosamente. {len(resultados)} estudiantes analizados, {alertas} con alertas generadas."
            )
        )
