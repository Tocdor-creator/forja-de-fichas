// Peças compartilhadas pelos sistemas da família d20 (D&D 3.5, 5e, 5.5 e Tormenta 20):
// atributos (compra de pontos / arranjo / rolagem / manual), seleção limitada de opções,
// e o layout de resumo + ficha pronta.
import { h, stepper, circulos } from '../../js/core/ui.js';

export const ATR = [
  { id: 'for', nome: 'Força', sigla: 'FOR' },
  { id: 'des', nome: 'Destreza', sigla: 'DES' },
  { id: 'con', nome: 'Constituição', sigla: 'CON' },
  { id: 'int', nome: 'Inteligência', sigla: 'INT' },
  { id: 'sab', nome: 'Sabedoria', sigla: 'SAB' },
  { id: 'car', nome: 'Carisma', sigla: 'CAR' },
];
export const nomeAtr = id => ATR.find(a => a.id === id)?.nome || id;
export const siglaAtr = id => ATR.find(a => a.id === id)?.sigla || id;

export const mod = v => Math.floor((v - 10) / 2);
export const sinal = n => (n >= 0 ? `+${n}` : `${n}`);
export const zeros = () => Object.fromEntries(ATR.map(a => [a.id, 0]));
export const somaObj = (...objs) => {
  const r = zeros();
  for (const o of objs) for (const [k, v] of Object.entries(o || {})) r[k] = (r[k] || 0) + (v || 0);
  return r;
};

export function rolar4d6() {
  const d = Array.from({ length: 4 }, () => 1 + Math.floor(Math.random() * 6)).sort((a, b) => b - a);
  return { dados: d, total: d[0] + d[1] + d[2] };
}

export function atributosIniciais(cfg) {
  return {
    metodo: cfg.metodoPadrao || 'pontos',
    pontos: Object.fromEntries(ATR.map(a => [a.id, cfg.pontos.inicial])),
    manual: Object.fromEntries(ATR.map(a => [a.id, cfg.manual.inicial])),
    rolagens: [],
    atribuicao: {}, // { for: índice no conjunto (arranjo ou rolagens) }
  };
}

/** Valores base (antes de bônus de raça/antecedente) conforme o método escolhido. */
export function valoresBase(at, cfg) {
  if (at.metodo === 'pontos') return { ...at.pontos };
  if (at.metodo === 'manual') return { ...at.manual };
  const conjunto = at.metodo === 'arranjo' ? cfg.arranjo : at.rolagens.map(r => cfg.rolagem.converter ? cfg.rolagem.converter(r.total) : r.total);
  return Object.fromEntries(ATR.map(a => {
    const i = at.atribuicao[a.id];
    return [a.id, i === undefined || conjunto[i] === undefined ? cfg.vazio : conjunto[i]];
  }));
}

export function gastoPontos(at, cfg) {
  return ATR.reduce((s, a) => s + cfg.pontos.custo[at.pontos[a.id]], 0);
}

export function pendenciasAtributos(at, cfg) {
  if (at.metodo === 'pontos') {
    const resto = cfg.pontos.total - gastoPontos(at, cfg);
    return [resto > 0 && `Ainda faltam ${resto} ponto(s) de atributo.`, resto < 0 && `Você gastou ${-resto} ponto(s) a mais.`].filter(Boolean);
  }
  if (at.metodo === 'arranjo' || at.metodo === 'rolagem') {
    if (at.metodo === 'rolagem' && at.rolagens.length < 6) return ['Role os seis valores.'];
    const faltam = ATR.filter(a => at.atribuicao[a.id] === undefined);
    return faltam.length ? [`Distribua um valor para: ${faltam.map(a => a.nome).join(', ')}.`] : [];
  }
  return [];
}

/**
 * Passo de atributos. cfg:
 *  pontos: { total, custo: {valor: custo}, min, max, inicial }, arranjo?: [..], rolagem: { converter?, regra },
 *  manual: { min, max, inicial }, vazio, mostrarMod (bool), formatar(v), bonus(dados) -> {id: n}, notaBonus(dados)
 */
