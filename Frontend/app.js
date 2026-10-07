'use strict';

const $ = s => document.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
}[c]));

const money = v => new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
}).format(Number(v || 0));

const date = v => v ? new Date(v).toLocaleString('es-CO') : '—';
const path = v => encodeURIComponent(v);

const state = {
    token: sessionStorage.getItem('nexo.token'),
    base: localStorage.getItem('nexo.base') || 'http://localhost:8050',
    me: null,
    view: 'home',
    page: 0,
    rows: [],
    cache: {},
    busy: false
};

const sections = {
    home: { title: 'Inicio', icon: '⌂' },
    buses: { title: 'Buses', icon: '🚌', prefix: 'BUS', endpoint: '/api/buses' },
    alertas: { title: 'Alertas e Incidentes', icon: '⚠️', prefix: 'ALERTA', endpoint: '/api/alertas' },
    rutas: { title: 'Rutas', icon: '🛣️', prefix: 'RUTA', endpoint: '/api/rutas' },
    estaciones: { title: 'Estaciones', icon: '🚉', prefix: 'ESTACION', endpoint: '/api/estaciones' },
    conductores: { title: 'Conductores', icon: '👨‍✈️', prefix: 'CONDUCTOR', endpoint: '/api/conductores' },
    users: { title: 'Usuarios', icon: '♧' },
    roles: { title: 'Roles', icon: '◈' },
    permissions: { title: 'Permisos', icon: '⚿' }
};

const can = p => state.me?.effectivePermissions?.includes(p);
const any = ps => ps.some(can);

function visible(view) {
    if (view === 'home') return true;
    if (view === 'users') {
        return any(['USER_READ', 'USER_CREATE', 'USER_UPDATE', 'USER_DELETE', 'ROLE_ASSIGN', 'PERMISSION_ASSIGN']);
    }
    if (view === 'roles') return can('ROLE_MANAGE');
    if (view === 'permissions') return can('PERMISSION_MANAGE');

    const p = sections[view].prefix;
    return any([p + '_READ', p + '_CREATE', p + '_UPDATE', p + '_DELETE', p + '_CANCEL']);
}

function toast(message, bad = false) {
    $('#toast').textContent = message;
    $('#toast').className = 'visible' + (bad ? ' bad' : '');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => {
        $('#toast').className = '';
    }, 5500);
}

function logout() {
    state.token = null;
    state.me = null;
    state.cache = {};
    sessionStorage.removeItem('nexo.token');
    $('#app').hidden = true;
    $('#login-screen').hidden = false;
    if ($('#modal').open) $('#modal').close();
    $('#login-form').password.value = '';
}

async function api(url, { method = 'GET', body, auth = true } = {}) {
    const headers = { Accept: 'application/json, text/plain' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (auth && state.token) headers.Authorization = 'Bearer ' + state.token;

    let response;
    try {
        response = await fetch(state.base + url, {
            method,
            headers,
            body: body === undefined ? undefined : JSON.stringify(body)
        });
    } catch {
        throw new Error('No se pudo conectar con el servidor. Revisa la URL, Spring Boot y PostgreSQL.');
    }

    const text = await response.text();
    let data = text;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {}

    if (!response.ok) {
        if (auth && (response.status === 401 || (response.status === 403 && url === '/api/auth/me'))) {
            logout();
        }
        let error = typeof data === 'string'
            ? data
            : (data?.detail || data?.message || Object.entries(data || {})
                .filter(([k]) => !['timestamp', 'status', 'error', 'path'].includes(k))
                .map(([k, v]) => k + ': ' + v)
                .join('\n'));

        if (response.status === 403) {
            error = 'Tu cuenta no tiene permiso para esta operación, o la sesión ya no está disponible.';
        }
        throw new Error(error || `La operación no se completó (${response.status}).`);
    }

    return data;
}

async function refreshMe() {
    state.me = await api('/api/auth/me');
    $('#session-name').textContent = state.me.username;
    $('#session-role').textContent = state.me.role || 'Sin rol';
    $('#avatar').textContent = state.me.username.slice(0, 2).toUpperCase();
    $('#server-label').textContent = state.base;
    $('#navigation').innerHTML = Object.entries(sections)
        .filter(([k]) => visible(k))
        .map(([k, v]) => `
            <button data-nav="${k}" class="${state.view === k ? 'active' : ''}">
                <span class="nav-icon">${v.icon}</span>${v.title}
            </button>
        `).join('');
}

async function enter() {
    await refreshMe();
    $('#login-screen').hidden = true;
    $('#app').hidden = false;
    await navigate('home');
}

$('#login-form').base.value = state.base;

$('#login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.currentTarget;
    const b = f.querySelector('button[type=submit]');
    b.disabled = true;
    $('#login-error').textContent = '';

    try {
        const base = f.base.value.trim().replace(/\/+$/, '');
        const u = new URL(base);
        if (!['http:', 'https:'].includes(u.protocol)) {
            throw new Error('Utiliza una URL HTTP o HTTPS.');
        }

        state.base = base;
        localStorage.setItem('nexo.base', base);
        state.token = await api('/api/auth/login', {
            method: 'POST',
            auth: false,
            body: {
                username: f.username.value.trim(),
                password: f.password.value
            }
        });
        sessionStorage.setItem('nexo.token', state.token);
        await enter();
        f.password.value = '';
    } catch (error) {
        logout();
        $('#login-error').textContent = error.message;
    } finally {
        b.disabled = false;
    }
});

$('#logout').onclick = logout;
$('#menu-toggle').onclick = () => $('#sidebar').classList.toggle('open');
$('#navigation').onclick = e => {
    const b = e.target.closest('[data-nav]');
    if (b) navigate(b.dataset.nav);
};

function heading(title, subtitle, actions = '') {
    return `
        <div class="page-heading">
            <div>
                <span class="eyebrow">ESPACIO DE TRABAJO</span>
                <h1>${esc(title)}</h1>
                <p>${esc(subtitle)}</p>
            </div>
            <div class="toolbar">${actions}</div>
        </div>
    `;
}

