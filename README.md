# 🎓 AldaEdu / EduSync — Hack4Edu 2026

> **Plataforma inteligente de seguimiento académico y detección temprana del riesgo de deserción escolar.** Desarrollada para el concurso **Hack4Edu (Reto 05: "Detectar antes de que sea demasiado tarde")**, empoderando a docentes y tutores mediante analítica predictiva de asistencia, calificaciones y alertas automatizadas multicanal (WhatsApp y Email).

---

## 🌟 Características Principales

- **Dashboard Docente Interactivo**: Métricas clave en tiempo real (estudiantes evaluados, alertas críticas, tasa de asistencia promedio y calificaciones).
- **Motor Analítico de Detección de Riesgo (Pandas & Django)**:
  - Reglas de asistencia crítica (< 70% o inasistencias reiteradas).
  - Detección de rachas de 3 o más faltas consecutivas.
  - Alerta ante caídas abruptas de rendimiento por curso (≥ 2 puntos).
  - Cálculo de Score de Riesgo (0 a 100) y categorización: **Bajo**, **Medio** y **Alto**.
- **Notificaciones Automáticas Multicanal**:
  - 📩 **Correo Electrónico (SMTP)** a docentes y tutores.
  - 📱 **WhatsApp (API Twilio)** con plantillas de alerta inmediata.
- **Base de Datos Cloud en Supabase**:
  - Conexión vía Transaction Pooler (PostgreSQL en puerto 6543).
  - Fallback automático a SQLite local si no se detectan credenciales de base de datos remota.
- **Panel Administrativo Profesional**:
  - Personalizado con **Django Jazzmin** y paleta institucional.
  - Badges dinámicos de severidad de riesgo, filtros avanzados y acciones en lote.
- **API REST Integrada**:
  - Endpoints CRUD estándar con **Django REST Framework (DRF)**.
  - Endpoints analíticos y reactivos para el Dashboard y envío de notificaciones.

---

## 🛠️ Stack Tecnológico

- **Backend:** Python 3.12, Django 5.x / 6.x, Django REST Framework
- **Base de Datos:** Supabase (PostgreSQL en Transaction Pooler, puerto 6543) / SQLite (desarrollo local)
- **Motor Analítico:** Pandas, NumPy
- **Mensajería:** Twilio (WhatsApp API), Python SMTP / Email
- **Frontend / UI:** HTML5 semántico, CSS moderno, JavaScript modular, Django Jazzmin Admin

---

## 🚀 Inicio Rápido

### 1. Clonar el repositorio y preparar el entorno virtual

```bash
git clone https://github.com/LENINSAB23/Proyecto-Hack4Edu.git
cd Proyecto-Hack4edu

# Crear entorno virtual
python -m venv venv

# Activar en Windows:
venv\Scripts\activate
# Activar en Linux / macOS:
source venv/bin/activate
```

### 2. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 3. Configurar variables de entorno

Copia el archivo de plantilla `.env.example` como `.env`:

```bash
cp .env.example .env
```

Configura tus credenciales en `.env`:
- Conexión Supabase PostgreSQL (o déjalo en blanco para usar SQLite local).
```env
DB_NAME=postgres
DB_USER=<usuario-del-pooler>
DB_PASSWORD=<tu-password>
DB_HOST=aws-0-sa-east-1.pooler.supabase.com
DB_PORT=6543
```
- Claves de Twilio y Gmail para notificaciones reales por WhatsApp y correo.

### 4. Aplicar migraciones

```bash
python manage.py migrate
```

### 5. Crear superusuario (para el panel admin)

```bash
python manage.py createsuperuser
```

### 6. (Opcional) Cargar datos de demostración

Carga un aula completa con estudiantes, notas, asistencias, materiales y diagnósticos calculados:

```bash
python manage.py seed_data
```

### 7. Iniciar el servidor de desarrollo

```bash
python manage.py runserver
```

