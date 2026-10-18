// Tormenta20 (Edição Jogo do Ano) — criação de personagem de 1º nível.
import { campo } from '../../js/core/ui.js';
import { introGenerica } from '../../js/core/intro.js';
import {
  h, ATR, nomeAtr, siglaAtr, sinal, somaObj, atributosIniciais, valoresBase,
  passoAtributos, seletor, escolhaUnica, contadorEscolha, blocoTexto, fichaD20, resumoD20, listaEditavel,
} from '../_d20/comum.js';
import * as R from './regras.js';

const raca = d => R.RACAS.find(r => r.id === d.raca);
const classe = d => R.CLASSES.find(c => c.id === d.classe);
const origem = d => R.ORIGENS.find(o => o.id === d.origem);

const CFG_ATR = {
  pontos: R.PONTOS,
  rolagem: { converter: R.converterRolagem, regra: 'Role 4d6 seis vezes (descarta o menor) e converta: 8-9 = –1, 10-11 = 0, 12-13 = +1, 14-15 = +2, 16-17 = +3, 18 = +4.' },
  manual: { min: -5, max: 10, inicial: 0 },
  vazio: 0,
  formatar: sinal,
  subtitulo: 'Em Tormenta20 o valor do atributo já é o modificador. 0 é a média humana; +3 ou +4 é extraordinário.',
  explicacao: m => ({
    pontos: 'Pontos: todos começam em 0 e você tem 10 pontos (+1 = 1, +2 = 2, +3 = 4, +4 = 7). Pode baixar um atributo para –1 e ganhar 1 ponto.',
    rolagem: 'Rolagem: se a soma dos atributos ficar abaixo de +6, role de novo o menor valor.',
    manual: 'Manual: use se o mestre definiu outro método.',
  })[m],
  bonus: d => somaObj(raca(d)?.mods, d.racaBonus),
};

function atributos(d) {
  const base = valoresBase(d.atributos, CFG_ATR);
  const b = CFG_ATR.bonus(d);
  return Object.fromEntries(ATR.map(a => [a.id, base[a.id] + (b[a.id] || 0)]));
}

/** Todas as perícias treinadas, com a origem de cada treino. */
function treinadas(d) {
  const c = classe(d), o = origem(d);
  const set = new Set([...(c?.fixas || []), ...Object.values(d.classeOu), ...d.periciasClasse, ...d.periciasInt, ...d.periciasRaca,
    ...d.beneficios.filter(b => b.startsWith('p:')).map(b => b.slice(2))]);
  return set;
}

function derivar(d) {
  const atr = atributos(d);
  const c = classe(d), r = raca(d);
  const tr = treinadas(d);
  const pericias = R.PERICIAS.map(p => {
    const t = tr.has(p.id);
    const racial = (r?.pericias?.[p.id] || 0) + (d.racaPericiasBonus.includes(p.id) ? (r?.bonusPericias?.valor || 0) : 0);
    return { ...p, prof: t, bonus: atr[p.atr] + (t ? 2 : 0) + racial, usavel: !p.so || t };
  });
  const arm = R.ARMADURAS.find(a => a.id === d.armadura) || R.ARMADURAS[0];
  const esc = R.ESCUDOS.find(e => e.id === d.escudo) || R.ESCUDOS[0];
  const atrDefesa = c?.autoconfianca && d.usarCarNaDefesa ? atr.car : atr.des;
  const insolencia = c?.insolencia && !arm.pesada ? Math.max(0, Math.min(atr.car, 1)) : 0;
  const defesa = 10 + (arm.pesada ? 0 : atrDefesa) + arm.def + esc.def + (r?.defesa || 0) + insolencia;
  const pv = c ? c.pv + atr.con + (r?.pv1 || 0) : 0;
  const pm = c ? c.pm + (r?.pmNivel || 0) + (c.abencoado ? Math.max(0, atr.car) : 0) : 0;
  return {
    atr, pericias, defesa, pv, pm,
    desl: r?.desl || 9,
    tamanho: r?.tamanho || 'Médio',
    qtdInt: Math.max(0, atr.int),
  };
}

// ---------------------------------------------------------------- passos

