
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

function obtenerIDUsuario() {
  if (!localStorage.getItem("usuarioID")) {
    localStorage.setItem("usuarioID", "usr_" + Math.random().toString(36).substr(2, 9));
  }
  return localStorage.getItem("usuarioID");
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
    const diaData = datosSemana[claveDia] || { apuntados: [], horario: "", max: 5 };
    datosSemana[claveDia] = diaData;

    const estaLleno = diaData.apuntados.length >= diaData.max;
    const userID = obtenerIDUsuario();
    const yaRegistrado = Object.values(datosSemana).some(d =>
      d.apuntados?.some(p => p.id === userID)
    );

    let listaHTML = diaData.apuntados.map((persona, idx) => {
      const puedeCancelar = isAdmin || persona.id === userID;
      return `<li>${persona.nombre} ${puedeCancelar ? `<button class="boton-cancelar" onclick="cancelarCita('${claveDia}', ${idx})">Cancelar</button>` : ""}</li>`;
    }).join("");

    contenedor.innerHTML += `
      <div class="dia">
        <h3>${nombreDia} (${formatFecha(fecha)})</h3>
        <p><strong>Horario:</strong> ${diaData.horario || "No definido"}</p>
        <p><strong>Apuntados (${diaData.apuntados.length}/${diaData.max}):</strong></p>
        <ul class="apuntados">${listaHTML}</ul>
        ${
          !yaRegistrado && !estaLleno ? `<button class="boton-apuntar" onclick="apuntar('${claveDia}')">Apuntarse</button>` : 
          yaRegistrado ? `<button class="boton-apuntar" disabled>Ya estás apuntado</button>` : 
          `<button class="boton-apuntar" disabled>Completo</button>`
        }
        ${isAdmin ? `
        <div style="margin-top:10px">
          <label>Horario: <input type="text" id="h_${claveDia}" value="${diaData.horario}"></label><br>
          <label>Máximo: <input type="number" id="m_${claveDia}" value="${diaData.max}" min="1" max="10"></label>
        </div>
        ` : ""}
      </div>`;
  }

  if (isAdmin) {
    contenedor.innerHTML += `<button onclick="guardarCambiosAdmin()">💾 Guardar cambios</button>`;
  }

  guardarDatosSemana(claveSemana, datosSemana);
}

function apuntar(claveDia) {
  const nombre = prompt("Introduce tu nombre:");
  if (!nombre) return;
  const inicioSemana = getStartOfWeek(semanaOffset);
  const claveSemana = `semana_${inicioSemana.toISOString().slice(0,10)}`;
  const datosSemana = obtenerDatosSemana(claveSemana);
  const userID = obtenerIDUsuario();

  datosSemana[claveDia].apuntados.push({ nombre: nombre.trim(), id: userID });
  guardarDatosSemana(claveSemana, datosSemana);
  renderizarSemana();
}

function cancelarCita(claveDia, index) {
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
    datosSemana[claveDia].horario = document.getElementById("h_" + claveDia).value;
    datosSemana[claveDia].max = parseInt(document.getElementById("m_" + claveDia).value);
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
