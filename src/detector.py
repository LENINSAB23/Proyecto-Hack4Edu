from src.notifier import NotificationService

class HighRiskDetector:
    def __init__(self, notification_service: NotificationService):
        self.notification_service = notification_service

    def process_student_update(self, student_data: dict, tutor_data: dict):
        """
        Simula la recepción de una actualización del estado de un estudiante.
        Si el estado es 'riesgo_alto', notifica al tutor.
        """
        student_name = student_data.get('name', 'Estudiante Desconocido')
        print(f"Analizando actualización del estudiante: {student_name}")
        
        if student_data.get('status') == 'riesgo_alto':
            print("¡ALERTA: Estudiante marcado como riesgo alto! Iniciando protocolo de notificación...")
            self.notification_service.notify_tutor(student_data, tutor_data)
        else:
            print("El estudiante no presenta riesgo alto. No se requiere acción inmediata.")

