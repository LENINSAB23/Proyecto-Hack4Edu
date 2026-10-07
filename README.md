# KallpaSync / EduSync — Frontend

Interfaz docente estática en HTML, CSS y JavaScript. El dashboard funciona en modo demostración y concentra las llamadas HTTP en `js/api.js`; la interfaz no accede directamente a Supabase. El backend Django debe exponer la API y comunicarse con Supabase.

## Ejecutar localmente

Sirve esta carpeta con cualquier servidor estático; por ejemplo:

```bash
python -m http.server 8000
```

Abre `http://localhost:8000`. Si Django también usa el puerto `8000`, sirve el frontend en otro puerto, por ejemplo `python -m http.server 5500`, y abre `http://localhost:5500`.

Para probar el acceso demo:

- Correo: `docente@edusync.edu`
- Contraseña: `123456`

## Conectar con Django

En `js/api.js`:

1. Define `USE_MOCK_DATA = false`.
2. Actualiza `API_BASE_URL` con la URL del backend.
3. Alinea las rutas indicadas abajo con las rutas implementadas en Django.

Todas las respuestas de error del backend se muestran en la interfaz; al desactivar mock no se sustituye silenciosamente una respuesta fallida por datos falsos. El token se guarda en `localStorage` como `edusync_token` y se envía como `Authorization: Bearer <token>`. Si usan otro esquema de autenticación, ajusten `requestApi()` y `apiLogin()` en `js/api.js`.

## Contrato de API propuesto

| Acción | Método y ruta | Payload / respuesta esperada |
| --- | --- | --- |
| Iniciar sesión | `POST /api/auth/login/` | `{ "username": "...", "password": "..." }` → `{ "token": "...", "user": { "name": "...", "role": "teacher" } }`. También se acepta `access` o `key` como nombre del token. |
| Listar estudiantes | `GET /api/students/` | Lista o paginación DRF `{ "results": [...] }`. Cada estudiante: `{ "id", "nombre", "asistencia", "nota", "participacion" }`. |
| Guardar notas | `PUT /api/grades/bulk-update/` | `{ "students": [{ "id", "nombre", "asistencia", "nota", "participacion" }] }`. |
| Listar recursos | `GET /api/materials/` | Lista o `{ "results": [...] }`. Campos: `{ "id", "title", "type", "desc", "url" }`. |
| Publicar recurso | `POST /api/materials/` | `{ "title", "type", "desc", "url" }`; `url` puede ser vacío. El frontend comparte enlaces; no sube archivos binarios. |
| Registrar asistencia | `POST /api/attendance/` | Disponible en `js/api.js`; acuerden con backend el esquema de registro y conecten el formulario cuando definan ese flujo. |

El endpoint de login y todos los endpoints que lean o modifiquen datos docentes deben validar autenticación y permisos en Django. Ocultar secciones en el frontend es solo una decisión de interfaz, no un control de seguridad.

## CORS y despliegue

- Configuren `django-cors-headers` en Django para permitir el origen desde el que se sirve este frontend.
- No incluyan claves `service_role` de Supabase ni secretos del backend en el navegador.
- Las credenciales demo son solo para `USE_MOCK_DATA = true`; no representan una autenticación real.

## Archivos principales

- `index.html`: estructura de las vistas, formularios y login.
- `styles.css`: tema visual adaptable a escritorio y móvil.
- `js/app.js`: navegación, renderizado, validación y estados de interfaz.
- `js/api.js`: datos mock y adaptador HTTP para Django.
