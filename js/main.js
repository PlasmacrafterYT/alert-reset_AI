/* =========================================================
   AlertReset AI – Landing page
   1) Menú móvil  2) Enlace activo al hacer scroll  3) Demo interactiva
   ========================================================= */

/* ---------- 1) Menú móvil ---------- */
const navToggle = document.getElementById("navToggle");
const navMenu = document.getElementById("navMenu");

navToggle.addEventListener("click", () => {
  const open = navMenu.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(open));
  navToggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
});
navMenu.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    navMenu.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  })
);

/* ---------- 2) Enlace activo según la sección visible ---------- */
const links = [...document.querySelectorAll('.navbar__menu li a[href^="#"]')];
const sections = links
  .map((l) => document.querySelector(l.getAttribute("href")))
  .filter(Boolean);

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        links.forEach((l) =>
          l.classList.toggle("active", l.getAttribute("href") === "#" + entry.target.id)
        );
      }
    });
  },
  { rootMargin: "-40% 0px -55% 0px" }
);
sections.forEach((s) => observer.observe(s));

/* ---------- 3) Demo interactiva ---------- */
/* Umbrales (en el producto real los configura el gestor: HU34) */
const FAST_MS = 1500;      // respuesta considerada "rápida"
const FAST_STREAK = 3;     // respuestas rápidas consecutivas

const ROUTINE_MESSAGES = [
  "¿Deseas guardar los cambios del documento?",
  "¿Permitir que esta página use cookies?",
  "¿Deseas abrir este archivo PDF?",
  "¿Permitir notificaciones de este sitio?",
];

const el = (id) => document.getElementById(id);
const ui = {
  start: el("demoStart"),
  box: el("alertBox"),
  badge: el("alertBadge"),
  title: el("alertTitle"),
  text: el("alertText"),
  reason: el("alertReason"),
  meta: el("alertMeta"),
  actions: el("alertActions"),
  accept: el("btnAccept"),
  cancel: el("btnCancel"),
  count: el("demoCount"),
  time: el("demoTime"),
  result: el("demoResult"),
  resultTitle: el("resultTitle"),
  resultText: el("resultText"),
  resultList: el("resultList"),
};

let state;

function resetState() {
  state = {
    step: 0,            // alertas mostradas
    shownAt: 0,
    fastStreak: 0,
    times: [],
    critical: false,
    adapted: false,
    finalDecision: null,
    triggerElement: null,
  };
}

function startDemo() {
  resetState();
  ui.start.hidden = true;
  ui.result.hidden = true;
  showRoutine();
}

function showRoutine() {
  state.step++;
  state.critical = false;
  ui.count.textContent = state.step;

  ui.box.hidden = false;
  ui.box.className = "alert alert--routine";
  ui.badge.textContent = "Riesgo bajo";
  ui.title.textContent = "Confirmación";
  ui.text.textContent = ROUTINE_MESSAGES[(state.step - 1) % ROUTINE_MESSAGES.length];
  ui.reason.hidden = true;
  ui.meta.hidden = true;

  setButtons("Cancelar", "Aceptar");
  state.shownAt = performance.now();
  ui.accept.focus();
}

function showCritical() {
  state.step++;
  state.critical = true;
  state.adapted = state.fastStreak >= FAST_STREAK; // ¿hay habituación?
  ui.count.textContent = state.step;

  ui.box.hidden = false;
  ui.box.className = state.adapted ? "alert alert--critical" : "alert alert--routine";
  ui.badge.textContent = state.adapted ? "Riesgo alto" : "Riesgo bajo";

  if (state.adapted) {
    ui.title.textContent = "Esta advertencia es diferente a las anteriores";
    ui.text.textContent =
      "Estás a punto de compartir información con personas externas a la organización.";
    ui.reason.hidden = false;
    ui.reason.textContent =
      "¿Por qué ves esto? Detectamos varias respuestas muy rápidas seguidas y esta acción es de alto riesgo.";
    ui.meta.hidden = false;
    ui.meta.innerHTML =
      "<span><strong>Recurso:</strong> informe_financiero.xlsx</span>" +
      "<span><strong>Destinatario:</strong> externo@otraempresa.com</span>" +
      "<span><strong>Reversibilidad:</strong> no se puede deshacer una vez enviado</span>";
    setButtons("Cancelar envío", "Revisar destinatario");
    // El botón de acción segura va primero y recibe el foco; la acción riesgosa no.
  } else {
    // Sin habituación: el sistema no interrumpe de forma especial
    ui.title.textContent = "Confirmación";
    ui.text.textContent = "¿Deseas compartir informe_financiero.xlsx con externo@otraempresa.com?";
    ui.reason.hidden = true;
    ui.meta.hidden = true;
    setButtons("Cancelar", "Aceptar");
  }

  state.shownAt = performance.now();
  ui.accept.focus();
}

