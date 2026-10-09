/**
 * AldaEdu - Application Controller
 * Gestión de estado reactiva, interfaz moderna y diagnóstico analítico.
 */

const state = {
  students: [],
  materials: [],
  alerts: [],
  stats: null,
  isTeacher: false,
  user: null,
  activeTab: "dashboard",
  studentQuery: "",
  riskFilter: "todos",
  selectedStudent: null
};

function escapeHtml(val) {
  return String(val ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);
}

// =================== TOASTS ===================
function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  
  const iconName = type === "success" ? "check-circle" : (type === "error" ? "alert-circle" : (type === "warning" ? "alert-triangle" : "info"));
  toast.innerHTML = `
    <i data-lucide="${iconName}" class="toast-icon"></i>
    <div class="toast-content">${escapeHtml(message)}</div>
  `;
  container.appendChild(toast);
  if (typeof lucide !== "undefined") lucide.createIcons();

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    toast.style.transition = "all 250ms ease";
    setTimeout(() => toast.remove(), 250);
  }, 4500);
}

// =================== AUTH STATE ===================
function setTeacherState(isLoggedIn, user = null) {
  state.isTeacher = isLoggedIn;
  state.user = user;

  const roleBadge = document.getElementById("roleBadge");
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const guestPrompt = document.getElementById("guestPrompt");
  const sidebarUserName = document.getElementById("sidebarUserName");
  const sidebarUserAvatar = document.getElementById("sidebarUserAvatar");

  if (roleBadge) {
    roleBadge.textContent = isLoggedIn ? `Docente: ${user?.name || "Activo"}` : "Vista previa";
  }
  if (loginBtn) loginBtn.classList.toggle("hidden", isLoggedIn);
  if (logoutBtn) logoutBtn.classList.toggle("hidden", !isLoggedIn);
  if (guestPrompt) guestPrompt.classList.toggle("hidden", isLoggedIn);

  if (sidebarUserName) {
    sidebarUserName.textContent = isLoggedIn ? (user?.name || "Profesor Activo") : "Invitado";
  }
  if (sidebarUserAvatar) {
    sidebarUserAvatar.textContent = isLoggedIn 
      ? (user?.name || "D").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
      : "V";
  }

  document.querySelectorAll(".teacher-only, .teacher-nav").forEach(el => {
    el.classList.toggle("hidden", !isLoggedIn);
  });

  if (typeof lucide !== "undefined") lucide.createIcons();
}

// =================== MODAL CONTROLLERS ===================
function openModal(modalId) {
  document.getElementById(modalId)?.classList.add("active");
}

function closeModal(modalId) {
  document.getElementById(modalId)?.classList.remove("active");
}

function setupModalBackdrops() {
  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", e => {
      if (e.target === overlay) overlay.classList.remove("active");
    });
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal-overlay.active").forEach(m => m.classList.remove("active"));
    }
  });
}

// =================== RENDER ENGINE ===================
function renderMetrics() {
  const students = state.students;
  const altos = students.filter(s => s.nivel_riesgo === "alto").length;
  const medios = students.filter(s => s.nivel_riesgo === "medio").length;
  const asistProm = students.length 
    ? Math.round(students.reduce((a, b) => a + Number(b.asistencia || 0), 0) / students.length)
    : 0;
  const notaProm = students.length 
    ? (students.reduce((a, b) => a + Number(b.nota || b.promedio || 0), 0) / students.length).toFixed(1)
    : "0.0";

  const statEstudiantes = document.getElementById("stat-estudiantes");
  const statAlertas = document.getElementById("stat-alertas");
  const statAsistencia = document.getElementById("stat-asistencia");
  const statNotas = document.getElementById("stat-notas");
  const statTotalAlertas = document.getElementById("stat-total-alertas");

  if (statEstudiantes) statEstudiantes.textContent = students.length;
  if (statAlertas) statAlertas.textContent = altos;
  if (statAsistencia) statAsistencia.textContent = `${asistProm}%`;
  if (statNotas) statNotas.textContent = `${notaProm} / 20`;
  if (statTotalAlertas) statTotalAlertas.textContent = altos + medios;

  // Actualizar badges en sidebar y navegación móvil
  const badgeAlertas = document.getElementById("sidebarBadgeAlertas");
  const mobileBadgeAlertas = document.getElementById("mobileBadgeAlertas");
  if (badgeAlertas) {
    badgeAlertas.textContent = altos;
    badgeAlertas.classList.toggle("hidden", altos === 0);
  }
  if (mobileBadgeAlertas) {
    mobileBadgeAlertas.textContent = altos;
    mobileBadgeAlertas.classList.toggle("hidden", altos === 0);
  }
}

