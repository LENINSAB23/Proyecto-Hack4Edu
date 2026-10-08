

3. Correr migraciones:
```bash
python manage.py migrate
```

4. Crear superusuario:
```bash
python manage.py createsuperuser
```

5. Levantar el servidor:
```bash
python manage.py runserver
```

Panel de administración disponible en `/admin`.

## Conexión a Supabase

El proyecto usa el **Transaction pooler** de Supabase (puerto 6543), recomendado para despliegues en plataformas como Render en vez de la conexión directa.

## Estado actual

- Conexión a Supabase funcionando
- Modelos y migraciones aplicadas
- Panel de administración personalizado con identidad visual EduSync (verde/naranja)
- Pendiente: API REST (Django REST Framework) para conectar con Dashboard y módulo de Alertas# Proyecto-Hack4edu 
=======
# Proyecto-Hack4edu origin/frontend
