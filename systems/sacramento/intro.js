// Intro do Sacramento: bola de feno rolando no deserto (loading) → fachada do saloon
// → portas vai-e-vem abrindo e a câmera atravessando para dentro.
import { h } from '../../js/core/ui.js';

const FRASES = [
  'Selando o cavalo…',
  'Passando um café coado…',
  'Limpando o revólver…',
  'Embaralhando as cartas…',
  'Espantando a poeira do chapéu…',
  'Contando os réis…',
];

// gerador pseudoaleatório com semente fixa: a bola de feno sai sempre igual
function rng(seed) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

function bolaDeFeno() {
  const r = rng(42);
  const cores = ['#7a5a2e', '#9c7840', '#b8925a', '#5e4321', '#c9a66b'];
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 200 200');
  svg.setAttribute('class', 'feno-svg');
  svg.setAttribute('aria-hidden', 'true');
  const ponto = (raio) => {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * raio;
    return [100 + Math.cos(a) * d, 100 + Math.sin(a) * d];
  };
  // galhos curvos emaranhados
  for (let i = 0; i < 90; i++) {
    const [x1, y1] = ponto(88), [x2, y2] = ponto(88), [c1x, c1y] = ponto(110), [c2x, c2y] = ponto(110);
    const p = document.createElementNS(ns, 'path');
    p.setAttribute('d', `M${x1.toFixed(1)} ${y1.toFixed(1)} C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`);
    p.setAttribute('stroke', cores[Math.floor(r() * cores.length)]);
    p.setAttribute('stroke-width', (0.8 + r() * 2.2).toFixed(2));
    p.setAttribute('fill', 'none');
    p.setAttribute('stroke-linecap', 'round');
    p.setAttribute('opacity', (0.65 + r() * 0.35).toFixed(2));
    svg.append(p);
  }
  // alguns laços em volta para dar volume redondo
  for (let i = 0; i < 7; i++) {
    const e = document.createElementNS(ns, 'ellipse');
    e.setAttribute('cx', 100); e.setAttribute('cy', 100);
    e.setAttribute('rx', 70 + r() * 18); e.setAttribute('ry', 30 + r() * 50);
    e.setAttribute('transform', `rotate(${Math.floor(r() * 180)} 100 100)`);
    e.setAttribute('stroke', cores[i % cores.length]);
    e.setAttribute('stroke-width', '1.4');
    e.setAttribute('fill', 'none');
    e.setAttribute('opacity', '.7');
    svg.append(e);
  }
  return svg;
}

const SVG_DUNAS = (cor, d) => `<svg viewBox="0 0 1200 200" preserveAspectRatio="none"><path fill="${cor}" d="${d}"/></svg>`;
const DUNA_LONGE = 'M0 120 C150 60 300 70 420 110 S700 150 820 90 S1080 60 1200 120 V200 H0Z';
const DUNA_PERTO = 'M0 140 C200 90 380 120 520 140 S800 170 960 120 S1120 110 1200 140 V200 H0Z';

const MESAS = `<svg viewBox="0 0 1200 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
  <path fill="#b9643a" opacity=".55" d="M0 300 V230 H90 L110 170 H230 L250 230 H420 L440 150 L470 120 H560 L585 150 L600 230 H800 L815 190 H900 L920 230 H1200 V300Z"/>
  <path fill="#8e4a2b" opacity=".55" d="M0 300 V260 H160 L175 215 H300 L318 260 H700 L720 200 H820 L835 170 H930 L950 260 H1200 V300Z"/>
</svg>`;

const CACTO = `<svg viewBox="0 0 60 100" aria-hidden="true"><path fill="#4a3a22" d="M26 100 V20 a4 4 0 0 1 8 0 V55 H44 V35 a4 4 0 0 1 8 0 V58 a5 5 0 0 1 -5 5 H34 V100Z M26 70 H13 a5 5 0 0 1 -5 -5 V45 a4 4 0 0 1 8 0 V62 H26Z"/></svg>`;

