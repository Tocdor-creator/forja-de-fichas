// Roteador (hash) e telas do hub.
import { h, toast } from './core/ui.js';
import * as store from './core/storage.js';
import { SISTEMAS, info, carregar } from './core/registry.js';
import { renderBuilder, renderFicha } from './core/builder.js';

const app = document.getElementById('app');

function introJaVista(id) {
  try { return sessionStorage.getItem(`forja.intro.${id}`) === '1'; } catch { return false; }
}
function marcarIntro(id) {
  try { sessionStorage.setItem(`forja.intro.${id}`, '1'); } catch { /* sem storage, só repete a intro */ }
}

/** Carrega o sistema e, na primeira entrada da sessão, toca a intro dele. */
async function entrarNoSistema(id) {
  const sistema = await carregar(id);
  document.body.dataset.tema = id;
  if (sistema.intro && !introJaVista(id)) {
    marcarIntro(id);
    await sistema.intro(document.body);
  }
  return sistema;
}

function dataCurta(ts) {
  return new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function cartaoFicha(f, sistema) {
  const meta = info(f.sistema);
  const titulo = sistema?.titulo?.(f.dados) || f.dados?.nome || 'Personagem sem nome';
  const sub = sistema?.subtitulo?.(f.dados) || '';
  return h('article', { class: 'cartao-ficha', style: `--cor-sistema:${meta?.cor || '#888'}` },
    h('a', { class: 'cartao-ficha-link', href: `#/f/${f.id}` },
      h('span', { class: 'selo' }, meta?.emblema || '🎲', ' ', meta?.nome || f.sistema),
      h('strong', null, titulo),
      sub && h('span', { class: 'cartao-ficha-sub' }, sub),
      h('small', null, 'Atualizada em ', dataCurta(f.atualizadoEm))),
    h('div', { class: 'cartao-ficha-acoes' },
      h('a', { class: 'mini', href: `#/f/${f.id}/editar/` }, 'Editar'),
      h('button', { type: 'button', class: 'mini', onClick: () => { store.duplicar(f.id); toast('Ficha duplicada.'); rota(); } }, 'Duplicar'),
      h('button', {
        type: 'button', class: 'mini perigo',
        onClick: () => { if (confirm(`Apagar "${titulo}"? Não dá para desfazer.`)) { store.remover(f.id); toast('Ficha apagada.'); rota(); } },
      }, 'Apagar')));
}

function botaoImportar() {
  const input = h('input', {
    type: 'file', accept: '.json,application/json', hidden: true,
    onChange: async e => {
      const arq = e.target.files[0];
      if (!arq) return;
      try {
        const f = await store.importar(arq);
        toast('Ficha importada!');
        location.hash = `#/f/${f.id}`;
      } catch (err) {
        toast(err.message || 'Não consegui ler esse arquivo.');
      }
    },
  });
  return h('label', { class: 'btn btn-fantasma' }, 'Importar ficha (.json)', input);
}

async function listaDeFichas(filtroSistema) {
  const fichas = store.listar().filter(f => !filtroSistema || f.sistema === filtroSistema);
  if (!fichas.length) return h('p', { class: 'vazio' }, 'Nenhuma ficha por aqui ainda.');
  // carrega só os sistemas que aparecem na lista, para montar título/subtítulo
  const ids = [...new Set(fichas.map(f => f.sistema))];
  const mods = Object.fromEntries(await Promise.all(ids.map(async id => {
    try { return [id, await carregar(id)]; } catch { return [id, null]; }
  })));
  return h('div', { class: 'grade-fichas' }, fichas.map(f => cartaoFicha(f, mods[f.sistema])));
}

async function telaHub() {
  document.body.dataset.tema = 'hub';
  document.title = 'Forja de Fichas';
  app.replaceChildren(h('div', { class: 'hub' },
    h('header', { class: 'hub-topo' },
      h('div', { class: 'hub-marca' },
        h('span', { class: 'hub-emblema', 'aria-hidden': 'true' }, '⚒'),
        h('div', null, h('h1', null, 'Forja de Fichas'), h('p', null, 'Personagens criados seguindo as regras de cada sistema.')))),
    h('section', { class: 'hub-secao' },
      h('h2', null, 'Escolha o sistema'),
      h('div', { class: 'grade-sistemas' }, SISTEMAS.map(s => {
        const disp = s.status === 'disponivel';
        return h(disp ? 'a' : 'div', {
          class: 'cartao-sistema' + (disp ? '' : ' em-breve'),
          href: disp ? `#/s/${s.id}` : null,
          style: `--cor-sistema:${s.cor}`,
          'aria-disabled': disp ? null : 'true',
        },
          h('span', { class: 'cartao-sistema-emblema', 'aria-hidden': 'true' }, s.emblema),
          h('span', { class: 'cartao-sistema-genero' }, s.genero),
          h('strong', null, s.nome),
          h('p', null, s.resumo),
          h('span', { class: 'cartao-sistema-status' }, disp ? 'Criar personagem →' : 'Em breve'));
      }))),
    h('section', { class: 'hub-secao' },
      h('div', { class: 'secao-cabeca' }, h('h2', null, 'Suas fichas'), botaoImportar()),
      await listaDeFichas()),
    h('footer', { class: 'hub-rodape' }, 'As fichas ficam salvas neste navegador. Exporte em .json para guardar uma cópia ou passar para outro aparelho.')));
}

async function telaSistema(id) {
  const sistema = await entrarNoSistema(id);
  document.title = `${sistema.nome} · Forja de Fichas`;
  const lobby = sistema.lobby ? sistema.lobby() : h('h1', null, sistema.nome);
  app.replaceChildren(h('div', { class: `lobby ${sistema.temaClasse || ''}` },
    h('div', { class: 'builder-barra' }, h('a', { class: 'btn btn-fantasma', href: '#/' }, '← Todos os sistemas')),
    lobby,
    h('div', { class: 'lobby-acoes' },
      h('button', {
        type: 'button', class: 'btn btn-primario btn-grande',
        onClick: () => {
          const f = store.criar(id, sistema.novo());
          location.hash = `#/f/${f.id}/editar/${sistema.passos[0].id}`;
        },
      }, sistema.textoNovo || 'Novo personagem'),
      botaoImportar()),
    h('section', { class: 'hub-secao' }, h('h2', null, 'Personagens deste sistema'), await listaDeFichas(id))));
}

async function telaFicha(id, editar, passo) {
  const ficha = store.obter(id);
  if (!ficha) { toast('Ficha não encontrada.'); location.hash = '#/'; return; }
  const sistema = await entrarNoSistema(ficha.sistema);
  if (sistema.migrar) ficha.dados = sistema.migrar(ficha.dados);
  document.title = `${sistema.titulo(ficha.dados) || 'Ficha'} · ${sistema.nome}`;
  if (editar) renderBuilder(app, sistema, ficha, passo);
  else renderFicha(app, sistema, ficha);
}

// (o builder troca o passo via history.replaceState, que não dispara hashchange)
async function rota() {
  const partes = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  try {
    if (partes[0] === 's' && partes[1]) await telaSistema(partes[1]);
    else if (partes[0] === 'f' && partes[1]) await telaFicha(partes[1], partes[2] === 'editar', partes[3]);
    else await telaHub();
  } catch (err) {
    console.error(err);
    app.replaceChildren(h('div', { class: 'hub' },
      h('h1', null, 'Opa, a ficha caiu do cavalo.'),
      h('p', null, err.message),
      h('a', { class: 'btn', href: '#/' }, 'Voltar ao início')));
  }
  scrollTo({ top: 0 });
}

addEventListener('hashchange', rota);
rota();
