/* =========================================================
   AlertReset AI – Landing page
   1) Menú móvil  2) Enlace activo  3) Demo interactiva  4) Inicio de sesión
   ========================================================= */

const $ = (id) => document.getElementById(id);

/* ---------- 1) Menú móvil ---------- */
const navToggle = $("navToggle");
const navMenu = $("navMenu");

function setMenu(open) {
  navMenu.classList.toggle("open", open);
  navToggle.setAttribute("aria-expanded", String(open));
  navToggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
}

navToggle.addEventListener("click", () => setMenu(!navMenu.classList.contains("open")));
navMenu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));

/* ---------- 2) Enlace activo según la sección visible ---------- */
const links = [...document.querySelectorAll('.navbar__menu li a[href^="#"]')];

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === "#" + entry.target.id));
    });
  },
  { rootMargin: "-40% 0px -55% 0px" }
);
links.forEach((l) => {
  const section = document.querySelector(l.getAttribute("href"));
  if (section) observer.observe(section);
});

/* ---------- 3) Demo interactiva ---------- */
/* Umbrales (en el producto real los configura el gestor: HU34) */
const FAST_MS = 1500;      // respuesta considerada "rápida"
const FAST_STREAK = 3;     // respuestas rápidas consecutivas para detectar habituación
const ROUTINE_ALERTS = 4;  // alertas rutinarias antes de la alerta crítica

const ROUTINE_MESSAGES = [
  "¿Deseas guardar los cambios del documento?",
  "¿Permitir que esta página use cookies?",
  "¿Deseas abrir este archivo PDF?",
  "¿Permitir notificaciones de este sitio?",
];

const ui = {
  start: $("demoStart"),
  box: $("alertBox"),
  badge: $("alertBadge"),
  title: $("alertTitle"),
  text: $("alertText"),
  reason: $("alertReason"),
  meta: $("alertMeta"),
  accept: $("btnAccept"),
  cancel: $("btnCancel"),
  count: $("demoCount"),
  time: $("demoTime"),
  result: $("demoResult"),
  resultTitle: $("resultTitle"),
  resultText: $("resultText"),
  resultList: $("resultList"),
  restart: $("btnRestart"),
};

let state;

function resetState() {
  state = { step: 0, shownAt: 0, fastStreak: 0, times: [], critical: false, adapted: false };
}

function startDemo() {
  resetState();
  ui.start.hidden = true;
  ui.result.hidden = true;
  showRoutine();
}

function restartDemo() {
  ui.time.textContent = "—";
  ui.count.textContent = "0";
  startDemo();
}

/* Muestra una alerta y empieza a medir el tiempo de respuesta */
function showAlert({ className, badge, title, text, reason, meta, cancelLabel, acceptLabel }) {
  ui.count.textContent = state.step;
  ui.box.hidden = false;
  ui.box.className = className;
  ui.badge.textContent = badge;
  ui.title.textContent = title;
  ui.text.textContent = text;
  ui.reason.hidden = !reason;
  ui.reason.textContent = reason || "";
  ui.meta.hidden = !meta;
  ui.meta.innerHTML = meta || "";
  ui.cancel.textContent = cancelLabel;
  ui.accept.textContent = acceptLabel;
  state.shownAt = performance.now();
  ui.accept.focus();
}

function showRoutine() {
  state.step++;
  state.critical = false;
  showAlert({
    className: "alert alert--routine",
    badge: "Riesgo bajo",
    title: "Confirmación",
    text: ROUTINE_MESSAGES[(state.step - 1) % ROUTINE_MESSAGES.length],
    cancelLabel: "Cancelar",
    acceptLabel: "Aceptar",
  });
}

function showCritical() {
  state.step++;
  state.critical = true;
  state.adapted = state.fastStreak >= FAST_STREAK; // ¿hay habituación?

  if (state.adapted) {
    showAlert({
      className: "alert alert--critical",
      badge: "Riesgo alto",
      title: "Esta advertencia es diferente a las anteriores",
      text: "Estás a punto de compartir información con personas externas a la organización.",
      reason: "¿Por qué ves esto? Detectamos varias respuestas muy rápidas seguidas y esta acción es de alto riesgo.",
      meta:
        "<span><strong>Recurso:</strong> informe_financiero.xlsx</span>" +
        "<span><strong>Destinatario:</strong> externo@otraempresa.com</span>" +
        "<span><strong>Reversibilidad:</strong> no se puede deshacer una vez enviado</span>",
      cancelLabel: "Cancelar envío",
      acceptLabel: "Revisar destinatario", // opción segura de la alerta adaptativa
    });
  } else {
    // Sin habituación: el sistema no interrumpe de forma especial
    showAlert({
      className: "alert alert--routine",
      badge: "Riesgo bajo",
      title: "Confirmación",
      text: "¿Deseas compartir informe_financiero.xlsx con externo@otraempresa.com?",
      cancelLabel: "Cancelar",
      acceptLabel: "Aceptar",
    });
  }
}

/* Registra el tiempo de respuesta y devuelve true si la alerta era la crítica */
function registerResponse() {
  const ms = performance.now() - state.shownAt;
  state.times.push(ms);
  ui.time.textContent = (ms / 1000).toFixed(2) + " s";
  if (!state.critical) state.fastStreak = ms < FAST_MS ? state.fastStreak + 1 : 0;
  return state.critical;
}

