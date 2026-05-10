// === ADMIN MODULE ===

let adminSectionActive = null;

function showAdminSection(sectionName) {
  const container = document.getElementById('admin-sections');
  if (!container) return;

  if (adminSectionActive === sectionName) {
    container.innerHTML = '';
    adminSectionActive = null;
    return;
  }
  adminSectionActive = sectionName;

  switch (sectionName) {
    case 'solicitudes-pendientes': renderSolicitudesPendientes(); break;
    case 'solicitudes-respondidas': renderSolicitudesRespondidas(); break;
    case 'mis-pacientes': renderMisPacientes(); break;
    case 'nuevo-admin': renderNuevoAdmin(); break;
    case 'mi-perfil-admin': renderAdminPerfil(); break;
  }
}

// ===== SOLICITUDES PENDIENTES =====
async function renderSolicitudesPendientes() {
  const container = document.getElementById('admin-sections');
  container.innerHTML = sectionPanelHTML('Solicitudes Pendientes', 'Pedidos sin responder', `<div class="loading-center"><div class="spinner"></div></div>`);

  try {
    const requests = await dbGetPendingRequests();
    const body = document.querySelector('#admin-sections .section-body');

    if (!requests.length) {
      body.innerHTML = emptyStateHTML('Sin pendientes', 'No hay solicitudes esperando respuesta');
      return;
    }

    body.innerHTML = requests.map(r => adminRequestCardHTML(r)).join('');
    updateAdminPendingBadge(requests.length);
  } catch (e) {
    showToast('Error al cargar solicitudes', 'error');
  }
}

function adminRequestCardHTML(r) {
  const profile = r.profiles || {};
  const details = safeParseJSON(r.details);
  const typeBadge = {
    receta: `<span class="request-type-badge badge-receta">💊 Receta</span>`,
    orden: `<span class="request-type-badge badge-orden">📋 Orden</span>`,
    transcripcion: `<span class="request-type-badge badge-transcripcion">📸 Transcripción</span>`
  }[r.type] || '';

  let detailText = '';
  if (r.type === 'receta') detailText = `<b>Fármaco:</b> ${details.farmaco || '—'} | <b>Dosis:</b> ${details.dosis || '—'} | <b>Cantidad:</b> ${details.cantidad || '—'}${details.observaciones ? `<br><b>Obs:</b> ${details.observaciones}` : ''}`;
  if (r.type === 'orden') detailText = `<b>Detalle:</b> ${details.detalle || '—'}${details.observaciones ? `<br><b>Obs:</b> ${details.observaciones}` : ''}`;
  if (r.type === 'transcripcion') {
    detailText = details.observaciones ? `<b>Obs:</b> ${details.observaciones}` : 'Sin observaciones';
    if (details.file_url && details.file_url !== '[archivo adjunto]') {
      detailText += `<br><a href="${details.file_url}" target="_blank" rel="noopener" style="color:var(--teal);font-weight:600">Ver imagen adjunta →</a>`;
    }
  }

  return `
    <div class="request-card">
      <div class="request-card-header">
        ${typeBadge}
        <span class="status-badge status-pending">Pendiente</span>
      </div>
      <div style="margin-bottom:8px">
        <div style="font-weight:700;font-size:15px">${profile.full_name || 'Paciente'}</div>
        <div style="font-size:12px;color:var(--gray-500)">DNI: ${profile.dni || '—'} · ${profile.email || '—'}</div>
      </div>
      <div class="request-info">${detailText}</div>
      <div class="request-date mt-12">${formatDateTime(r.created_at)}</div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:12px;flex-wrap:wrap;gap:8px">
        <a href="https://app.rcta.me/Login" target="_blank" rel="noopener noreferrer" class="btn btn-sm"
          style="background:linear-gradient(135deg,#6c3fc5,#8b5cf6);color:white;box-shadow:0 4px 14px rgba(108,63,197,0.35);text-decoration:none">
          <svg viewBox="0 0 24 24" style="width:15px;height:15px"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" fill="currentColor"/></svg>
          RCTA
        </a>
        <button class="btn btn-success btn-sm" onclick="confirmarNotificacion('${r.id}', '${(profile.full_name || '').replace(/'/g, '')}', '${r.type}')">
          <svg viewBox="0 0 24 24" style="width:15px;height:15px"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" fill="currentColor"/></svg>
          Notificar
        </button>
      </div>
    </div>
  `;
}