const passoConceito = {
  id: 'conceito',
  titulo: 'Conceito',
  subtitulo: 'Descreva seu herói em uma frase curta, com pelo menos um traço de personalidade.',
  pendencias: d => [!d.nome.trim() && 'Dê um nome ao personagem.'].filter(Boolean),
  render(ctx) {
    const d = ctx.dados;
    const set = k => v => { d[k] = v; ctx.mudou(); };
    return h('div', null,
      h('div', { class: 'linha-2' }, campo('Nome', () => d.nome, set('nome')), campo('Jogador(a)', () => d.jogador, set('jogador'))),
      campo('Conceito', () => d.conceito, set('conceito'), { placeholder: 'Uma bucaneira que sonha em conhecer os pontos mais distantes de Arton.' }),
      h('div', { class: 'linha-2' }, campo('Idade', () => d.idade, set('idade')), campo('Gênero / pronomes', () => d.genero, set('genero'))),
      campo('Aparência', () => d.aparencia, set('aparencia'), { multi: true }),
      campo('Personalidade e história', () => d.historia, set('historia'), { multi: true }));
  },
};

const passoAtr = passoAtributos(CFG_ATR);
const pendAtr = passoAtr.pendencias;
passoAtr.pendencias = d => {
  const p = pendAtr(d);
  if (d.atributos.metodo === 'rolagem' && d.atributos.rolagens.length === 6) {
    const soma = d.atributos.rolagens.reduce((s, r) => s + R.converterRolagem(r.total), 0);
    if (soma < 6) p.push(`A soma das rolagens convertidas é ${sinal(soma)}: role de novo (precisa somar +6 ou mais).`);
  }
  return p;
};

const passoRaca = {
  id: 'raca',
  titulo: 'Raça',
  subtitulo: 'Sua raça modifica atributos e dá habilidades. Raças raras têm mecânicas mais avançadas.',
  pendencias(d) {
    const r = raca(d);
    if (!r) return ['Escolha uma raça.'];
    const p = [];
    if (r.escolha && Object.keys(d.racaBonus).length !== r.escolha.qtd) p.push(`Escolha ${r.escolha.qtd} atributos para +${r.escolha.valor}.`);
    if (r.treinadas && d.periciasRaca.length !== r.treinadas) p.push(`Escolha ${r.treinadas} perícia(s) treinada(s) da raça.`);
    if (r.bonusPericias && d.racaPericiasBonus.length !== r.bonusPericias.qtd) p.push(`Escolha ${r.bonusPericias.qtd} perícias para +${r.bonusPericias.valor} (Deformidade).`);
    return p;
  },
  render(ctx) {
    const d = ctx.dados;
    const r = raca(d);
    return h('div', null,
      escolhaUnica({
        opcoes: R.RACAS, valor: d.raca,
        onChange: id => { d.raca = id; d.racaBonus = {}; d.periciasRaca = []; d.racaPericiasBonus = []; ctx.mudou(true); },
        render: o => [h('strong', null, o.nome),
          h('small', null, [Object.entries(o.mods || {}).map(([k, v]) => `${siglaAtr(k)} ${sinal(v)}`).join(', '), o.escolha && `+1 em ${o.escolha.qtd} à escolha`].filter(Boolean).join(' · ')),
          h('small', null, o.resumo)],
      }),
      r && h('div', { class: 'detalhe-escolha' },
        h('h3', null, r.nome),
        h('p', null, `Tamanho ${r.tamanho || 'Médio'} · Deslocamento ${r.desl || 9} m`),
        h('ul', null, r.tracos.map(t => h('li', null, t)))),
      r?.escolha && [
        h('h3', { class: 'subtitulo-secao' }, `+${r.escolha.valor} em ${r.escolha.qtd} atributos diferentes`),
        seletor({
          opcoes: ATR.filter(a => !(r.escolha.exceto || []).includes(a.id)).map(a => ({ id: a.id, nome: a.nome })),
          selecionados: Object.keys(d.racaBonus), limite: r.escolha.qtd,
          onChange: ids => { d.racaBonus = Object.fromEntries(ids.map(i => [i, r.escolha.valor])); ctx.mudou(true); },
        }),
      ],
      r?.treinadas && [
        h('h3', { class: 'subtitulo-secao' }, `Perícias treinadas da raça (${r.treinadas})`),
        seletor({
          opcoes: R.PERICIAS.map(p => ({ id: p.id, nome: p.nome, desc: nomeAtr(p.atr) })),
          selecionados: d.periciasRaca, limite: r.treinadas,
          onChange: ids => { d.periciasRaca = ids; ctx.mudou(true); },
        }),
      ],
      r?.bonusPericias && [
        h('h3', { class: 'subtitulo-secao' }, `Deformidade: +${r.bonusPericias.valor} em ${r.bonusPericias.qtd} perícias`),
        seletor({
          opcoes: R.PERICIAS.map(p => ({ id: p.id, nome: p.nome })),
          selecionados: d.racaPericiasBonus, limite: r.bonusPericias.qtd,
          onChange: ids => { d.racaPericiasBonus = ids; ctx.mudou(true); },
        }),
      ]);
  },
};