function studentRowHtml(student, includeActions = true) {
  const initials = student.nombre.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const risk = student.nivel_riesgo || "bajo";
  const notaVal = Number(student.nota || student.promedio || 0).toFixed(1);
  const asistVal = Number(student.asistencia || 0).toFixed(1);

  return `
    <tr data-student-id="${student.id}">
      <td>
        <div class="student-cell">
          <div class="student-avatar">${escapeHtml(initials)}</div>
          <div class="student-info">
            <span class="student-name">${escapeHtml(student.nombre)}</span>
            <span class="student-grade">${escapeHtml(student.grado || "Secundaria")}</span>
          </div>
        </div>
      </td>
      <td>
        <strong>${asistVal}%</strong>
      </td>
      <td>
        <strong>${notaVal}</strong>
      </td>
      <td>
        <span class="badge-risk ${risk}">${risk === 'alto' ? 'Riesgo Alto' : (risk === 'medio' ? 'Riesgo Medio' : 'Estable')}</span>
      </td>
      ${includeActions ? `
      <td>
        <div class="table-actions">
          <button class="btn-action-icon info" title="Ver ficha del estudiante" onclick="verFichaEstudiante(${student.id})">
            <i data-lucide="eye"></i>
          </button>
          ${risk !== 'bajo' ? `
          <button class="btn-action-pill whatsapp" title="Notificar al tutor" onclick="abrirModalNotificar(${student.id})">
            <i data-lucide="bell"></i> Notificar
          </button>
          ` : `
          <button class="btn-action-icon" title="Evaluar alumno" onclick="evaluarAlumno(${student.id})">
            <i data-lucide="refresh-cw"></i>
          </button>
          `}
        </div>
      </td>` : ""}
    </tr>
  `;
}