// Confirmación antes de notificar
function confirmarNotificacion(requestId, patientName, requestType) {
  const tipoTexto = {
    receta: 'receta',
    orden: 'orden médica',
    transcripcion: 'transcripción'
  }[requestType] || 'solicitud';

  openModal(`
    <div style="text-align:center;padding:8px 0 16px">
      <div style="width:64px;height:64px;background:var(--orange-light);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
        <svg viewBox="0 0 24 24" style="width:32px;height:32px;color:#d68910"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/></svg>
      </div>
      <h2 class="modal-title" style="text-align:center">¿Confirmar notificación?</h2>
      <p style="font-size:14px;color:var(--gray-500);margin:8px 0 4px">Vas a notificar a <b>${patientName}</b> que su</p>
      <p style="font-size:14px;color:var(--gray-500);margin-bottom:20px"><b>${tipoTexto} ya está lista para retirar.</b></p>
      <div style="background:var(--orange-light);border-radius:10px;padding:12px 16px;margin-bottom:20px;text-align:left">
        <div style="font-size:12px;font-weight:700;color:#d68910;margin-bottom:4px">⚠️ ANTES DE CONFIRMAR</div>
        <div style="font-size:13px;color:var(--gray-700)">Asegurate de que la ${tipoTexto} ya fue generada en RCTA y está lista para que el paciente la retire.</div>
      </div>
    </div>
    <div id="notif-error" class="alert alert-error hidden"></div>
    <div style="display:flex;gap:10px">
      <button class="btn btn-secondary" style="flex:1" onclick="closeModal()">
        Cancelar
      </button>
      <button class="btn btn-success" style="flex:1" onclick="enviarNotificacion('${requestId}')">
        <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/></svg>
        Sí, notificar
      </button>
    </div>
  `);
}

async function enviarNotificacion(requestId) {
  const mensajeNotificacion = 'Tu solicitud ya está lista para retirar. Pasate por el Servicio Médico. Ante cualquier duda, no dudes en consultarnos.';

  try {
    await dbRespondRequest(requestId, mensajeNotificacion);
    closeModal();
    showToast('✓ Paciente notificado correctamente', 'success');
    renderSolicitudesPendientes();
  } catch {
    const errEl = document.getElementById('notif-error');
    if (errEl) showAlert(errEl, 'Error al notificar. Intentá nuevamente.');
  }
}