function button(action, label, data = '', className = 'primary') {
    return `<button type="button" class="${className}" data-action="${action}" ${data}>${label}</button>`;
}

function badge(active) {
    return `<span class="badge ${active ? '' : 'off'}">${active ? 'Activo' : 'Inactivo'}</span>`;
}

function chips(values) {
    return `
        <div class="chips">
            ${(values || []).map(v => `<span class="chip">${esc(v)}</span>`).join('') || '<span class="muted">Sin permisos</span>'}
        </div>
    `;
}

async function navigate(view, page = 0) {
    if (!visible(view)) view = 'home';
    state.view = view;
    state.page = page;
    $('#sidebar').classList.remove('open');
    $('#crumb').textContent = sections[view].title;
    $('#navigation').querySelectorAll('button').forEach(b => {
        b.classList.toggle('active', b.dataset.nav === view);
    });

    $('#content').innerHTML = '<div class="empty">Cargando tu espacio…</div>';

    try {
        await render();
    } catch (error) {
        $('#content').innerHTML = heading(sections[view].title, 'No se pudo cargar la información') + `
            <div class="panel empty">
                ${esc(error.message)}<br><br>
                ${button('reload', 'Reintentar')}
            </div>
        `;
    }
}

async function render() {
    if (state.view === 'home') return dashboard();

    const view = state.view;
    const conf = sections[view];
    let actions = button('reload', '↻ Actualizar', '', 'secondary');
    let rows = [];
    let read = false;

    if (['customers', 'products', 'sales', 'buses', 'alertas', 'rutas', 'estaciones', 'conductores'].includes(view)) {
        read = can(conf.prefix + '_READ');

        if (can(conf.prefix + '_CREATE')) {
            const createLabel = {
                buses: 'Nuevo bus',
                alertas: '🚨 Registrar incidente',
                rutas: 'Nueva ruta',
                estaciones: 'Nueva estación',
                conductores: 'Nuevo conductor',
                sales: 'Nueva venta',
                products: 'Nuevo producto',
                customers: 'Nuevo cliente'
            }[view] || 'Nuevo registro';
            actions = button('create', '＋ ' + createLabel) + actions;
        }
        if (!read && view !== 'sales' && can(conf.prefix + '_UPDATE')) {
            actions += button('edit-business-id', 'Editar por ID', '', 'secondary');
        }
        if (!read && view !== 'sales' && can(conf.prefix + '_DELETE')) {
            actions += button('deactivate-business-id', 'Desactivar por ID', '', 'secondary');
        }
        if (!read && view === 'sales' && can('SALE_CANCEL')) {
            actions += button('cancel-sale-id', 'Anular por ID', '', 'secondary');
        }

        if (read) {
            const result = await api(conf.endpoint + `?page=${state.page}&size=20`);
            rows = result.content || [];
            state.total = result.totalElements || 0;
            state.pages = result.totalPages || 0;
        }
    } else if (view === 'users') {
        read = can('USER_READ');

        if (can('USER_CREATE')) actions = button('create', '＋ Nuevo usuario') + actions;
        if (can('ROLE_ASSIGN')) actions += button('user-role', 'Asignar rol', '', 'secondary');
        if (can('PERMISSION_ASSIGN')) {
            actions += button('user-permission', 'Dar permiso', '', 'secondary') + button('revoke-permission-id', 'Retirar permiso', '', 'secondary');
        }
        if (!read && can('USER_UPDATE')) actions += button('edit-named', 'Actualizar cuenta', '', 'secondary');
        if (!read && can('USER_DELETE')) actions += button('delete-named', 'Eliminar cuenta', '', 'secondary');

        if (read) rows = await api('/api/user/all');
    } else if (view === 'roles') {
        read = true;
        rows = await api('/api/roles');
        actions = button('create', '＋ Nuevo rol') + actions;
    } else {
        read = true;
        rows = (await api('/api/permissions')).map(name => ({ name }));
        actions = button('create', '＋ Nuevo permiso') + actions;
    }

    state.rows = rows;

    const intro = {
        buses: 'Flota de buses del sistema de transporte masivo.',
        alertas: 'Monitoreo y registro de incidentes, emergencias y alertas operativas.',
        rutas: 'Trazados y líneas de transporte de la red.',
        estaciones: 'Puntos de parada y estaciones del sistema.',
        conductores: 'Personal operativo y conductores asignados.',
        customers: 'Organiza tus relaciones comerciales.',
        products: 'Tu catálogo, precios y existencias al día.',
        sales: 'Cada operación, con su detalle e historial.',
        users: 'Cuentas, estados y accesos de tu equipo.',
        roles: 'Un rol por usuario. Capacidades compartidas por equipo.',
        permissions: 'El catálogo de capacidades de tu aplicación.'
    };

    $('#content').innerHTML = heading(conf.title, intro[view], actions) + (
        !read
            ? '<div class="panel empty">Puedes realizar las acciones habilitadas arriba. Tu cuenta no tiene permiso para consultar este listado.</div>'
            : table(view, rows)
    );
}

