const state = {
  students: [],
  materials: [],
  isTeacher: false,
  user: null,
  activeTab: "dashboard",
  studentQuery: ""
};

const tabTitles = {
  dashboard: "Panel de control",
  registro: "Registrar evaluación",
  materiales: "Tareas y materiales",
  alertas: "Alertas de riesgo",
  estudiantes: "Estudiantes"
};

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function setTeacherState(isLoggedIn, user = null) {
  state.isTeacher = isLoggedIn;
  state.user = user;

  const roleBadge = document.getElementById("roleBadge");
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const teacherActions = document.getElementById("teacherActions");
  const guestPrompt = document.getElementById("guestPrompt");
  const userAvatar = document.getElementById("userAvatar");

  if (roleBadge) roleBadge.textContent = isLoggedIn ? `Docente${user?.name ? ` · ${user.name}` : ""}` : "Vista previa";
  if (loginBtn) loginBtn.classList.toggle("hidden", isLoggedIn);
  if (logoutBtn) logoutBtn.classList.toggle("hidden", !isLoggedIn);
  if (teacherActions) teacherActions.classList.toggle("hidden", !isLoggedIn);
  if (guestPrompt) guestPrompt.classList.toggle("hidden", isLoggedIn);
  document.querySelectorAll(".teacher-only, .teacher-nav").forEach((element) => {
    element.classList.toggle("hidden", !isLoggedIn);
  });
  if (userAvatar && isLoggedIn) {
    const initials = (user?.name || "D").split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
    userAvatar.textContent = initials;
  } else if (userAvatar) {
    userAvatar.innerHTML = '<i data-lucide="user-round"></i>';
  }
  if (!isLoggedIn) {
    state.user = null;
  }

  if (typeof lucide !== "undefined") lucide.createIcons();
}

function openLoginModal() {
  const modal = document.getElementById("loginModal");
  if (modal) {
    modal.classList.remove("hidden");
    document.getElementById("loginUsuario")?.focus();
  }
}

function closeLoginModal() {
  document.getElementById("loginModal")?.classList.add("hidden");
}

function bindLoginModal() {
  document.getElementById("loginBtn")?.addEventListener("click", openLoginModal);
  document.getElementById("closeLoginModal")?.addEventListener("click", closeLoginModal);
  document.getElementById("logoutBtn")?.addEventListener("click", logout);
  document.getElementById("loginModal")?.addEventListener("click", (event) => {
    if (event.target.id === "loginModal") closeLoginModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeLoginModal();
  });

  document.getElementById("loginForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const submitButton = form.querySelector('[type="submit"]');
    const username = document.getElementById("loginUsuario").value.trim();
    const password = document.getElementById("loginPassword").value;

    submitButton.disabled = true;
    submitButton.textContent = "Ingresando...";
    try {
      const result = await apiLogin(username, password);
      if (!result.success) {
        showToast(result.message || "No se pudo iniciar sesión.", "error");
        return;
      }

      const user = result.data?.user || result.data?.docente || null;
      setTeacherState(true, user);
      closeLoginModal();
      form.reset();
      try {
        await loadDashboardData();
      } catch (error) {
        showToast(error.message || "Sesión iniciada, pero no se pudieron cargar los datos.", "error");
      }
      showToast(`Bienvenido${user?.name ? `, ${user.name}` : ""}.`, "success");
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = "Ingresar";
    }
  });
}

function calcularRiesgo(estudiante) {
  const esBajaAsistencia = Number(estudiante.asistencia || 0) < 70;
  const esNotaBaja = Number(estudiante.nota || 0) < 10.5;
  const esSinParticipacion = estudiante.participacion === "Nula";

  if (esBajaAsistencia && esNotaBaja && esSinParticipacion) {
    return { enRiesgo: true, nivel: "Alto riesgo", motivo: "Asistencia menor a 70%, nota baja y sin participación" };
  }
  if (esBajaAsistencia || esNotaBaja) {
    return { enRiesgo: true, nivel: "Riesgo moderado", motivo: "Bajo rendimiento o faltas recurrentes" };
  }
  return { enRiesgo: false, nivel: "Estable", motivo: "Sin señales de alerta" };
}

function studentRow(student, includeAction = false) {
  const analysis = calcularRiesgo(student);
  const riskClass = analysis.enRiesgo ? "badge-risk-high" : "badge-risk-none";
  return `<tr>
    <td><strong>${escapeHtml(student.nombre)}</strong></td>
    <td>${escapeHtml(student.asistencia)}%</td>
    <td>${escapeHtml(student.nota)}</td>
    <td>${escapeHtml(student.participacion)}</td>
    <td><span class="${riskClass}">${escapeHtml(analysis.nivel)}</span></td>
    ${includeAction ? `<td><button class="action-btn" data-notify="${escapeHtml(student.nombre)}" data-reason="${escapeHtml(analysis.motivo)}"><i data-lucide="message-circle"></i> Contactar tutor</button></td>` : ""}
  </tr>`;
}

