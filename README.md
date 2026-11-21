# AlertReset AI – Landing page

Landing page del proyecto **AlertReset AI** (UP-Code Group · UPC · 1ASI0784 HCI for UX Design).
Hecha con HTML, CSS y JavaScript puros, sin dependencias ni build.

## Estructura

```
alertreset-ai/
├── index.html
├── css/styles.css
├── js/main.js
├── img/hero-publico.svg
└── README.md
```

## Cómo abrirla en VS Code

1. Descomprime el .zip y abre la carpeta `alertreset-ai` en VS Code (`Archivo > Abrir carpeta`).
2. Instala la extensión **Live Server** (Ritwick Dey).
3. Clic derecho en `index.html` > **Open with Live Server**.

(También puedes abrir `index.html` directamente en el navegador.)

## Dónde editar

- **Textos y secciones:** `index.html`
- **Colores:** variables al inicio de `css/styles.css` (`:root`), tomadas de la guía de estilos del informe (sección 4.1.1)
- **Imagen del hero (público objetivo):** `img/hero-publico.svg`. Para usar una foto propia, guárdala en `img/` y cambia la ruta en `.hero--bg` dentro de `css/styles.css`.
- **Inicio de sesión:** formulario integrado en la portada de `index.html` y sección 4 de `js/main.js` (`MIN_PASS` define el mínimo de caracteres). Es demostrativo: acepta cualquier correo válido y una contraseña de 6+ caracteres; solo guarda el correo en el navegador.
- **Umbrales de la demo:** `FAST_MS` y `FAST_STREAK` al inicio de la sección 3 de `js/main.js`

## Subir a GitHub Pages

1. Crea un repositorio y sube el contenido de esta carpeta (`index.html` en la raíz).
2. En el repositorio: **Settings > Pages > Deploy from a branch > main / (root)**.
3. Tu sitio quedará en `https://TU-USUARIO.github.io/NOMBRE-REPO/`.

## Secciones

Inicio (hero) · Problema · Cómo funciona (4 pasos) · Demo interactiva · Soluciones (3 segmentos) · Beneficios · Seguridad y accesibilidad · CTA · Footer
