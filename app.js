
const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
let semanaOffset = 0;
let isAdmin = false;

function getStartOfWeek(offset = 0) {
  const now = new Date();
  const monday = new Date(now.setDate(now.getDate() - now.getDay() + 1 + offset * 7));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function formatFecha(date) {
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
}

function obtenerDatosSemana(clave) {
  const datos = localStorage.getItem(clave);
  return datos ? JSON.parse(datos) : {};
}

function guardarDatosSemana(clave, data) {
  localStorage.setItem(clave, JSON.stringify(data));
}

function autoGenerarSemana() {
  const hoy = new Date();
  const inicioActual = getStartOfWeek(0);
  const domingo = new Date(inicioActual);
  domingo.setDate(domingo.getDate() + 6);

  if (hoy > domingo) {
    const inicioNueva = getStartOfWeek(1);
    const claveNueva = `semana_${inicioNueva.toISOString().slice(0,10)}`;
    if (!localStorage.getItem(claveNueva)) {
      guardarDatosSemana(claveNueva, {});
    }
  }
}

function renderizarSemana() {
  const contenedor = document.getElementById("contenedor-semana");
  contenedor.innerHTML = "";

  const inicioSemana = getStartOfWeek(semanaOffset);
  const claveSemana = `semana_${inicioSemana.toISOString().slice(0,10)}`;
  const datosSemana = obtenerDatosSemana(claveSemana);
  const nombreSemana = `${formatFecha(inicioSemana)} - ${formatFecha(new Date(inicioSemana.getTime() + 5*86400000))}`;
  document.getElementById("nombre-semana").textContent = `Semana: ${nombreSemana}`;

  for (let i = 0; i < 6; i++) {
    const fecha = new Date(inicioSemana);
    fecha.setDate(fecha.getDate() + i);
    const nombreDia = diasSemana[i];
    const claveDia = `${nombreDia}_${fecha.toISOString().slice(0,10)}`;
    const diaData = datosSemana[claveDia] || { apuntados: [], horario: "17:00 - 19:00", max: 5 };
    datosSemana[claveDia] = diaData;

    const estaLleno = diaData.apuntados.length >= diaData.max;

    let listaHTML = diaData.apuntados.map((nombre, idx) => {
      return `<li>${nombre} ${isAdmin ? `<button onclick="eliminarCita('${claveDia}', ${idx})">❌</button>` : ""}</li>`;
    }).join("");

    contenedor.innerHTML += `
      <div class="dia">
        <h3>${nombreDia} (${formatFecha(fecha)})</h3>
        <p><strong>Horario:</strong> ${diaData.horario}</p>
        <p><strong>Apuntados (${diaData.apuntados.length}/${diaData.max}):</strong></p>
        <ul class="apuntados">${listaHTML}</ul>
        ${!estaLleno ? `<button class="boton-apuntar" onclick="apuntar('${claveDia}')">Apuntarse</button>` : `<button disabled class="boton-apuntar">Completo</button>`}
        ${isAdmin ? `
        <p>
          <label>Horario: <input type="text" id="h_${claveDia}" value="${diaData.horario}"></label><br>
          <label>Máximo: <input type="number" id="m_${claveDia}" value="${diaData.max}" min="1" max="10"></label>
        </p>
        ` : ""}
      </div>`;
  }

  if (isAdmin) {
    contenedor.innerHTML += `<button onclick="guardarCambiosAdmin()">💾 Guardar cambios de peluquero</button>`;
  }

  guardarDatosSemana(claveSemana, datosSemana);
}

function apuntar(claveDia) {
  const nombre = prompt("Introduce tu nombre:");
  if (!nombre) return;
  const inicioSemana = getStartOfWeek(semanaOffset);
  const claveSemana = `semana_${inicioSemana.toISOString().slice(0,10)}`;
  const datosSemana = obtenerDatosSemana(claveSemana);

  datosSemana[claveDia].apuntados.push(nombre.trim());
  guardarDatosSemana(claveSemana, datosSemana);
  renderizarSemana();
}

function eliminarCita(claveDia, index) {
  const inicioSemana = getStartOfWeek(semanaOffset);
  const claveSemana = `semana_${inicioSemana.toISOString().slice(0,10)}`;
  const datosSemana = obtenerDatosSemana(claveSemana);
  datosSemana[claveDia].apuntados.splice(index, 1);
  guardarDatosSemana(claveSemana, datosSemana);
  renderizarSemana();
}

function guardarCambiosAdmin() {
  const inicioSemana = getStartOfWeek(semanaOffset);
  const claveSemana = `semana_${inicioSemana.toISOString().slice(0,10)}`;
  const datosSemana = obtenerDatosSemana(claveSemana);
  for (let i = 0; i < 6; i++) {
    const fecha = new Date(inicioSemana);
    fecha.setDate(fecha.getDate() + i);
    const claveDia = `${diasSemana[i]}_${fecha.toISOString().slice(0,10)}`;
    const nuevoHorario = document.getElementById("h_" + claveDia).value;
    const nuevoMax = parseInt(document.getElementById("m_" + claveDia).value);
    datosSemana[claveDia].horario = nuevoHorario;
    datosSemana[claveDia].max = nuevoMax;
  }
  guardarDatosSemana(claveSemana, datosSemana);
  renderizarSemana();
}

document.getElementById("semana-actual").addEventListener("click", () => {
  semanaOffset = 0;
  renderizarSemana();
});

document.getElementById("semana-siguiente").addEventListener("click", () => {
  semanaOffset = 1;
  renderizarSemana();
});

document.getElementById("btn-admin").addEventListener("click", () => {
  const clave = localStorage.getItem("adminPassword") || "peñu123";
  const intento = prompt("Contraseña de peluquero:");
  if (intento === clave) {
    isAdmin = true;
    renderizarSemana();
  } else {
    alert("Contraseña incorrecta");
  }
});

autoGenerarSemana();
renderizarSemana();
