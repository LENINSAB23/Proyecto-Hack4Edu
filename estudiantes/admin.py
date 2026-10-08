from django.contrib import admin
from django.utils.html import format_html
from .models import Estudiante, Asistencia, Nota, Alerta, Material
from estudiantes.services.detector import evaluar_riesgo_estudiante

@admin.register(Estudiante)
class EstudianteAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'grado', 'tutor_nombre', 'tutor_telefono', 'fecha_registro', 'evaluar_riesgo_btn')
    search_fields = ('nombre', 'grado', 'tutor_nombre', 'tutor_email', 'tutor_telefono')
    list_filter = ('grado', 'fecha_registro')

    @admin.display(description="Diagnóstico")
    def evaluar_riesgo_btn(self, obj):
        alerta = obj.alertas.order_by('-fecha').first()
        if not alerta:
            return format_html('<span style="color:#6c757d;">Sin evaluar</span>')
        colores = {'alto': '#e63946', 'medio': '#f77f00', 'bajo': '#2a9d8f'}
        bg = colores.get(alerta.nivel_riesgo, '#6c757d')
        return format_html(
            '<span style="background:{}; color:#fff; padding:3px 8px; border-radius:12px; font-weight:bold; font-size:11px;">Riesgo {}</span>',
            bg, alerta.nivel_riesgo.upper()
        )


@admin.register(Asistencia)
class AsistenciaAdmin(admin.ModelAdmin):
    list_display = ('estudiante', 'fecha', 'estado_badge')
    list_filter = ('presente', 'fecha')
    search_fields = ('estudiante__nombre',)
    date_hierarchy = 'fecha'

    @admin.display(description="Estado")
    def estado_badge(self, obj):
        if obj.presente:
            return format_html('<span style="color:#2a9d8f; font-weight:600;">✓ Presente</span>')
        return format_html('<span style="color:#e63946; font-weight:600;">✗ Ausente</span>')


@admin.register(Nota)
class NotaAdmin(admin.ModelAdmin):
    list_display = ('estudiante', 'curso', 'calificacion', 'fecha')
    list_filter = ('curso', 'fecha')
    search_fields = ('estudiante__nombre', 'curso')
    date_hierarchy = 'fecha'


@admin.register(Alerta)
class AlertaAdmin(admin.ModelAdmin):
    list_display = ('estudiante', 'badge_riesgo', 'descripcion', 'fecha', 'atendida')
    list_filter = ('nivel_riesgo', 'atendida', 'fecha')
    search_fields = ('estudiante__nombre', 'descripcion')
    actions = ['marcar_como_atendidas']

    @admin.display(description="Nivel")
    def badge_riesgo(self, obj):
        colores = {'alto': '#d90429', 'medio': '#f77f00', 'bajo': '#2a9d8f'}
        bg = colores.get(obj.nivel_riesgo, '#6c757d')
        return format_html(
            '<span style="background:{}; color:#fff; padding:3px 10px; border-radius:12px; font-weight:bold;">{}</span>',
            bg, obj.nivel_riesgo.upper()
        )

    @admin.action(description="Marcar alertas seleccionadas como atendidas")
    def marcar_como_atendidas(self, request, queryset):
        queryset.update(atendida=True)


@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'tipo', 'enlace', 'fecha_creacion')
    list_filter = ('tipo', 'fecha_creacion')
    search_fields = ('titulo', 'descripcion')
