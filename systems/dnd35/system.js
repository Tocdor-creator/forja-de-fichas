// D&D 3.5 — criação de personagem de 1º nível.
import { campo } from '../../js/core/ui.js';
import { introGenerica } from '../../js/core/intro.js';
import {
  h, ATR, nomeAtr, siglaAtr, mod, sinal, somaObj, atributosIniciais, valoresBase, stepper,
  passoAtributos, seletor, escolhaUnica, contadorEscolha, blocoTexto, fichaD20, resumoD20, listaEditavel,
} from '../_d20/comum.js';
import * as R from './regras.js';

const CFG_ATR = {
  pontos: R.PONTOS,
  arranjo: R.ARRANJO,
  rolagem: { regra: 'Role 4d6 seis vezes, descarte o menor de cada. Se o total de modificadores for 0 ou menos, ou nenhum valor passar de 13, role de novo.' },
  manual: { min: 3, max: 18, inicial: 10 },
  vazio: 8,
  mostrarMod: true,
  subtitulo: 'Defina os seis valores. Os ajustes raciais entram na coluna “Bônus”.',
  explicacao: m => ({
    pontos: 'Compra de pontos (campanha padrão): 25 pontos; todos começam em 8 e vão até 18.',
    arranjo: 'Arranjo padrão: 15, 14, 13, 12, 10 e 8.',
    rolagem: 'Rolagem clássica: 4d6, descarta o menor.',
    manual: 'Manual: use se o Mestre definiu outro método.',
  })[m],
  bonus: d => raca(d)?.mods || {},
};

const raca = d => R.RACAS.find(r => r.id === d.raca);
const classe = d => R.CLASSES.find(c => c.id === d.classe);
const pericia = id => R.PERICIAS.find(p => p.id === id);
const talento = id => R.TALENTOS.find(t => t.id === id);
const pequeno = d => raca(d)?.tamanho === 'Pequeno';

function atributos(d) {
  const base = valoresBase(d.atributos, CFG_ATR);
  const b = CFG_ATR.bonus(d);
  const atr = Object.fromEntries(ATR.map(a => [a.id, base[a.id] + (b[a.id] || 0)]));
  if (d.raca === 'meio-orc') atr.int = Math.max(3, atr.int);
  return atr;
}

function talentosAutomaticos(d) {
  const c = classe(d);
  return [...(c?.automaticos || []), d.talentoMonge].filter(Boolean);
}
function todosTalentos(d) {
  return [...talentosAutomaticos(d), ...d.talentos];
}

function limiteTalentos(d) {
  return 1 + (raca(d)?.talentoExtra || 0) + (classe(d)?.talentoCombate || 0);
}

function pontosPericiaTotal(d, m) {
  const c = classe(d);
  if (!c) return 0;
  return Math.max(1, c.pts + m.int) * 4 + (raca(d)?.periciasExtras || 0);
}

function preRequisitoOk(t, d, atr) {
  const p = t.pre;
  if (!p) return { ok: true };
  const falta = [];
  for (const [k, v] of Object.entries(p.atr || {})) if (atr[k] < v) falta.push(`${siglaAtr(k)} ${v}`);
  for (const tid of p.talentos || []) if (!todosTalentos(d).includes(tid)) falta.push(talento(tid).nome);
  if (p.bba && bba(d) < p.bba) falta.push(`BBA +${p.bba}`);
  if (p.conj && !classe(d)?.conj) falta.push('ser conjurador');
  return { ok: !falta.length, falta };
}

const bba = d => (classe(d)?.bba === 'bom' ? 1 : 0);

