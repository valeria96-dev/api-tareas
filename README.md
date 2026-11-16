# API de Tareas — Unidad 2 (Aplicaciones Web, UPS)

API REST para gestionar tareas personales, hecha con **Node.js + Express 5 + MongoDB (Mongoose)**.
Incluye validación con **express-validator**, sesiones con **express-session + bcrypt**, carga de
archivos con **multer** y notificaciones en tiempo real con **Socket.io**.

## Requisitos

- Node.js 20 o superior (LTS) — https://nodejs.org
- MongoDB Community + MongoDB Compass (local) **o** una base gratuita en MongoDB Atlas
- Postman (para probar la colección)

## Instalación y ejecución

```bash
git clone https://github.com/valeria96-dev/api-tareas.git
cd api-tareas
npm install
cp .env.example .env      # en Windows: copy .env.example .env
npm run dev               # o: npm start
```

Abre http://localhost:3000 para la página de demostración (login, CRUD y eventos en vivo).

## Pruebas

```bash
npm test          # 16 pruebas automáticas (necesita MongoDB encendido)
```

También puedes importar `postman_collection.json` en Postman y ejecutarla completa con **Run collection**
(en el paso de subir archivo, elige cualquier JPG, PNG o PDF de tu computadora).

## Arquitectura por capas

```
src/
├── routes/        Define URL + método y encadena middlewares
├── middlewares/   Validación, sesión, subida de archivos, manejo de errores
├── controllers/   Lee req, llama al servicio, responde y emite el evento en tiempo real
├── services/      Reglas de negocio (404, 409, conflictos de versión)
├── domain/        Funciones PURAS: transforman datos, sin E/S y sin mutar entradas
├── repositories/  Único lugar que consulta MongoDB (E/S)
├── models/        Esquemas de Mongoose
├── realtime/      Socket.io (salas por usuario)
├── config/        Conexión a la base de datos
├── app.js         Configura Express (se exporta para las pruebas)
└── server.js      Conecta la BD, crea el servidor HTTP y Socket.io
```

Flujo de una petición: `route → validación → controller → service → repository → MongoDB`.

## Endpoints

| Método | Ruta | Descripción | Éxito | Errores |
|---|---|---|---|---|
| POST | /api/auth/register | Crea usuario e inicia sesión | 201 | 400, 409 |
| POST | /api/auth/login | Inicia sesión | 200 | 400, 401 |
| GET | /api/auth/me | Usuario de la sesión | 200 | 401 |
| POST | /api/auth/logout | Cierra sesión | 204 | 401 |
| GET | /api/tasks | Lista mis tareas | 200 | 401 |
| GET | /api/tasks/:id | Obtiene una tarea | 200 | 400, 401, 404 |
| POST | /api/tasks | Crea una tarea | 201 | 400, 401, 409 |
| PATCH | /api/tasks/:id | Actualiza (requiere `version`) | 200 | 400, 401, 404, 409 |
| DELETE | /api/tasks/:id | Elimina | 204 | 400, 401, 404 |
| POST | /api/tasks/:id/attachment | Sube adjunto (campo `archivo`) | 200 | 400, 401, 404, 413, 415 |
| GET | /api/tasks/:id/attachment | Descarga el adjunto | 200 | 401, 404 |

Todas las rutas `/api/tasks` requieren sesión. Cada usuario solo ve sus propias tareas.

### Formato uniforme de errores

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Datos de entrada inválidos",
    "details": [{ "field": "title", "message": "El título debe tener entre 3 y 100 caracteres" }]
  }
}
```

Códigos posibles: `VALIDATION_ERROR`, `INVALID_JSON`, `UNAUTHORIZED`, `INVALID_CREDENTIALS`,
`NOT_FOUND`, `ROUTE_NOT_FOUND`, `DUPLICATE`, `VERSION_CONFLICT`, `FILE_REQUIRED`,
`FILE_TOO_LARGE`, `UNSUPPORTED_FILE`, `NO_ATTACHMENT`, `INTERNAL_ERROR`.

## Ejemplos de petición y respuesta

**Crear tarea**

```http
POST /api/tasks
Content-Type: application/json

{ "title": "Estudiar Node", "description": "Unidad 2" }
```

```http
HTTP/1.1 201 Created
Location: /api/tasks/6650f1c2a1b2c3d4e5f60718

{
  "id": "6650f1c2a1b2c3d4e5f60718",
  "title": "Estudiar Node",
  "description": "Unidad 2",
  "status": "pendiente",
  "attachment": null,
  "version": 0,
  "createdAt": "2026-11-01T15:00:00.000Z",
  "updatedAt": "2026-11-01T15:00:00.000Z"
}
```

**Actualizar con control de concurrencia**

```http
PATCH /api/tasks/6650f1c2a1b2c3d4e5f60718
Content-Type: application/json

{ "status": "completada", "version": 0 }
```

Respuesta `200` con `"version": 1`. Si otro cliente vuelve a enviar `"version": 0`:

```json
HTTP/1.1 409 Conflict
{
  "error": {
    "code": "VERSION_CONFLICT",
    "message": "La tarea fue modificada por otra petición. Vuelve a consultarla e intenta de nuevo.",
    "details": { "currentVersion": 1, "sentVersion": 0 }
  }
}
```

**Subir archivo** (form-data, campo `archivo`, JPG/PNG/PDF, máximo 2 MB) → `200` con la tarea
y su `attachment`. Un `.txt` responde `415`; un archivo de más de 2 MB responde `413`.

## Tiempo real (Socket.io)

Al conectarse, el socket usa la misma cookie de sesión. Si no hay sesión, se desconecta.
Cada usuario entra a la sala `user:<id>` y recibe solo sus eventos:

| Evento | Cuándo | Contenido |
|---|---|---|
| `task:created` | POST /api/tasks | la tarea creada |
| `task:updated` | PATCH o subida de archivo | la tarea actualizada |
| `task:deleted` | DELETE | `{ id }` |

Para verlo: abre http://localhost:3000 en dos pestañas con el mismo usuario y crea o cambia una tarea.

## Seguridad aplicada

- Contraseñas con hash bcrypt; la cookie de sesión es `httpOnly` y `sameSite=lax`.
- `mongoose.set('sanitizeFilter', true)` y validación de tipos evitan inyección NoSQL.
- Solo se guardan los campos permitidos (`title`, `description`, `status`).
- Archivos: tipo MIME en lista blanca, límite de 2 MB, nombre aleatorio y descarga solo para el dueño.
- Índice único `(owner, title)` y bloqueo optimista con `version` para manejar conflictos.
