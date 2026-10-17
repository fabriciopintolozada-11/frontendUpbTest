# frontendUpbTest

Página en **HTML, CSS y JavaScript** (sin frameworks) para gestionar los productos de la API [backendUpbTest](https://github.com/fabriciopintolozada-11/backendUpbTest).

Recorrido: **Página → backend (Express) → PostgreSQL → respuesta en la página.**

## Funciones

- Listar todos los productos.
- Buscar por nombre (`GET /api/productos?nombre=`).
- Consultar por id (`GET /api/productos/:id`).
- Crear, editar y eliminar productos.
- Muestra los mensajes de error del backend (400 / 404).

## Configuración

La URL del backend está en [`config.js`](config.js):

```js
const API_PUBLICA = 'https://backendupbtest-hjcd.onrender.com';
const API_LOCAL = 'http://localhost:3000';
```

Si la página se abre desde `localhost` usa el backend local; si no, usa la URL pública.
El frontend solo conoce la URL pública del backend: **no contiene credenciales de la base de datos**.

## Ejecutar en local

Con el backend corriendo en el puerto 3000:

```bash
npx serve .        # o abre index.html directamente en el navegador
```

## Despliegue en Render

*New → Static Site* y conecta este repositorio.

- Build Command: *(vacío)*
- Publish Directory: `.`

> En el plan gratuito, el backend se "duerme" tras unos minutos sin uso: la primera carga puede tardar hasta un minuto.
