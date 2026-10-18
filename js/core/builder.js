// Assistente genérico de criação: navegação por passos + painel de resumo.
// Cada sistema só descreve os passos; a casca (salvar, navegar, pendências) é daqui.
import { h, toast, baixar, slug } from './ui.js';
import * as store from './storage.js';

export function renderBuilder(root, sistema, ficha, passoId) {
  const passos = sistema.passos;
  let idx = Math.max(0, passos.findIndex(p => p.id === passoId));

  const nav = h('ol', { class: 'passos-nav' });
  const conteudo = h('section', { class: 'passo-conteudo', 'aria-live': 'polite' });
  const aside = h('aside', { class: 'resumo' });
  const tituloEl = h('span', { class: 'builder-titulo' });

  const ctx = {
    sistema,
    dados: ficha.dados,
    /** Salva; com `redesenhar` refaz o passo atual (use em contadores, não em inputs de texto). */
    mudou(redesenhar = false) {
      store.salvar(ficha);
      atualizarCasca();
      if (redesenhar) desenharPasso();
    },
    ir(id) {
      const i = passos.findIndex(p => p.id === id);
      if (i >= 0) { idx = i; desenharPasso(); }
    },
  };

  function pendencias(p) {
    return p.pendencias ? p.pendencias(ficha.dados) : [];
  }

  function atualizarCasca() {
    tituloEl.textContent = sistema.titulo(ficha.dados) || 'Personagem sem nome';
    nav.replaceChildren(...passos.map((p, i) => {
      const pend = pendencias(p);
      return h('li', null, h('button', {
        type: 'button',
        class: 'passo-btn' + (i === idx ? ' ativo' : '') + (pend.length ? ' pendente' : ' ok'),
        'aria-current': i === idx ? 'step' : null,
        title: pend.join('\n') || 'Tudo certo',
        onClick: () => { idx = i; desenharPasso(); },
      }, h('span', { class: 'passo-num' }, i + 1), h('span', { class: 'passo-nome' }, p.titulo)));
    }));
    aside.replaceChildren(sistema.resumo(ctx));
    const ativo = nav.querySelector('.ativo');
    if (ativo) nav.parentElement.scrollLeft = ativo.offsetLeft - nav.parentElement.clientWidth / 2 + ativo.offsetWidth / 2;
  }

  function desenharPasso() {
    const p = passos[idx];
    history.replaceState(null, '', `#/f/${ficha.id}/editar/${p.id}`);
    const pend = pendencias(p);
    conteudo.replaceChildren(
      h('header', { class: 'passo-cabeca' },
        h('span', { class: 'passo-etapa' }, `Passo ${idx + 1} de ${passos.length}`),
        h('h2', null, p.titulo),
        p.subtitulo && h('p', { class: 'passo-sub' }, p.subtitulo)),
      p.render(ctx),
      pend.length ? h('ul', { class: 'pendencias' }, pend.map(m => h('li', null, m))) : null,
      h('footer', { class: 'passo-rodape' },
        h('button', { type: 'button', class: 'btn', disabled: idx === 0, onClick: () => { idx--; desenharPasso(); scrollTo({ top: 0 }); } }, '← Voltar'),
        idx < passos.length - 1
          ? h('button', { type: 'button', class: 'btn btn-primario', onClick: () => { idx++; desenharPasso(); scrollTo({ top: 0 }); } }, 'Próximo →')
          : h('a', { class: 'btn btn-primario', href: `#/f/${ficha.id}` }, 'Ver ficha pronta ✦')));
    atualizarCasca();
  }

  root.replaceChildren(h('div', { class: `builder ${sistema.temaClasse || ''}` },
    h('div', { class: 'builder-barra' },
      h('a', { class: 'btn btn-fantasma', href: '#/' }, '← Início'),
      h('div', { class: 'builder-id' }, h('small', null, sistema.nome), tituloEl),
      h('div', { class: 'builder-acoes' },
        h('button', { type: 'button', class: 'btn btn-fantasma', onClick: () => { baixar(`${slug(sistema.titulo(ficha.dados))}.json`, store.exportar(ficha)); toast('Ficha exportada.'); } }, 'Exportar'),
        h('a', { class: 'btn', href: `#/f/${ficha.id}` }, 'Ver ficha'))),
    h('nav', { class: 'passos', 'aria-label': 'Etapas da criação' }, nav),
    h('div', { class: 'builder-corpo' }, conteudo, aside)));

  desenharPasso();
}

/** Visualização da ficha pronta (modo de jogo: marcar vida, dor etc.). */
export function renderFicha(root, sistema, ficha) {
  const area = h('div', { class: 'ficha-area' });
  const ctx = {
    sistema,
    dados: ficha.dados,
    mudou(redesenhar = true) { store.salvar(ficha); if (redesenhar) desenhar(); },
  };
  function desenhar() { area.replaceChildren(sistema.ficha(ctx)); }

  root.replaceChildren(h('div', { class: `visualizar ${sistema.temaClasse || ''}` },
    h('div', { class: 'builder-barra nao-imprimir' },
      h('a', { class: 'btn btn-fantasma', href: '#/' }, '← Início'),
      h('div', { class: 'builder-id' }, h('small', null, sistema.nome), h('span', { class: 'builder-titulo' }, sistema.titulo(ficha.dados) || 'Personagem sem nome')),
      h('div', { class: 'builder-acoes' },
        h('a', { class: 'btn btn-fantasma', href: `#/f/${ficha.id}/editar/${sistema.passos[0].id}` }, 'Editar'),
        h('button', { type: 'button', class: 'btn btn-fantasma', onClick: () => baixar(`${slug(sistema.titulo(ficha.dados))}.json`, store.exportar(ficha)) }, 'Exportar'),
        h('button', { type: 'button', class: 'btn btn-primario', onClick: () => print() }, 'Imprimir / PDF'))),
    area));
  desenhar();
}