function renderStudents() {
  const dashboardTable = document.getElementById("tabla-dashboard-alertas");
  const alertsTable = document.getElementById("tabla-alertas-full");
  const studentsTable = document.getElementById("tabla-estudiantes");
  const risks = state.students.filter((student) => calcularRiesgo(student).enRiesgo);

  if (dashboardTable) dashboardTable.innerHTML = risks.map((student) => studentRow(student, true)).join("");
  if (alertsTable) {
    alertsTable.innerHTML = risks.map((student) => {
      const analysis = calcularRiesgo(student);
      return `<tr>
        <td><strong>${escapeHtml(student.nombre)}</strong></td>
        <td>${escapeHtml(analysis.motivo)}</td>
        <td>${new Date().toLocaleDateString("es-PE")}</td>
        <td>Coordinar una tutoría preventiva</td>
      </tr>`;
    }).join("") || '<tr><td colspan="4" class="table-empty">No hay alertas activas.</td></tr>';
  }

  const query = state.studentQuery.toLocaleLowerCase("es");
  const filteredStudents = state.students.filter((student) => student.nombre.toLocaleLowerCase("es").includes(query));
  if (studentsTable) {
    studentsTable.innerHTML = filteredStudents.map((student) => studentRow(student)).join("")
      || '<tr><td colspan="5" class="table-empty">No se encontraron estudiantes.</td></tr>';
  }
  if (dashboardTable) {
    dashboardTable.querySelectorAll("[data-notify]").forEach((button) => button.addEventListener("click", () => {
      notificarTelegram(button.dataset.notify, button.dataset.reason);
    }));
  }

  document.getElementById("dashboard-empty")?.classList.toggle("hidden", risks.length > 0);
  const emptyTitle = document.getElementById("dashboard-empty-title");
  const emptyMessage = document.getElementById("dashboard-empty-message");
  if (!state.isTeacher && emptyTitle && emptyMessage) {
    emptyTitle.textContent = "Inicia sesión para ver el seguimiento";
    emptyMessage.textContent = "Los datos de estudiantes solo se muestran en la sesión docente.";
  } else if (emptyTitle && emptyMessage) {
    emptyTitle.textContent = "Todo en orden";
    emptyMessage.textContent = "No hay alertas activas con los datos actuales.";
  }
  document.getElementById("studentCount").textContent = `${filteredStudents.length} estudiante${filteredStudents.length === 1 ? "" : "s"}`;
  document.getElementById("stat-estudiantes").textContent = state.isTeacher ? String(state.students.length) : "—";
  document.getElementById("stat-alertas").textContent = state.isTeacher ? String(risks.length) : "—";
  const average = state.students.length
    ? Math.round(state.students.reduce((sum, student) => sum + Number(student.asistencia || 0), 0) / state.students.length)
    : 0;
  document.getElementById("stat-asistencia").textContent = state.isTeacher ? `${average}%` : "—";
  document.getElementById("stat-notas").textContent = state.isTeacher ? String(state.students.length) : "—";
}

function renderMaterials() {
  const list = document.getElementById("materiales-list");
  if (!list) return;

  list.innerHTML = state.materials.length
    ? state.materials.map((material) => `<article class="material-item">
        <div class="material-item-header">
          <div class="material-title-wrap"><span class="material-icon"><i data-lucide="${material.type === "Tarea" ? "notebook-pen" : "file-text"}"></i></span><strong>${escapeHtml(material.title || "Sin título")}</strong></div>
          <span class="material-type">${escapeHtml(material.type || "Material")}</span>
        </div>
        <p>${escapeHtml(material.desc || material.description || "Sin descripción")}</p>
        ${material.url || material.link ? `<a class="material-link" href="${escapeHtml(material.url || material.link)}" target="_blank" rel="noopener noreferrer">Abrir recurso <i data-lucide="external-link"></i></a>` : ""}
      </article>`).join("")
    : '<div class="empty-state"><i data-lucide="folder-open"></i><strong>Aún no hay recursos</strong><span>Lo que publiques aparecerá aquí para tenerlo a mano.</span></div>';
  if (typeof lucide !== "undefined") lucide.createIcons();
}

function renderAll() {
  renderStudents();
  renderMaterials();
  populateStudentSelect();
  if (typeof lucide !== "undefined") lucide.createIcons();
}

function populateStudentSelect() {
  const select = document.getElementById("select-estudiante");
  if (!select) return;
  const selected = select.value;
  const options = state.students.map((student) => `<option value="${escapeHtml(student.id ?? student.nombre)}">${escapeHtml(student.nombre)}</option>`).join("");
  select.innerHTML = '<option value="">Selecciona un estudiante</option>' + options;
  if (selected) select.value = selected;
}

