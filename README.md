# EduSync — Backend

Backend del proyecto EduSync para el concurso Hack4Edu (Reto 05: "Detectar antes de que sea demasiado tarde").

## Stack

- **Framework:** Django 6.1
- **Base de datos:** Supabase (PostgreSQL), proyecto `KallpaSync`, región South America (São Paulo)
- **API:** Django REST Framework
- **Despliegue:** Render (no corresponde a esta parte del equipo)
- **Librerías clave:** psycopg2-binary, python-decouple, django-jazzmin (panel admin personalizado), djangorestframework

## Modelos de datos

- **Estudiante**: nombre, grado, fecha de registro
- **Asistencia**: estudiante, fecha, presente (booleano)
- **Nota**: estudiante, curso, calificación, fecha
- **Alerta**: estudiante, nivel de riesgo (bajo/medio/alto), descripción, fecha, atendida

## Endpoints de la API

Todos disponibles bajo `/api/`:

- `GET/POST /api/estudiantes/`
- `GET/POST /api/asistencias/`
- `GET/POST /api/notas/`
- `GET/POST /api/alertas/`

## Configuración local

1. Clonar el repo y crear entorno virtual:

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt


2. Crear un archivo `.env` en la raíz con las credenciales de Supabase:

DB_NAME=postgres
DB_USER=<usuario-del-pooler>
DB_PASSWORD=<tu-password>
DB_HOST=aws-0-sa-east-1.pooler.supabase.com
DB_PORT=6543


3. Correr migraciones:

python manage.py migrate


4. Crear superusuario:

python manage.py createsuperuser


5. Levantar el servidor:

python manage.py runserver


Panel de administración disponible en `/admin`. API disponible en `/api`.

## Conexión a Supabase

El proyecto usa el **Transaction pooler** de Supabase (puerto 6543).

## Estado actual

- Conexión a Supabase funcionando
- Modelos y migraciones aplicadas
- Panel de administración personalizado con identidad visual KallpaSync
- API REST lista para que Dashboard y Alertas se conecten
- Pendiente (no corresponde a esta parte): despliegue en Render