function derivar(d) {
  const atr = atributos(d);
  const m = Object.fromEntries(ATR.map(a => [a.id, mod(atr[a.id])]));
  const c = classe(d), r = raca(d);
  const tal = todosTalentos(d).map(talento).filter(Boolean);
  const efe = (k) => tal.reduce((s, t) => s + (t.efeito?.[k] || 0), 0);
  const efePericia = id => tal.reduce((s, t) => s + (t.efeito?.pericias?.[id] || 0), 0);
  const efeSalv = id => tal.reduce((s, t) => s + (t.efeito?.salv?.[id] || 0), 0);
  const tam = pequeno(d) ? 1 : 0;

  const arm = R.ARMADURAS.find(a => a.id === d.armadura) || R.ARMADURAS[0];
  const esc = R.ESCUDOS.find(e => e.id === d.escudo) || R.ESCUDOS[0];
  const desCA = arm.maxDes == null ? m.des : Math.min(m.des, arm.maxDes);
  const sabMonge = c?.bonusSab && arm.id === 'nenhuma' && esc.id === 'nenhum' ? Math.max(0, m.sab) : 0;
  const ca = 10 + arm.ca + esc.ca + desCA + tam + sabMonge;
  const toque = 10 + desCA + tam + sabMonge;
  const surpreso = 10 + arm.ca + esc.ca + tam + sabMonge + Math.min(0, desCA);

  const salvBase = id => (c?.salv.includes(id) ? 2 : 0);
  const res = r?.resistencias || 0;
  const salv = [
    { id: 'fort', nome: 'Fortitude', atr: 'con' }, { id: 'ref', nome: 'Reflexos', atr: 'des' }, { id: 'von', nome: 'Vontade', atr: 'sab' },
  ].map(s => ({ ...s, prof: !!c?.salv.includes(s.id), bonus: salvBase(s.id) + m[s.atr] + res + efeSalv(s.id) }));

  const pericias = R.PERICIAS.map(p => {
    const deClasse = !!c?.pericias.includes(p.id);
    const pts = d.pericias[p.id] || 0;
    const grad = deClasse ? pts : pts / 2;
    const racial = r?.pericias?.[p.id] || 0;
    const bonus = Math.floor(grad + m[p.atr] + racial + efePericia(p.id));
    return { ...p, deClasse, pts, grad, racial, bonus, prof: grad > 0, usavel: !p.so || grad > 0 };
  });

  return {
    atr, m, ca, toque, surpreso, salv, pericias,
    pv: c ? Math.max(1, c.dv + m.con) + efe('pv') : 0,
    bba: bba(d),
    corpo: bba(d) + m.for + tam,
    distancia: bba(d) + m.des + tam,
    agarrar: bba(d) + m.for + (pequeno(d) ? -4 : 0),
    iniciativa: m.des + efe('iniciativa'),
    desl: r ? (r.desl + (c?.id === 'barbaro' ? 3 : 0)) : 9,
    pontosPericia: pontosPericiaTotal(d, m),
    gastos: Object.values(d.pericias).reduce((s, v) => s + v, 0),
    idiomasBonus: Math.max(0, m.int),
    talentos: tal,
  };
}

// ---------------------------------------------------------------- passos

const passoConceito = {
  id: 'conceito',
  titulo: 'Conceito',
  subtitulo: 'Nome, alinhamento e quem é o seu aventureiro.',
  pendencias: d => [
    !d.nome.trim() && 'Dê um nome ao personagem.',
    !d.alinhamento && 'Escolha um alinhamento.',
    d.classe && !R.alinhamentoValido(d.classe, d.alinhamento) && `${classe(d).nome} exige alinhamento: ${classe(d).alinh}.`,
  ].filter(Boolean),
  render(ctx) {
    const d = ctx.dados;
    const set = k => v => { d[k] = v; ctx.mudou(); };
    return h('div', null,
      h('div', { class: 'linha-2' },
        campo('Nome do personagem', () => d.nome, set('nome')),
        campo('Jogador(a)', () => d.jogador, set('jogador'))),
      h('div', { class: 'linha-2' },
        h('label', { class: 'campo' }, h('span', { class: 'campo-rotulo' }, 'Alinhamento'),
          h('select', { onChange: e => { d.alinhamento = e.target.value; ctx.mudou(true); } },
            h('option', { value: '' }, '—'),
            R.ALINHAMENTOS.map(a => h('option', { value: a, selected: d.alinhamento === a }, a)))),
        campo('Divindade', () => d.divindade, set('divindade'))),
      h('div', { class: 'linha-2' },
        campo('Idade', () => d.idade, set('idade')),
        campo('Altura e peso', () => d.altura, set('altura'))),
      campo('Aparência', () => d.aparencia, set('aparencia'), { multi: true }),
      campo('Personalidade e história', () => d.historia, set('historia'), { multi: true }));
  },
};