function switchTab(tabName, event) {
  event?.preventDefault();
  const teacherTabs = ["registro", "materiales", "alertas", "estudiantes"];
  if (teacherTabs.includes(tabName) && !state.isTeacher) {
    openLoginModal();
    return;
  }

  document.querySelectorAll(".view-section").forEach((section) => {
    section.classList.toggle("view-active", section.id === `view-${tabName}`);
  });
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
  document.querySelector(`.nav-item[onclick*="'${tabName}'"]`)?.classList.add("active");
  state.activeTab = tabName;

  const title = document.getElementById("sectionTitle");
  if (title) title.textContent = tabTitles[tabName] || "KallpaSync";
}

async function guardarEvaluacion(event) {
  event.preventDefault();
  if (!state.isTeacher) {
    openLoginModal();
    return;
  }
  const form = event.currentTarget;

  const selectedStudent = document.getElementById("select-estudiante").value;
  const student = state.students.find((item) => String(item.id ?? item.nombre) === selectedStudent);
  if (!student) {
    showToast("Selecciona un estudiante válido.", "error");
    return;
  }

  const updatedStudent = {
    ...student,
    asistencia: Number(document.getElementById("input-asistencia").value),
    nota: Number(document.getElementById("input-nota").value),
    participacion: document.getElementById("input-participacion").value
  };
  const nextStudents = state.students.map((item) => item === student ? updatedStudent : item);
  const button = form.querySelector('[type="submit"]');
  button.disabled = true;

  try {
    const result = await apiSaveGrades(nextStudents);
    if (!result.success) throw new Error(result.message || "No se pudo guardar la evaluación.");
    state.students = nextStudents;
    localStorage.setItem("eduSyncData", JSON.stringify(state.students));
    form.reset();
    renderAll();
    switchTab("dashboard");
    showToast("Evaluación guardada correctamente.", "success");
  } catch (error) {
    showToast(error.message || "No se pudo guardar la evaluación.", "error");
  } finally {
    button.disabled = false;
  }
}

async function guardarMaterial(event) {
  event.preventDefault();
  if (!state.isTeacher) {
    openLoginModal();
    return;
  }
  const form = event.currentTarget;

  const resourceUrl = document.getElementById("material-link").value.trim();
  const normalizedUrl = normalizeResourceUrl(resourceUrl);
  if (resourceUrl && !normalizedUrl) {
    showToast("El enlace debe comenzar con http:// o https://.", "error");
    return;
  }

  const material = {
    title: document.getElementById("material-title").value.trim(),
    type: document.getElementById("material-type").value,
    desc: document.getElementById("material-desc").value.trim(),
    url: normalizedUrl
  };
  const button = form.querySelector('[type="submit"]');
  button.disabled = true;

  try {
    const result = await apiAddMaterial(material);
    if (!result.success) throw new Error(result.message || "No se pudo publicar el material.");
    state.materials.unshift(result.data || material);
    form.reset();
    renderMaterials();
    showToast("Recurso publicado correctamente.", "success");
  } catch (error) {
    showToast(error.message || "No se pudo publicar el recurso.", "error");
  } finally {
    button.disabled = false;
  }
}

function notificarTelegram(nombre, motivo) {
  showToast(`Seguimiento sugerido para ${nombre}: ${motivo}`, "info");
}

function normalizeResourceUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function showToast(message, type = "info") {
  const toast = document.getElementById("appToast");
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast toast-${type}`;
  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => toast.classList.add("hidden"), 4000);
}

async function logout() {
  await apiLogout();
  setTeacherState(false);
  state.students = [];
  state.materials = [];
  renderAll();
  switchTab("dashboard");
  showToast("Sesión cerrada.", "info");
}

async function initializeApp() {
  const date = document.getElementById("currentDate");
  if (date) {
    date.textContent = new Intl.DateTimeFormat("es-PE", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  }

  const token = localStorage.getItem("edusync_token");
  const user = JSON.parse(localStorage.getItem("edusync_user") || "null");
  setTeacherState(Boolean(token), user);
  document.getElementById("loginDemoText")?.classList.toggle("hidden", !USE_MOCK_DATA);

  if (!token) {
    state.students = [];
    state.materials = [];
    renderAll();
    return;
  }

  await loadDashboardData();
}

async function loadDashboardData() {
  try {
    const [students, materials] = await Promise.all([apiGetStudents(), apiGetMaterials()]);
    const savedStudents = JSON.parse(localStorage.getItem("eduSyncData") || "null");
    state.students = Array.isArray(savedStudents) && savedStudents.length ? savedStudents : students;
    state.materials = materials;
    renderAll();
  } catch (error) {
    console.error("No se pudieron cargar los datos iniciales:", error);
    throw error;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  bindLoginModal();
  document.getElementById("form-evaluacion")?.addEventListener("submit", guardarEvaluacion);
  document.getElementById("form-material")?.addEventListener("submit", guardarMaterial);
  document.getElementById("studentSearch")?.addEventListener("input", (event) => {
    state.studentQuery = event.currentTarget.value.trim();
    renderStudents();
  });
  await initializeApp();
  switchTab("dashboard");
});

window.openLoginModal = openLoginModal;
window.switchTab = switchTab;
window.guardarEvaluacion = guardarEvaluacion;
window.guardarMaterial = guardarMaterial;
window.logout = logout;
