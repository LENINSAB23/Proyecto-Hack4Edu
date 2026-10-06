from django.contrib import admin
from .models import Estudiante, Asistencia, Nota, Alerta

admin.site.register(Estudiante)
admin.site.register(Asistencia)
admin.site.register(Nota)
admin.site.register(Alerta)