export function passoAtributos(cfg) {
  return {
    id: 'atributos',
    titulo: 'Atributos',
    subtitulo: cfg.subtitulo,
    pendencias: d => pendenciasAtributos(d.atributos, cfg),
    render(ctx) {
      const at = ctx.dados.atributos;
      const metodos = [
        ['pontos', 'Compra de pontos'],
        cfg.arranjo && ['arranjo', 'Arranjo padrão'],
        ['rolagem', 'Rolar 4d6'],
        ['manual', 'Manual'],
      ].filter(Boolean);
      const bonus = cfg.bonus(ctx.dados);
      const base = valoresBase(at, cfg);
      const fmt = cfg.formatar || (v => v);

      const abas = h('div', { class: 'abas', role: 'tablist' }, metodos.map(([id, rot]) => h('button', {
        type: 'button', role: 'tab', class: 'aba' + (at.metodo === id ? ' ativa' : ''), 'aria-selected': String(at.metodo === id),
        onClick: () => { at.metodo = id; ctx.mudou(true); },
      }, rot)));

      let topo = null;
      if (at.metodo === 'pontos') {
        const resto = cfg.pontos.total - gastoPontos(at, cfg);
        topo = h('div', { class: `contador-d20 ${resto === 0 ? 'zerado' : resto < 0 ? 'estourado' : ''}` },
          h('strong', null, resto), ` de ${cfg.pontos.total} pontos restantes`,
          h('small', null, 'Custos: ' + Object.entries(cfg.pontos.custo).map(([v, c]) => `${fmt(Number(v))}=${c}`).join(' · ')));
      } else if (at.metodo === 'arranjo' || at.metodo === 'rolagem') {
        const conjunto = at.metodo === 'arranjo' ? cfg.arranjo : at.rolagens.map(r => cfg.rolagem.converter ? cfg.rolagem.converter(r.total) : r.total);
        const usados = new Set(Object.values(at.atribuicao));
        topo = h('div', { class: 'conjunto' },
          at.metodo === 'rolagem' && h('div', { class: 'rolagem-acoes' },
            h('button', {
              type: 'button', class: 'btn', onClick: () => {
                at.rolagens = Array.from({ length: 6 }, rolar4d6);
                at.atribuicao = {};
                ctx.mudou(true);
              },
            }, at.rolagens.length ? '🎲 Rolar de novo' : '🎲 Rolar 6 × 4d6'),
            h('small', null, cfg.rolagem.regra)),
          h('div', { class: 'conjunto-valores' }, conjunto.map((v, i) => h('span', {
            class: 'valor-chip' + (usados.has(i) ? ' usado' : ''),
            title: at.metodo === 'rolagem' ? `Dados: ${at.rolagens[i].dados.join(', ')} (descarta o menor) = ${at.rolagens[i].total}` : '',
          }, fmt(v), at.metodo === 'rolagem' && cfg.rolagem.converter ? h('small', null, ` (${at.rolagens[i].total})`) : null))));
      }

      const linhas = ATR.map(a => {
        let controle;
        if (at.metodo === 'pontos') {
          const v = at.pontos[a.id];
          const prox = cfg.pontos.custo[v + 1];
          const resto = cfg.pontos.total - gastoPontos(at, cfg);
          controle = stepper(v, {
            rotulo: a.nome, min: cfg.pontos.min, max: cfg.pontos.max,
            podeSubir: prox !== undefined && prox - cfg.pontos.custo[v] <= resto,
            onChange: nv => { at.pontos[a.id] = nv; ctx.mudou(true); },
          });
          controle = h('div', { class: 'controle-pontos' }, controle);
          if (cfg.formatar) controle.querySelector('output').textContent = fmt(v);
        } else if (at.metodo === 'manual') {
          controle = stepper(at.manual[a.id], {
            rotulo: a.nome, min: cfg.manual.min, max: cfg.manual.max,
            onChange: nv => { at.manual[a.id] = nv; ctx.mudou(true); },
          });
          if (cfg.formatar) controle.querySelector('output').textContent = fmt(at.manual[a.id]);
        } else {
          const conjunto = at.metodo === 'arranjo' ? cfg.arranjo : at.rolagens.map(r => cfg.rolagem.converter ? cfg.rolagem.converter(r.total) : r.total);
          const usadosPorOutros = new Set(Object.entries(at.atribuicao).filter(([k]) => k !== a.id).map(([, i]) => i));
          controle = h('select', {
            class: 'select-valor', 'aria-label': `Valor de ${a.nome}`,
            onChange: e => {
              if (e.target.value === '') delete at.atribuicao[a.id];
              else at.atribuicao[a.id] = Number(e.target.value);
              ctx.mudou(true);
            },
          },
            h('option', { value: '' }, '—'),
            conjunto.map((v, i) => usadosPorOutros.has(i) ? null : h('option', { value: i, selected: at.atribuicao[a.id] === i }, fmt(v))));
        }
        const total = base[a.id] + (bonus[a.id] || 0);
        return h('div', { class: 'linha-atr' },
          h('div', { class: 'linha-atr-nome' }, h('strong', null, a.nome), h('small', null, a.sigla)),
          controle,
          h('span', { class: 'linha-atr-bonus' }, bonus[a.id] ? sinal(bonus[a.id]) : ''),
          h('span', { class: 'linha-atr-total' }, fmt(total), cfg.mostrarMod ? h('small', null, sinal(mod(total))) : null));
      });

      return h('div', null,
        abas,
        cfg.explicacao && h('p', { class: 'nota-d20' }, cfg.explicacao(at.metodo)),
        topo,
        h('div', { class: 'tabela-atr' },
          h('div', { class: 'linha-atr cabeca' }, h('span', null, 'Atributo'), h('span', null, 'Base'), h('span', null, 'Bônus'), h('span', null, 'Total')),
          linhas),
        cfg.notaBonus && h('p', { class: 'nota-d20' }, cfg.notaBonus(ctx.dados)));
    },
  };
}

