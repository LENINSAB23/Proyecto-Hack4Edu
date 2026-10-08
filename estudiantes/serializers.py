from rest_framework import serializers
from .models import Estudiante, Asistencia, Nota, Alerta


class EstudianteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Estudiante
        fields = '__all__'


class AsistenciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asistencia
        fields = '__all__'


class NotaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Nota
        fields = '__all__'


class AlertaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alerta
        fields = '__all__'
