/**
 * AldaEdu - API Client
 * Conecta con el backend Django (Supabase PostgreSQL) con fallback resiliente.
 */

// Si la URL actual ya es servida por Django, usamos '/api', de lo contrario 'http://127.0.0.1:8000/api'
const API_BASE_URL = window.location.origin.includes(':8000') 
  ? `${window.location.origin}/api` 
  : "http://127.0.0.1:8000/api";

const MOCK_STUDENTS = [
  { id: 1, nombre: "Carlos Mendoza", grado: "5to Secundaria", tutor_nombre: "Roberto Mendoza", tutor_email: "roberto@ejemplo.com", tutor_telefono: "+51987654321", asistencia: 25.0, nota: 9.5, promedio: 9.5, participacion: "Nula", nivel_riesgo: "alto", alerta_descripcion: "Asistencia crítica del 25.0% | 6 inasistencias consecutivas" },
  { id: 2, nombre: "Ana Gómez", grado: "5to Secundaria", tutor_nombre: "Elena Gómez", tutor_email: "elena@ejemplo.com", tutor_telefono: "+51912345678", asistencia: 50.0, nota: 8.2, promedio: 8.2, participacion: "Nula", nivel_riesgo: "alto", alerta_descripcion: "Ausencias reiteradas y nota reprobatoria en Matemáticas" },
  { id: 3, nombre: "María López", grado: "5to Secundaria", tutor_nombre: "Patricia López", tutor_email: "patricia@ejemplo.com", tutor_telefono: "+51998877665", asistencia: 96.0, nota: 17.5, promedio: 17.5, participacion: "Alta", nivel_riesgo: "bajo", alerta_descripcion: "" },
  { id: 4, nombre: "Juan Pérez", grado: "4to Secundaria", tutor_nombre: "Carmen Pérez", tutor_email: "carmen@ejemplo.com", tutor_telefono: "+51944556677", asistencia: 72.0, nota: 11.2, promedio: 11.2, participacion: "Media", nivel_riesgo: "medio", alerta_descripcion: "Promedio en el límite y faltas intermitentes" },
  { id: 5, nombre: "Lucía Fernández", grado: "4to Secundaria", tutor_nombre: "Jorge Fernández", tutor_email: "jorge@ejemplo.com", tutor_telefono: "+51933221100", asistencia: 100.0, nota: 18.5, promedio: 18.5, participacion: "Alta", nivel_riesgo: "bajo", alerta_descripcion: "" },
  { id: 6, nombre: "Diego Salcedo", grado: "5to Secundaria", tutor_nombre: "Teresa Salcedo", tutor_email: "teresa@ejemplo.com", tutor_telefono: "+51977665544", asistencia: 60.0, nota: 9.8, promedio: 9.8, participacion: "Nula", nivel_riesgo: "alto", alerta_descripcion: "Asistencia < 70% y promedio bajo en Ciencias" }
];

const MOCK_MATERIALS = [
  { id: 1, title: "Guía de Álgebra: Ecuaciones Cuadráticas", type: "Material", desc: "Ejercicios resueltos y propuestos para reforzar la sesión semanal.", url: "https://drive.google.com/", fecha: "2026-03-01" },
  { id: 2, title: "Tarea 04: Redacción de Ensayos Argumentativos", type: "Tarea", desc: "Investigación y análisis sobre impacto de la tecnología en la educación.", url: "https://docs.google.com/", fecha: "2026-03-03" },
  { id: 3, title: "Simulacro de Evaluación Bimestral de Ciencias", type: "Evaluación", desc: "Revisión integral de física y química con preguntas tipo admisión.", url: "https://forms.google.com/", fecha: "2026-03-05" }
];

function getAuthToken() {
  return localStorage.getItem("aldaedu_token") || localStorage.getItem("edusync_token");
}

function getMockCollection(key, defaults) {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || "null");
    return Array.isArray(saved) && saved.length ? saved : defaults.map(i => ({ ...i }));
  } catch {
    return defaults.map(i => ({ ...i }));
  }
}

function saveMockCollection(key, collection) {
  localStorage.setItem(key, JSON.stringify(collection));
}

async function requestApi(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const token = getAuthToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000); // 7s timeout

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      const message = typeof payload === "object"
        ? payload.detail || payload.message || Object.values(payload).flat().join(" ")
        : payload;
      throw new Error(message || `Error del servidor (${response.status})`);
    }
    return payload;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// =================== AUTH ===================