function table(view, rows) {
    let headers;
    let cells;
    const action = (name, label, i, cls = 'link-button') => button(name, label, `data-index="${i}"`, cls);

    if (view === 'buses') {
        headers = ['Placa / Modelo', 'Capacidad', 'Estado', 'Acciones'];
        cells = (r, i) => [
            `<span class="cell-title">${esc(r.placa)}</span><small class="cell-sub">${esc(r.modelo)}</small>`,
            `${r.capacidad} pasajeros`,
            `<span class="badge ${r.activo ? '' : 'off'}">${esc(r.estado || (r.activo ? 'OPERATIVO' : 'INACTIVO'))}</span>`,
            (r.activo && can('BUS_UPDATE') ? action('edit', 'Editar', i) : '') +
            (r.activo && can('BUS_DELETE') ? action('deactivate', 'Desactivar', i) : '')
        ];
    }
    if (view === 'alertas') {
        headers = ['Incidente / Alerta', 'Severidad', 'Bus / Ruta / Estación', 'Registrado por', 'Estado', 'Acciones'];
        cells = (r, i) => [
            `<span class="cell-title">${esc(r.tipo)}</span><small class="cell-sub">${esc(r.descripcion)}</small>`,
            `<span class="badge ${r.severidad === 'ALTA' ? 'off' : ''}">${esc(r.severidad)}</span>`,
            `<span class="cell-title">Bus: ${esc(r.busPlaca || ('#' + r.busId))}</span><small class="cell-sub">${r.rutaCodigo ? 'Ruta: ' + esc(r.rutaCodigo) : ''} ${r.estacionNombre ? '· Estación: ' + esc(r.estacionNombre) : ''}</small>`,
            `${esc(r.registradoPor || 'sistema')}<small class="cell-sub">${date(r.fechaHora)}</small>`,
            badge(r.activo),
            (r.activo && can('ALERTA_UPDATE') ? action('edit', 'Editar', i) : '') +
            (r.activo && can('ALERTA_DELETE') ? action('deactivate', 'Resolver/Cerrar', i) : '')
        ];
    }
    if (view === 'rutas') {
        headers = ['Código', 'Nombre', 'Descripción', 'Estado', 'Acciones'];
        cells = (r, i) => [
            `<span class="cell-title">${esc(r.codigo)}</span>`,
            esc(r.nombre),
            esc(r.descripcion || '—'),
            badge(r.activo),
            (r.activo && can('RUTA_UPDATE') ? action('edit', 'Editar', i) : '') +
            (r.activo && can('RUTA_DELETE') ? action('deactivate', 'Desactivar', i) : '')
        ];
    }
    if (view === 'estaciones') {
        headers = ['Estación', 'Ubicación', 'Estado', 'Acciones'];
        cells = (r, i) => [
            `<span class="cell-title">${esc(r.nombre)}</span>`,
            esc(r.ubicacion || '—'),
            badge(r.activo),
            (r.activo && can('ESTACION_UPDATE') ? action('edit', 'Editar', i) : '') +
            (r.activo && can('ESTACION_DELETE') ? action('deactivate', 'Desactivar', i) : '')
        ];
    }
    if (view === 'conductores') {
        headers = ['Conductor', 'Cédula', 'Licencia', 'Contacto', 'Estado', 'Acciones'];
        cells = (r, i) => [
            `<span class="cell-title">${esc(r.nombre)}</span>`,
            esc(r.cedula),
            esc(r.licencia),
            esc(r.telefono || '—'),
            badge(r.activo),
            (r.activo && can('CONDUCTOR_UPDATE') ? action('edit', 'Editar', i) : '') +
            (r.activo && can('CONDUCTOR_DELETE') ? action('deactivate', 'Desactivar', i) : '')
        ];
    }
    if (view === 'customers') {
        headers = ['Cliente', 'Contacto', 'Estado', 'Acciones'];
        cells = (r, i) => [
            `<span class="cell-title">${esc(r.name)}</span><small class="cell-sub">Cliente #${r.id}</small>`,
            `${esc(r.email)}<small class="cell-sub">${esc(r.phone || 'Sin teléfono')}</small>`,
            badge(r.active),
            (r.active && can('CUSTOMER_UPDATE') ? action('edit', 'Editar', i) : '') +
            (r.active && can('CUSTOMER_DELETE') ? action('deactivate', 'Desactivar', i) : '')
        ];
    }
    if (view === 'products') {
        headers = ['Producto', 'Precio', 'Existencias', 'Estado', 'Acciones'];
        cells = (r, i) => [
            `<span class="cell-title">${esc(r.name)}</span><small class="cell-sub">${esc(r.sku)}</small>`,
            money(r.price),
            r.stock,
            badge(r.active),
            (r.active && can('PRODUCT_UPDATE') ? action('edit', 'Editar', i) : '') +
            (r.active && can('PRODUCT_DELETE') ? action('deactivate', 'Desactivar', i) : '')
        ];
    }
    if (view === 'sales') {
        headers = ['Venta', 'Cliente', 'Fecha', 'Total', 'Estado', 'Acciones'];
        cells = (r, i) => [
            `<span class="cell-title">#${r.id}</span><small class="cell-sub">${esc(r.createdBy)}</small>`,
            esc(r.customerName),
            date(r.createdAt),
            money(r.total),
            `<span class="badge ${r.cancelled ? 'off' : ''}">${r.cancelled ? 'Anulada' : 'Registrada'}</span>`,
            action('sale-detail', 'Ver detalle', i) +
            (!r.cancelled && can('SALE_CANCEL') ? action('cancel-sale', 'Anular', i) : '')
        ];
    }
    if (view === 'users') {
        headers = ['Usuario', 'Rol', 'Estado', 'Acciones'];
        cells = (r, i) => [
            `<span class="cell-title">${esc(r.username)}</span><small class="cell-sub">${esc(r.email)}</small>`,
            `<span class="badge">${esc(r.role || 'Sin rol')}</span>`,
            `<span class="badge ${r.locked || r.disabled ? 'off' : ''}">${r.disabled ? 'Deshabilitado' : r.locked ? 'Bloqueado' : 'Habilitado'}</span>`,
            (can('USER_UPDATE') ? action('edit', 'Editar', i) : '') +
            action('user-detail', 'Permisos', i) +
            (can('ROLE_ASSIGN') ? action('user-role', 'Rol', i) : '') +
            (can('PERMISSION_ASSIGN') ? action('user-permission', '＋ Permiso', i) : '') +
            (can('USER_DELETE') ? action('delete-user', 'Eliminar', i) : '')
        ];
    }
    if (view === 'roles') {
        headers = ['Rol', 'Permisos heredados', 'Acciones'];
        cells = (r, i) => [
            `<span class="cell-title">${esc(r.name)}</span>`,
            chips(r.permissions),
            can('PERMISSION_MANAGE') ? action('role-permission', 'Gestionar permisos', i) : '—'
        ];
    }
    if (view === 'permissions') {
        headers = ['Permiso', 'Tipo'];
        cells = r => [
            `<span class="cell-title">${esc(r.name)}</span>`,
            'Capacidad disponible para roles y usuarios'
        ];
    }

    const paging = ['customers', 'products', 'sales', 'buses', 'alertas', 'rutas', 'estaciones', 'conductores'].includes(view);

    return `
        <section class="panel">
            <div class="panel-title">
                <h3>${esc(sections[view].title)} <span class="muted">· ${paging ? state.total : rows.length}</span></h3>
                <div class="toolbar">
                    <input id="filter" aria-label="Buscar en los resultados visibles" placeholder="Buscar en esta página…">
                </div>
            </div>
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
                    </thead>
                    <tbody>
                        ${rows.map((r, i) => `
                            <tr>
                                ${cells(r, i).map((v, k) => `
                                    <td ${k === headers.length - 1 ? 'class="actions"' : ''}>${v}</td>
                                `).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div id="empty-table" class="empty" ${rows.length ? 'hidden' : ''}>
                    Aún no hay registros. Empieza con una nueva creación.
                </div>
            </div>
            ${paging ? `
                <div class="pagination">
                    <span>Página ${state.page + 1} de ${Math.max(state.pages, 1)} ·${state.total} registros</span>
                    <div>
                        <button data-action="previous" ${state.page === 0 ? 'disabled' : ''}>← Anterior</button>
                        <button data-action="next" ${state.page + 1 >= state.pages ? 'disabled' : ''}>Siguiente →</button>
                    </div>
                </div>
            ` : ''}
        </section>
    `;
}

async function dashboard() {
    const first = state.me.username;
    const transportKeys = ['rutas', 'estaciones', 'buses', 'conductores', 'alertas'];
    const metrics = await Promise.all(transportKeys.map(async key => ({
        key,
        total: can(sections[key].prefix + '_READ')
            ? (await api(sections[key].endpoint + '?size=1')).totalElements
            : null
    })));

    const links = Object.entries(sections).filter(([key]) => key !== 'home' && visible(key));

    $('#content').innerHTML = heading(
        `Hola, ${first}.`,
        'Operación de Transporte Urbano, de un vistazo.',
        `<span class="date-label">${esc(new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }))}</span>`
    ) + `
        <div class="hero">
            <div>
                <span class="eyebrow">SISTEMA DE TRANSPORTE URBANO</span>
                <h2>Monitoreo y control de la red de transporte.</h2>
                <p>Gestiona rutas, estaciones, flota de buses, conductores y alertas operativas en tiempo real.</p>
            </div>
            <span class="hero-mark">🚌</span>
        </div>
        <div class="cards">
            ${metrics.map(({ key, total }) => `
                <div class="card">
                    <span class="card-icon">${sections[key].icon}</span>
                    <div>
                        <h3>${sections[key].title}</h3>
                        <p>${total === null ? 'Sin acceso al listado' : 'Registros en el sistema'}</p>
                    </div>
                    <div class="metric">${total ?? '—'}</div>
                    ${visible(key) ? button('go', 'Abrir módulo →', `data-view="${key}"`, 'link-button') : ''}
                </div>
            `).join('')}
        </div>
        <section class="panel">
            <div class="panel-title">
                <h3>Accesos rápidos a módulos</h3>
                <span class="badge">${esc(state.me.role)}</span>
            </div>
            <div class="quick-links">
                ${links.map(([key, v]) => `
                    <button class="quick-link" data-action="go" data-view="${key}">
                        <span>${v.icon} &nbsp; ${v.title}<small>Ir a ${v.title.toLowerCase()}</small></span>
                        <span>→</span>
                    </button>
                `).join('') || '<div class="empty">Tu cuenta todavía no tiene permisos para estos módulos.</div>'}
            </div>
        </section>
    `;
}

let modalSubmit = null;

function modal(title, body, onSubmit, label = 'Guardar') {
    const f = $('#modal-form');
    f.reset();
    $('#modal-title').textContent = title;
    $('#modal-body').innerHTML = body;
    $('#modal-error').textContent = '';
    $('#modal-save').textContent = label;
    $('#modal-save').hidden = !onSubmit;
    $('#modal-cancel').textContent = onSubmit ? 'Cancelar' : 'Cerrar';
    modalSubmit = onSubmit;
    if (!$('#modal').open) $('#modal').showModal();
}

$('#modal-close').onclick = $('#modal-cancel').onclick = () => $('#modal').close();

$('#modal').addEventListener('click', e => {
    if (e.target === $('#modal')) {
        const rect = e.target.getBoundingClientRect();
        if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
            e.target.close();
        }
    }
});

$('#modal-form').onsubmit = async e => {
    e.preventDefault();
    if (!modalSubmit) return;

    const submit = modalSubmit;
    const b = $('#modal-save');
    b.disabled = true;
    $('#modal-error').textContent = '';

    try {
        await submit(new FormData(e.currentTarget));
        $('#modal').close();
        state.cache = {};
        await refreshMe();
        await navigate(state.view, state.page);
        toast('Cambios guardados correctamente.');
    } catch (error) {
        $('#modal-error').textContent = error.message;
    } finally {
        b.disabled = false;
    }
};

const field = (label, name, value = '', type = 'text', extra = '') => `
    <label>
        ${label}
        <input name="${name}" type="${type}" value="${esc(value)}" ${extra}>
    </label>