const passoClasse = {
  id: 'classe',
  titulo: 'Classe',
  subtitulo: 'Define PV, PM, perícias treinadas, proficiências e habilidades de 1º nível.',
  pendencias(d) {
    const c = classe(d);
    if (!c) return ['Escolha uma classe.'];
    const p = [];
    (c.ou || []).forEach((par, i) => { if (!d.classeOu[i]) p.push(`Escolha entre ${par.map(R.nomePericia).join(' ou ')}.`); });
    if (d.periciasClasse.length !== c.qtd) p.push(`Escolha ${c.qtd} perícias da classe (${d.periciasClasse.length}/${c.qtd}).`);
    return p;
  },
  render(ctx) {
    const d = ctx.dados;
    const c = classe(d);
    const fixas = new Set([...(c?.fixas || []), ...Object.values(d.classeOu)]);
    return h('div', null,
      escolhaUnica({
        opcoes: R.CLASSES, valor: d.classe,
        onChange: id => { d.classe = id; d.classeOu = {}; d.periciasClasse = []; ctx.mudou(true); },
        render: o => [h('strong', null, o.nome), h('small', null, `${o.pv} PV (+${o.pvNivel}/nível) · ${o.pm} PM/nível`)],
      }),
      c && h('div', { class: 'detalhe-escolha' },
        h('h3', null, c.nome),
        h('ul', null,
          h('li', null, h('strong', null, 'Pontos de vida: '), `${c.pv} + Constituição (+${c.pvNivel} + Con por nível)`),
          h('li', null, h('strong', null, 'Pontos de mana: '), `${c.pm} por nível`),
          h('li', null, h('strong', null, 'Perícias: '), [...c.fixas.map(R.nomePericia), ...(c.ou || []).map(par => par.map(R.nomePericia).join(' ou '))].join(', '), ` + ${c.qtd} à escolha`),
          h('li', null, h('strong', null, 'Proficiências: '), 'armas simples, armaduras leves; ', c.prof),
          c.magia && h('li', null, h('strong', null, 'Magias: '), c.magia)),
        h('h3', { class: 'subtitulo-secao' }, 'Habilidades de 1º nível'),
        h('ul', null, c.carac.map(t => h('li', null, t)))),
      c && (c.ou || []).map((par, i) => [
        h('h3', { class: 'subtitulo-secao' }, par.map(R.nomePericia).join(' ou ')),
        h('div', { class: 'abas' }, par.map(pid => h('button', {
          type: 'button', class: 'aba' + (d.classeOu[i] === pid ? ' ativa' : ''),
          onClick: () => { d.classeOu[i] = pid; d.periciasClasse = d.periciasClasse.filter(x => x !== pid); ctx.mudou(true); },
        }, R.nomePericia(pid)))),
      ]),
      c && [
        h('h3', { class: 'subtitulo-secao' }, 'Perícias da classe'),
        contadorEscolha('perícia(s)', d.periciasClasse.length, c.qtd),
        seletor({
          opcoes: R.PERICIAS.filter(p => c.de.includes(p.id)).map(p => ({ id: p.id, nome: p.nome, desc: nomeAtr(p.atr) })),
          selecionados: d.periciasClasse, limite: c.qtd, travados: [...fixas],
          onChange: ids => { d.periciasClasse = ids; ctx.mudou(true); },
        }),
        c.autoconfianca && h('label', { class: 'campo-check' },
          h('input', { type: 'checkbox', checked: d.usarCarNaDefesa, onChange: e => { d.usarCarNaDefesa = e.target.checked; ctx.mudou(true); } }),
          ' Usar Carisma em vez de Destreza na Defesa (Autoconfiança)'),
        campo(c.escolhas || 'Anotações da classe', () => d.escolhasClasse, v => { d.escolhasClasse = v; ctx.mudou(); }, { multi: true, placeholder: c.escolhasExemplo || '' }),
      ]);
  },
};