function renderStudents() {
  const studentsTable = document.getElementById("tabla-estudiantes");
  const dashboardAlertsTable = document.getElementById("tabla-dashboard-alertas");
  const alertsFullTable = document.getElementById("tabla-alertas-full");

  // Filtrado
  const query = state.studentQuery.toLowerCase();
  let filtered = state.students.filter(s => s.nombre.toLowerCase().includes(query) || (s.grado && s.grado.toLowerCase().includes(query)));
  
  if (state.riskFilter !== "todos") {
    filtered = filtered.filter(s => s.nivel_riesgo === state.riskFilter);
  }

  // Tabla completa de alumnos
  if (studentsTable) {
    if (filtered.length > 0) {
      studentsTable.innerHTML = filtered.map(s => studentRowHtml(s, true)).join("");
    } else {
      studentsTable.innerHTML = `<tr><td colspan="5" class="table-empty"><div class="empty-state"><i data-lucide="search-x"></i><strong>No se encontraron estudiantes</strong><span>Intenta con otro término o limpia los filtros.</span></div></td></tr>`;
    }
  }

  // Dashboard de Alertas Prioritarias (Riesgo alto y medio)
  const prioritized = state.students.filter(s => s.nivel_riesgo === "alto" || s.nivel_riesgo === "medio");
  if (dashboardAlertsTable) {
    if (prioritized.length > 0) {
      dashboardAlertsTable.innerHTML = prioritized.map(s => `
        <tr>
          <td>
            <div class="student-cell">
              <div class="student-avatar">${s.nombre.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase()}</div>
              <div class="student-info">
                <span class="student-name">${escapeHtml(s.nombre)}</span>
                <span class="student-grade">${escapeHtml(s.grado || "")}</span>
              </div>
            </div>
          </td>
          <td><strong>${Number(s.asistencia || 0).toFixed(1)}%</strong></td>
          <td><strong>${Number(s.nota || s.promedio || 0).toFixed(1)}</strong></td>
          <td><span class="badge-risk ${s.nivel_riesgo}">${s.nivel_riesgo.toUpperCase()}</span></td>
          <td>
            <button class="btn-action-pill whatsapp" onclick="abrirModalNotificar(${s.id})">
              <i data-lucide="message-circle"></i> Contactar Tutor
            </button>
          </td>
        </tr>
      `).join("");
    } else {
      dashboardAlertsTable.innerHTML = `<tr><td colspan="5"><div class="empty-state"><i data-lucide="check-check"></i><strong>Todo en orden</strong><span>No se detectan alertas críticas en el aula.</span></div></td></tr>`;
    }
  }

  // Vista dedicada de Alertas
  if (alertsFullTable) {
    if (prioritized.length > 0) {
      alertsFullTable.innerHTML = prioritized.map(s => `
        <tr>
          <td>
            <strong>${escapeHtml(s.nombre)}</strong>
            <div style="font-size: 0.78rem; color: var(--text-muted);">${escapeHtml(s.grado || "")} · Tutor: ${escapeHtml(s.tutor_nombre || "No registrado")}</div>
          </td>
          <td>
            <span class="badge-risk ${s.nivel_riesgo}">${s.nivel_riesgo.toUpperCase()}</span>
            <p style="font-size: 0.82rem; color: var(--text-muted); margin-top: 4px;">${escapeHtml(s.alerta_descripcion || "Asistencia crítica o caída de rendimiento escolar")}</p>
          </td>
          <td>
            <div class="table-actions">
              <button class="btn-action-pill whatsapp" onclick="abrirModalNotificar(${s.id})">
                <i data-lucide="send"></i> Despachar Alerta
              </button>
              <button class="btn-action-pill" onclick="marcarAlertaAtendida(${s.id})">
                <i data-lucide="check"></i> Atendida
              </button>
            </div>
          </td>
        </tr>
      `).join("");
    } else {
      alertsFullTable.innerHTML = `<tr><td colspan="3"><div class="empty-state"><i data-lucide="shield-check"></i><strong>Sin alertas pendientes</strong><span>El alumnado se encuentra en condiciones regulares.</span></div></td></tr>`;
    }
  }

  // Actualizar select de estudiantes en formulario de evaluación
  populateStudentSelect();

  const countLabel = document.getElementById("studentCount");
  if (countLabel) countLabel.textContent = `${filtered.length} estudiante${filtered.length === 1 ? '' : 's'}`;

  if (typeof lucide !== "undefined") lucide.createIcons();
}

function populateStudentSelect() {
  const select = document.getElementById("select-estudiante");
  if (!select) return;
  const curr = select.value;
  select.innerHTML = '<option value="">Selecciona un estudiante...</option>' + 
    state.students.map(s => `<option value="${s.id}">${escapeHtml(s.nombre)} (${escapeHtml(s.grado)})</option>`).join("");
  if (curr) select.value = curr;
}

function renderMaterials() {
  const container = document.getElementById("materiales-list");
  if (!container) return;

  if (state.materials.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="folder-plus"></i>
        <strong>Aún no hay recursos publicados</strong>
        <span>Comparte guías, lecturas o tareas para reforzar a tus estudiantes.</span>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="materials-grid">
        ${state.materials.map(m => `
          <article class="material-card">
            <div class="material-header">
              <span class="material-type-tag ${m.type || 'Material'}">${escapeHtml(m.type || 'Material')}</span>
              <span class="material-date">${escapeHtml(m.fecha || 'Reciente')}</span>
            </div>
            <h3 class="material-title">${escapeHtml(m.title)}</h3>
            <p class="material-desc">${escapeHtml(m.desc || 'Sin instrucciones adicionales.')}</p>
            <div class="material-footer">
              ${m.url ? `
              <a href="${escapeHtml(m.url)}" target="_blank" rel="noopener noreferrer" class="material-link-btn">
                <i data-lucide="external-link"></i> Abrir Recurso
              </a>` : `<span style="font-size:0.78rem; color:var(--text-subtle);">Sin enlace externo</span>`}
            </div>
          </article>
        `).join("")}
      </div>
    `;
  }
  if (typeof lucide !== "undefined") lucide.createIcons();
}

// =================== INTERACTIVE ACTIONS ===================
async function ejecutarDiagnosticoGlobal() {
  const btn = document.getElementById("btnDiagnosticoGlobal");
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader-2" class="animate-spin"></i> Analizando...`;
    if (typeof lucide !== "undefined") lucide.createIcons();
  }

  showToast("Ejecutando motor analítico sobre todos los estudiantes...", "info");

  try {
    const res = await apiEvaluarTodos();
    showToast(`Diagnóstico completo: ${res.total_analizados} analizados, ${res.riesgo_alto} en riesgo alto, ${res.riesgo_medio} moderado.`, "success");
    await recargarDatos();
  } catch (err) {
    showToast(err.message || "Error al ejecutar el diagnóstico.", "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i data-lucide="sparkles"></i> <span>Escanear Aula con IA</span>`;
      if (typeof lucide !== "undefined") lucide.createIcons();
    }
  }
}

