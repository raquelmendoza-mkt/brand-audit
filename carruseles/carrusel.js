/* ==================================================================
   carrusel.js — añade cabecera, pie, numeración y control de calidad
   a cada <section class="slide">. Opciones por slide (data-*):
     data-chrome="off"     sin cabecera ni pie (ej. portada a sangre)
     data-swipe="off"      oculta "Desliza" (se oculta solo en el último)
     data-progress="off"   oculta la barra de progreso inferior
   Opciones del carrusel (en <body>):
     data-handle="@raquelmendoza.mkt"   data-name="Raquel Mendoza"
     data-counter="off"  oculta la numeración (01 / 10)
   ================================================================== */
(function () {
  const params = new URLSearchParams(location.search);
  const rendering = params.has('render');
  if (!rendering) document.body.classList.add('preview');

  const body = document.body;
  const handle = body.dataset.handle || '@raquelmendoza.mkt';
  const name = body.dataset.name || 'Raquel Mendoza';
  const showCounter = body.dataset.counter !== 'off';
  const slides = [...document.querySelectorAll('.slide')];
  const total = slides.length;
  const pad = (n) => String(n).padStart(2, '0');
  const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  slides.forEach((s, i) => {
    const n = i + 1;
    const last = n === total;
    if (s.dataset.chrome !== 'off') {
      s.insertAdjacentHTML('beforeend',
        `<div class="chrome-top"><div class="brand"><span class="mono">RM</span>${name}</div><div>${handle}</div></div>` +
        `<div class="chrome-bottom"><div class="counter">${showCounter ? pad(n) + ' / ' + pad(total) : ''}</div>` +
        (last || s.dataset.swipe === 'off' ? '<div></div>' : `<div class="swipe">Desliza ${arrow}</div>`) +
        `</div>`);
    }
    if (s.dataset.progress !== 'off') {
      s.insertAdjacentHTML('beforeend', `<div class="progress"><i style="width:${(n / total) * 100}%"></i></div>`);
    }
  });

  /* Control de calidad: detecta texto que se sale de su caja o del área segura */
  function qa() {
    const issues = [];
    slides.forEach((s, i) => {
      const sr = s.getBoundingClientRect();
      const z = parseFloat(getComputedStyle(document.querySelector('.deck')).zoom) || 1;
      s.querySelectorAll('.content').forEach((c) => {
        if (c.scrollHeight > c.clientHeight + 2) {
          issues.push(`Slide ${i + 1}: el contenido no cabe (sobran ${c.scrollHeight - c.clientHeight}px de alto). Recorta texto o baja un tamaño.`);
        }
        [...c.querySelectorAll('*')].forEach((el) => {
          if (el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflow !== 'visible' && el.clientWidth > 0) {
            issues.push(`Slide ${i + 1}: «${el.textContent.trim().slice(0, 40)}» se desborda a lo ancho.`);
          }
          const r = el.getBoundingClientRect();
          if (!s.classList.contains('bleed') && r.width && (r.right - sr.left) / z > 1080 - 60) {
            issues.push(`Slide ${i + 1}: «${el.textContent.trim().slice(0, 40)}» toca el borde derecho.`);
          }
        });
      });
    });
    return [...new Set(issues)];
  }

  window.__carrusel = { total, qa };
  document.fonts.ready.then(() => {
    const issues = qa();
    if (issues.length) console.warn('[carrusel] Revisar:\n' + issues.join('\n'));
    window.__carruselReady = true;
  });
})();