const passoOrigem = {
  id: 'origem',
  titulo: 'Origem e divindade',
  subtitulo: 'O que você fazia antes de ser aventureiro. Escolha dois benefícios da lista da origem (perícias e/ou poderes).',
  pendencias(d) {
    const p = [];
    if (!raca(d)?.semOrigem) {
      if (!origem(d)) p.push('Escolha uma origem.');
      else if (d.beneficios.length !== 2) p.push(`Escolha 2 benefícios da origem (${d.beneficios.length}/2).`);
    }
    const c = classe(d);
    if (c?.devoto === 'obrigatorio' && !d.divindade) p.push(`${c.nome} precisa ser devoto de uma divindade.`);
    if (Array.isArray(c?.devoto) && !c.devoto.includes(d.divindade)) p.push(`${c.nome} deve ser devoto de ${c.devoto.map(id => R.DEUSES.find(x => x.id === id).nome).join(', ')}.`);
    return p;
  },
  render(ctx) {
    const d = ctx.dados;
    const o = origem(d);
    const c = classe(d);
    const jaTreinadas = new Set([...(c?.fixas || []), ...Object.values(d.classeOu), ...d.periciasClasse, ...d.periciasRaca]);
    const deuses = Array.isArray(c?.devoto) ? R.DEUSES.filter(x => c.devoto.includes(x.id)) : R.DEUSES;
    return h('div', null,
      raca(d)?.semOrigem
        ? h('p', { class: 'detalhe-escolha' }, 'Golens são construídos “prontos” e não escolhem origem.')
        : [
          escolhaUnica({
            opcoes: R.ORIGENS, valor: d.origem,
            onChange: id => { d.origem = id; d.beneficios = []; ctx.mudou(true); },
            render: x => [h('strong', null, x.nome), h('small', null, x.pericias.map(R.nomePericia).join(', '))],
          }),
          o && h('div', { class: 'detalhe-escolha' },
            h('h3', null, o.nome),
            h('p', null, h('strong', null, 'Itens: '), o.itens)),
          o && [
            h('h3', { class: 'subtitulo-secao' }, 'Benefícios (escolha 2)'),
            seletor({
              opcoes: [
                ...o.pericias.map(p => ({ id: 'p:' + p, nome: R.nomePericia(p), desc: jaTreinadas.has(p) ? 'Perícia (já treinada por outra escolha)' : 'Perícia', desabilitado: jaTreinadas.has(p) })),
                ...o.poderes.map(p => ({ id: 'd:' + p, nome: p, desc: 'Poder' })),
              ],
              selecionados: d.beneficios, limite: 2,
              onChange: ids => { d.beneficios = ids; ctx.mudou(true); },
            }),
          ],
        ],
      h('h3', { class: 'subtitulo-secao' }, c?.devoto ? 'Divindade (obrigatória para sua classe)' : 'Divindade (opcional)'),
      h('label', { class: 'campo' },
        h('select', { onChange: e => { d.divindade = e.target.value; ctx.mudou(true); } },
          h('option', { value: '' }, 'Nenhuma'),
          deuses.map(x => h('option', { value: x.id, selected: d.divindade === x.id }, x.nome)))),
      d.divindade && campo('Poder concedido e obrigações', () => d.devocao, v => { d.devocao = v; ctx.mudou(); }, { multi: true, placeholder: 'Anote o poder concedido escolhido e as obrigações & restrições da divindade.' }));
  },
};

