// Motor de intro reutilizável: cena animada + "carregando" + botão de entrada + animação de saída.
// Cada sistema passa a cena (HTML) e estiliza tudo no próprio theme.css.
import { h } from './ui.js';

/**
 * opts: { classe, cena (string HTML), titulo, frases: [], botao, duracao (ms), saida (ms da animação de saída) }
 * Ao clicar no botão, adiciona `.saindo` no overlay (o tema anima) e resolve depois de `saida` ms.
 */
export function introGenerica(raiz, { classe, cena, titulo, frases, botao, duracao = 3200, saida = 1400 }) {
  return new Promise(resolve => {
    const frase = h('p', { class: 'ig-frase' }, frases[0]);
    const barra = h('div', { class: 'ig-barra-fill' });
    const btn = h('button', { type: 'button', class: 'ig-botao', onClick: entrar }, botao);
    const overlay = h('div', { class: `intro-generica ${classe}`, role: 'dialog', 'aria-label': titulo },
      h('div', { class: 'ig-cena', html: cena }),
      h('div', { class: 'ig-centro' },
        h('h2', { class: 'ig-titulo' }, titulo),
        frase,
        h('div', { class: 'ig-barra', role: 'progressbar', 'aria-label': 'Carregando' }, barra),
        btn),
      h('button', { type: 'button', class: 'intro-pular', onClick: () => terminar(0) }, 'Pular ›'));
    raiz.append(overlay);

    let i = 0, pronto = false, saiu = false;
    const timer = setInterval(() => { i = (i + 1) % frases.length; frase.textContent = frases[i]; }, 850);
    const t0 = performance.now();
    (function tick(t) {
      if (pronto) return;
      const p = Math.min(1, (t - t0) / duracao);
      barra.style.width = `${(1 - (1 - p) ** 2) * 100}%`;
      if (p < 1) requestAnimationFrame(tick);
      else {
        pronto = true;
        clearInterval(timer);
        overlay.classList.add('pronta');
        btn.focus();
      }
    })(t0);

    function entrar() {
      if (saiu) return;
      overlay.classList.add('saindo');
      terminar(saida);
    }
    function terminar(espera) {
      if (saiu && espera) return;
      saiu = true;
      clearInterval(timer);
      setTimeout(() => {
        overlay.classList.add('fim');
        setTimeout(() => { overlay.remove(); resolve(); }, 600);
      }, espera);
    }
    overlay.addEventListener('keydown', e => { if (e.key === 'Escape') terminar(0); });
  });
}