const passoRaca = {
  id: 'raca',
  titulo: 'Raça',
  subtitulo: 'A raça ajusta atributos, tamanho, deslocamento, idiomas e dá habilidades raciais.',
  pendencias: d => [!raca(d) && 'Escolha uma raça.'].filter(Boolean),
  render(ctx) {
    const d = ctx.dados;
    const r = raca(d);
    return h('div', null,
      escolhaUnica({
        opcoes: R.RACAS, valor: d.raca,
        onChange: id => { d.raca = id; ctx.mudou(true); },
        render: o => [h('strong', null, o.nome),
          h('small', null, Object.entries(o.mods).map(([k, v]) => `${siglaAtr(k)} ${sinal(v)}`).join(', ') || 'Sem ajustes'),
          h('small', null, o.resumo)],
      }),
      r && h('div', { class: 'detalhe-escolha' },
        h('h3', null, r.nome),
        h('p', null, `Tamanho ${r.tamanho} · Deslocamento ${r.desl} m · Classe favorecida: ${r.favorecida} · Idiomas: ${r.idiomas}`),
        h('ul', null, r.tracos.map(t => h('li', null, t)))));
  },
};

const passoClasse = {
  id: 'classe',
  titulo: 'Classe',
  subtitulo: 'Define dado de vida, bônus base de ataque, resistências, perícias de classe e habilidades.',
  pendencias: d => [!classe(d) && 'Escolha uma classe.', classe(d)?.escolhaAuto && !d.talentoMonge && `Escolha o ${classe(d).escolhaAuto.rotulo.toLowerCase()}.`].filter(Boolean),
  render(ctx) {
    const d = ctx.dados;
    const c = classe(d);
    const fmtBBA = x => (x === 'bom' ? '+1 (bom)' : x === 'medio' ? '+0 (médio)' : '+0 (ruim)');
    return h('div', null,
      escolhaUnica({
        opcoes: R.CLASSES, valor: d.classe,
        onChange: id => { d.classe = id; d.talentoMonge = ''; ctx.mudou(true); },
        render: o => [h('strong', null, o.nome), h('small', null, `d${o.dv} · ${o.pts} + Int perícias/nível`)],
      }),
      c && h('div', { class: 'detalhe-escolha' },
        h('h3', null, c.nome),
        !R.alinhamentoValido(c.id, d.alinhamento) && h('p', { class: 'pendencias' }, `Seu alinhamento (${d.alinhamento}) não é permitido: ${c.alinh}.`),
        h('ul', null,
          h('li', null, h('strong', null, 'Dado de vida: '), `d${c.dv} (máximo no 1º nível)`),
          h('li', null, h('strong', null, 'Bônus base de ataque: '), fmtBBA(c.bba)),
          h('li', null, h('strong', null, 'Resistências boas (+2): '), c.salv.map(s => ({ fort: 'Fortitude', ref: 'Reflexos', von: 'Vontade' })[s]).join(', ')),
          h('li', null, h('strong', null, 'Pontos de perícia: '), `(${c.pts} + mod. Int) × 4 no 1º nível`),
          h('li', null, h('strong', null, 'Alinhamento: '), c.alinh),
          h('li', null, h('strong', null, 'Proficiências: '), c.prof),
          c.magia && h('li', null, h('strong', null, 'Magias: '), c.magia)),
        h('h3', { class: 'subtitulo-secao' }, 'Habilidades de 1º nível'),
        h('ul', null, c.carac.map(t => h('li', null, t)))),
      c?.escolhaAuto && [
        h('h3', { class: 'subtitulo-secao' }, c.escolhaAuto.rotulo),
        escolhaUnica({
          opcoes: c.escolhaAuto.de.map(talento), valor: d.talentoMonge,
          onChange: id => { d.talentoMonge = id; ctx.mudou(true); },
          render: o => [h('strong', null, o.nome), h('small', null, o.desc)],
        }),
      ],
      c && campo(c.escolhas || 'Anotações da classe', () => d.escolhasClasse, v => { d.escolhasClasse = v; ctx.mudou(); }, { multi: true, placeholder: c.escolhasExemplo || '' }));
  },
};

