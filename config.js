// URL pública del backend. Solo es una dirección HTTP: aquí NUNCA va la contraseña de la base de datos.
// En local (abriendo la página desde localhost) usa el backend local.
const API_PUBLICA = 'https://backendupbtest-hjcd.onrender.com';
const API_LOCAL = 'http://localhost:3000';

const esLocal = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);

window.API_URL = `${esLocal ? API_LOCAL : API_PUBLICA}/api/productos`;