async function apiLogin(username, password) {
  try {
    const data = await requestApi("/auth/login/", {
      method: "POST",
      body: JSON.stringify({ username, password })
    });
    if (data.token) {
      localStorage.setItem("aldaedu_token", data.token);
      localStorage.setItem("aldaedu_user", JSON.stringify(data.user || { name: username, role: "docente" }));
      return { success: true, data };
    }
    return { success: false, message: data.message || "Credenciales incorrectas" };
  } catch (error) {
    // Modo de demostración offline / standalone
    if ((username === "docente@aldaedu.pe" || username === "docente@aldaedu.edu" || username === "docente@edusync.edu") && password === "123456") {
      const demoData = {
        token: "demo-jwt-token-local",
        user: { name: "Profesor Alejandro Rivera", email: username, role: "docente" }
      };
      localStorage.setItem("aldaedu_token", demoData.token);
      localStorage.setItem("aldaedu_user", JSON.stringify(demoData.user));
      return { success: true, data: demoData };
    }
    return { success: false, message: "Correo o contraseña incorrectos. (Demo: docente@aldaedu.pe / 123456)" };
  }
}

async function apiLogout() {
  localStorage.removeItem("aldaedu_token");
  localStorage.removeItem("aldaedu_user");
  localStorage.removeItem("edusync_token");
  localStorage.removeItem("edusync_user");
}

// =================== STUDENTS ===================
async function apiGetStudents() {
  try {
    const data = await requestApi("/students/");
    if (Array.isArray(data)) {
      saveMockCollection("aldaeduData", data);
      return data;
    }
  } catch (err) {
    console.warn("Backend offline o error al cargar estudiantes, usando cache/mock:", err.message);
  }
  return getMockCollection("aldaeduData", MOCK_STUDENTS);
}

async function apiAddStudent(studentData) {
  try {
    const result = await requestApi("/students/", {
      method: "POST",
      body: JSON.stringify(studentData)
    });
    if (result.success && result.data) return result.data;
  } catch (err) {
    console.warn("Backend no disponible, guardando alumno en local:", err.message);
  }
  // Fallback local
  const current = getMockCollection("aldaeduData", MOCK_STUDENTS);
  const newStudent = {
    id: Date.now(),
    nombre: studentData.nombre,
    grado: studentData.grado || "5to Secundaria",
    tutor_nombre: studentData.tutor_nombre || "",
    tutor_email: studentData.tutor_email || "",
    tutor_telefono: studentData.tutor_telefono || "",
    asistencia: Number(studentData.asistencia || 100),
    nota: Number(studentData.nota || 14),
    promedio: Number(studentData.nota || 14),
    participacion: "Media",
    nivel_riesgo: "bajo",
    alerta_descripcion: ""
  };
  current.unshift(newStudent);
  saveMockCollection("aldaeduData", current);
  return newStudent;
}

async function apiGetStudentDetail(studentId) {
  try {
    return await requestApi(`/students/${studentId}/`);
  } catch (err) {
    const students = getMockCollection("aldaeduData", MOCK_STUDENTS);
    const found = students.find(s => s.id == studentId);
    if (found) {
      return {
        ...found,
        historial_notas: [{ curso: "Matemáticas", calificacion: found.nota, fecha: "2026-03-01" }],
        historial_asistencias: [{ fecha: "2026-03-01", presente: found.asistencia >= 70 }],
        historial_alertas: found.nivel_riesgo !== "bajo" ? [{ nivel_riesgo: found.nivel_riesgo, descripcion: found.alerta_descripcion, atendida: false }] : []
      };
    }
    throw err;
  }
}

async function apiDeleteStudent(studentId) {
  try {
    return await requestApi(`/students/${studentId}/`, { method: "DELETE" });
  } catch (err) {
    const students = getMockCollection("aldaeduData", MOCK_STUDENTS).filter(s => s.id != studentId);
    saveMockCollection("aldaeduData", students);
    return { success: true };
  }
}