const passoPericias = {
  id: 'pericias',
  titulo: 'Perícias',
  subtitulo: 'Com Inteligência positiva você treina perícias extras (qualquer uma) igual ao valor de Int. Bônus = ½ nível + atributo + treino (+2).',
  pendencias(d) {
    const der = derivar(d);
    return d.periciasInt.length !== der.qtdInt ? [`Escolha ${der.qtdInt} perícia(s) pela Inteligência (${d.periciasInt.length}/${der.qtdInt}).`] : [];
  },
  render(ctx) {
    const d = ctx.dados;
    const der = derivar(d);
    const outras = new Set([...treinadas({ ...d, periciasInt: [] })]);
    return h('div', null,
      der.qtdInt ? [
        contadorEscolha('perícia(s) de Inteligência', d.periciasInt.length, der.qtdInt),
        seletor({
          opcoes: R.PERICIAS.map(p => ({ id: p.id, nome: p.nome, desc: nomeAtr(p.atr) })),
          selecionados: d.periciasInt, limite: der.qtdInt, travados: [...outras],
          onChange: ids => { d.periciasInt = ids; ctx.mudou(true); },
        }),
      ] : h('p', { class: 'nota-d20' }, 'Sua Inteligência não dá perícias extras.'),
      h('h3', { class: 'subtitulo-secao' }, 'Resultado'),
      h('ul', { class: 'fd-lista t20-lista' }, der.pericias.map(p => h('li', { class: p.prof ? 'prof' : '' },
        h('span', { class: 'fd-prof' }, p.prof ? '●' : '○'),
        h('span', null, p.nome, h('small', null, ` (${siglaAtr(p.atr)})${p.so ? ' · só treinada' : ''}`)),
        h('b', null, p.usavel ? sinal(p.bonus) : '—')))));
  },
};

const passoEquip = {
  id: 'equipamento',
  titulo: 'Equipamento e magias',
  subtitulo: 'Itens da origem, armas, armadura, Tibares e magias.',
  render(ctx) {
    const d = ctx.dados;
    const c = classe(d), o = origem(d);
    const der = derivar(d);
    return h('div', null,
      o && h('div', { class: 'detalhe-escolha' }, h('strong', null, 'Itens da origem: '), o.itens),
      h('p', { class: 'nota-d20' }, 'Todo personagem também começa com mochila, saco de dormir e traje de viajante, além das armas e armadura conforme suas proficiências — confira os detalhes com o mestre.'),
      h('div', { class: 'linha-2' },
        h('label', { class: 'campo' }, h('span', { class: 'campo-rotulo' }, 'Armadura'),
          h('select', { onChange: e => { d.armadura = e.target.value; ctx.mudou(true); } }, R.ARMADURAS.map(a => h('option', { value: a.id, selected: d.armadura === a.id }, a.nome)))),
        h('label', { class: 'campo' }, h('span', { class: 'campo-rotulo' }, 'Escudo'),
          h('select', { onChange: e => { d.escudo = e.target.value; ctx.mudou(true); } }, R.ESCUDOS.map(a => h('option', { value: a.id, selected: d.escudo === a.id }, a.nome))))),
      h('p', { class: 'contador-d20' }, h('strong', null, der.defesa), ' Defesa'),
      h('h3', { class: 'subtitulo-secao' }, 'Armas'),
      listaEditavel(d.armas, [['nome', 'Arma', 'Espada longa'], ['ataque', 'Ataque', 'Luta ' + sinal(der.pericias.find(p => p.id === 'luta').bonus)], ['dano', 'Dano / crítico', `1d8${sinal(der.atr.for)} 19`]], ctx, '+ Adicionar arma'),
      h('div', { class: 'linha-2' },
        h('div', { class: 'campo' },
          campo('Tibares (T$)', () => d.tibares, v => { d.tibares = v || 0; ctx.mudou(); }, { tipo: 'number' }),
          h('button', { type: 'button', class: 'mini', onClick: () => { let t = 0; for (let i = 0; i < 4; i++) t += 1 + Math.floor(Math.random() * 6); d.tibares = t; ctx.mudou(true); } }, '🎲 Rolar 4d6 Tibares')),
        h('div')),
      campo('Outros itens', () => d.itens, v => { d.itens = v; ctx.mudou(); }, { multi: true }),
      c?.conj && [
        h('h3', { class: 'subtitulo-secao' }, 'Magias'),
        h('p', { class: 'nota-d20' }, c.magia),
        campo('Magias conhecidas (1º círculo)', () => d.magias, v => { d.magias = v; ctx.mudou(); }, { multi: true }),
      ],
      campo('Poderes e anotações', () => d.anotacoes, v => { d.anotacoes = v; ctx.mudou(); }, { multi: true }));
  },
};

