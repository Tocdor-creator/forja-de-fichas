// Pequenos utilitários de DOM usados por todo o site e pelos sistemas.

/**
 * Cria um elemento. Atributos especiais:
 *  - class, style (string), html (innerHTML confiável)
 *  - onClick / onInput / ... -> addEventListener
 *  - booleanos (checked, disabled, ...) são atribuídos como propriedade
 */
export function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === null || v === undefined || v === false) continue;
      if (k.startsWith('on') && typeof v === 'function') {
        el.addEventListener(k.slice(2).toLowerCase(), v);
      } else if (k === 'class') {
        el.className = v;
      } else if (k === 'html') {
        el.innerHTML = v;
      } else if (k in el && typeof v !== 'string') {
        el[k] = v;
      } else if (k === 'value') {
        el.value = v;
      } else {
        el.setAttribute(k, v === true ? '' : v);
      }
    }
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue;
    if (Array.isArray(c)) append(el, c);
    else el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

let toastTimer;
export function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** Campo de texto rotulado. `get`/`set` leem e escrevem o valor. */
export function campo(rotulo, get, set, { multi = false, placeholder = '', tipo = 'text', dica = '' } = {}) {
  const input = multi
    ? h('textarea', { rows: 3, placeholder, onInput: e => set(e.target.value) }, get() ?? '')
    : h('input', { type: tipo, placeholder, value: get() ?? '', onInput: e => set(tipo === 'number' ? Number(e.target.value) : e.target.value) });
  return h('label', { class: 'campo' },
    h('span', { class: 'campo-rotulo' }, rotulo),
    input,
    dica && h('small', { class: 'campo-dica' }, dica));
}

/** Controle − valor + com limites. */
export function stepper(valor, { min = 0, max = Infinity, podeSubir = true, onChange, rotulo = '' }) {
  return h('div', { class: 'stepper', role: 'group', 'aria-label': rotulo },
    h('button', { type: 'button', class: 'stepper-btn', 'aria-label': `Diminuir ${rotulo}`, disabled: valor <= min, onClick: () => onChange(valor - 1) }, '−'),
    h('output', { class: 'stepper-valor' }, valor),
    h('button', { type: 'button', class: 'stepper-btn', 'aria-label': `Aumentar ${rotulo}`, disabled: valor >= max || !podeSubir, onClick: () => onChange(valor + 1) }, '+'));
}

/** Fileira de círculos marcáveis (vida, dor, etc.). */
export function circulos(total, marcados, onChange, { rotulo = '' } = {}) {
  const wrap = h('div', { class: 'circulos', role: 'group', 'aria-label': rotulo });
  for (let i = 0; i < total; i++) {
    const marcado = i < marcados;
    wrap.append(h('button', {
      type: 'button',
      class: 'circulo' + (marcado ? ' marcado' : ''),
      'aria-pressed': String(marcado),
      'aria-label': `${rotulo} ${i + 1}`,
      onClick: () => onChange && onChange(marcado && i === marcados - 1 ? i : i + 1),
    }));
  }
  return wrap;
}

export function baixar(nomeArquivo, conteudo, tipo = 'application/json') {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const a = h('a', { href: url, download: nomeArquivo });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function slug(s) {
  return (s || 'ficha').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'ficha';
}