// =================== GRADES & ATTENDANCE ===================
async function apiSaveGrades(payload) {
  try {
    const res = await requestApi("/grades/", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    return res;
  } catch (err) {
    // Actualizar en mock
    const current = getMockCollection("aldaeduData", MOCK_STUDENTS);
    const studentId = payload.estudiante_id || payload.id;
    const idx = current.findIndex(s => s.id == studentId || s.nombre === payload.nombre);
    if (idx !== -1) {
      if (payload.nota !== undefined) current[idx].nota = Number(payload.nota);
      if (payload.asistencia !== undefined) current[idx].asistencia = Number(payload.asistencia);
      if (payload.participacion) current[idx].participacion = payload.participacion;
      saveMockCollection("aldaeduData", current);
    }
    return { success: true, message: "Evaluación guardada localmente." };
  }
}

// =================== RISK & ALERTS ===================
async function apiEvaluarTodos() {
  try {
    return await requestApi("/evaluar-todos/", { method: "POST" });
  } catch (err) {
    console.warn("Backend offline para evaluar-todos, procesando en cliente:", err.message);
    const students = getMockCollection("aldaeduData", MOCK_STUDENTS);
    let altos = 0, medios = 0, bajos = 0;
    students.forEach(s => {
      if (s.asistencia < 70 && s.nota < 10.5) { s.nivel_riesgo = "alto"; altos++; }
      else if (s.asistencia < 80 || s.nota < 12) { s.nivel_riesgo = "medio"; medios++; }
      else { s.nivel_riesgo = "bajo"; bajos++; }
    });
    saveMockCollection("aldaeduData", students);
    return {
      success: true,
      total_analizados: students.length,
      riesgo_alto: altos,
      riesgo_medio: medios,
      riesgo_bajo: bajos
    };
  }
}

async function apiGetAlerts(soloActivas = true) {
  try {
    return await requestApi(`/alerts/?activas=${soloActivas}`);
  } catch (err) {
    const students = getMockCollection("aldaeduData", MOCK_STUDENTS);
    return students
      .filter(s => s.nivel_riesgo && s.nivel_riesgo !== "bajo")
      .map(s => ({
        id: s.id,
        estudiante_id: s.id,
        estudiante_nombre: s.nombre,
        grado: s.grado,
        tutor_nombre: s.tutor_nombre,
        tutor_email: s.tutor_email,
        tutor_telefono: s.tutor_telefono,
        nivel_riesgo: s.nivel_riesgo,
        descripcion: s.alerta_descripcion || "Riesgo detectado por inasistencias y notas bajas",
        fecha: "2026-03-08 12:00",
        atendida: false
      }));
  }
}

async function apiAttendAlert(alertaId) {
  try {
    return await requestApi("/alerts/", {
      method: "POST",
      body: JSON.stringify({ alerta_id: alertaId, atendida: true })
    });
  } catch (err) {
    return { success: true, message: "Alerta atendida localmente." };
  }
}

// =================== NOTIFICATIONS (TWILIO / SMTP) ===================
async function apiNotificarTutor(data) {
  try {
    return await requestApi("/notificar-tutor/", {
      method: "POST",
      body: JSON.stringify(data)
    });
  } catch (err) {
    return {
      success: true,
      message: `Notificación simulada para ${data.nombre || 'el estudiante'} despachada correctamente.`,
      destinatarios: { email: data.email || "carlos.tutor@ejemplo.com", whatsapp: data.telefono || "+51987654321" }
    };
  }
}

// =================== MATERIALS ===================
async function apiGetMaterials() {
  try {
    const data = await requestApi("/materials/");
    if (Array.isArray(data)) {
      saveMockCollection("aldaedu_materials", data);
      return data;
    }
  } catch (err) {
    console.warn("Backend offline para materiales, usando cache/mock:", err.message);
  }
  return getMockCollection("aldaedu_materials", MOCK_MATERIALS);
}

async function apiAddMaterial(material) {
  try {
    const res = await requestApi("/materials/", {
      method: "POST",
      body: JSON.stringify(material)
    });
    if (res.success && res.data) return res.data;
  } catch (err) {
    console.warn("Guardando material en local:", err.message);
  }
  const current = getMockCollection("aldaedu_materials", MOCK_MATERIALS);
  const created = { id: Date.now(), ...material, fecha: new Date().toISOString().split("T")[0] };
  current.unshift(created);
  saveMockCollection("aldaedu_materials", current);
  return created;
}

// =================== STATS ===================
async function apiGetStats() {
  try {
    return await requestApi("/stats/");
  } catch (err) {
    const students = getMockCollection("aldaeduData", MOCK_STUDENTS);
    const crit = students.filter(s => s.nivel_riesgo === "alto").length;
    const med = students.filter(s => s.nivel_riesgo === "medio").length;
    const asist = students.length ? Math.round(students.reduce((a, b) => a + Number(b.asistencia || 0), 0) / students.length) : 85;
    const nota = students.length ? Math.round((students.reduce((a, b) => a + Number(b.nota || 0), 0) / students.length) * 10) / 10 : 13.5;
    return {
      total_estudiantes: students.length,
      alertas_activas: crit + med,
      alertas_criticas: crit,
      asistencia_promedio: asist,
      promedio_calificaciones: nota,
      total_materiales: getMockCollection("aldaedu_materials", MOCK_MATERIALS).length
    };
  }
}