const passoAtr = passoAtributos(CFG_ATR);

const passoPericias = {
  id: 'pericias',
  titulo: 'Perícias',
  subtitulo: 'Perícias de classe: 1 ponto = 1 graduação (máx. 4). Fora da classe: 2 pontos = 1 graduação (máx. 2).',
  pendencias(d) {
    if (!classe(d)) return ['Escolha a classe antes das perícias.'];
    const der = derivar(d);
    const resto = der.pontosPericia - der.gastos;
    return [resto > 0 && `Ainda faltam ${resto} ponto(s) de perícia.`, resto < 0 && `Você gastou ${-resto} ponto(s) a mais (talvez tenha mudado a Inteligência).`].filter(Boolean);
  },
  render(ctx) {
    const d = ctx.dados;
    if (!classe(d)) return h('p', { class: 'nota-d20' }, 'Escolha uma classe primeiro.');
    const der = derivar(d);
    const resto = der.pontosPericia - der.gastos;
    const [soClasse, setSoClasse] = [d._filtroClasse ?? false, v => { d._filtroClasse = v; ctx.mudou(true); }];
    return h('div', null,
      h('div', { class: `contador-d20 ${resto === 0 ? 'zerado' : resto < 0 ? 'estourado' : ''}` },
        h('strong', null, resto), ` de ${der.pontosPericia} pontos restantes`,
        h('small', null, `(${classe(d).pts} + Int ${sinal(der.m.int)}) × 4${raca(d)?.periciasExtras ? ` + ${raca(d).periciasExtras} (humano)` : ''}`)),
      h('div', { class: 'abas' },
        h('button', { type: 'button', class: 'aba' + (!soClasse ? ' ativa' : ''), onClick: () => setSoClasse(false) }, 'Todas'),
        h('button', { type: 'button', class: 'aba' + (soClasse ? ' ativa' : ''), onClick: () => setSoClasse(true) }, 'Só de classe')),
      h('div', { class: 'tabela-pericias35' },
        h('div', { class: 'pl35 cabeca' }, h('span', null, 'Perícia'), h('span', null, 'Pontos'), h('span', null, 'Grad.'), h('span', null, 'Total')),
        der.pericias.filter(p => !soClasse || p.deClasse).map(p => h('div', { class: 'pl35' + (p.deClasse ? ' de-classe' : '') + (p.pts ? ' ativa' : '') },
          h('span', { class: 'pl35-nome' },
            h('strong', null, p.nome), h('small', null, ` ${siglaAtr(p.atr)}${p.so ? ' · só treinada' : ''}${p.deClasse ? ' · de classe' : ''}${p.racial ? ` · racial ${sinal(p.racial)}` : ''}`)),
          stepper(p.pts, {
            rotulo: p.nome, max: 4, podeSubir: resto > 0,
            onChange: v => { if (v) d.pericias[p.id] = v; else delete d.pericias[p.id]; ctx.mudou(true); },
          }),
          h('span', { class: 'pl35-grad' }, String(p.grad).replace('.', ',')),
          h('b', { class: 'pl35-total' }, p.usavel ? sinal(p.bonus) : '—')))),
      h('p', { class: 'nota-d20' }, 'Perícias “só treinadas” não podem ser usadas sem ao menos meia graduação.'));
  },
};

