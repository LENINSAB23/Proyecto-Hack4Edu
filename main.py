from src.notifier import NotificationService
from src.detector import HighRiskDetector

def main():
    print("Iniciando módulo de notificaciones de riesgo...")
    
    # 1. Inicializar servicios
    notifier = NotificationService()
    detector = HighRiskDetector(notifier)
    
    # 2. Simulación de datos (Mock).
    # Cuando unas tu código con el resto del equipo, este objeto vendrá de una base de datos o API.
    student_mock = {
        "id": "101",
        "name": "Ana Gómez",
        "status": "riesgo_alto",
        "reason": "Ausencias recurrentes (3 seguidas) y bajo rendimiento en matemáticas."
    }
    
    tutor_mock = {
        "id": "T01",
        "name": "Profesor Carlos",
        "email": "carlos.tutor@ejemplo.com", # Cambia por un correo real al probar
        "phone": "+981302929"               # Cambia por un teléfono registrado en Twilio para probar
    }
    
    # 3. Procesar el caso del estudiante simulado
    print("--- Prueba 1: Estudiante con riesgo alto ---")
    detector.process_student_update(student_mock, tutor_mock)
    
    print("\n--- Prueba 2: Estudiante normal ---")
    student_normal_mock = {
        "id": "102",
        "name": "Luis Pérez",
        "status": "regular",
        "reason": ""
    }
    detector.process_student_update(student_normal_mock, tutor_mock)

if __name__ == "__main__":
    main()

