# Módulo de Notificación de Estudiantes en Riesgo

Este módulo fue diseñado para detectar cuando un estudiante es marcado como **"riesgo alto"** y notificar de manera automática a un docente/tutor. Funciona enviando:
1. **Un correo electrónico** (vía SMTP, por ejemplo con Gmail).
2. **Un mensaje de WhatsApp** (vía la API de Twilio).

Está estructurado de manera limpia para que cuando te toque unirlo con el trabajo de tus compañeros, la integración sea sencilla.

## Estructura de Archivos
* `main.py`: Punto de entrada de prueba. Aquí se simula la llegada de los datos de un estudiante para comprobar que funciona.
* `src/config.py`: Se encarga de cargar y organizar las variables de entorno para no exponer contraseñas en el código.
* `src/detector.py`: Simula el "listener" o motor que revisa el estado del alumno y dispara el evento de notificación si corresponde.
* `src/notifier.py`: Contiene la lógica que se conecta a los servidores de email (SMTP) y a la API de Twilio para enviar los mensajes reales.
* `requirements.txt`: Lista de librerías externas necesarias (Twilio y dotenv).
* `.env.example`: Plantilla que debes renombrar a `.env` y rellenar con tus datos reales.

## ¿Cómo probarlo?

1. **Instalar dependencias:**
   Es recomendable usar un entorno virtual (venv). Instala las librerías con:
   ```bash
   pip install -r requirements.txt
   ```

2. **Configurar el `.env`:**
   * Crea una copia del archivo `.env.example` y llámalo **`.env`**.
   * Llena los datos con tu información real.
   * *Para el Email*: Si usas Gmail, recuerda activar las "Contraseñas de aplicación" en tu cuenta de Google.
   * *Para WhatsApp*: Debes registrarte en [Twilio](https://www.twilio.com/) para obtener tu `ACCOUNT_SID`, `AUTH_TOKEN` y configurar un número de Sandbox para WhatsApp.

3. **Ejecutar la prueba:**
   Modifica el archivo `main.py` para poner tu propio email o número de teléfono temporalmente en los datos de `tutor_mock`, y luego ejecuta:
   ```bash
   python main.py
   ```
   Verás en la consola los mensajes informativos simulando la detección del estudiante y el envío.