export function intro(raiz) {
  return new Promise(resolve => {

    // ---------- Cena 1: deserto + bola de feno
    const frase = h('p', { class: 'deserto-frase' }, FRASES[0]);
    const barra = h('div', { class: 'deserto-barra-fill' });
    const feno = h('div', { class: 'feno' },
      h('div', { class: 'feno-pulo' }, h('div', { class: 'feno-giro' }, bolaDeFeno())),
      h('div', { class: 'feno-sombra' }));
    const poeira = h('div', { class: 'poeira', 'aria-hidden': 'true' },
      Array.from({ length: 8 }, (_, i) => h('span', { style: `--i:${i}` })));

    const deserto = h('div', { class: 'cena cena-deserto' },
      h('div', { class: 'deserto-sol' }),
      h('div', { class: 'deserto-mesas', html: MESAS }),
      h('div', { class: 'duna-faixa duna-longe', html: SVG_DUNAS('#d9a066', DUNA_LONGE).repeat(2) }),
      h('div', { class: 'cactos', html: `<span>${CACTO}</span><span>${CACTO}</span><span>${CACTO}</span>` }),
      h('div', { class: 'duna-faixa duna-perto', html: SVG_DUNAS('#e8bd80', DUNA_PERTO).repeat(2) }),
      h('div', { class: 'areia' }),
      poeira,
      feno,
      h('div', { class: 'deserto-carregando' },
        h('h2', null, 'Sacramento'),
        frase,
        h('div', { class: 'deserto-barra', role: 'progressbar', 'aria-label': 'Carregando' }, barra)),
      h('button', { type: 'button', class: 'intro-pular', onClick: () => irParaSaloon(true) }, 'Pular ›'));

    // ---------- Cena 2: fachada do saloon
    const portaEsq = h('div', { class: 'porta porta-esq' });
    const portaDir = h('div', { class: 'porta porta-dir' });
    const fachada = h('div', { class: 'fachada' },
      h('div', { class: 'placa-saloon' }, h('span', null, 'Saloon'), h('small', null, 'Fichas · Pinga · Café')),
      h('div', { class: 'lampiao lampiao-esq' }), h('div', { class: 'lampiao lampiao-dir' }),
      h('div', { class: 'vao' },
        h('div', { class: 'vao-interior' }, h('div', { class: 'vao-balcao' })),
        h('div', { class: 'portas', onClick: entrar }, portaEsq, portaDir)),
      h('div', { class: 'tablado' }));
    const btnEntrar = h('button', { type: 'button', class: 'btn-entrar', onClick: entrar }, 'Entrar no saloon');
    const saloon = h('div', { class: 'cena cena-saloon', hidden: true },
      fachada,
      h('div', { class: 'saloon-chamada' }, btnEntrar, h('small', null, 'ou empurre as portas')),
      h('div', { class: 'clarao' }));

    const overlay = h('div', { class: 'intro-sac', role: 'dialog', 'aria-label': 'Entrada do Sacramento' }, deserto, saloon);
    raiz.append(overlay);

    // ---------- Loading
    const duracao = 3800; // anima mesmo com "reduzir movimento": é curta e tem Pular / Esc
    const t0 = performance.now();
    let fraseIdx = 0, encerrado = false;
    const timerFrase = setInterval(() => {
      fraseIdx = (fraseIdx + 1) % FRASES.length;
      frase.textContent = FRASES[fraseIdx];
    }, 900);
    function tick(t) {
      if (encerrado) return;
      const p = Math.min(1, (t - t0) / duracao);
      barra.style.width = `${(1 - Math.pow(1 - p, 2)) * 100}%`;
      if (p < 1) requestAnimationFrame(tick);
      else irParaSaloon(false);
    }
    requestAnimationFrame(tick);

    function irParaSaloon(pulou) {
      if (encerrado) return;
      encerrado = true;
      clearInterval(timerFrase);
      barra.style.width = '100%';
      frase.textContent = 'Pronto, sô!';
      feno.classList.add('saindo');
      setTimeout(() => {
        deserto.classList.add('sumindo');
        saloon.hidden = false;
        requestAnimationFrame(() => saloon.classList.add('visivel'));
        setTimeout(() => { deserto.remove(); btnEntrar.focus(); }, 700);
      }, pulou ? 150 : 900);
    }

    let entrando = false;
    function entrar() {
      if (entrando) return;
      entrando = true;
      saloon.classList.add('entrando');
      setTimeout(() => {
        overlay.classList.add('fim');
        setTimeout(() => { overlay.remove(); resolve(); }, 500);
      }, 2000);
    }

    overlay.addEventListener('keydown', e => {
      if (e.key === 'Escape') { irParaSaloon(true); }
    });
  });
}