const passoTalentos = {
  id: 'talentos',
  titulo: 'Talentos',
  subtitulo: 'Todo personagem tem 1 talento no 1º nível; humanos ganham +1 e guerreiros +1 talento de combate.',
  pendencias(d) {
    const lim = limiteTalentos(d);
    const p = [];
    if (d.talentos.length !== lim) p.push(`Escolha ${lim} talento(s) (${d.talentos.length}/${lim}).`);
    if (classe(d)?.talentoCombate) {
      const naoCombate = d.talentos.filter(t => !talento(t)?.combate).length;
      if (naoCombate > lim - classe(d).talentoCombate) p.push('O talento bônus do guerreiro precisa ser um talento de combate.');
    }
    const atr = atributos(d);
    for (const t of d.talentos) {
      const r = preRequisitoOk(talento(t), d, atr);
      if (!r.ok) p.push(`${talento(t).nome}: falta ${r.falta.join(', ')}.`);
    }
    return p;
  },
  render(ctx) {
    const d = ctx.dados;
    const lim = limiteTalentos(d);
    const atr = atributos(d);
    const auto = talentosAutomaticos(d);
    return h('div', null,
      contadorEscolha('talento(s)', d.talentos.length, lim),
      auto.length ? h('p', { class: 'nota-d20' }, 'Ganhos pela classe: ', auto.map(t => talento(t)?.nome).join(', ')) : null,
      classe(d)?.talentoCombate && h('p', { class: 'nota-d20' }, 'Talentos marcados com ⚔ são de combate (valem para o bônus do guerreiro).'),
      seletor({
        colunas: 'largo',
        opcoes: R.TALENTOS.filter(t => !auto.includes(t.id)).map(t => {
          const pr = preRequisitoOk(t, d, atr);
          return { id: t.id, nome: (t.combate ? '⚔ ' : '') + t.nome, desc: t.desc + (pr.ok ? '' : ` (requer ${pr.falta.join(', ')})`), desabilitado: !pr.ok && !d.talentos.includes(t.id) };
        }),
        selecionados: d.talentos, limite: lim,
        onChange: ids => { d.talentos = ids; ctx.mudou(true); },
      }),
      campo('Detalhes dos talentos', () => d.notasTalentos, v => { d.notasTalentos = v; ctx.mudou(); }, { placeholder: 'Ex.: Foco em Arma (espada longa); Foco em Perícia (Blefar)' }));
  },
};

const passoEquip = {
  id: 'equipamento',
  titulo: 'Equipamento e magias',
  subtitulo: 'Armadura, escudo, armas, ouro inicial e magias.',
  render(ctx) {
    const d = ctx.dados;
    const c = classe(d);
    const der = derivar(d);
    return h('div', null,
      h('div', { class: 'linha-2' },
        h('label', { class: 'campo' }, h('span', { class: 'campo-rotulo' }, 'Armadura'),
          h('select', { onChange: e => { d.armadura = e.target.value; ctx.mudou(true); } }, R.ARMADURAS.map(a => h('option', { value: a.id, selected: d.armadura === a.id }, a.nome)))),
        h('label', { class: 'campo' }, h('span', { class: 'campo-rotulo' }, 'Escudo'),
          h('select', { onChange: e => { d.escudo = e.target.value; ctx.mudou(true); } }, R.ESCUDOS.map(a => h('option', { value: a.id, selected: d.escudo === a.id }, a.nome))))),
      h('p', { class: 'contador-d20' }, h('strong', null, der.ca), ` CA · toque ${der.toque} · surpreso ${der.surpreso}`),
      h('h3', { class: 'subtitulo-secao' }, 'Armas'),
      listaEditavel(d.armas, [['nome', 'Arma', 'Espada longa'], ['ataque', 'Ataque', sinal(der.corpo)], ['dano', 'Dano / crítico', `1d8${sinal(der.m.for)} 19-20/×2`]], ctx, '+ Adicionar arma'),
      h('div', { class: 'linha-2' },
        h('div', { class: 'campo' },
          campo('Peças de ouro (PO)', () => d.po, v => { d.po = v || 0; ctx.mudou(); }, { tipo: 'number' }),
          c && h('button', {
            type: 'button', class: 'mini', onClick: () => {
              const [n, x] = c.ouro;
              let t = 0; for (let i = 0; i < n; i++) t += 1 + Math.floor(Math.random() * 4);
              d.po = t * x; ctx.mudou(true);
            },
          }, `🎲 Rolar ouro inicial (${c.ouro[0]}d4${c.ouro[1] > 1 ? ` × ${c.ouro[1]}` : ''})`)),
        campo('Idiomas', () => d.idiomas, v => { d.idiomas = v; ctx.mudou(); }, { placeholder: raca(d)?.idiomas, dica: der.idiomasBonus ? `+${der.idiomasBonus} idioma(s) adicional(is) pela Inteligência.` : '' })),
      campo('Outros itens', () => d.itens, v => { d.itens = v; ctx.mudou(); }, { multi: true }),
      c?.conj && [
        h('h3', { class: 'subtitulo-secao' }, 'Magias'),
        h('p', { class: 'nota-d20' }, c.magia, ` CD = 10 + nível da magia + ${sinal(der.m[c.conj])} (${nomeAtr(c.conj)}).`),
        campo('Magias de nível 0', () => d.magias0, v => { d.magias0 = v; ctx.mudou(); }, { multi: true }),
        campo('Magias de 1º nível', () => d.magias1, v => { d.magias1 = v; ctx.mudou(); }, { multi: true }),
      ]);
  },
};

