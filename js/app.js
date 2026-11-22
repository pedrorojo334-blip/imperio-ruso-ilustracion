// Interacciones: índice con capítulo actual y progreso, filtros de la línea del tiempo y cuestionario.
// Todo el contenido se lee completo sin este archivo.
(() => {
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- índice: capítulo actual ----------
  const enlaces = [...document.querySelectorAll('[data-indice] a[href^="#"]')];
  const secciones = enlaces.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window && secciones.length) {
    const visibles = new Map();
    const io = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => visibles.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0));
      const actual = [...visibles.entries()].filter(([, r]) => r > 0).sort((a, b) =>
        secciones.findIndex((s) => s.id === a[0]) - secciones.findIndex((s) => s.id === b[0]))[0];
      if (actual) enlaces.forEach((a) => {
        if (a.getAttribute('href') === '#' + actual[0]) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
    }, { rootMargin: '-35% 0px -55% 0px', threshold: [0, .01] });
    secciones.forEach((s) => io.observe(s));
  }

  // ---------- progreso de lectura ----------
  const barraIndice = document.querySelector('[data-progreso]');
  const barra = document.createElement('div');
  barra.className = 'barra-progreso';
  barra.setAttribute('aria-hidden', 'true');
  barra.innerHTML = '<span></span>';
  document.body.prepend(barra);
  const lectura = document.getElementById('lectura');
  let pendiente = false;
  const progreso = () => {
    pendiente = false;
    const r = lectura.getBoundingClientRect();
    const total = r.height - innerHeight;
    const p = Math.min(1, Math.max(0, -r.top / (total > 0 ? total : 1)));
    const w = (p * 100).toFixed(1) + '%';
    if (barraIndice) barraIndice.style.width = w;
    barra.firstChild.style.width = w;
  };
  addEventListener('scroll', () => { if (!pendiente) { pendiente = true; requestAnimationFrame(progreso); } }, { passive: true });
  progreso();

  // ---------- línea del tiempo ----------
  const filtros = document.querySelector('[data-filtros]');
  const eventos = [...document.querySelectorAll('[data-eventos] li')];
  const conteo = document.querySelector('[data-conteo]');
  if (filtros) {
    filtros.hidden = false;
    const aplicar = (tema) => {
      let n = 0;
      eventos.forEach((li) => {
        const ver = tema === 'todos' || li.dataset.tema === tema;
        li.hidden = !ver;
        li.classList.remove('entra');
        if (ver) { n++; if (!reducido) { void li.offsetWidth; li.classList.add('entra'); } }
      });
      filtros.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tema === tema)));
      conteo.textContent = tema === 'todos' ? `${n} acontecimientos` : `${n} acontecimientos de este tema`;
    };
    filtros.addEventListener('click', (e) => { const b = e.target.closest('button[data-tema]'); if (b) aplicar(b.dataset.tema); });
    conteo.textContent = `${eventos.length} acontecimientos`;
  }

  // ---------- cuestionario ----------
  const form = document.querySelector('[data-cuestionario]');
  if (form) {
    const resultado = form.querySelector('[data-resultado]');
    const grupos = [...form.querySelectorAll('fieldset[data-correcta]')];
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let aciertos = 0; let sinResponder = 0;
      grupos.forEach((fs) => {
        const elegido = fs.querySelector('input:checked');
        fs.classList.remove('bien', 'mal');
        fs.querySelectorAll('label').forEach((l) => l.classList.remove('correcta'));
        if (!elegido) { sinResponder++; return; }
        const ok = elegido.value === fs.dataset.correcta;
        if (ok) aciertos++;
        fs.classList.add(ok ? 'bien' : 'mal');
        fs.querySelector(`input[value="${fs.dataset.correcta}"]`).closest('label').classList.add('correcta');
        fs.querySelector('.explica').hidden = false;
      });
      resultado.textContent = sinResponder
        ? `Te faltan ${sinResponder} ${sinResponder === 1 ? 'pregunta' : 'preguntas'} por responder. Llevas ${aciertos} de ${grupos.length - sinResponder}.`
        : aciertos === grupos.length ? `¡${aciertos} de ${grupos.length}! Dominas el tema.`
        : `${aciertos} de ${grupos.length}. Revisa las explicaciones y vuelve a intentarlo.`;
      resultado.focus();
    });
    form.addEventListener('reset', () => {
      grupos.forEach((fs) => { fs.classList.remove('bien', 'mal'); fs.querySelectorAll('label').forEach((l) => l.classList.remove('correcta')); fs.querySelector('.explica').hidden = true; });
      resultado.textContent = '';
    });
  }
})();