const passos = [passoConceito, passoAtr, passoRaca, passoClasse, passoOrigem, passoPericias, passoEquip];

// ---------------------------------------------------------------- resumo e ficha

const linha = d => [raca(d)?.nome, classe(d) && `${classe(d).nome} 1`].filter(Boolean).join(' · ');
const atrModelo = der => ATR.map(a => ({ sigla: a.sigla, principal: sinal(der.atr[a.id]) }));

function resumo(ctx) {
  const d = ctx.dados;
  const der = derivar(d);
  return resumoD20({
    nome: d.nome, linha: linha(d), atributos: atrModelo(der),
    destaques: [
      { rot: 'PV', val: der.pv || '—' }, { rot: 'PM', val: der.pm || '—' },
      { rot: 'Defesa', val: der.defesa }, { rot: 'Desloc.', val: `${der.desl} m` },
    ],
    extras: [
      der.pericias.some(p => p.prof) && 'Treinadas: ' + der.pericias.filter(p => p.prof).map(p => p.nome).join(', '),
      origem(d) && `Origem: ${origem(d).nome}`,
      d.divindade && `Devoto de ${R.DEUSES.find(x => x.id === d.divindade)?.nome}`,
    ],
  });
}

function ficha(ctx) {
  const d = ctx.dados;
  const der = derivar(d);
  const c = classe(d), r = raca(d), o = origem(d);
  const poderes = d.beneficios.filter(b => b.startsWith('d:')).map(b => b.slice(2));
  const deus = R.DEUSES.find(x => x.id === d.divindade)?.nome;
  return fichaD20({
    pendencias: passos.flatMap(p => (p.pendencias ? p.pendencias(d) : [])),
    sistema: 'Tormenta20',
    nome: d.nome, linha: linha(d),
    meta: [o?.nome, deus && `Devoto de ${deus}`, der.tamanho, d.jogador && `Jogador(a): ${d.jogador}`],
    atributos: atrModelo(der),
    destaques: [
      { rot: 'Defesa', val: der.defesa }, { rot: 'Deslocamento', val: `${der.desl} m` }, { rot: 'Tamanho', val: der.tamanho },
      { rot: 'Iniciativa', val: sinal(der.pericias.find(p => p.id === 'iniciativa').bonus) },
      { rot: 'Percepção', val: sinal(der.pericias.find(p => p.id === 'percepcao').bonus) },
    ],
    vida: der.pv ? { rot: 'Pontos de vida', max: der.pv, marcados: d.jogo.pvPerdidos, onChange: v => { d.jogo.pvPerdidos = v; ctx.mudou(); }, dica: 'Marque o dano sofrido.' } : null,
    outros: der.pm ? [{ rot: 'Pontos de mana', max: der.pm, marcados: d.jogo.pmGastos, onChange: v => { d.jogo.pmGastos = v; ctx.mudou(); }, dica: 'Marque os PM gastos.' }] : [],
    pericias: der.pericias.map(p => ({ nome: p.nome, atr: siglaAtr(p.atr), prof: p.prof, bonus: p.bonus, texto: p.usavel ? sinal(p.bonus) : '—' })),
    blocos: [
      c && blocoTexto(`${c.nome}: habilidades`, h('ul', null, c.carac.map(t => h('li', null, t))), d.escolhasClasse && h('p', { class: 'fd-texto' }, d.escolhasClasse), h('p', { class: 'fd-nota' }, 'Proficiências: armas simples, armaduras leves; ', c.prof)),
      r && blocoTexto(`${r.nome}: habilidades`, h('ul', null, r.tracos.map(t => h('li', null, t)))),
      (poderes.length || d.anotacoes) && blocoTexto('Poderes', poderes.length && h('ul', null, poderes.map(p => h('li', null, p))), d.anotacoes && h('p', { class: 'fd-texto' }, d.anotacoes)),
      deus && blocoTexto(`Devoção: ${deus}`, d.devocao && h('p', { class: 'fd-texto' }, d.devocao)),
      c?.conj && blocoTexto('Magias', h('p', { class: 'fd-nota' }, c.magia), d.magias && h('p', { class: 'fd-texto' }, d.magias)),
      d.armas.length ? blocoTexto('Armas', h('table', { class: 'fd-tabela' },
        h('thead', null, h('tr', null, h('th', null, 'Arma'), h('th', null, 'Ataque'), h('th', null, 'Dano'))),
        h('tbody', null, d.armas.map(a => h('tr', null, h('td', null, a.nome), h('td', null, a.ataque), h('td', null, a.dano)))))) : null,
      blocoTexto('Equipamento',
        h('p', null, R.ARMADURAS.find(a => a.id === d.armadura)?.nome, ' · ', R.ESCUDOS.find(e => e.id === d.escudo)?.nome),
        o && h('p', null, 'Da origem: ', o.itens),
        d.itens && h('p', { class: 'fd-texto' }, d.itens),
        h('p', null, h('strong', null, `T$ ${d.tibares || 0}`))),
      (d.conceito || d.aparencia || d.historia) && blocoTexto('Conceito e história',
        d.conceito && h('p', null, h('em', null, d.conceito)), d.aparencia && h('p', { class: 'fd-texto' }, d.aparencia), d.historia && h('p', { class: 'fd-texto' }, d.historia)),
    ],
  });
}