/** Grade de opções selecionáveis com limite (perícias, talentos, poderes…). */
export function seletor({ opcoes, selecionados, limite = Infinity, travados = [], onChange, colunas = 'auto' }) {
  const cheio = selecionados.length >= limite;
  return h('div', { class: 'seletor' + (colunas === 'largo' ? ' largo' : '') }, opcoes.map(o => {
    const travado = travados.includes(o.id);
    const sel = travado || selecionados.includes(o.id);
    return h('button', {
      type: 'button',
      class: 'opcao' + (sel ? ' selecionada' : '') + (travado ? ' travada' : ''),
      'aria-pressed': String(sel),
      disabled: travado || (!sel && cheio) || o.desabilitado,
      title: travado ? 'Já vem de outra escolha' : o.dica || '',
      onClick: () => onChange(sel ? selecionados.filter(x => x !== o.id) : [...selecionados, o.id]),
    },
      h('span', { class: 'opcao-marca', 'aria-hidden': 'true' }, sel ? '✔' : ''),
      h('span', { class: 'opcao-texto' }, h('strong', null, o.nome), o.desc && h('small', null, o.desc)));
  }));
}

/** Cartões grandes de escolha única (raça, classe, origem). */
export function escolhaUnica({ opcoes, valor, onChange, render }) {
  return h('div', { class: 'cartoes-escolha' }, opcoes.map(o => h('button', {
    type: 'button', class: 'cartao-escolha' + (valor === o.id ? ' selecionado' : ''), 'aria-pressed': String(valor === o.id),
    onClick: () => onChange(o.id),
  }, render ? render(o) : [h('strong', null, o.nome), o.desc && h('small', null, o.desc)])));
}

export function contadorEscolha(rotulo, atual, limite) {
  const resto = limite - atual;
  return h('div', { class: `contador-d20 ${resto === 0 ? 'zerado' : resto < 0 ? 'estourado' : ''}` },
    h('strong', null, Math.max(resto, 0)), ` ${rotulo} restante(s) de ${limite}`);
}

export function blocoTexto(titulo, ...conteudo) {
  return h('section', { class: 'fd-bloco' }, h('h3', null, titulo), ...conteudo);
}

/**
 * Ficha pronta genérica. modelo:
 *  { sistema, nome, linha, meta: [..], atributos: [{sigla, valor, mod}], destaques: [{rot, val}],
 *    vida: {rot, max, marcados, onChange}, outros: [{rot, max, marcados, onChange}],
 *    salvaguardas: [{nome, bonus, prof}], pericias: [{nome, bonus, prof, atr}], blocos: [Node], pendencias: [] }
 */