// ===== SOLICITUDES RESPONDIDAS & ESTADÍSTICAS =====
async function renderSolicitudesRespondidas() {
  const container = document.getElementById('admin-sections');
  container.innerHTML = sectionPanelHTML(
    'Respondidas & Estadísticas',
    'Solicitudes completadas y métricas mensuales',
    `<div class="loading-center"><div class="spinner"></div></div>`
  );

  try {
    const sb = getSupabase();
    const { data: requests, error } = await sb
      .from('requests')
      .select('*, profiles!requests_user_id_fkey(full_name, dni, email)')
      .eq('status', 'responded')
      .order('responded_at', { ascending: false });

    if (error) throw error;

    const body = document.querySelector('#admin-sections .section-body');

    if (!requests || !requests.length) {
      body.innerHTML = emptyStateHTML('Sin respondidas', 'Todavía no respondiste ninguna solicitud');
      return;
    }

    // ---- Estadísticas mensuales ----
    const stats = calcularEstadisticasMensuales(requests);

    body.innerHTML = `
      <!-- STATS SECTION -->
      <div class="stats-section">
        <div class="stats-title">
          <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" fill="currentColor"/></svg>
          Estadísticas Mensuales
        </div>

        <!-- Totales globales -->
        <div class="stats-totals">
          <div class="stat-total-card teal">
            <div class="stat-total-num">${requests.filter(r=>r.type==='receta').length}</div>
            <div class="stat-total-label">💊 Recetas</div>
          </div>
          <div class="stat-total-card blue">
            <div class="stat-total-num">${requests.filter(r=>r.type==='orden').length}</div>
            <div class="stat-total-label">📋 Órdenes</div>
          </div>
          <div class="stat-total-card purple">
            <div class="stat-total-num">${requests.filter(r=>r.type==='transcripcion').length}</div>
            <div class="stat-total-label">📸 Transcripciones</div>
          </div>
          <div class="stat-total-card green">
            <div class="stat-total-num">${requests.length}</div>
            <div class="stat-total-label">✅ Total</div>
          </div>
        </div>

        <!-- Tabla mensual -->
        <div class="stats-table-wrap">
          <table class="stats-table">
            <thead>
              <tr>
                <th>Mes</th>
                <th>💊 Recetas</th>
                <th>📋 Órdenes</th>
                <th>📸 Transcripciones</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${stats.map(s => `
                <tr>
                  <td><b>${s.mes}</b></td>
                  <td><span class="stat-pill teal-pill">${s.recetas}</span></td>
                  <td><span class="stat-pill blue-pill">${s.ordenes}</span></td>
                  <td><span class="stat-pill purple-pill">${s.transcripciones}</span></td>
                  <td><b>${s.total}</b></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Gráfico de barras -->
        <div class="chart-wrap">
          <div class="chart-label-y">Cantidad</div>
          <div class="chart-bars" id="admin-chart-bars"></div>
          <div class="chart-label-x">Meses</div>
          <div class="chart-legend">
            <div class="chart-legend-item"><div class="legend-dot" style="background:var(--teal)"></div>Recetas</div>
            <div class="chart-legend-item"><div class="legend-dot" style="background:var(--blue)"></div>Órdenes</div>
            <div class="chart-legend-item"><div class="legend-dot" style="background:var(--purple)"></div>Transcripciones</div>
          </div>
        </div>
      </div>

      <!-- LISTA DE RESPONDIDAS -->
      <div class="stats-title" style="margin-top:24px;margin-bottom:12px">
        <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/></svg>
        Historial de Respondidas (${requests.length})
      </div>
      <div id="respondidas-lista">
        ${requests.map(r => respondidaCardHTML(r)).join('')}
      </div>
    `;

    // Renderizar gráfico después de insertar el DOM
    renderBarChart(stats);

  } catch (e) {
    showToast('Error al cargar', 'error');
  }
}

function calcularEstadisticasMensuales(requests) {
  const meses = {};
  const MESES_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

  requests.forEach(r => {
    const fecha = new Date(r.responded_at || r.created_at);
    const key = `${fecha.getFullYear()}-${String(fecha.getMonth()+1).padStart(2,'0')}`;
    const label = `${MESES_ES[fecha.getMonth()]} ${fecha.getFullYear()}`;

    if (!meses[key]) meses[key] = { key, mes: label, recetas: 0, ordenes: 0, transcripciones: 0, total: 0 };
    if (r.type === 'receta') meses[key].recetas++;
    else if (r.type === 'orden') meses[key].ordenes++;
    else if (r.type === 'transcripcion') meses[key].transcripciones++;
    meses[key].total++;
  });

  return Object.values(meses).sort((a,b) => a.key.localeCompare(b.key));
}

function renderBarChart(stats) {
  const container = document.getElementById('admin-chart-bars');
  if (!container || !stats.length) return;

  const maxVal = Math.max(...stats.map(s => s.total), 1);

  container.innerHTML = stats.map(s => {
    const pct = Math.round((s.total / maxVal) * 100);
    const pctR = Math.round((s.recetas / maxVal) * 100);
    const pctO = Math.round((s.ordenes / maxVal) * 100);
    const pctT = Math.round((s.transcripciones / maxVal) * 100);
    return `
      <div class="chart-bar-group">
        <div class="chart-bar-val">${s.total}</div>
        <div class="chart-bar-stack">
          <div class="chart-bar-seg bar-purple" style="height:${pctT}%" title="Transcripciones: ${s.transcripciones}"></div>
          <div class="chart-bar-seg bar-blue" style="height:${pctO}%" title="Órdenes: ${s.ordenes}"></div>
          <div class="chart-bar-seg bar-teal" style="height:${pctR}%" title="Recetas: ${s.recetas}"></div>
        </div>
        <div class="chart-bar-label">${s.mes.split(' ')[0]}<br><small>${s.mes.split(' ')[1]||''}</small></div>
      </div>
    `;
  }).join('');
}

function respondidaCardHTML(r) {
  const profile = r.profiles || {};
  const badges = {
    receta: '<span class="request-type-badge badge-receta">💊 Receta</span>',
    orden: '<span class="request-type-badge badge-orden">📋 Orden</span>',
    transcripcion: '<span class="request-type-badge badge-transcripcion">📸 Transcripción</span>'
  };
  const details = safeParseJSON(r.details);
  let detailText = '';
  if (r.type === 'receta') detailText = `${details.farmaco || ''} ${details.dosis || ''} · ${details.cantidad || ''}`;
  if (r.type === 'orden') detailText = (details.detalle || '').slice(0, 80);
  if (r.type === 'transcripcion') detailText = 'Receta fotografiada';

  return `
    <div class="request-card" style="border-left:3px solid var(--green)">
      <div class="request-card-header">
        ${badges[r.type] || ''}
        <span class="status-badge status-responded">✓ Respondida</span>
      </div>
      <div style="font-weight:700;font-size:15px;margin-bottom:2px">${profile.full_name || '—'}</div>
      <div style="font-size:12px;color:var(--gray-500);margin-bottom:6px">DNI: ${profile.dni || '—'} · ${profile.email || '—'}</div>
      <div class="request-info">${detailText}</div>
      ${r.admin_response ? `
        <div style="margin-top:8px;padding:10px 12px;background:var(--green-light);border-radius:8px;border-left:3px solid var(--green)">
          <div style="font-size:11px;color:#27ae60;font-weight:700;margin-bottom:3px">NOTIFICACIÓN ENVIADA</div>
          <div style="font-size:13px;color:var(--gray-700)">${r.admin_response}</div>
        </div>` : ''}
      <div style="display:flex;justify-content:space-between;margin-top:10px;font-size:12px;color:var(--gray-400)">
        <span>Solicitado: ${formatDate(r.created_at)}</span>
        <span>Respondido: ${formatDate(r.responded_at || r.created_at)}</span>
      </div>
    </div>
  `;
}

// ===== MIS PACIENTES =====
async function renderMisPacientes() {
  const container = document.getElementById('admin-sections');
  container.innerHTML = sectionPanelHTML('Mis Pacientes', 'Todos los usuarios registrados', `
    <div class="search-bar">
      <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/></svg>
      <input type="text" id="patient-search" placeholder="Buscar paciente..." oninput="filterPatients()" />
    </div>
    <div id="patients-content"><div class="loading-center"><div class="spinner"></div></div></div>
  `);

  try {
    const users = await dbGetAllUsers();
    window._adminPatients = users;
    renderPatientList(users);
  } catch (e) {
    const pc = document.getElementById('patients-content');
    if (pc) pc.innerHTML = '<p style="color:var(--red);font-size:14px;padding:16px 0">Error al cargar pacientes.</p>';
    showToast('Error al cargar pacientes', 'error');
  }
}

function filterPatients() {
  const q = document.getElementById('patient-search')?.value?.toLowerCase() || '';
  const filtered = (window._adminPatients || []).filter(p =>
    (p.full_name || '').toLowerCase().includes(q) ||
    (p.dni || '').includes(q) ||
    (p.email || '').toLowerCase().includes(q)
  );
  renderPatientList(filtered);
}

function renderPatientList(users) {
  const pc = document.getElementById('patients-content');
  if (!pc) return;

  // Limpiar contenido anterior (spinner o lista vieja)
  pc.innerHTML = '';

  if (!users.length) {
    const div = document.createElement('div');
    div.className = 'patient-list-wrapper';
    div.innerHTML = emptyStateHTML('Sin resultados', 'No encontramos pacientes con ese criterio');
    body.appendChild(div);
    return;
  }

  if (!users.length) {
    pc.innerHTML = emptyStateHTML('Sin resultados', 'No hay pacientes con ese criterio');
    return;
  }

  // Agrupar por primera letra
  const grouped = {};
  users.forEach(u => {
    const letter = (u.full_name || u.email || '?')[0].toUpperCase();
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(u);
  });

  let html = '';
  Object.keys(grouped).sort().forEach(letter => {
    html += `<div class="alpha-header">${letter}</div>`;
    html += `<ul class="patient-list">${grouped[letter].map(u => patientItemHTML(u)).join('')}</ul>`;
  });

  pc.innerHTML = html;
}

function patientItemHTML(u) {
  const initials = (u.full_name || u.email || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return `
    <li class="patient-item" onclick="openPatientDetail('${u.id}', '${(u.full_name || '').replace(/'/g, '')}')">
      <div class="patient-avatar">${initials}</div>
      <div class="patient-info">
        <div class="patient-name">${u.full_name || 'Sin nombre'}</div>
        <div class="patient-detail">DNI: ${u.dni || '—'} · ${u.email}</div>
      </div>
      <svg viewBox="0 0 24 24" style="width:20px;height:20px;color:var(--gray-300);flex-shrink:0"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="currentColor"/></svg>
    </li>
  `;
}

async function openPatientDetail(userId, name) {
  openModal(`
    <h2 class="modal-title">${name}</h2>
    <p class="modal-subtitle">Historial de solicitudes</p>
    <div class="loading-center"><div class="spinner"></div></div>
  `);

  try {
    const [profile, requests] = await Promise.all([
      dbGetProfile(userId),
      dbGetPatientRequests(userId)
    ]);

    const content = document.getElementById('modal-content');

    let profileHTML = `
      <div style="background:var(--gray-50);border-radius:12px;padding:16px;margin-bottom:16px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px">
          <div><div style="color:var(--gray-400);font-weight:600;font-size:11px;margin-bottom:2px">DNI</div><div style="font-weight:700">${profile.dni || '—'}</div></div>
          <div><div style="color:var(--gray-400);font-weight:600;font-size:11px;margin-bottom:2px">CELULAR</div><div style="font-weight:700">${profile.phone || '—'}</div></div>
          <div style="grid-column:1/-1"><div style="color:var(--gray-400);font-weight:600;font-size:11px;margin-bottom:2px">OBRA SOCIAL</div><div style="font-weight:700">${profile.obra_social || '—'} ${profile.plan ? '· ' + profile.plan : ''} ${profile.nro_afiliado ? '· N° ' + profile.nro_afiliado : ''}</div></div>
        </div>
      </div>
    `;

    // Frequency analysis
    const freq = {};
    requests.forEach(r => {
      const d = safeParseJSON(r.details);
      const key = r.type === 'receta' ? `Receta: ${d.farmaco || '?'}` : r.type === 'orden' ? 'Orden Médica' : 'Transcripción';
      freq[key] = (freq[key] || 0) + 1;
    });

    const freqHTML = Object.keys(freq).length
      ? `<div style="margin-bottom:14px"><div style="font-family:var(--font-heading);font-size:13px;font-weight:700;color:var(--gray-500);margin-bottom:8px">MÁS FRECUENTE</div>${Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k,v]) => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--gray-100);font-size:14px"><span>${k}</span><span style="font-weight:700;color:var(--teal)">${v}x</span></div>`).join('')}</div>`
      : '';

    const histHTML = requests.length
      ? requests.slice(0, 5).map(r => requestCardHTML(r)).join('')
      : emptyStateHTML('Sin solicitudes', 'Este paciente no ha realizado pedidos');

    content.innerHTML = `
      <h2 class="modal-title">${name}</h2>
      ${profileHTML}
      ${freqHTML}
      <div style="font-family:var(--font-heading);font-size:13px;font-weight:700;color:var(--gray-500);margin-bottom:8px">ÚLTIMAS SOLICITUDES</div>
      ${histHTML}
    `;
  } catch {
    showToast('Error al cargar datos del paciente', 'error');
  }
}