`;

function check(label, name, checked) {
    return `
        <label class="check-label">
            <input type="checkbox" name="${name}" ${checked ? 'checked' : ''}>
            ${label}
        </label>
    `;
}

async function options(url) {
    return await api(url);
}

async function picker(name, label, kind, current = '') {
    let values = [];
    if (kind === 'role' && can('ROLE_MANAGE')) {
        values = (await options('/api/roles')).map(r => r.name);
    }
    if (kind === 'permission' && can('PERMISSION_MANAGE')) {
        values = await options('/api/permissions');
    } else if (kind === 'permission' && can('PERMISSION_ASSIGN')) {
        values = await options('/api/user/permissions');
    }

    if (values.length) {
        return `
            <label>
                ${label}
                <select name="${name}" required>
                    ${values.map(v => `<option ${v === current ? 'selected' : ''} value="${esc(v)}">${esc(v)}</option>`).join('')}
                </select>
            </label>
        `;
    }

    return field(label, name, current || (kind === 'role' ? 'CUSTOMER' : ''), 'text', 'required maxlength="50"');
}

async function entityForm(row, askId = false) {
    const view = state.view;
    const edit = !!row;
    row = row || {};
    let body = '';

    if (view === 'buses') {
        body = field('Placa del bus', 'placa', row.placa || '', 'text', 'required maxlength="10" placeholder="Ej. BUS-101"') +
            field('Modelo / Marca', 'modelo', row.modelo || '', 'text', 'required maxlength="50" placeholder="Ej. Mercedes Benz 2024"') + `
            <div class="fields">
                ${field('Capacidad de pasajeros', 'capacidad', row.capacidad ?? 80, 'number', 'required min="1" max="300" step="1"')}
                <label>
                    Estado operativo
                    <select name="estado">
                        <option value="OPERATIVO" ${row.estado === 'OPERATIVO' ? 'selected' : ''}>OPERATIVO</option>
                        <option value="MANTENIMIENTO" ${row.estado === 'MANTENIMIENTO' ? 'selected' : ''}>MANTENIMIENTO</option>
                        <option value="FUERA_SERVICIO" ${row.estado === 'FUERA_SERVICIO' ? 'selected' : ''}>FUERA_SERVICIO</option>
                    </select>
                </label>
            </div>
        `;
    }

    if (view === 'alertas') {
        let busesList = [];
        let rutasList = [];
        let estacionesList = [];
        try {
            if (can('BUS_READ')) busesList = (await allPages('/api/buses')).filter(b => b.activo);
            if (can('RUTA_READ')) rutasList = (await allPages('/api/rutas')).filter(r => r.activo);
            if (can('ESTACION_READ')) estacionesList = (await allPages('/api/estaciones')).filter(e => e.activo);
        } catch {}

        body = `
            <div class="fields">
                <label>
                    Tipo de incidente / alerta
                    <select name="tipo" required>
                        <option value="FALLA_MECANICA" ${row.tipo === 'FALLA_MECANICA' ? 'selected' : ''}>Falla mecánica</option>
                        <option value="ACCIDENTE" ${row.tipo === 'ACCIDENTE' ? 'selected' : ''}>Accidente vial</option>
                        <option value="RETRASO" ${row.tipo === 'RETRASO' ? 'selected' : ''}>Retraso de operación</option>
                        <option value="EMERGENCIA_MEDICA" ${row.tipo === 'EMERGENCIA_MEDICA' ? 'selected' : ''}>Emergencia médica</option>
                        <option value="SEGURIDAD" ${row.tipo === 'SEGURIDAD' ? 'selected' : ''}>Incidente de seguridad</option>
                        <option value="OTRO" ${row.tipo === 'OTRO' ? 'selected' : ''}>Otro incidente</option>
                    </select>
                </label>
                <label>
                    Nivel de severidad
                    <select name="severidad" required>
                        <option value="ALTA" ${row.severidad === 'ALTA' ? 'selected' : ''}>Alta</option>
                        <option value="MEDIA" ${row.severidad === 'MEDIA' ? 'selected' : ''}>Media</option>
                        <option value="BAJA" ${row.severidad === 'BAJA' ? 'selected' : ''}>Baja</option>
                    </select>
                </label>
            </div>
            <label>
                Bus asociado
                ${busesList.length ? `
                    <select name="busId" required>
                        <option value="">Selecciona un bus</option>
                        ${busesList.map(b => `<option value="${b.id}" ${row.busId === b.id ? 'selected' : ''}>${esc(b.placa)} · ${esc(b.modelo)} (#${b.id})</option>`).join('')}
                    </select>
                ` : `<input name="busId" type="number" required min="1" step="1" value="${row.busId || ''}" placeholder="ID del bus">`}
            </label>
            <div class="fields">
                <label>
                    Ruta (opcional)
                    ${rutasList.length ? `
                        <select name="rutaId">
                            <option value="">Ninguna / No aplica</option>
                            ${rutasList.map(r => `<option value="${r.id}" ${row.rutaId === r.id ? 'selected' : ''}>${esc(r.codigo)} - ${esc(r.nombre)}</option>`).join('')}
                        </select>
                    ` : `<input name="rutaId" type="number" min="1" step="1" value="${row.rutaId || ''}" placeholder="ID de ruta">`}
                </label>
                <label>
                    Estación (opcional)
                    ${estacionesList.length ? `
                        <select name="estacionId">
                            <option value="">Ninguna / En tránsito</option>
                            ${estacionesList.map(e => `<option value="${e.id}" ${row.estacionId === e.id ? 'selected' : ''}>${esc(e.nombre)}</option>`).join('')}
                        </select>
                    ` : `<input name="estacionId" type="number" min="1" step="1" value="${row.estacionId || ''}" placeholder="ID de estación">`}
                </label>
            </div>
            <label>
                Descripción detallada del incidente
                <textarea name="descripcion" required maxlength="500" rows="3" style="width:100%;box-sizing:border-box;padding:8px;border-radius:4px;border:1px solid #ccc;font-family:inherit;">${esc(row.descripcion || '')}</textarea>
            </label>
        `;
    }

    if (view === 'rutas') {
        body = field('Código de ruta', 'codigo', row.codigo || '', 'text', 'required maxlength="50" placeholder="Ej. R01-NORTE"') +
            field('Nombre de la ruta', 'nombre', row.nombre || '', 'text', 'required maxlength="150" placeholder="Ej. Portal Norte - Centro"') +
            field('Descripción (opcional)', 'descripcion', row.descripcion || '', 'text', 'maxlength="250"');
    }

    if (view === 'estaciones') {
        body = field('Nombre de estación', 'nombre', row.nombre || '', 'text', 'required maxlength="150" placeholder="Ej. Estación Central"') +
            field('Ubicación (opcional)', 'ubicacion', row.ubicacion || '', 'text', 'maxlength="200" placeholder="Ej. Av. Caracas con Calle 45"');
    }

    if (view === 'conductores') {
        body = field('Nombre completo', 'nombre', row.nombre || '', 'text', 'required maxlength="150"') +
            field('Cédula de ciudadanía', 'cedula', row.cedula || '', 'text', 'required maxlength="20"') + `
            <div class="fields">
                ${field('Licencia de conducción', 'licencia', row.licencia || '', 'text', 'required maxlength="30"')}
                ${field('Teléfono', 'telefono', row.telefono || '', 'tel', 'maxlength="30"')}
            </div>
        `;
    }

    if (view === 'customers') {
        body = field('Nombre', 'name', row.name, 'text', 'required maxlength="150"') + `
            <div class="fields">
                ${field('Correo', 'email', row.email, 'email', 'required maxlength="200"')}
                ${field('Teléfono', 'phone', row.phone, 'tel', 'maxlength="30"')}
            </div>
        `;
    }

    if (view === 'products') {
        body = field('Nombre', 'name', row.name, 'text', 'required maxlength="150"') +
            field('Código SKU', 'sku', row.sku, 'text', 'required maxlength="50"') + `
            <div class="fields">
                ${field('Precio', 'price', row.price ?? '', 'number', 'required min="0.01" step="0.01"')}
                ${field('Existencias', 'stock', row.stock ?? 0, 'number', 'required min="0" max="2147483647" step="1"')}
            </div>
        `;
    }

    if (view === 'users') {
        body = field('Usuario', 'username', row.username, 'text', `required maxlength="50" ${edit ? 'readonly' : ''}`) +
            field('Correo', 'email', row.email, 'email', 'required maxlength="200"') +
            field(edit ? 'Nueva contraseña (opcional)' : 'Contraseña', 'password', '', 'password', `${edit ? '' : 'required'} autocomplete="new-password"`) + `
            <div class="fields">
                ${check('Cuenta bloqueada', 'locked', row.locked)}
                ${check('Cuenta deshabilitada', 'disabled', row.disabled)}
            </div>
        `;

        if (!edit && can('ROLE_ASSIGN')) {
            body += await picker('role', 'Rol de la cuenta', 'role');
        }
        body += '<p class="note">Los permisos adicionales se gestionan desde la acción «Dar permiso». Editar datos no cambia el rol.</p>';
    }

    if (view === 'roles') {
        body = field('Nombre del rol', 'name', '', 'text', 'required maxlength="50" pattern="[A-Za-z][A-Za-z0-9_]{0,49}"');
        if (can('PERMISSION_MANAGE')) {
            body += `
                <label>Permisos iniciales</label>
                <div class="checks">
                    ${(await api('/api/permissions')).map(v => `
                        <label>
                            <input type="checkbox" name="permissions" value="${esc(v)}">
                            ${esc(v)}
                        </label>
                    `).join('')}
                </div>
            `;
        }
        body += '<p class="note">El rol puede comenzar sin permisos. Después podrás asignarlo a un usuario.</p>';
    }

    if (view === 'permissions') {
        body = field('Nombre del permiso', 'name', '', 'text', 'required maxlength="50" pattern="[A-Za-z][A-Za-z0-9_]{0,49}"') +
            '<p class="note">Crear un permiso lo registra en el catálogo. La operación correspondiente debe comprobarlo en el servidor.</p>';
    }

    if (askId) {
        body = field('Identificador del registro', 'recordId', '', 'number', 'required min="1" step="1"') + body;
    }

    modal((edit ? 'Editar ' : 'Nuevo ') + ({
        buses: 'bus',
        alertas: 'incidente / alerta',
        rutas: 'ruta',
        estaciones: 'estación',
        conductores: 'conductor',
        customers: 'cliente',
        products: 'producto',
        users: 'usuario',
        roles: 'rol',
        permissions: 'permiso'
    }[view]), body, async f => {
        let data = Object.fromEntries(f);
        const recordId = askId ? data.recordId : row.id;
        delete data.recordId;

        if (view === 'buses') {
            data.capacidad = Number(data.capacidad);
        }
        if (view === 'alertas') {
            data.busId = Number(data.busId);
            if (data.rutaId) data.rutaId = Number(data.rutaId); else delete data.rutaId;
            if (data.estacionId) data.estacionId = Number(data.estacionId); else delete data.estacionId;
        }
        if (view === 'products') {
            data.price = Number(data.price);
            data.stock = Number(data.stock);
        }
        if (view === 'users') {
            data.locked = f.has('locked');
            data.disabled = f.has('disabled');
            if (edit && !data.password) delete data.password;
        }
        if (view === 'roles' && can('PERMISSION_MANAGE')) {
            data.permissions = f.getAll('permissions');
        }

        const url = view === 'users'
            ? (edit ? '/api/user/update' : '/api/user/add')
            : view === 'roles'
                ? '/api/roles'
                : view === 'permissions'
                    ? '/api/permissions'
                    : sections[view].endpoint + (edit ? '/' + recordId : '');

        await api(url, { method: edit ? 'PUT' : 'POST', body: data });
    });
}