async function evaluarAlumno(studentId) {
  try {
    showToast("Analizando datos del estudiante...", "info");
    const res = await apiEvaluarTodos(); // o evaluar individual
    showToast("Estudiante evaluado exitosamente.", "success");
    await recargarDatos();
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function verFichaEstudiante(studentId) {
  try {
    showToast("Cargando ficha del alumno...", "info");
    const detail = await apiGetStudentDetail(studentId);
    state.selectedStudent = detail;

    document.getElementById("modalFichaNombre").textContent = detail.nombre;
    document.getElementById("modalFichaGrado").textContent = detail.grado;
    document.getElementById("modalFichaAsistencia").textContent = `${Number(detail.asistencia || 0).toFixed(1)}%`;
    document.getElementById("modalFichaNota").textContent = Number(detail.nota || detail.promedio || 0).toFixed(1);
    
    const riskBadge = document.getElementById("modalFichaRiesgo");
    if (riskBadge) {
      riskBadge.className = `badge-risk ${detail.nivel_riesgo || 'bajo'}`;
      riskBadge.textContent = (detail.nivel_riesgo || 'bajo').toUpperCase();
    }

    document.getElementById("modalFichaTutor").textContent = detail.tutor_nombre || "No especificado";
    document.getElementById("modalFichaTutorEmail").textContent = detail.tutor_email || "Sin email";
    document.getElementById("modalFichaTutorTel").textContent = detail.tutor_telefono || "Sin teléfono";
    document.getElementById("modalFichaMotivo").textContent = detail.alerta_descripcion || "El estudiante mantiene métricas estables.";

    openModal("modalFicha");
    if (typeof lucide !== "undefined") lucide.createIcons();
  } catch (err) {
    showToast(err.message || "No se pudo cargar la ficha", "error");
  }
}

function abrirModalNotificar(studentId) {
  const student = state.students.find(s => s.id == studentId);
  if (!student) return;

  state.selectedStudent = student;
  document.getElementById("notifStudentName").textContent = student.nombre;
  document.getElementById("notifTutorName").value = student.tutor_nombre || "Tutor / Padre de Familia";
  document.getElementById("notifTutorEmail").value = student.tutor_email || "";
  document.getElementById("notifTutorPhone").value = student.tutor_telefono || "";

  const motivo = student.alerta_descripcion || "Asistencia crítica y descenso en rendimiento pedagógico";
  document.getElementById("notifMensaje").value = 
    `Estimado/a ${student.tutor_nombre || 'Padre/Madre de familia'}, le saludamos desde el colegio respecto a su menor ${student.nombre}. ` +
    `Hemos identificado una situación de acompañamiento prioritario debido a: ${motivo}. ` +
    `Agradecemos coordinar con nosotros una breve sesión de tutoría preventiva para asegurar su éxito escolar.`;

  openModal("modalNotificar");
  if (typeof lucide !== "undefined") lucide.createIcons();
}

async function enviarNotificacionTutor(e) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('[type="submit"]');
  btn.disabled = true;
  btn.textContent = "Despachando...";

  const student = state.selectedStudent;
  const payload = {
    estudiante_id: student ? student.id : null,
    nombre: student ? student.nombre : "Estudiante",
    tutor_nombre: document.getElementById("notifTutorName").value.trim(),
    email: document.getElementById("notifTutorEmail").value.trim(),
    telefono: document.getElementById("notifTutorPhone").value.trim(),
    motivo: document.getElementById("notifMensaje").value.trim()
  };

  try {
    const res = await apiNotificarTutor(payload);
    showToast(res.message || "Notificación despachada con éxito vía Twilio/Email.", "success");
    closeModal("modalNotificar");
  } catch (err) {
    showToast(err.message || "Error al despachar la notificación", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Despachar Notificación";
  }
}

async function marcarAlertaAtendida(studentId) {
  try {
    await apiAttendAlert(studentId);
    showToast("Alerta marcada como atendida.", "success");
    await recargarDatos();
  } catch (err) {
    showToast(err.message, "error");
  }
}

// =================== NAVIGATION ===================
function toggleMobileSidebar(forceState) {
  const sidebar = document.querySelector(".sidebar");
  const backdrop = document.getElementById("sidebarBackdrop");
  if (!sidebar) return;
  const isOpen = forceState !== undefined ? forceState : !sidebar.classList.contains("mobile-open");
  sidebar.classList.toggle("mobile-open", isOpen);
  if (backdrop) backdrop.classList.toggle("active", isOpen);
  document.body.style.overflow = isOpen ? "hidden" : "";
}

function switchTab(tabName, event) {
  if (event) event.preventDefault();

  const teacherOnlyTabs = ["registro", "materiales", "alertas", "estudiantes"];
  if (teacherOnlyTabs.includes(tabName) && !state.isTeacher) {
    openModal("loginModal");
    showToast("Inicia sesión para acceder a la gestión docente.", "info");
    return;
  }

  // Cerrar menú móvil si está abierto
  toggleMobileSidebar(false);

  document.querySelectorAll(".view-section").forEach(s => s.classList.add("hidden"));
  document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));
  document.querySelectorAll(".mobile-nav-item").forEach(item => item.classList.remove("active"));

  const targetView = document.getElementById(`view-${tabName}`);
  if (targetView) targetView.classList.remove("hidden");

  const activeNav = document.querySelector(`.nav-item[data-tab="${tabName}"]`);
  if (activeNav) activeNav.classList.add("active");

  const activeMobileNav = document.querySelector(`.mobile-nav-item[data-tab="${tabName}"]`);
  if (activeMobileNav) activeMobileNav.classList.add("active");

  state.activeTab = tabName;
  if (typeof lucide !== "undefined") lucide.createIcons();
}