function novo() {
  return {
    versao: 1,
    nome: '', jogador: '', conceito: '', idade: '', genero: '', aparencia: '', historia: '',
    atributos: atributosIniciais({ pontos: R.PONTOS, manual: CFG_ATR.manual, metodoPadrao: 'pontos' }),
    raca: '', racaBonus: {}, periciasRaca: [], racaPericiasBonus: [],
    classe: '', classeOu: {}, periciasClasse: [], escolhasClasse: '', usarCarNaDefesa: false,
    origem: '', beneficios: [], divindade: '', devocao: '',
    periciasInt: [],
    armadura: 'nenhuma', escudo: 'nenhum', armas: [], tibares: 0, itens: '', magias: '', anotacoes: '',
    jogo: { pvPerdidos: 0, pmGastos: 0 },
  };
}

const CENA = `
  <div class="t20-ceu"></div>
  <div class="t20-nuvens"><span></span><span></span><span></span></div>
  <div class="t20-chuva"></div>
  <svg class="t20-raio" viewBox="0 0 100 300" aria-hidden="true"><path d="M60 0 L30 130 L55 130 L25 300 L80 110 L52 110 L75 0Z" fill="#ffd0d0"/></svg>
  <div class="t20-flash"></div>`;

export default {
  tema: 'theme.css',
  temaClasse: 'tema-t20',
  textoNovo: 'Novo herói',
  intro: raiz => introGenerica(raiz, {
    classe: 'intro-t20', cena: CENA, titulo: 'Tormenta20',
    frases: ['Nuvens rubras se aproximam…', 'Consultando os deuses de Arton…', 'Contando Tibares…', 'A Tormenta está chegando…'],
    botao: 'Enfrentar a Tormenta', duracao: 3200, saida: 1300,
  }),
  lobby: () => h('header', { class: 'lobby-sistema' },
    h('span', { class: 'lobby-pre' }, 'Edição Jogo do Ano · Arton'),
    h('h1', null, 'Tormenta20'),
    h('p', null, 'Atributos por pontos (10) ou rolagem convertida, 17 raças, 14 classes, 35 origens com benefícios, devoção aos 20 deuses e perícias treinadas — PV, PM e Defesa calculados no 1º nível.')),
  novo,
  migrar: d => ({ ...novo(), ...d, jogo: { ...novo().jogo, ...d.jogo } }),
  titulo: d => d.nome,
  subtitulo: linha,
  passos, resumo, ficha,
};