const passos = [passoConceito, passoRaca, passoClasse, passoAtr, passoPericias, passoTalentos, passoEquip];

// ---------------------------------------------------------------- resumo e ficha

const linha = d => [raca(d)?.nome, classe(d) && `${classe(d).nome} 1`].filter(Boolean).join(' · ');
const atrModelo = der => ATR.map(a => ({ sigla: a.sigla, principal: der.atr[a.id], secundario: sinal(der.m[a.id]) }));

function resumo(ctx) {
  const d = ctx.dados;
  const der = derivar(d);
  return resumoD20({
    nome: d.nome, linha: linha(d), atributos: atrModelo(der),
    destaques: [
      { rot: 'PV', val: der.pv || '—' }, { rot: 'CA', val: der.ca },
      { rot: 'BBA', val: sinal(der.bba) }, { rot: 'Iniciativa', val: sinal(der.iniciativa) },
      { rot: 'Fort/Ref/Von', val: der.salv.map(s => sinal(s.bonus)).join(' ') }, { rot: 'Desloc.', val: `${der.desl} m` },
    ],
    extras: [
      classe(d) && `Perícias: ${der.gastos}/${der.pontosPericia} pontos`,
      der.talentos.length && `Talentos: ${der.talentos.map(t => t.nome).join(', ')}`,
    ],
  });
}