- **Aula / Dashboard Docente**: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- **Panel Admin**: [http://127.0.0.1:8000/admin/](http://127.0.0.1:8000/admin/)
- **API REST (DRF)**: [http://127.0.0.1:8000/api/](http://127.0.0.1:8000/api/)
- **Acceso Docente Demo**: `docente@aldaedu.pe` / `123456`

---

## 📡 Endpoints de la API REST

### Endpoints DRF (CRUD estándar)
- `GET / POST /api/estudiantes/` — Listar y registrar estudiantes
- `GET / POST /api/asistencias/` — Listar y registrar asistencias
- `GET / POST /api/notas/` — Listar y registrar notas
- `GET / POST /api/alertas/` — Listar y gestionar alertas

### Endpoints del Dashboard y Analítica
- `POST /api/auth/login/` — Autenticación docente
- `GET / POST /api/students/` — Gestión reactiva de estudiantes para el Dashboard
- `POST /api/evaluar-todos/` — Ejecución masiva del detector predictivo
- `POST /api/students/<id>/evaluar/` — Evaluación individual por estudiante
- `POST /api/notificar-tutor/` — Envío de alerta por WhatsApp y Correo
- `GET / POST /api/materials/` — Repositorio de materiales pedagógicos
- `GET /api/stats/` — Estadísticas globales del aula

---

## 🛠️ Comandos de Gestión Personalizados

| Comando | Descripción |
|---|---|
| `python manage.py evaluar_riesgo` | Ejecuta el motor analítico de detección sobre todo el alumnado y genera alertas en la BD. |
| `python manage.py seed_data` | Puebla la base de datos con alumnos, notas, asistencias y recursos de prueba. |
| `python main.py` | Ejecuta el test aislado del despachador de notificaciones (WhatsApp / Email). |
| `python test_detector.py` | Ejecuta un test integral del detector analítico con persistencia en Supabase. |

---

## 📁 Estructura del Proyecto

```text
Proyecto-Hack4edu/
├── edusync_backend/            # Configuración central Django (settings, urls, wsgi)
├── estudiantes/                # Módulo principal de la aplicación
│   ├── management/commands/    # Comandos CLI (evaluar_riesgo, seed_data)
│   ├── services/
│   │   └── detector.py         # Motor analítico con Pandas (score y reglas de riesgo)
│   ├── models.py               # Modelos: Estudiante, Asistencia, Nota, Alerta, Material
│   ├── serializers.py          # Serializadores Django REST Framework
│   ├── views.py                # Endpoints API REST, ViewSets DRF y vista Dashboard
│   └── admin.py                # Configuración de Jazzmin Admin
├── src/                        # Microservicios de mensajería externa
│   ├── config.py               # Cargador de entorno para notificaciones
│   ├── detector.py             # Adaptador de eventos de riesgo
│   └── notifier.py             # Integración con Twilio (WhatsApp) y SMTP (Email)
├── templates/                  # Plantillas HTML (index.html, admin personalizado)
├── static/                     # Archivos estáticos (CSS, JS, iconos)
│   ├── css/                    # Estilos modernos del dashboard y admin custom
│   └── js/                     # Lógica frontend reactiva y cliente API REST
├── .env.example                # Variables de entorno documentadas
├── requirements.txt            # Dependencias del proyecto
└── manage.py                   # CLI principal de Django
```

---

## 🚀 Despliegue en Render

Para desplegar este proyecto en **Render**:

1. **Build Command**: `./build.sh` (o `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate`)
2. **Start Command**: `gunicorn edusync_backend.wsgi:application`
3. **Variables de Entorno**:
   - `DEBUG`: `False`
   - `SECRET_KEY`: Tu clave secreta de producción
   - `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`: Credenciales de Supabase (opcional).

---

## 👥 Equipo — Hack4Edu 2026
Desarrollado con dedicación para reducir la brecha educativa y prevenir la deserción escolar en Latinoamérica.
