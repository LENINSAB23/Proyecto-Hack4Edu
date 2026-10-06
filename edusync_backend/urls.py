from django.contrib import admin
from django.urls import path
from django.contrib.admin.views.decorators import staff_member_required
from estudiantes.models import Estudiante, Asistencia, Nota, Alerta

original_index = admin.site.index

@staff_member_required
def custom_index(request, extra_context=None):
    extra_context = extra_context or {}
    extra_context['total_estudiantes'] = Estudiante.objects.count()
    extra_context['total_alertas'] = Alerta.objects.filter(atendida=False).count()
    extra_context['total_asistencias'] = Asistencia.objects.count()
    extra_context['total_notas'] = Nota.objects.count()
    return original_index(request, extra_context)

admin.site.index = custom_index

urlpatterns = [
    path('admin/', admin.site.urls),
]
