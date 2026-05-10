# 🏥 VasaSalud - Guía de Instalación y Deploy

## Estructura del proyecto

```
vasasalud/
├── index.html          # App principal
├── css/
│   └── main.css        # Estilos (mobile-first)
├── js/
│   ├── config.js       # Configuración Supabase
│   ├── supabase.js     # Cliente y helpers de DB
│   ├── auth.js         # Login, registro, recuperación
│   ├── user.js         # Dashboard de usuarios
│   ├── admin.js        # Dashboard de admins
│   ├── superadmin.js   # Panel super admin
│   └── app.js          # Controller principal
├── supabase-schema.sql # SQL para ejecutar en Supabase
├── _headers            # Headers de seguridad (Cloudflare)
└── _redirects          # Redirects SPA (Cloudflare)
```

---

## PASO 1: Configurar Supabase

### 1.1 - Ejecutar el schema SQL
1. Ir a **Supabase Dashboard → SQL Editor**
2. Pegar y ejecutar el contenido de `supabase-schema.sql`
3. Verificar que se crearon las tablas: `profiles`, `requests`, `family_members`

### 1.2 - Crear bucket de Storage
1. Ir a **Storage → Create Bucket**
2. Nombre: `vasasalud`
3. Marcar como **Public**
4. En SQL Editor ejecutar:
```sql
CREATE POLICY "Authenticated users can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND bucket_id = 'vasasalud');

CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'vasasalud');
```

### 1.3 - Configurar autenticación de email
1. Ir a **Authentication → Settings**
2. En "Email" habilitar **Confirm email** si lo deseás
3. Configurar el **Site URL** con tu dominio de Cloudflare

### 1.4 - Crear Super Admin
1. Registrarte normalmente en la app con el mail `superadmin@vasasalud.com`
2. En SQL Editor ejecutar:
```sql
UPDATE public.profiles SET role = 'super_admin' WHERE email = 'superadmin@vasasalud.com';
```
3. También podés cambiar el email del super admin en `js/config.js`

---

## PASO 2: Deploy en Cloudflare Pages

### Opción A - Subir archivos directamente
1. Ir a **Cloudflare Dashboard → Pages → Create Project**
2. Elegir **"Upload assets"**
3. Subir todos los archivos del proyecto
4. Configurar el dominio custom si tenés uno

### Opción B - Via GitHub (recomendado)
1. Subir el proyecto a un repositorio GitHub
2. En Cloudflare Pages → **Connect to Git**
3. Seleccionar el repositorio
4. Configuración de build:
   - **Build command**: (vacío, es HTML estático)
   - **Build output directory**: `/` (raíz del proyecto)
5. Deploy

---

## Roles del sistema

| Rol | Descripción | Acceso |
|-----|-------------|--------|
| `user` | Trabajador | Dashboard propio, solicitudes, familia |
| `admin` | Médica/Enfermera | Ver todas las solicitudes, pacientes, crear admins |
| `super_admin` | Administrador global | Control total del sistema |

---

## Seguridad implementada

✅ **Row Level Security (RLS)** en Supabase - los usuarios solo ven sus propios datos  
✅ **Anon key** (diseñada para ser pública, sin permisos elevados)  
✅ **Service role key** - NUNCA expuesta en el frontend  
✅ **Content Security Policy** via `_headers`  
✅ **X-Frame-Options: DENY** - evita clickjacking  
✅ **Políticas de roles** - verificación server-side en cada query  
✅ **No datos sensibles en localStorage** - sesión manejada por Supabase  

---

## Notas importantes

- El **anon key** de Supabase es seguro en el frontend (está diseñado para esto)
- Las **políticas RLS** en Supabase garantizan que usuarios no puedan acceder a datos ajenos
- Para producción, revisar y ajustar las políticas RLS según necesidades
- Las **transcripciones** se suben al bucket `vasasalud` de Supabase Storage
- Si querés deshabilitar el registro público, ir a **Authentication → Settings → Disable sign ups**

---

## Soporte

Si algo no funciona, verificar:
1. Que el schema SQL se ejecutó correctamente en Supabase
2. Que la URL y anon key en `js/config.js` son correctas
3. Que el bucket `vasasalud` existe en Storage
4. Los logs en Supabase Dashboard → Logs