// ===== NUEVO ADMIN =====
function renderNuevoAdmin() {
  const container = document.getElementById('admin-sections');
  container.innerHTML = sectionPanelHTML('Nuevo Administrador', 'Asigná rol a un usuario ya registrado', `
    <div style="background:var(--blue-light);border-radius:12px;padding:16px;margin-bottom:20px">
      <div style="font-family:var(--font-heading);font-weight:800;font-size:14px;color:var(--blue);margin-bottom:6px">📋 ¿Cómo funciona?</div>
      <div style="font-size:13px;color:var(--gray-700);line-height:1.6">
        1. La persona se registra normalmente con <b>"Crear cuenta"</b><br>
        2. Ingresás su email acá y le asignás el rol de Administrador
      </div>
    </div>
    <div id="newadmin-error" class="alert alert-error hidden"></div>
    <div id="newadmin-success" class="alert alert-success hidden"></div>
    <div class="form-group"><label>Email del usuario</label><input type="email" id="na-email" placeholder="medica@vasasalud.com" /></div>
    <button class="btn btn-primary btn-full mt-8" onclick="crearNuevoAdmin()">Asignar Rol Admin</button>
  `);
}

async function crearNuevoAdmin() {
  const email = document.getElementById('na-email')?.value?.trim().toLowerCase();
  const errEl = document.getElementById('newadmin-error');
  const sucEl = document.getElementById('newadmin-success');

  if (!email) { showAlert(errEl, 'Ingresá el email del usuario.'); return; }

  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('profiles')
      .update({ role: VASA_CONFIG.roles.ADMIN })
      .eq('email', email)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      showAlert(errEl, 'No se encontró ningún usuario con ese email. ¿Ya se registró en la app?');
      return;
    }

    errEl.classList.add('hidden');
    showAlert(sucEl, `✓ Rol Admin asignado a ${email} correctamente.`);
    document.getElementById('na-email').value = '';
  } catch (e) {
    showAlert(errEl, 'Error al asignar rol. Intentá nuevamente.');
  }
}