export function fichaD20(m) {
  return h('article', { class: 'ficha-d20' },
    m.pendencias?.length ? h('div', { class: 'fd-aviso nao-imprimir' }, h('strong', null, 'Ficha incompleta: '), m.pendencias.join(' ')) : null,
    h('header', { class: 'fd-topo' },
      h('div', { class: 'fd-sistema' }, m.sistema),
      h('h1', null, m.nome || 'Sem nome'),
      m.linha && h('p', { class: 'fd-linha' }, m.linha),
      m.meta?.length ? h('p', { class: 'fd-meta' }, m.meta.filter(Boolean).join('  ·  ')) : null),
    h('div', { class: 'fd-atributos' }, m.atributos.map(a => h('div', { class: 'fd-atr' },
      h('span', { class: 'fd-atr-sigla' }, a.sigla),
      h('b', null, a.principal ?? a.valor),
      a.secundario !== undefined && h('span', { class: 'fd-atr-sec' }, a.secundario)))),
    h('div', { class: 'fd-destaques' }, m.destaques.map(d => h('div', { class: 'fd-destaque' }, h('b', null, d.val), h('span', null, d.rot)))),
    h('div', { class: 'fd-grade' },
      [m.vida, ...(m.outros || [])].filter(Boolean).map(v => blocoTexto(`${v.rot} (${v.max})`,
        v.max <= 60
          ? circulos(v.max, Math.min(v.marcados, v.max), v.onChange, { rotulo: v.rot })
          : h('div', { class: 'fd-contador-pv' },
            h('button', { type: 'button', class: 'btn', onClick: () => v.onChange(Math.min(v.max, v.marcados + 1)) }, '− 1'),
            h('b', null, `${v.max - v.marcados} / ${v.max}`),
            h('button', { type: 'button', class: 'btn', onClick: () => v.onChange(Math.max(0, v.marcados - 1)) }, '+ 1')),
        h('p', { class: 'fd-nota' }, v.dica || 'Marque o que foi gasto ou perdido.'))),
      m.salvaguardas && blocoTexto(m.rotuloSalvaguardas || 'Testes de resistência',
        h('ul', { class: 'fd-lista' }, m.salvaguardas.map(s => h('li', { class: s.prof ? 'prof' : '' },
          h('span', { class: 'fd-prof' }, s.prof ? '●' : '○'), h('span', null, s.nome), h('b', null, sinal(s.bonus)))))),
      m.pericias && blocoTexto(m.rotuloPericias || 'Perícias',
        h('ul', { class: 'fd-lista fd-pericias' }, m.pericias.map(p => h('li', { class: p.prof ? 'prof' : '' },
          h('span', { class: 'fd-prof' }, p.prof ? (p.dupla ? '◉' : '●') : '○'),
          h('span', null, p.nome, p.atr && h('small', null, ` (${p.atr})`)),
          h('b', null, p.texto ?? sinal(p.bonus)))))),
      ...(m.blocos || []).filter(Boolean)));
}

/** Resumo lateral genérico. */
export function resumoD20({ nome, linha, atributos, destaques, extras = [] }) {
  return h('div', { class: 'resumo-d20' },
    h('strong', { class: 'resumo-d20-nome' }, nome || 'Sem nome'),
    linha && h('span', { class: 'resumo-d20-linha' }, linha),
    h('div', { class: 'resumo-d20-atr' }, atributos.map(a => h('div', null, h('small', null, a.sigla), h('b', null, a.principal ?? a.valor), a.secundario !== undefined && h('span', null, a.secundario)))),
    h('dl', { class: 'resumo-d20-dest' }, destaques.map(d => h('div', null, h('dt', null, d.rot), h('dd', null, d.val)))),
    extras.filter(Boolean).map(e => h('p', { class: 'resumo-d20-extra' }, e)));
}

/** Lista editável de itens/armas simples. */
export function listaEditavel(lista, campos, ctx, rotuloAdd = '+ Adicionar') {
  return h('div', { class: 'lista-editavel' },
    lista.map((item, i) => h('div', { class: 'item-editavel' },
      campos.map(([k, rot, ph]) => h('label', { class: 'campo' }, h('span', { class: 'campo-rotulo' }, rot),
        h('input', { value: item[k] ?? '', placeholder: ph || '', onInput: e => { item[k] = e.target.value; ctx.mudou(); } }))),
      h('button', { type: 'button', class: 'mini perigo', 'aria-label': 'Remover', onClick: () => { lista.splice(i, 1); ctx.mudou(true); } }, '✕'))),
    h('button', { type: 'button', class: 'btn', onClick: () => { lista.push(Object.fromEntries(campos.map(([k]) => [k, '']))); ctx.mudou(true); } }, rotuloAdd));
}

export { h, stepper, circulos };
