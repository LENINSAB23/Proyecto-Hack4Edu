// Base de datos inicial en memoria/LocalStorage
let estudiantesData = JSON.parse(localStorage.getItem('eduSyncData')) || [
  { nombre: "Juan Pérez", asistencia: 65, nota: 8.5, participacion: "Nula" },
  { nombre: "María López", asistencia: 90, nota: 16.0, participacion: "Alta" },
  { nombre: "Carlos Gómez", asistencia: 75, nota: 11.0, participacion: "Media" },
  { nombre: "Ana Torres", asistencia: 58, nota: 7.0, participacion: "Nula" }
];

document.addEventListener("DOMContentLoaded", () => {
  renderAll();
});

// Cambiar entre pestañas
function switchTab(tabName, event) {
  if (event) event.preventDefault();

  document.querySelectorAll('.view-section').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

  document.getElementById(`view-${tabName}`).style.display = 'block';
  
  if (event && event.currentTarget) {
    event.currentTarget.classList.add('active');
  }
}

// Lógica de detección de riesgo (Reglas del Reto 05)
function calcularRiesgo(estudiante) {
  // Regla: Asistencia < 70% + Nota < 10.5 + Participación Nula
  const esBajaAsistencia = estudiante.asistencia < 70;
  const esNotaBaja = estudiante.nota < 10.5;
  const esSinParticipacion = estudiante.participacion === "Nula";

  if (esBajaAsistencia && esNotaBaja && esSinParticipacion) {
    return { enRiesgo: true, nivel: "ALTO RIESGO", motivo: "Asistencia < 70% + Notas en descenso + 0 Participación" };
  } else if (esBajaAsistencia || esNotaBaja) {
    return { enRiesgo: true, nivel: "RIESGO MODERADO", motivo: "Bajo rendimiento o faltas recurrentes" };
  }
  
  return { enRiesgo: false, nivel: "ESTABLE", motivo: "Sin señales de alerta" };
}

// Guardar nueva evaluación introducida por el profesor
function guardarEvaluacion(event) {
  event.preventDefault();

  const nombre = document.getElementById("select-estudiante").value;
  const asistencia = parseFloat(document.getElementById("input-asistencia").value);
  const nota = parseFloat(document.getElementById("input-nota").value);
  const participacion = document.getElementById("input-participacion").value;

  const idx = estudiantesData.findIndex(e => e.nombre === nombre);
  if (idx !== -1) {
    estudiantesData[idx] = { nombre, asistencia, nota, participacion };
  } else {
    estudiantesData.push({ nombre, asistencia, nota, participacion });
  }

  localStorage.setItem('eduSyncData', JSON.stringify(estudiantesData));
  alert(`✅ Datos guardados y analizados correctamente para ${nombre}.`);
  
  renderAll();
  switchTab('dashboard');
}

// Renderizar métricas y tablas
function renderAll() {
  let alertasContador = 0;
  let sumaAsistencia = 0;
  const tablaDashboard = document.getElementById("tabla-dashboard-alertas");
  const tablaAlertasFull = document.getElementById("tabla-alertas-full");
  const tablaEstudiantes = document.getElementById("tabla-estudiantes");

  tablaDashboard.innerHTML = "";
  tablaAlertasFull.innerHTML = "";
  tablaEstudiantes.innerHTML = "";

  estudiantesData.forEach(est => {
    sumaAsistencia += est.asistencia;
    const analisis = calcularRiesgo(est);

    if (analisis.enRiesgo) {
      alertasContador++;
      
      // Fila Dashboard
      tablaDashboard.innerHTML += `
        <tr>
          <td><strong>${est.nombre}</strong></td>
          <td>${est.asistencia}%</td>
          <td>${est.nota}</td>
          <td>${est.participacion}</td>
          <td><span class="badge-risk-high">${analisis.nivel}</span></td>
          <td><button class="action-btn" onclick="notificarTelegram('${est.nombre}', '${analisis.motivo}')">Notificar Tutor</button></td>
        </tr>
      `;

      // Fila Vista Alertas
      tablaAlertasFull.innerHTML += `
        <tr>
          <td><strong>${est.nombre}</strong></td>
          <td>${analisis.motivo}</td>
          <td>${new Date().toLocaleDateString()}</td>
          <td>Entrevista de tutoría preventiva urgente</td>
        </tr>
      `;
    }

    // Fila Vista Estudiantes
    tablaEstudiantes.innerHTML += `
      <tr>
        <td>${est.nombre}</td>
        <td>${est.asistencia}%</td>
        <td>${est.nota}</td>
        <td>${est.participacion}</td>
        <td><span class="${analisis.enRiesgo ? 'badge-risk-high' : 'badge-risk-none'}">${analisis.nivel}</span></td>
      </tr>
    `;
  });

  // Métricas
  document.getElementById("stat-estudiantes").innerText = estudiantesData.length;
  document.getElementById("stat-alertas").innerText = alertasContador;
  document.getElementById("stat-asistencia").innerText = Math.round(sumaAsistencia / estudiantesData.length) + "%";
  document.getElementById("stat-notas").innerText = estudiantesData.length * 3;

  if (lucide) lucide.createIcons();
}

function notificarTelegram(nombre, motivo) {
  alert(`📢 [Simulación Webhook/Telegram]: Notificación enviada al tutor del estudiante ${nombre}.\nMotivo: ${motivo}`);
}