function confirmAction(title, message, run) {
    modal(title, `<p>${esc(message)}</p>`, run, 'Confirmar');
}

async function userRole(row) {
    modal(
        'Asignar rol',
        field('Usuario', 'username', row?.username || '', 'text', 'required') +
        await picker('role', 'Rol único', 'role', row?.role) +
        '<p class="note">Reemplaza el rol actual y conserva los permisos individuales.</p>',
        f => api('/api/user/assignRole', { method: 'POST', body: Object.fromEntries(f) })
    );
}

async function userPermission(row) {
    modal(
        'Dar permiso individual',
        field('Usuario', 'username', row?.username || '', 'text', 'required') +
        await picker('permission', 'Permiso adicional', 'permission') +
        '<p class="note">Se suma a los permisos del rol sin cambiarlo.</p>',
        f => api('/api/user/assignPermission', { method: 'POST', body: Object.fromEntries(f) })
    );
}

async function userDetails(row) {
    const d = await api(`/api/user/${path(row.username)}/permissions`);
    modal(
        'Permisos de ' + d.username,
        `
            <p class="note">Rol: <b>${esc(d.role)}</b></p>
            <div class="permission-group">
                <h3>Heredados del rol</h3>
                ${chips(d.rolePermissions)}
            </div>
            <div class="permission-group">
                <h3>Permisos individuales</h3>
                ${(d.additionalPermissions || []).map(p => `
                    <div class="info-row">
                        <span>${esc(p)}</span>${can('PERMISSION_ASSIGN') ? button('revoke-user-permission', 'Retirar', `data-username="${esc(d.username)}" data-permission="${esc(p)}"`, 'link-button') : ''}
                    </div>
                `).join('') || '<small>No tiene permisos adicionales.</small>'}
            </div>
            <div class="permission-group">
                <h3>Acceso efectivo</h3>
                ${chips(d.effectivePermissions)}
            </div>
        `,
        null
    );
}