function ficha(ctx) {
  const d = ctx.dados;
  const der = derivar(d);
  const c = classe(d), r = raca(d);
  return fichaD20({
    pendencias: passos.flatMap(p => (p.pendencias ? p.pendencias(d) : [])),
    sistema: 'Dungeons & Dragons 3.5',
    nome: d.nome, linha: linha(d),
    meta: [d.alinhamento, d.divindade, r?.tamanho, d.jogador && `Jogador(a): ${d.jogador}`],
    atributos: atrModelo(der),
    destaques: [
      { rot: 'CA', val: der.ca }, { rot: 'Toque', val: der.toque }, { rot: 'Surpreso', val: der.surpreso },
      { rot: 'Iniciativa', val: sinal(der.iniciativa) }, { rot: 'BBA', val: sinal(der.bba) },
      { rot: 'Corpo a corpo', val: sinal(der.corpo) }, { rot: 'Distância', val: sinal(der.distancia) },
      { rot: 'Agarrar', val: sinal(der.agarrar) }, { rot: 'Deslocamento', val: `${der.desl} m` },
    ],
    vida: der.pv ? { rot: 'Pontos de vida', max: der.pv, marcados: d.jogo.pvPerdidos, onChange: v => { d.jogo.pvPerdidos = v; ctx.mudou(); } } : null,
    salvaguardas: der.salv,
    pericias: der.pericias.filter(p => p.pts || p.racial || !p.so).map(p => ({ nome: p.nome, atr: siglaAtr(p.atr), prof: p.pts > 0, bonus: p.bonus, texto: p.usavel ? sinal(p.bonus) : '—' })),
    rotuloPericias: 'Perícias (graduações + mod.)',
    blocos: [
      der.talentos.length && blocoTexto('Talentos', h('ul', null, der.talentos.map(t => h('li', null, h('strong', null, t.nome), ` — ${t.desc}`))), d.notasTalentos && h('p', { class: 'fd-nota' }, d.notasTalentos)),
      c && blocoTexto(`${c.nome}: habilidades`, h('ul', null, c.carac.map(t => h('li', null, t))), d.escolhasClasse && h('p', { class: 'fd-texto' }, d.escolhasClasse), h('p', { class: 'fd-nota' }, c.prof)),
      r && blocoTexto(`${r.nome}: traços`, h('ul', null, r.tracos.map(t => h('li', null, t)))),
      c?.conj && blocoTexto('Magias', h('p', { class: 'fd-nota' }, c.magia),
        d.magias0 && h('p', { class: 'fd-texto' }, h('strong', null, 'Nível 0: '), d.magias0),
        d.magias1 && h('p', { class: 'fd-texto' }, h('strong', null, '1º nível: '), d.magias1)),
      d.armas.length ? blocoTexto('Armas', h('table', { class: 'fd-tabela' },
        h('thead', null, h('tr', null, h('th', null, 'Arma'), h('th', null, 'Ataque'), h('th', null, 'Dano'))),
        h('tbody', null, d.armas.map(a => h('tr', null, h('td', null, a.nome), h('td', null, a.ataque), h('td', null, a.dano)))))) : null,
      blocoTexto('Equipamento',
        h('p', null, R.ARMADURAS.find(a => a.id === d.armadura)?.nome, ' · ', R.ESCUDOS.find(e => e.id === d.escudo)?.nome),
        d.itens && h('p', { class: 'fd-texto' }, d.itens),
        h('p', null, h('strong', null, d.po || 0), ' PO'),
        h('p', null, 'Idiomas: ', d.idiomas || r?.idiomas || '—')),
      (d.aparencia || d.historia) && blocoTexto('Aparência e história',
        d.aparencia && h('p', { class: 'fd-texto' }, d.aparencia), d.historia && h('p', { class: 'fd-texto' }, d.historia)),
    ],
  });
}

function novo() {
  return {
    versao: 1,
    nome: '', jogador: '', alinhamento: '', divindade: '', idade: '', altura: '', aparencia: '', historia: '',
    raca: '', classe: '', talentoMonge: '', escolhasClasse: '',
    atributos: atributosIniciais({ pontos: R.PONTOS, manual: CFG_ATR.manual, metodoPadrao: 'pontos' }),
    pericias: {}, talentos: [], notasTalentos: '',
    armadura: 'nenhuma', escudo: 'nenhum', armas: [], po: 0, idiomas: '', itens: '', magias0: '', magias1: '',
    jogo: { pvPerdidos: 0 },
  };
}

const CENA = `
  <div class="d35-parede"></div>
  <div class="d35-tocha d35-tocha-e"><span></span></div><div class="d35-tocha d35-tocha-d"><span></span></div>
  <div class="d35-porta"><div class="d35-grade"></div></div>
  <div class="d35-poeira"></div>`;

export default {
  tema: 'theme.css',
  temaClasse: 'tema-dnd35',
  textoNovo: 'Novo aventureiro',
  intro: raiz => introGenerica(raiz, {
    classe: 'intro-dnd35', cena: CENA, titulo: 'D&D 3.5',
    frases: ['Acendendo as tochas…', 'Distribuindo graduações…', 'Conferindo pré-requisitos…', 'Destrancando a masmorra…'],
    botao: 'Descer à masmorra', duracao: 3000, saida: 1600,
  }),
  lobby: () => h('header', { class: 'lobby-sistema' },
    h('span', { class: 'lobby-pre' }, 'Edição 3.5 · d20 System'),
    h('h1', null, 'D&D 3.5'),
    h('p', null, 'Compra de 25 pontos, raças com ajustes, perícias por graduação (de classe e fora de classe), talentos com pré-requisitos, BBA, Fortitude/Reflexos/Vontade e CA de toque e surpreso — tudo calculado no 1º nível.')),
  novo,
  migrar: d => ({ ...novo(), ...d, jogo: { ...novo().jogo, ...d.jogo } }),
  titulo: d => d.nome,
  subtitulo: linha,
  passos, resumo, ficha,
};
