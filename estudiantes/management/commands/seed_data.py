from datetime import date, timedelta
from django.core.management.base import BaseCommand
from estudiantes.models import Estudiante, Asistencia, Nota, Material
from estudiantes.services.detector import evaluar_todos_los_estudiantes

class Command(BaseCommand):
    help = "Puebla la base de datos con estudiantes, asistencias, notas y materiales de demostración"

    def handle(self, *args, **kwargs):
        self.stdout.write("Generando datos de demostración para AldaEdu...")

        estudiantes_data = [
            {
                "nombre": "Carlos Mendoza",
                "grado": "5to Secundaria",
                "tutor_nombre": "Roberto Mendoza",
                "tutor_email": "roberto.mendoza@ejemplo.com",
                "tutor_telefono": "+51987654321",
                "presentes": [False, False, False, True, False],
                "notas": [("Matemáticas", 9.0), ("Comunicación", 10.0), ("Ciencias", 8.5)],
            },
            {
                "nombre": "Ana Gómez",
                "grado": "5to Secundaria",
                "tutor_nombre": "Elena Gómez",
                "tutor_email": "elena.gomez@ejemplo.com",
                "tutor_telefono": "+51912345678",
                "presentes": [False, False, False, False, True],
                "notas": [("Matemáticas", 7.5), ("Comunicación", 8.0), ("Historia", 9.0)],
            },
            {
                "nombre": "María López",
                "grado": "5to Secundaria",
                "tutor_nombre": "Patricia López",
                "tutor_email": "patricia.lopez@ejemplo.com",
                "tutor_telefono": "+51998877665",
                "presentes": [True, True, True, True, True],
                "notas": [("Matemáticas", 18.0), ("Comunicación", 16.5), ("Ciencias", 17.0)],
            },
            {
                "nombre": "Juan Pérez",
                "grado": "4to Secundaria",
                "tutor_nombre": "Carmen Pérez",
                "tutor_email": "carmen.perez@ejemplo.com",
                "tutor_telefono": "+51944556677",
                "presentes": [True, False, True, False, True],
                "notas": [("Matemáticas", 11.5), ("Comunicación", 12.0), ("Ciencias", 10.5)],
            },
            {
                "nombre": "Lucía Fernández",
                "grado": "4to Secundaria",
                "tutor_nombre": "Jorge Fernández",
                "tutor_email": "jorge.fernandez@ejemplo.com",
                "tutor_telefono": "+51933221100",
                "presentes": [True, True, True, True, True],
                "notas": [("Matemáticas", 19.0), ("Comunicación", 17.5), ("Inglés", 18.5)],
            },
            {
                "nombre": "Diego Salcedo",
                "grado": "5to Secundaria",
                "tutor_nombre": "Teresa Salcedo",
                "tutor_email": "teresa.salcedo@ejemplo.com",
                "tutor_telefono": "+51977665544",
                "presentes": [False, True, False, False, True],
                "notas": [("Matemáticas", 10.0), ("Comunicación", 11.0), ("Historia", 8.0)],
            },
        ]

        today = date.today()
        for data in estudiantes_data:
            estudiante, _ = Estudiante.objects.get_or_create(
                nombre=data["nombre"],
                defaults={
                    "grado": data["grado"],
                    "tutor_nombre": data["tutor_nombre"],
                    "tutor_email": data["tutor_email"],
                    "tutor_telefono": data["tutor_telefono"],
                }
            )

            # Cargar asistencias recientes si tiene pocas
            if estudiante.asistencias.count() < 3:
                for i, pres in enumerate(data["presentes"]):
                    f = today - timedelta(days=(len(data["presentes"]) - i))
                    Asistencia.objects.get_or_create(estudiante=estudiante, fecha=f, defaults={"presente": pres})

            # Cargar notas si tiene pocas
            if estudiante.notas.count() < 2:
                for curso, calif in data["notas"]:
                    Nota.objects.get_or_create(
                        estudiante=estudiante,
                        curso=curso,
                        fecha=today - timedelta(days=5),
                        defaults={"calificacion": calif}
                    )

        # Cargar materiales de demostración
        materiales_demo = [
            ("Guía de Álgebra: Ecuaciones Cuadráticas", "Material", "Ejercicios resueltos y propuestos para reforzar la sesión semanal.", "https://drive.google.com/"),
            ("Tarea 04: Redacción de Ensayos Argumentativos", "Tarea", "Investigación y análisis sobre impacto de la tecnología en la educación.", "https://docs.google.com/"),
            ("Simulacro de Evaluación Bimestral de Ciencias", "Evaluación", "Revisión integral de física y química con preguntas tipo admisión.", "https://forms.google.com/"),
        ]

        for tit, tip, desc, url in materiales_demo:
            Material.objects.get_or_create(titulo=tit, defaults={"tipo": tip, "descripcion": desc, "enlace": url})

        # Evaluar todos los estudiantes para generar alertas
        evaluar_todos_los_estudiantes()
        self.stdout.write(self.style.SUCCESS("¡Datos de demostración y alertas analíticas generadas exitosamente!"))