function respond(decision) {
  if (!registerResponse()) {
    state.step < ROUTINE_ALERTS ? showRoutine() : showCritical();
  } else {
    finish(decision);
  }
}

function finish(decision) {
  ui.box.hidden = true;
  ui.result.hidden = false;

  const avg = state.times.reduce((a, b) => a + b, 0) / state.times.length;
  const fastCount = state.times.filter((t) => t < FAST_MS).length;

  if (state.adapted) {
    ui.resultTitle.textContent =
      decision === "cancelled" ? "Bien: detuviste una acción riesgosa" : "Bien: revisaste antes de enviar";
    ui.resultText.textContent =
      "AlertReset AI detectó tu piloto automático y rompió el patrón visual justo cuando importaba.";
  } else if (decision === "accepted") {
    ui.resultTitle.textContent = "Esta vez no hubo adaptación";
    ui.resultText.textContent =
      "Respondiste con calma, por eso no se activó la advertencia adaptativa. Prueba de nuevo aceptando más rápido.";
  } else {
    ui.resultTitle.textContent = "Detuviste la acción antes de enviar";
    ui.resultText.textContent =
      "Respondiste con calma y decidiste cancelar. La adaptación solo se activa si hay habituación y alto riesgo.";
  }

  ui.resultList.innerHTML =
    `<li>Respuestas rápidas (&lt; ${FAST_MS / 1000} s): <strong>${fastCount} de ${state.times.length}</strong></li>` +
    `<li>Tiempo promedio de respuesta: <strong>${(avg / 1000).toFixed(2)} s</strong></li>` +
    `<li>¿Se activó la alerta adaptativa?: <strong>${state.adapted ? "Sí" : "No"}</strong></li>`;

  ui.restart.focus();
}

$("btnStart").addEventListener("click", startDemo);
ui.restart.addEventListener("click", restartDemo);
// En la alerta adaptativa, "Aceptar" es "Revisar destinatario" (la opción segura)
ui.accept.addEventListener("click", () => respond(state.adapted ? "reviewed" : "accepted"));
ui.cancel.addEventListener("click", () => respond("cancelled"));

resetState();

/* ---------- 4) Inicio de sesión (demostrativo, sin servidor) ----------
   - Valida correo y contraseña (mín. 6 caracteres)
   - Guarda solo el correo en el navegador (nunca la contraseña)
   - Cambia el botón a "Cerrar sesión" y muestra el usuario */
const SESSION_KEY = "alertreset_user";
const MIN_PASS = 6;

const login = {
  btn: $("btnLogin"),
  user: $("navUser"),
  card: $("loginCard"),
  form: $("loginForm"),
  welcome: $("loginWelcome"),
  welcomeText: $("loginWelcomeText"),
  email: $("loginEmail"),
  pass: $("loginPass"),
  remember: $("loginRemember"),
  toggle: $("togglePass"),
  emailErr: $("emailError"),
  passErr: $("passError"),
  sessionEmail: null,
};

/* Almacenamiento seguro (puede fallar en modo privado) */
function readSession() {
  try {
    return localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
  } catch (e) {
    return null;
  }
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
  } catch (e) { /* nada que borrar */ }
  login.sessionEmail = null;
}

/* Muestra el formulario o el mensaje de bienvenida según haya sesión */
function renderAuth() {
  const email = login.sessionEmail || readSession();
  login.sessionEmail = email;
  login.user.hidden = !email;
  login.user.textContent = email ? "Hola, " + email.split("@")[0] : "";
  login.btn.textContent = email ? "Cerrar sesión" : "Iniciar sesión";
  login.form.hidden = Boolean(email);
  login.welcome.hidden = !email;
  if (email) login.welcomeText.textContent = `Has iniciado sesión como ${email}. Ya puedes explorar AlertReset AI.`;
}

function focusLogin() {
  login.card.scrollIntoView({ behavior: "smooth", block: "center" });
  if (!login.sessionEmail) login.email.focus({ preventScroll: true });
}

function resetForm() {
  login.form.reset();
  [login.emailErr, login.passErr].forEach((n) => { n.hidden = true; n.textContent = ""; });
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

function validate() {
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(login.email.value.trim());
  const passOk = login.pass.value.length >= MIN_PASS;

  setError(login.email, login.emailErr, emailOk ? "" : "Ingresa un correo válido, por ejemplo nombre@correo.com.");
  setError(login.pass, login.passErr, passOk ? "" : `La contraseña debe tener al menos ${MIN_PASS} caracteres.`);

  if (!emailOk) login.email.focus();
  else if (!passOk) login.pass.focus();
  return emailOk && passOk;
}

login.form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!validate()) return;
  saveSession(login.email.value.trim().toLowerCase(), login.remember.checked);
  login.pass.value = ""; // la contraseña nunca se conserva
  renderAuth();
});

login.btn.addEventListener("click", () => {
  setMenu(false);
  if (login.sessionEmail) {      // ya hay sesión → cerrar sesión
    clearSession();
    resetForm();
    renderAuth();
  }
  focusLogin();
});

login.toggle.addEventListener("click", () => {
  const show = login.pass.type === "password";
  login.pass.type = show ? "text" : "password";
  login.toggle.textContent = show ? "Ocultar" : "Mostrar";
  login.toggle.setAttribute("aria-pressed", String(show));
});

renderAuth();