function setButtons(cancelLabel, acceptLabel) {
  ui.cancel.textContent = cancelLabel;
  ui.accept.textContent = acceptLabel;
}

function registerResponse() {
  const ms = performance.now() - state.shownAt;
  state.times.push(ms);
  ui.time.textContent = (ms / 1000).toFixed(2) + " s";
  if (!state.critical) {
    state.fastStreak = ms < FAST_MS ? state.fastStreak + 1 : 0;
  }
  return ms;
}

function onAccept() {
  const ms = registerResponse();
  if (!state.critical) {
    // 4 alertas rutinarias y después la crítica
    state.step < 4 ? showRoutine() : showCritical();
    return;
  }
  // Decisión sobre la alerta crítica
  if (state.adapted) {
    // "Revisar destinatario" = la opción segura de la alerta adaptativa
    finish("reviewed", ms);
  } else {
    finish("accepted", ms);
  }
}

function onCancel() {
  const ms = registerResponse();
  if (!state.critical) {
    state.step < 4 ? showRoutine() : showCritical();
    return;
  }
  finish("cancelled", ms);
}

function finish(decision, ms) {
  state.finalDecision = decision;
  ui.box.hidden = true;
  ui.result.hidden = false;

  const avg = state.times.reduce((a, b) => a + b, 0) / state.times.length;
  const fastCount = state.times.filter((t) => t < FAST_MS).length;

  if (state.adapted) {
    ui.resultTitle.textContent =
      decision === "cancelled" ? "Bien: detuviste una acción riesgosa" : "Bien: revisaste antes de enviar";
    ui.resultText.textContent =
      "AlertReset AI detectó tu piloto automático y rompió el patrón visual justo cuando importaba.";
  } else {
    ui.resultTitle.textContent =
      decision === "accepted"
        ? "Esta vez no hubo adaptación"
        : "Detuviste la acción antes de enviar";
    ui.resultText.textContent =
      decision === "accepted"
        ? "Respondiste con calma, por eso no se activó la advertencia adaptativa. Prueba de nuevo aceptando más rápido."
        : "Respondiste con calma y decidiste cancelar. La adaptación solo se activa si hay habituación y alto riesgo.";
  }

  ui.resultList.innerHTML =
    `<li>Respuestas rápidas (&lt; ${FAST_MS / 1000} s): <strong>${fastCount} de ${state.times.length}</strong></li>` +
    `<li>Tiempo promedio de respuesta: <strong>${(avg / 1000).toFixed(2)} s</strong></li>` +
    `<li>¿Se activó la alerta adaptativa?: <strong>${state.adapted ? "Sí" : "No"}</strong></li>`;

  el("btnRestart").focus();
}

function restart() {
  ui.time.textContent = "—";
  ui.count.textContent = "0";
  startDemo();
}

el("btnStart").addEventListener("click", startDemo);
el("btnRestart").addEventListener("click", restart);
ui.accept.addEventListener("click", onAccept);
ui.cancel.addEventListener("click", onCancel);

resetState();

/* =========================================================
   4) Inicio de sesión (demostrativo, sin servidor)
   - Valida correo y contraseña (mín. 6 caracteres)
   - Guarda solo el correo en el navegador (nunca la contraseña)
   - Cambia el botón a "Cerrar sesión" y muestra el usuario
   ========================================================= */
const SESSION_KEY = "alertreset_user";
const MIN_PASS = 6;

