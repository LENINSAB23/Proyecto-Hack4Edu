from django.contrib import admin
from django.urls import path
from django.contrib.admin.views.decorators import staff_member_required
from estudiantes.models import Estudiante, Asistencia, Nota, Alerta
from estudiantes.views import (
    dashboard_view,
    api_login,
    api_students,
    api_student_detail,
    api_evaluar_estudiante,
    api_evaluar_todos,
    api_grades,
    api_attendance,
    api_alerts,
    api_notificar_tutor,
    api_materials,
    api_stats,
)

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
    # Panel de Administración
    path('admin/', admin.site.urls),

    # Frontend Dashboard Web
    path('', dashboard_view, name='dashboard'),

    # API REST AldaEdu
    path('api/auth/login/', api_login, name='api_login'),
    path('api/students/', api_students, name='api_students'),
    path('api/students/<int:pk>/', api_student_detail, name='api_student_detail'),
    path('api/students/<int:pk>/evaluar/', api_evaluar_estudiante, name='api_evaluar_estudiante'),
    path('api/evaluar-todos/', api_evaluar_todos, name='api_evaluar_todos'),
    path('api/grades/', api_grades, name='api_grades'),
    path('api/grades/bulk-update/', api_grades, name='api_grades_bulk'),
    path('api/attendance/', api_attendance, name='api_attendance'),
    path('api/alerts/', api_alerts, name='api_alerts'),
    path('api/notificar-tutor/', api_notificar_tutor, name='api_notificar_tutor'),
    path('api/materials/', api_materials, name='api_materials'),
    path('api/stats/', api_stats, name='api_stats'),
]