async function rolePermissions(row) {
    const p = await picker('permission', 'Permiso', 'permission');
    modal(
        'Permisos de ' + row.name,
        `
            <p class="note">Estos permisos se aplican a todos los usuarios con el rol ${esc(row.name)}.</p>
            ${p}
            <label>
                Operación
                <select name="operation">
                    <option value="PUT">Agregar al rol</option>
                    <option value="DELETE">Retirar del rol</option>
                </select>
            </label>
            <div class="permission-group">
                <h3>Permisos actuales</h3>
                ${chips(row.permissions)}
            </div>
        `,
        f => api(`/api/roles/${path(row.name)}/permissions/${path(f.get('permission'))}`, { method: f.get('operation') })
    );
}

async function allPages(endpoint) {
    const out = [];
    for (let page = 0; ; page++) {
        const d = await api(`${endpoint}?page=${page}&size=100`);
        out.push(...d.content);
        if (page + 1 >= d.totalPages) break;
        if (page >= 99) {
            throw new Error('Hay demasiados registros para este selector. Usa los identificadores manualmente.');
        }
    }
    return out;
}

async function saleForm() {
    const customers = can('CUSTOMER_READ') ? (await allPages('/api/customers')).filter(r => r.active) : [];
    const products = can('PRODUCT_READ') ? (await allPages('/api/products')).filter(r => r.active) : [];

    const customer = customers.length
        ? `
            <label>
                Cliente
                <select name="customerId" required>
                    <option value="">Selecciona un cliente</option>
                    ${customers.map(c => `<option value="${c.id}">${esc(c.name)} · #${c.id}</option>`).join('')}
                </select>
            </label>
        `
        : field('Identificador del cliente', 'customerId', '', 'number', 'required min="1" step="1"');

    modal(
        'Nueva venta',
        customer +
        '<p class="note">El servidor calcula los precios y valida el inventario. Los importes mostrados son una estimación.</p>' +
        '<label>Productos de la venta</label>' +
        '<div id="sale-lines"></div>' +
        button('add-line', '＋ Agregar producto', '', 'secondary') +
        '<div class="totals"><span>Total estimado</span><b id="sale-total">—</b></div>',
        async f => {
            const items = [...$('#sale-lines').children].map(line => ({
                productId: Number(line.querySelector('[name=productId]').value),
                quantity: Number(line.querySelector('[name=quantity]').value)
            }));

            if (!items.length) throw new Error('Agrega al menos un producto.');
            if (new Set(items.map(i => i.productId)).size !== items.length) {
                throw new Error('No repitas productos: consolida su cantidad.');
            }

            await api('/api/sales', {
                method: 'POST',
                body: {
                    customerId: Number(f.get('customerId')),
                    items
                }
            });
        },
        'Registrar venta'
    );

    state.cache.saleProducts = products;
    addSaleLine();
}

function addSaleLine() {
    const ps = state.cache.saleProducts || [];
    const line = document.createElement('div');
    line.className = 'sale-line';

    line.innerHTML = (
        ps.length
            ? `
                <select name="productId" aria-label="Producto" required>
                    <option value="">Selecciona un producto</option>
                    ${ps.map(p => `<option value="${p.id}">${esc(p.name)} · ${money(p.price)} · stock ${p.stock}</option>`).join('')}
                </select>
            `
            : '<input name="productId" aria-label="ID de producto" placeholder="ID de producto" type="number" required min="1" step="1">'
    ) +
    '<input name="quantity" aria-label="Cantidad" type="number" value="1" min="1" max="1000000" step="1" required>' +
    button('remove-line', '×', '', 'icon-button');

    $('#sale-lines').append(line);
    saleEstimate();
}

function saleEstimate() {
    if (!$('#sale-total')) return;
    let total = 0;
    let unknown = false;

    for (const line of $('#sale-lines').children) {
        const p = (state.cache.saleProducts || []).find(p => p.id === Number(line.querySelector('[name=productId]').value));
        if (!p) {
            unknown = true;
            continue;
        }
        total += Math.round(Number(p.price) * 100) * Number(line.querySelector('[name=quantity]').value);
    }

    $('#sale-total').textContent = unknown ? 'Por calcular' : money(total/100);
}

async function saleDetails(row) {
    const d = await api('/api/sales/' + row.id);
    modal(
        'Venta #' + d.id,
        `
            <div class="info-row"><span>Cliente</span><b>${esc(d.customerName)}</b></div>
            <div class="info-row"><span>Registrada por</span><b>${esc(d.createdBy)}</b></div>
            <div class="info-row"><span>Fecha</span><b>${esc(date(d.createdAt))}</b></div>
            <div class="info-row"><span>Estado</span><b>${d.cancelled ? 'Anulada' : 'Registrada'}</b></div>
            ${d.cancelled ? `<div class="info-row"><span>Anulación</span><b>${esc(d.cancelledBy)} ·${esc(date(d.cancelledAt))}</b></div>` : ''}
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Precio</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${d.items.map(i => `
                            <tr>
                                <td>${esc(i.productName)}</td>
                                <td>${i.quantity}</td>
                                <td>${money(i.unitPrice)}</td>
                                <td>${money(i.subtotal)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div class="totals">
                <span>Total registrado</span><b>${money(d.total)}</b>
            </div>
        `,
        null
    );
}

async function handle(action, element) {
    const row = state.rows[Number(element.dataset.index)];

    switch (action) {
        case 'go':
            return navigate(element.dataset.view);

        case 'reload':
            await refreshMe();
            return navigate(state.view, state.page);

        case 'previous':
            return navigate(state.view, state.page - 1);

        case 'next':
            return navigate(state.view, state.page + 1);

        case 'create':
            return state.view === 'sales' ? saleForm() : entityForm();

        case 'edit':
            return entityForm(row);

        case 'edit-business-id':
            return entityForm({}, true);

        case 'deactivate-business-id':
            modal(
                'Desactivar registro',
                field('Identificador', 'id', '', 'number', 'required min="1" step="1"') +
                '<p class="note">El registro quedará inactivo. Se conservará el historial.</p>',
                f => api(sections[state.view].endpoint + '/' + path(f.get('id')), { method: 'DELETE' }),
                'Desactivar'
            );
            return;

        case 'cancel-sale-id':
            modal(
                'Anular venta',
                field('Identificador de venta', 'id', '', 'number', 'required min="1" step="1"') +
                '<p class="note">Anular repone las existencias y conserva el detalle original.</p>',
                f => api('/api/sales/' + path(f.get('id')) + '/cancel', { method: 'POST' }),
                'Anular venta'
            );
            return;

        case 'revoke-permission-id':
            modal(
                'Retirar permiso individual',
                field('Usuario', 'username', '', 'text', 'required') +
                await picker('permission', 'Permiso individual', 'permission') +
                '<p class="note">Los permisos heredados del rol permanecerán activos.</p>',
                f => api(`/api/user/${path(f.get('username'))}/permissions/${path(f.get('permission'))}`, { method: 'DELETE' }),
                'Retirar permiso'
            );
            return;

        case 'edit-named':
            modal(
                'Actualizar cuenta',
                field('Usuario', 'username', '', 'text', 'required') +
                field('Nuevo correo (opcional)', 'email', '', 'email') +
                field('Nueva contraseña (opcional)', 'password', '', 'password') +
                `
                    <label>
                        Estado
                        <select name="status">
                            <option value="">Conservar estado</option>
                            <option value="enabled">Habilitar y desbloquear</option>
                            <option value="disabled">Deshabilitar</option>
                            <option value="locked">Bloquear</option>
                        </select>
                    </label>
                `,
                f => {
                    const data = { username: f.get('username') };
                    if (f.get('email')) data.email = f.get('email');
                    if (f.get('password')) data.password = f.get('password');
                    if (f.get('status') === 'enabled') {
                        data.locked = false;
                        data.disabled = false;
                    }
                    if (f.get('status') === 'disabled') data.disabled = true;
                    if (f.get('status') === 'locked') data.locked = true;
                    return api('/api/user/update', { method: 'PUT', body: data });
                }
            );
            return;

        case 'delete-named':
            modal(
                'Eliminar cuenta',
                field('Usuario', 'username', '', 'text', 'required') +
                '<p class="note">La cuenta se eliminará permanentemente.</p>',
                f => api('/api/user/delete/' + path(f.get('username')), { method: 'DELETE' }),
                'Eliminar'
            );
            return;

        case 'deactivate':
            return confirmAction(
                'Desactivar registro',
                `¿Desactivar ${row.name}? Las ventas históricas se conservarán.`,
                () => api(sections[state.view].endpoint + '/' + row.id, { method: 'DELETE' })
            );

        case 'delete-user':
            return confirmAction(
                'Eliminar usuario',
                `¿Eliminar permanentemente la cuenta ${row.username}?`,
                () => api('/api/user/delete/' + path(row.username), { method: 'DELETE' })
            );

        case 'user-role':
            return userRole(row);

        case 'user-permission':
            return userPermission(row);

        case 'user-detail':
            return userDetails(row);

        case 'role-permission':
            return rolePermissions(row);

        case 'cancel-sale':
            return confirmAction(
                'Anular venta',
                `¿Anular la venta #${row.id}? Sus existencias regresarán al inventario.`,
                () => api('/api/sales/' + row.id + '/cancel', { method: 'POST' })
            );

        case 'sale-detail':
            return saleDetails(row);

        case 'add-line':
            if ($('#sale-lines').children.length >= 100) {
                throw new Error('Máximo 100 productos por venta.');
            }
            return addSaleLine();

        case 'remove-line':
            element.closest('.sale-line').remove();
            return saleEstimate();

        case 'revoke-user-permission':
            return confirmAction(
                'Retirar permiso individual',
                `¿Retirar ${element.dataset.permission} de ${element.dataset.username}? Los permisos heredados se conservan.`,
                () => api(`/api/user/${path(element.dataset.username)}/permissions/${path(element.dataset.permission)}`, { method: 'DELETE' })
            );
    }
}

async function onAction(e) {
    const b = e.target.closest('[data-action]');
    if (!b || b.disabled) return;
    b.disabled = true;

    try {
        await handle(b.dataset.action, b);
    } catch (error) {
        toast(error.message, true);
    } finally {
        b.disabled = false;
    }
}

$('#content').addEventListener('click', onAction);
$('#modal-body').addEventListener('click', onAction);
$('#modal-body').addEventListener('input', saleEstimate);

$('#content').addEventListener('input', e => {
    if (e.target.id !== 'filter') return;
    const term = e.target.value.toLocaleLowerCase();
    let shown = 0;

    $('#content').querySelectorAll('tbody tr').forEach(row => {
        row.hidden = !row.textContent.toLocaleLowerCase().includes(term);
        if (!row.hidden) shown++;
    });

    $('#empty-table').hidden = shown > 0;
    $('#empty-table').textContent = term ? 'No hay coincidencias en esta página.' : 'Aún no hay registros.';
});

$('#session-button').onclick = async () => {
    try {
        await refreshMe();
        modal(
            'Mi espacio',
            `
                <div class="info-row"><span>Usuario</span><b>${esc(state.me.username)}</b></div>
                <div class="info-row"><span>Rol</span><b>${esc(state.me.role)}</b></div>
                <div class="permission-group">
                    <h3>Permisos de mi sesión</h3>
                    ${chips(state.me.effectivePermissions)}
                </div>
            `,
            null
        );
    } catch (error) {
        toast(error.message, true);
        logout();
    }
};

if (state.token) {
    enter().catch(() => {
        logout();
        toast('Inicia sesión nuevamente para continuar.', true);
    });
}