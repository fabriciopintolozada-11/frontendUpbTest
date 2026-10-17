const API = window.API_URL;

const $ = (id) => document.getElementById(id);

const form = $('form-producto');
const inputId = $('producto-id');
const inputNombre = $('nombre');
const inputPrecio = $('precio');
const inputStock = $('stock');
const btnGuardar = $('btn-guardar');
const btnCancelar = $('btn-cancelar');
const tabla = $('tabla-productos');
const mensaje = $('mensaje');

const formatoPrecio = new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatoFecha = new Intl.DateTimeFormat('es-BO', { dateStyle: 'short', timeStyle: 'short' });

// ---------- Llamadas al backend ----------

// Hace la petición y devuelve el JSON; si el backend responde con error, lanza su mensaje
async function pedir(ruta = '', opciones = {}) {
    let respuesta;
    try {
        respuesta = await fetch(API + ruta, {
            ...opciones,
            headers: { 'Content-Type': 'application/json', ...opciones.headers },
        });
    } catch {
        throw new Error('No se pudo conectar con el backend. Si está en Render, puede tardar ~1 minuto en despertar; intenta de nuevo.');
    }

    if (respuesta.status === 204) return null;

    const datos = await respuesta.json().catch(() => null);
    if (!respuesta.ok) {
        throw new Error(`${respuesta.status}: ${datos?.error || 'Error inesperado'}`);
    }
    return datos;
}

const api = {
    listar: () => pedir(),
    buscar: (nombre) => pedir(`?nombre=${encodeURIComponent(nombre)}`),
    obtener: (id) => pedir(`/${encodeURIComponent(id)}`),
    crear: (producto) => pedir('', { method: 'POST', body: JSON.stringify(producto) }),
    actualizar: (id, producto) => pedir(`/${id}`, { method: 'PUT', body: JSON.stringify(producto) }),
    eliminar: (id) => pedir(`/${id}`, { method: 'DELETE' }),
};

// ---------- Interfaz ----------

let temporizadorMensaje;
function mostrarMensaje(texto, tipo = 'exito') {
    clearTimeout(temporizadorMensaje);
    mensaje.textContent = texto;
    mensaje.className = `mensaje ${tipo}`;
    if (tipo !== 'error') {
        temporizadorMensaje = setTimeout(() => mensaje.classList.add('oculto'), 4000);
    }
}

function celda(texto, clase) {
    const td = document.createElement('td');
    td.textContent = texto;
    if (clase) td.className = clase;
    return td;
}

function boton(texto, clase, accion) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = texto;
    if (clase) b.className = clase;
    b.addEventListener('click', accion);
    return b;
}

function renderTabla(productos, { resaltarId } = {}) {
    tabla.replaceChildren();
    $('contador').textContent = `(${productos.length})`;

    if (productos.length === 0) {
        const tr = document.createElement('tr');
        const td = celda('No hay productos para mostrar', 'vacio');
        td.colSpan = 6;
        tr.appendChild(td);
        tabla.appendChild(tr);
        return;
    }

    for (const p of productos) {
        const tr = document.createElement('tr');
        if (p.id === resaltarId) tr.className = 'resaltado';

        tr.append(
            celda(p.id),
            celda(p.nombre, 'nombre'),
            celda(formatoPrecio.format(p.precio), 'num'),
            celda(p.stock, 'num'),
            celda(p.createdAt ? formatoFecha.format(new Date(p.createdAt)) : '—'),
        );

        const acciones = document.createElement('td');
        const contenedor = document.createElement('div');
        contenedor.className = 'acciones';
        contenedor.append(
            boton('Editar', '', () => editar(p.id)),
            boton('Eliminar', 'peligro', () => eliminar(p)),
        );
        acciones.appendChild(contenedor);
        tr.appendChild(acciones);

        tabla.appendChild(tr);
    }
}

function limpiarFormulario() {
    form.reset();
    inputId.value = '';
    $('titulo-form').textContent = 'Nuevo producto';
    btnGuardar.textContent = 'Crear producto';
    btnCancelar.classList.add('oculto');
}

// Convierte el valor de un input numérico; vacío = no enviado
function leerNumero(input) {
    return input.value.trim() === '' ? undefined : Number(input.value);
}

// ---------- Acciones ----------

async function cargarProductos(opciones) {
    try {
        renderTabla(await api.listar(), opciones);
    } catch (e) {
        mostrarMensaje(e.message, 'error');
    }
}

async function editar(id) {
    try {
        // Consulta el producto actualizado al backend antes de editar
        const p = await api.obtener(id);
        inputId.value = p.id;
        inputNombre.value = p.nombre;
        inputPrecio.value = p.precio;
        inputStock.value = p.stock;
        $('titulo-form').textContent = `Editar producto #${p.id}`;
        btnGuardar.textContent = 'Guardar cambios';
        btnCancelar.classList.remove('oculto');
        form.scrollIntoView({ behavior: 'smooth' });
        inputNombre.focus();
    } catch (e) {
        mostrarMensaje(e.message, 'error');
    }
}

async function eliminar(p) {
    if (!confirm(`¿Eliminar "${p.nombre}" (id ${p.id})?`)) return;
    try {
        await api.eliminar(p.id);
        if (inputId.value === String(p.id)) limpiarFormulario();
        mostrarMensaje(`Producto #${p.id} eliminado`);
        await cargarProductos();
    } catch (e) {
        mostrarMensaje(e.message, 'error');
    }
}

form.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const producto = {
        nombre: inputNombre.value,
        precio: leerNumero(inputPrecio),
        stock: leerNumero(inputStock),
    };
    const id = inputId.value;

    btnGuardar.disabled = true;
    try {
        // Las validaciones las hace el backend: si algo está mal responde 400 con el motivo
        const guardado = id ? await api.actualizar(id, producto) : await api.crear(producto);
        mostrarMensaje(id ? `Producto #${guardado.id} actualizado` : `Producto #${guardado.id} creado`);
        limpiarFormulario();
        $('buscar-nombre').value = '';
        await cargarProductos({ resaltarId: guardado.id });
    } catch (e) {
        mostrarMensaje(e.message, 'error');
    } finally {
        btnGuardar.disabled = false;
    }
});

btnCancelar.addEventListener('click', limpiarFormulario);

$('form-buscar').addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const texto = $('buscar-nombre').value.trim();
    try {
        const productos = texto ? await api.buscar(texto) : await api.listar();
        renderTabla(productos);
        if (texto) mostrarMensaje(`${productos.length} resultado(s) para "${texto}"`, 'info');
    } catch (e) {
        mostrarMensaje(e.message, 'error');
    }
});

$('btn-todos').addEventListener('click', () => {
    $('buscar-nombre').value = '';
    cargarProductos();
});

$('form-id').addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const id = $('buscar-id').value.trim();
    if (!id) return;
    try {
        const p = await api.obtener(id);
        renderTabla([p], { resaltarId: p.id });
        mostrarMensaje(`Producto #${p.id} encontrado`, 'info');
    } catch (e) {
        mostrarMensaje(e.message, 'error');
    }
});

// ---------- Inicio ----------

async function iniciar() {
    $('api-url').textContent = API;
    const estado = $('estado-api');
    mostrarMensaje('Conectando con el backend… (en Render la primera carga puede tardar hasta 1 minuto)', 'info');
    try {
        renderTabla(await api.listar());
        estado.textContent = 'conectado';
        estado.classList.add('ok');
        mensaje.classList.add('oculto');
    } catch (e) {
        estado.textContent = 'sin conexión';
        estado.classList.add('error');
        mostrarMensaje(e.message, 'error');
    }
}

iniciar();
