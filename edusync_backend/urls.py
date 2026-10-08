from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.contrib.admin.views.decorators import staff_member_required
from estudiantes.models import Estudiante, Asistencia, Nota, Alerta
from estudiantes.views import EstudianteViewSet, AsistenciaViewSet, NotaViewSet, AlertaViewSet

router = DefaultRouter()
router.register(r'estudiantes', EstudianteViewSet)
router.register(r'asistencias', AsistenciaViewSet)
router.register(r'notas', NotaViewSet)
router.register(r'alertas', AlertaViewSet)

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
    path('api/', include(router.urls)),
]