const login = {
  btn: el("btnLogin"),
  user: el("navUser"),
  modal: el("loginModal"),
  form: el("loginForm"),
  email: el("loginEmail"),
  pass: el("loginPass"),
  remember: el("loginRemember"),
  toggle: el("togglePass"),
  emailErr: el("emailError"),
  passErr: el("passError"),
  formErr: el("formError"),
  lastFocus: null,
};

/* --- almacenamiento seguro (puede fallar en modo privado) --- */
function readSession() {
  try {
    return localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
  } catch (e) { return null; }
}
function saveSession(email, persist) {
  try {
    (persist ? localStorage : sessionStorage).setItem(SESSION_KEY, email);
  } catch (e) { /* sin almacenamiento: la sesión dura mientras la página esté abierta */ }
  login.sessionEmail = email;
}
function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  } catch (e) {}
  login.sessionEmail = null;
}

/* --- estado visual de la barra de navegación --- */
function renderAuth() {
  const email = login.sessionEmail || readSession();
  login.sessionEmail = email;
  if (email) {
    login.user.hidden = false;
    login.user.textContent = "Hola, " + email.split("@")[0];
    login.btn.textContent = "Cerrar sesión";
    login.btn.setAttribute("aria-haspopup", "false");
  } else {
    login.user.hidden = true;
    login.user.textContent = "";
    login.btn.textContent = "Iniciar sesión";
    login.btn.setAttribute("aria-haspopup", "dialog");
  }
}

/* --- modal --- */
function focusables() {
  return [...login.modal.querySelectorAll(
    'button:not([disabled]), input:not([disabled]), a[href]'
  )].filter((n) => n.offsetParent !== null);
}
function openModal() {
  login.lastFocus = document.activeElement;
  resetForm();
  login.modal.hidden = false;
  document.body.classList.add("modal-open");
  login.email.focus();
}
function closeModal() {
  login.modal.hidden = true;
  document.body.classList.remove("modal-open");
  if (login.lastFocus && document.contains(login.lastFocus)) login.lastFocus.focus();
}
function resetForm() {
  login.form.reset();
  [login.emailErr, login.passErr, login.formErr].forEach((n) => { n.hidden = true; n.textContent = ""; });
  [login.email, login.pass].forEach((i) => i.removeAttribute("aria-invalid"));
  login.pass.type = "password";
  login.toggle.textContent = "Mostrar";
  login.toggle.setAttribute("aria-pressed", "false");
}
function setError(input, node, msg) {
  node.textContent = msg;
  node.hidden = !msg;
  if (msg) input.setAttribute("aria-invalid", "true");
  else input.removeAttribute("aria-invalid");
}

/* --- validación y envío --- */
function validate() {
  const email = login.email.value.trim();
  const pass = login.pass.value;
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  const passOk = pass.length >= MIN_PASS;

  setError(login.email, login.emailErr, emailOk ? "" : "Ingresa un correo válido, por ejemplo nombre@correo.com.");
  setError(login.pass, login.passErr, passOk ? "" : `La contraseña debe tener al menos ${MIN_PASS} caracteres.`);

  if (!emailOk) { login.email.focus(); }
  else if (!passOk) { login.pass.focus(); }
  return emailOk && passOk;
}

login.form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!validate()) return;
  saveSession(login.email.value.trim().toLowerCase(), login.remember.checked);
  renderAuth();
  closeModal();
});

/* --- eventos --- */
login.btn.addEventListener("click", () => {
  navMenu.classList.remove("open");
  navToggle.setAttribute("aria-expanded", "false");
  if (login.sessionEmail) {      // ya hay sesión → cerrar sesión
    clearSession();
    renderAuth();
  } else {
    openModal();
  }
});

login.modal.addEventListener("click", (e) => {
  if (e.target.closest("[data-close-modal]")) closeModal();
});

login.toggle.addEventListener("click", () => {
  const show = login.pass.type === "password";
  login.pass.type = show ? "text" : "password";
  login.toggle.textContent = show ? "Ocultar" : "Mostrar";
  login.toggle.setAttribute("aria-pressed", String(show));
});

document.addEventListener("keydown", (e) => {
  if (login.modal.hidden) return;
  if (e.key === "Escape") { closeModal(); return; }
  if (e.key === "Tab") {          // mantener el foco dentro del modal
    const f = focusables();
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});

renderAuth();
