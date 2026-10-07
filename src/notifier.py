import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from twilio.rest import Client
from src.config import Config

class NotificationService:
    def __init__(self):
        if Config.TWILIO_ACCOUNT_SID and Config.TWILIO_AUTH_TOKEN:
            self.twilio_client = Client(Config.TWILIO_ACCOUNT_SID, Config.TWILIO_AUTH_TOKEN)
        else:
            self.twilio_client = None

    def send_email(self, to_email: str, subject: str, message: str):
        if not Config.SENDER_EMAIL or not Config.SENDER_PASSWORD:
            print("Email no configurado en las variables de entorno.")
            return

        msg = MIMEMultipart()
        msg['From'] = Config.SENDER_EMAIL
        msg['To'] = to_email
        msg['Subject'] = subject

        msg.attach(MIMEText(message, 'plain', 'utf-8'))

        try:
            with smtplib.SMTP(Config.SMTP_SERVER, Config.SMTP_PORT) as server:
                server.starttls()
                server.login(Config.SENDER_EMAIL, Config.SENDER_PASSWORD)
                server.send_message(msg)
            print(f"Correo enviado exitosamente a {to_email}")
        except Exception as e:
            print(f"Error al enviar correo a {to_email}: {e}")

    def send_whatsapp(self, to_phone: str, message: str):
        if not self.twilio_client:
            print("Twilio no está configurado en las variables de entorno.")
            return

        try:
            # En Twilio, los números de WhatsApp deben tener el prefijo "whatsapp:"
            if not to_phone.startswith("whatsapp:"):
                to_phone = f"whatsapp:{to_phone}"

            message_obj = self.twilio_client.messages.create(
                body=message,
                from_=Config.TWILIO_WHATSAPP_NUMBER,
                to=to_phone
            )
            print(f"Mensaje de WhatsApp enviado a {to_phone} (SID: {message_obj.sid})")
        except Exception as e:
            print(f"Error al enviar WhatsApp a {to_phone}: {e}")

    def notify_tutor(self, student: dict, tutor: dict):
        """
        Envía notificaciones al tutor sobre el estado de un estudiante.
        """
        subject = f"Alerta de Riesgo Alto: {student.get('name', 'Estudiante')}"
        message = (
            f"Hola {tutor.get('name', 'Tutor')},\n\n"
            f"El estudiante {student.get('name', 'Estudiante')} ha sido marcado como 'riesgo alto'.\n"
            f"Motivo: {student.get('reason', 'Sin especificar')}\n\n"
            f"Por favor, revisa este caso de inmediato en la plataforma."
        )

        if tutor.get('email'):
            self.send_email(tutor['email'], subject, message)
        
        if tutor.get('phone'):
            self.send_whatsapp(tutor['phone'], message)