// =================== FORMS ===================
async function guardarEvaluacion(e) {
  e.preventDefault();
  const studentId = document.getElementById("select-estudiante").value;
  const asistencia = document.getElementById("input-asistencia").value;
  const nota = document.getElementById("input-nota").value;
  const curso = document.getElementById("select-curso")?.value || "Matemáticas";

  if (!studentId) {
    showToast("Por favor selecciona un estudiante", "warning");
    return;
  }

  const btn = e.target.querySelector('[type="submit"]');
  btn.disabled = true;

  try {
    const res = await apiSaveGrades({
      estudiante_id: Number(studentId),
      asistencia: Number(asistencia),
      nota: Number(nota),
      curso: curso
    });
    showToast(res.message || "Evaluación guardada y procesada correctamente.", "success");
    e.target.reset();
    await recargarDatos();
    switchTab("dashboard");
  } catch (err) {
    showToast(err.message || "Error al guardar la evaluación", "error");
  } finally {
    btn.disabled = false;
  }
}

async function guardarMaterial(e) {
  e.preventDefault();
  const title = document.getElementById("material-title").value.trim();
  const type = document.getElementById("material-type").value;
  const desc = document.getElementById("material-desc").value.trim();
  const url = document.getElementById("material-link").value.trim();

  const btn = e.target.querySelector('[type="submit"]');
  btn.disabled = true;

  try {
    await apiAddMaterial({ title, type, desc, url });
    showToast("Recurso compartido correctamente con el aula.", "success");
    e.target.reset();
    await recargarDatos();
  } catch (err) {
    showToast(err.message || "Error al publicar recurso", "error");
  } finally {
    btn.disabled = false;
  }
}

