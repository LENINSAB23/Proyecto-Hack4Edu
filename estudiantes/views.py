from django.shortcuts import render
from django.core.management.base import BaseCommand
from estudiantes.services.detector import evaluar_todos_los_estudiantes

class Command(BaseCommand):
    help = "Ejecuta el motor de reglas de detección de abandono escolar"

    def handle(self, *args, **kwargs):
        self.stdout.write("Iniciando análisis de abandono escolar...")
        resultados = evaluar_todos_los_estudiantes()
        alertas = sum(1 for r in resultados if r["nivel_riesgo"] in ["medio", "alto"])
        self.stdout.write(self.style.SUCCESS(f"Análisis completado. {len(resultados)} analizados, {alertas} en riesgo."))
