# 🎓 AldaEdu — Hack4Edu 2026

> **Plataforma inteligente de seguimiento académico y detección temprana del riesgo de deserción escolar.** Desarrollada para empoderar a docentes y tutores mediante analítica predictiva de asistencia, calificaciones y alertas automatizadas multicanal (WhatsApp y Email).

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
  - Personalizado con **Django Jazzmin** con paleta corporativa AldaEdu.
  - Badges dinámicos de severidad de riesgo, filtros avanzados y acciones en lote.
- **API REST Integrada**:
  - Endpoints para gestión de alumnos, registro de notas, asistencia, materiales y evaluación masiva.

---

## 🚀 Inicio Rápido

### 1. Clonar el repositorio y preparar el entorno virtual

```bash
git clone https://github.com/LENINSAB23/Proyecto-Hack4Edu.git
cd Proyecto-Hack4edu

# Crear y activar entorno virtual
python -m venv venv

# En Windows:
venv\Scripts\activate
# En Linux / macOS:
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
- Claves de Twilio y Gmail para notificaciones reales por WhatsApp y correo.

### 4. Aplicar migraciones

```bash
python manage.py migrate
```

### 5. (Opcional) Cargar datos de demostración

Carga un aula completa con estudiantes, notas, asistencias, materiales y diagnósticos calculados:

```bash
python manage.py seed_data
```

### 6. Iniciar el servidor de desarrollo

```bash
python manage.py runserver
```

- **Aula / Dashboard Docente**: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- **Panel Admin AldaEdu**: [http://127.0.0.1:8000/admin/](http://127.0.0.1:8000/admin/)
- **Acceso Docente Demo**: `docente@aldaedu.pe` / `123456`

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
│   ├── views.py                # Endpoints de API REST y vista del Dashboard
│   └── admin.py                # Configuración de Jazzmin Admin
├── src/                        # Microservicios de mensajería externa
│   ├── config.py               # Cargador de entorno para notificaciones
│   ├── detector.py             # Adaptador de eventos de riesgo
│   └── notifier.py             # Integración con Twilio (WhatsApp) y SMTP (Email)
├── templates/                  # Plantillas HTML (index.html, admin personalizado)
├── static/                     # Archivos estáticos (CSS, JS, iconos)
│   ├── css/                    # Estilos modernos del dashboard
│   └── js/                     # Lógica frontend reactiva y cliente API REST
├── .env.example                # Variables de entorno documentadas
├── requirements.txt            # Dependencias del proyecto
└── manage.py                   # CLI principal de Django
```

---

## 👥 Equipo — Hack4Edu 2026
Desarrollado con dedicación para reducir la brecha educativa y prevenir la deserción escolar en Latinoamérica.
