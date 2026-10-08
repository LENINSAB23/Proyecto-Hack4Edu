from django.db import models

class Estudiante(models.Model):
    nombre = models.CharField(max_length=200)
    grado = models.CharField(max_length=50)
    fecha_registro = models.DateTimeField(auto_now_add=True)
    tutor_nombre = models.CharField(max_length=200, blank=True, default="")
    tutor_email = models.EmailField(blank=True, default="")
    tutor_telefono = models.CharField(max_length=30, blank=True, default="")

    class Meta:
        verbose_name = "Estudiante"
        verbose_name_plural = "Estudiantes"
        ordering = ["nombre"]

    def __str__(self):
        return f"{self.nombre} ({self.grado})"


class Asistencia(models.Model):
    estudiante = models.ForeignKey(Estudiante, on_delete=models.CASCADE, related_name="asistencias")
    fecha = models.DateField()
    presente = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Asistencia"
        verbose_name_plural = "Asistencias"
        ordering = ["-fecha"]

    def __str__(self):
        estado = "Presente" if self.presente else "Ausente"
        return f"{self.estudiante.nombre} - {self.fecha} ({estado})"


class Nota(models.Model):
    estudiante = models.ForeignKey(Estudiante, on_delete=models.CASCADE, related_name="notas")
    curso = models.CharField(max_length=100)
    calificacion = models.DecimalField(max_digits=4, decimal_places=2)
    fecha = models.DateField()

    class Meta:
        verbose_name = "Nota"
        verbose_name_plural = "Notas"
        ordering = ["-fecha"]

    def __str__(self):
        return f"{self.estudiante.nombre} - {self.curso}: {self.calificacion}"


class Alerta(models.Model):
    NIVEL_RIESGO = [
        ("bajo", "Bajo"),
        ("medio", "Medio"),
        ("alto", "Alto"),
    ]
    estudiante = models.ForeignKey(Estudiante, on_delete=models.CASCADE, related_name="alertas")
    nivel_riesgo = models.CharField(max_length=10, choices=NIVEL_RIESGO)
    descripcion = models.TextField(blank=True)
    fecha = models.DateTimeField(auto_now_add=True)
    atendida = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Alerta de Riesgo"
        verbose_name_plural = "Alertas de Riesgo"
        ordering = ["-fecha"]

    def __str__(self):
        return f"{self.estudiante.nombre} - Riesgo {self.nivel_riesgo}"


class Material(models.Model):
    TIPO_CHOICES = [
        ("Material", "Material"),
        ("Tarea", "Tarea"),
        ("Evaluación", "Evaluación"),
    ]
    titulo = models.CharField(max_length=200)
    tipo = models.CharField(max_length=50, choices=TIPO_CHOICES, default="Material")
    descripcion = models.TextField(blank=True)
    enlace = models.URLField(max_length=500, blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Material Educativo"
        verbose_name_plural = "Materiales Educativos"
        ordering = ["-fecha_creacion"]

    def __str__(self):
        return f"{self.tipo}: {self.titulo}"
