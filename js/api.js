// Keep mock mode enabled until Django endpoints and authentication are agreed.
const USE_MOCK_DATA = true;
const API_BASE_URL = "http://127.0.0.1:8000/api";

const MOCK_STUDENTS = [
  { id: 1, nombre: "Juan Pérez", asistencia: 65, nota: 8.5, participacion: "Nula" },
  { id: 2, nombre: "María López", asistencia: 90, nota: 16, participacion: "Alta" },
  { id: 3, nombre: "Carlos Gómez", asistencia: 75, nota: 11, participacion: "Media" },
  { id: 4, nombre: "Ana Torres", asistencia: 58, nota: 7, participacion: "Nula" }
];

const MOCK_MATERIALS = [
  { id: 1, title: "Guía de ejercicios - Álgebra", type: "Material", desc: "Ejercicios para practicar ecuaciones durante la semana.", url: "" },
  { id: 2, title: "Tarea semestral - Investigación", type: "Tarea", desc: "Entrega de análisis y reflexión sobre el tema asignado.", url: "" }
];

function getAuthToken() {
  return localStorage.getItem("edusync_token");
}

function getMockCollection(key, defaults) {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || "null");
    return Array.isArray(saved) ? saved : defaults.map((item) => ({ ...item }));
  } catch (error) {
    console.error(`No se pudo leer ${key} desde localStorage:`, error);
    return defaults.map((item) => ({ ...item }));
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

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = typeof payload === "object"
      ? payload.detail || payload.message || Object.values(payload).flat().join(" ")
      : payload;
    throw new Error(message || `Error de servidor (${response.status})`);
  }
  return payload;
}

function listFromApi(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data)) return payload.data;
  throw new Error("La respuesta de la API no tiene el formato de lista esperado.");
}

async function apiLogin(username, password) {
  if (USE_MOCK_DATA) {
    if (username !== "docente@edusync.edu" || password !== "123456") {
      return { success: false, message: "Correo o contraseña incorrectos." };
    }
    const data = {
      token: "mock-jwt-token",
      user: { name: "Alejandro Rivera", role: "teacher" }
    };
    localStorage.setItem("edusync_token", data.token);
    localStorage.setItem("edusync_user", JSON.stringify(data.user));
    return { success: true, data };
  }

  try {
    const data = await requestApi("/auth/login/", {
      method: "POST",
      body: JSON.stringify({ username, password })
    });
    const token = data.token || data.access || data.key;
    if (!token) {
      return { success: false, message: "El backend respondió sin un token de acceso." };
    }
    const user = data.user || data.docente || null;
    localStorage.setItem("edusync_token", token);
    if (user) localStorage.setItem("edusync_user", JSON.stringify(user));
    return { success: true, data: { ...data, token, user } };
  } catch (error) {
    return { success: false, message: error.message || "No se pudo conectar con el servidor." };
  }
}

async function apiGetStudents() {
  if (USE_MOCK_DATA) return getMockCollection("eduSyncData", MOCK_STUDENTS);
  return listFromApi(await requestApi("/students/"));
}

async function apiSaveGrades(students) {
  if (USE_MOCK_DATA) {
    saveMockCollection("eduSyncData", students);
    return { success: true, data: students };
  }
  const data = await requestApi("/grades/bulk-update/", {
    method: "PUT",
    body: JSON.stringify({ students })
  });
  return { success: true, data };
}

async function apiSaveAttendance(attendance) {
  if (USE_MOCK_DATA) {
    saveMockCollection("eduSyncData", attendance);
    return { success: true, data: attendance };
  }
  const data = await requestApi("/attendance/", {
    method: "POST",
    body: JSON.stringify(attendance)
  });
  return { success: true, data };
}

async function apiGetMaterials() {
  if (USE_MOCK_DATA) return getMockCollection("edusync_materials", MOCK_MATERIALS);
  return listFromApi(await requestApi("/materials/"));
}

async function apiAddMaterial(material) {
  if (USE_MOCK_DATA) {
    const materials = getMockCollection("edusync_materials", MOCK_MATERIALS);
    const created = { id: Date.now(), ...material };
    saveMockCollection("edusync_materials", [created, ...materials]);
    return { success: true, data: created };
  }
  const data = await requestApi("/materials/", {
    method: "POST",
    body: JSON.stringify(material)
  });
  return { success: true, data };
}

async function apiLogout() {
  localStorage.removeItem("edusync_token");
  localStorage.removeItem("edusync_user");
}