async function crearNuevoEstudiante(e) {
  e.preventDefault();
  const nombre = document.getElementById("newStudentNombre").value.trim();
  const grado = document.getElementById("newStudentGrado").value.trim();
  const tutorNombre = document.getElementById("newStudentTutor").value.trim();
  const tutorEmail = document.getElementById("newStudentEmail").value.trim();
  const tutorTel = document.getElementById("newStudentTel").value.trim();
  const asistencia = document.getElementById("newStudentAsistencia").value;
  const nota = document.getElementById("newStudentNota").value;

  const btn = e.target.querySelector('[type="submit"]');
  btn.disabled = true;

  try {
    await apiAddStudent({
      nombre, grado, tutor_nombre: tutorNombre, tutor_email: tutorEmail, tutor_telefono: tutorTel,
      asistencia: Number(asistencia || 95), nota: Number(nota || 14)
    });
    showToast(`Estudiante ${nombre} agregado con éxito al aula.`, "success");
    closeModal("modalNuevoEstudiante");
    e.target.reset();
    await recargarDatos();
  } catch (err) {
    showToast(err.message || "Error al registrar estudiante", "error");
  } finally {
    btn.disabled = false;
  }
}

// =================== INIT & SYNC ===================
async function recargarDatos() {
  try {
    const [students, materials] = await Promise.all([
      apiGetStudents(),
      apiGetMaterials()
    ]);
    state.students = students;
    state.materials = materials;
    renderMetrics();
    renderStudents();
    renderMaterials();
  } catch (err) {
    console.error("Error al recargar datos:", err);
  }
}

async function inicializar() {
  setupModalBackdrops();

  // Fecha actual en Navbar
  const dateEl = document.getElementById("currentDate");
  if (dateEl) {
    dateEl.textContent = new Intl.DateTimeFormat("es-PE", {
      weekday: "long", day: "numeric", month: "long"
    }).format(new Date());
  }

  // Comprobar token o credencial de sesión
  const token = getAuthToken();
  const user = JSON.parse(localStorage.getItem("aldaedu_user") || localStorage.getItem("edusync_user") || "null");
  setTeacherState(Boolean(token), user);

  // Bind Formularios
  document.getElementById("form-evaluacion")?.addEventListener("submit", guardarEvaluacion);
  document.getElementById("form-material")?.addEventListener("submit", guardarMaterial);
  document.getElementById("formNuevoEstudiante")?.addEventListener("submit", crearNuevoEstudiante);
  document.getElementById("formNotificar")?.addEventListener("submit", enviarNotificacionTutor);

  // Buscador y Filtros
  document.getElementById("studentSearch")?.addEventListener("input", e => {
    state.studentQuery = e.target.value.trim();
    renderStudents();
  });

  document.querySelectorAll(".filter-pill").forEach(pill => {
    pill.addEventListener("click", () => {
      document.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      state.riskFilter = pill.dataset.filter;
      renderStudents();
    });
  });

  // Login Form
  document.getElementById("loginForm")?.addEventListener("submit", async e => {
    e.preventDefault();
    const btn = e.target.querySelector('[type="submit"]');
    const u = document.getElementById("loginUsuario").value.trim();
    const p = document.getElementById("loginPassword").value;
    btn.disabled = true;
    btn.textContent = "Ingresando...";

    const res = await apiLogin(u, p);
    btn.disabled = false;
    btn.textContent = "Ingresar";

    if (res.success) {
      setTeacherState(true, res.data.user);
      closeModal("loginModal");
      showToast(`¡Bienvenido de vuelta, ${res.data.user.name}!`, "success");
      await recargarDatos();
    } else {
      showToast(res.message, "error");
    }
  });

  document.getElementById("logoutBtn")?.addEventListener("click", async () => {
    await apiLogout();
    setTeacherState(false, null);
    showToast("Sesión cerrada.", "info");
    switchTab("dashboard");
  });

  // Cargar datos
  await recargarDatos();
  switchTab("dashboard");
}

document.addEventListener("DOMContentLoaded", inicializar);

// Exportar funciones a ventana global
window.switchTab = switchTab;
window.toggleMobileSidebar = toggleMobileSidebar;
window.openModal = openModal;
window.closeModal = closeModal;
window.ejecutarDiagnosticoGlobal = ejecutarDiagnosticoGlobal;
window.verFichaEstudiante = verFichaEstudiante;
window.abrirModalNotificar = abrirModalNotificar;
window.marcarAlertaAtendida = marcarAlertaAtendida;
window.evaluarAlumno = evaluarAlumno;
