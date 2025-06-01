
const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
let semanaOffset = 0;
let isAdmin = false;
const userID = obtenerIDUsuario();

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

function getSemanaClave() {
  const inicioSemana = getStartOfWeek(semanaOffset);
  return inicioSemana.toISOString().slice(0, 10);
}

function renderizarSemana(datosSemana) {
  const contenedor = document.getElementById("contenedor-semana");
  contenedor.innerHTML = "";
  const inicioSemana = getStartOfWeek(semanaOffset);
  const nombreSemana = `${formatFecha(inicioSemana)} - ${formatFecha(new Date(inicioSemana.getTime() + 5*86400000))}`;
  document.getElementById("nombre-semana").textContent = `Semana: ${nombreSemana}`;

  for (let i = 0; i < 6; i++) {
    const fecha = new Date(inicioSemana);
    fecha.setDate(fecha.getDate() + i);
    const nombreDia = diasSemana[i];
    const claveDia = `${nombreDia}_${fecha.toISOString().slice(0,10)}`;
    const diaData = datosSemana[claveDia] || { apuntados: [], horario: "", max: 5 };

    const estaLleno = diaData.apuntados.length >= diaData.max;
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
}

function cargarSemanaRealtime() {
  const claveSemana = getSemanaClave();
  db.collection("semanas").doc(claveSemana).onSnapshot((doc) => {
    const datosSemana = doc.exists ? doc.data() : {};
    renderizarSemana(datosSemana);
  });
}

function apuntar(claveDia) {
  const nombre = prompt("Introduce tu nombre:");
  if (!nombre) return;
  const claveSemana = getSemanaClave();
  db.collection("semanas").doc(claveSemana).get().then(doc => {
    const datosSemana = doc.exists ? doc.data() : {};
    datosSemana[claveDia] = datosSemana[claveDia] || { apuntados: [], horario: "", max: 5 };
    datosSemana[claveDia].apuntados.push({ nombre: nombre.trim(), id: userID });
    db.collection("semanas").doc(claveSemana).set(datosSemana);
  });
}

function cancelarCita(claveDia, index) {
  const claveSemana = getSemanaClave();
  db.collection("semanas").doc(claveSemana).get().then(doc => {
    const datosSemana = doc.exists ? doc.data() : {};
    datosSemana[claveDia].apuntados.splice(index, 1);
    db.collection("semanas").doc(claveSemana).set(datosSemana);
  });
}

function guardarCambiosAdmin() {
  const claveSemana = getSemanaClave();
  db.collection("semanas").doc(claveSemana).get().then(doc => {
    const datosSemana = doc.exists ? doc.data() : {};
    for (let i = 0; i < 6; i++) {
      const fecha = new Date(getStartOfWeek(semanaOffset));
      fecha.setDate(fecha.getDate() + i);
      const claveDia = `${diasSemana[i]}_${fecha.toISOString().slice(0,10)}`;
      datosSemana[claveDia] = datosSemana[claveDia] || { apuntados: [], horario: "", max: 5 };
      datosSemana[claveDia].horario = document.getElementById("h_" + claveDia).value;
      datosSemana[claveDia].max = parseInt(document.getElementById("m_" + claveDia).value);
    }
   db.collection("semanas").doc(claveSemana).set(datosSemana, { merge: true });

  });
}

document.getElementById("semana-actual").addEventListener("click", () => {
  semanaOffset = 0;
  cargarSemanaRealtime();
});

document.getElementById("semana-siguiente").addEventListener("click", () => {
  semanaOffset = 1;
  cargarSemanaRealtime();
});

document.getElementById("btn-admin").addEventListener("click", () => {
  const clave = localStorage.getItem("adminPassword") || "peñu123";
  const intento = prompt("Contraseña de peluquero:");
  if (intento === clave) {
    isAdmin = true;
    cargarSemanaRealtime();
  } else {
    alert("Contraseña incorrecta");
  }
});

cargarSemanaRealtime();