// ===== ADMIN PROFILE =====
function renderAdminPerfil() {
  const container = document.getElementById('admin-sections');
  const p = currentProfile || {};
  container.innerHTML = sectionPanelHTML('Mi Perfil', 'Tus datos de administrador', `
    <div style="display:grid;gap:14px;margin-bottom:16px">
      <div><div style="font-size:12px;color:var(--gray-400);font-weight:600;margin-bottom:3px">NOMBRE Y APELLIDO</div><div style="font-weight:700">${p.full_name || '—'}</div></div>
      <div><div style="font-size:12px;color:var(--gray-400);font-weight:600;margin-bottom:3px">DNI</div><div style="font-weight:700">${p.dni || '—'}</div></div>
      <div><div style="font-size:12px;color:var(--gray-400);font-weight:600;margin-bottom:3px">EMAIL</div><div style="font-weight:700">${p.email || '—'}</div></div>
    </div>
    <button class="btn btn-outline" onclick="openEditAdminProfileModal()">Editar mis datos</button>
  `);
}

function openEditAdminProfileModal() {
  const p = currentProfile || {};
  openModal(`
    <h2 class="modal-title">Editar Perfil</h2>
    <div class="form-group"><label>Nombre y Apellido</label><input type="text" id="ap-name" value="${p.full_name || ''}" /></div>
    <div class="form-group"><label>DNI</label><input type="text" id="ap-dni" value="${p.dni || ''}" /></div>
    <button class="btn btn-primary btn-full mt-12" onclick="saveAdminProfile()">Guardar Cambios</button>
  `);
}

async function saveAdminProfile() {
  const name = document.getElementById('ap-name')?.value?.trim();
  const dni = document.getElementById('ap-dni')?.value?.trim();
  try {
    currentProfile = await dbUpsertProfile({ ...currentProfile, full_name: name, dni });
    updateNavUser();
    closeModal();
    showToast('Perfil actualizado', 'success');
    renderAdminPerfil();
  } catch {
    showToast('Error al guardar', 'error');
  }
}

async function updateAdminPendingBadge(count) {
  const badge = document.getElementById('admin-pending-badge');
  if (badge) {
    if (count > 0) { badge.style.display = 'flex'; badge.textContent = count; }
    else { badge.style.display = 'none'; }
  }
}
