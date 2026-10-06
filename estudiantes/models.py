from django.db import models

class Estudiante(models.Model):
    nombre = models.CharField(max_length=200)
    grado = models.CharField(max_length=50)
    fecha_registro = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nombre


class Asistencia(models.Model):
    estudiante = models.ForeignKey(Estudiante, on_delete=models.CASCADE, related_name='asistencias')
    fecha = models.DateField()
    presente = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.estudiante.nombre} - {self.fecha}"


class Nota(models.Model):
    estudiante = models.ForeignKey(Estudiante, on_delete=models.CASCADE, related_name='notas')
    curso = models.CharField(max_length=100)
    calificacion = models.DecimalField(max_digits=4, decimal_places=2)
    fecha = models.DateField()

    def __str__(self):
        return f"{self.estudiante.nombre} - {self.curso}: {self.calificacion}"


class Alerta(models.Model):
    NIVEL_RIESGO = [
        ('bajo', 'Bajo'),
        ('medio', 'Medio'),
        ('alto', 'Alto'),
    ]
    estudiante = models.ForeignKey(Estudiante, on_delete=models.CASCADE, related_name='alertas')
    nivel_riesgo = models.CharField(max_length=10, choices=NIVEL_RIESGO)
    descripcion = models.TextField(blank=True)
    fecha = models.DateTimeField(auto_now_add=True)
    atendida = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.estudiante.nombre} - Riesgo {self.nivel_riesgo}"
