// Yggdrasill — sagas nórdicas. Criação de personagem inicial.
import { campo, stepper, uid } from '../../js/core/ui.js';
import { introGenerica } from '../../js/core/intro.js';
import { h, seletor, contadorEscolha, blocoTexto, fichaD20, resumoD20, listaEditavel } from '../_d20/comum.js';
import * as R from './regras.js';

const soma = obj => Object.values(obj).reduce((s, v) => s + v, 0);
const competencias = d => [...R.COMPETENCIAS, ...d.competenciasExtras];
const nomeComp = (d, id) => competencias(d).find(c => c.id === id)?.nome || id;

function derivar(d) {
  const c = d.carac;
  const grupo = g => R.CARACTERISTICAS.filter(x => x.grupo === g).reduce((s, x) => s + c[x.id], 0);
  const aj = d.ajustes;
  const custoComp = Object.entries(d.competencias).reduce((s, [id, n]) => s + n * (d.privilegiadas.includes(id) ? 1 : 2), 0);
  const custoProezas = d.proezas.reduce((s, p) => s + (Number(p.nivel) || 0) * 3, 0);
  const maiorComp = Math.max(0, ...Object.values(d.competencias));
  return {
    pv: grupo('corpo') * 3 + grupo('mente') * 2 + grupo('alma') + aj.pv,
    reacao: c.int + c.per + c.ins + aj.reacao,
    defFisica: c.agi + c.vig + c.ins + aj.defFisica,
    defMental: c.ten + c.int + c.ins + aj.defMental,
    movimento: c.agi + c.vig + aj.movimento,
    carga: c.for * 2 + c.vig + aj.carga,
    furia: c.vig + c.ins + c.ten + aj.furia,
    renome: maiorComp,
    grupos: { corpo: grupo('corpo'), mente: grupo('mente'), alma: grupo('alma') },
    custoComp, custoProezas,
  };
}

// ---------------------------------------------------------------- passos

const passoConceito = {
  id: 'conceito',
  titulo: 'Conceito',
  subtitulo: 'Quem é você nas terras de Scandia? Nome, reino de origem e a saga que você quer viver.',
  pendencias: d => [!d.nome.trim() && 'Dê um nome ao personagem.'].filter(Boolean),
  render(ctx) {
    const d = ctx.dados;
    const set = k => v => { d[k] = v; ctx.mudou(); };
    return h('div', null,
      h('div', { class: 'linha-2' },
        campo('Nome', () => d.nome, set('nome'), { placeholder: 'Ivar, filho de Sigurd' }),
        campo('Jogador(a)', () => d.jogador, set('jogador'))),
      h('div', { class: 'linha-2' },
        h('label', { class: 'campo' }, h('span', { class: 'campo-rotulo' }, 'Reino'),
          h('select', { onChange: e => { d.reino = e.target.value; ctx.mudou(); } },
            h('option', { value: '' }, '—'), R.REINOS.map(r => h('option', { value: r, selected: d.reino === r }, r)))),
        campo('Idade', () => d.idade, set('idade'))),
      campo('Profissão', () => d.profissao, set('profissao'), { placeholder: 'Escaldo, ferreiro, caçador…' }),
      campo('Aparência', () => d.aparencia, set('aparencia'), { multi: true }),
      campo('Saga e história', () => d.historia, set('historia'), { multi: true }));
  },
};

const passoRunas = {
  id: 'runas',
  titulo: 'Runas do destino',
  subtitulo: 'Antes de tudo, as Nornas tecem seu destino: role 1d8 para cada ætt. Duas runas ficam positivas e uma negativa, ou o contrário.',
  pendencias(d) {
    if (d.runas.some(r => r.indice == null)) return ['Lance as três runas.'];
    const pos = d.runas.filter(r => r.aspecto === '+').length;
    if (d.runas.some(r => !r.aspecto)) return ['Defina o aspecto (positivo/negativo) de cada runa.'];
    if (pos === 0 || pos === 3) return ['Combine aspectos: 2 positivas e 1 negativa, ou 1 positiva e 2 negativas.'];
    const errada = d.runas.find((r, i) => R.AETTIR[i].runas[r.indice][3] === 'positivo' && r.aspecto === '-');
    if (errada) return [`${R.AETTIR[d.runas.indexOf(errada)].runas[errada.indice][0]} só tem aspecto positivo.`];
    return [];
  },
  render(ctx) {
    const d = ctx.dados;
    return h('div', null,
      h('button', {
        type: 'button', class: 'btn', onClick: () => {
          d.runas = d.runas.map((r, i) => {
            const indice = Math.floor(Math.random() * 8);
            return { indice, aspecto: R.AETTIR[i].runas[indice][3] === 'positivo' ? '+' : '' };
          });
          ctx.mudou(true);
        },
      }, '🎲 Lançar as runas (3d8)'),
      h('div', { class: 'runas' }, R.AETTIR.map((ae, i) => {
        const r = d.runas[i];
        const runa = r.indice != null ? ae.runas[r.indice] : null;
        return h('div', { class: 'runa-cartao' + (runa ? ' lancada' : '') },
          h('span', { class: 'runa-aett' }, ae.nome),
          h('span', { class: 'runa-glifo', 'aria-hidden': 'true' }, runa ? runa[1] : '?'),
          h('select', {
            'aria-label': `Runa da ${ae.nome}`,
            onChange: e => {
              const v = e.target.value;
              d.runas[i] = { indice: v === '' ? null : Number(v), aspecto: v !== '' && ae.runas[Number(v)][3] === 'positivo' ? '+' : '' };
              ctx.mudou(true);
            },
          },
            h('option', { value: '' }, '— escolha —'),
            ae.runas.map((x, j) => h('option', { value: j, selected: r.indice === j }, `${j + 1}. ${x[0]}`))),
          runa && h('small', null, runa[2], runa[3] ? ' (apenas positivo)' : ''),
          runa && h('div', { class: 'abas' },
            h('button', { type: 'button', class: 'aba' + (r.aspecto === '+' ? ' ativa' : ''), onClick: () => { r.aspecto = '+'; ctx.mudou(true); } }, 'Positivo'),
            h('button', { type: 'button', class: 'aba' + (r.aspecto === '-' ? ' ativa' : ''), disabled: runa[3] === 'positivo', onClick: () => { r.aspecto = '-'; ctx.mudou(true); } }, 'Negativo')));
      })),
      campo('Como o destino marcou sua vida', () => d.notasRunas, v => { d.notasRunas = v; ctx.mudou(); }, { multi: true, placeholder: 'Ex.: Fehu negativa — nasceu pobre; Algiz — protegido contra maldições…' }));
  },
};

const passoArquetipo = {
  id: 'arquetipo',
  titulo: 'Arquétipo',
  subtitulo: `Um papel tradicional da sociedade nórdica. Ele define ${R.PRIVILEGIADAS} competências privilegiadas (custam metade) e um dom obrigatório.`,
  pendencias(d) {
    const p = [];
    if (!d.arquetipo) p.push('Escolha um arquétipo (ou “Sem arquétipo”).');
    else if (d.arquetipo !== 'nenhum' && d.privilegiadas.length !== R.PRIVILEGIADAS) p.push(`Marque ${R.PRIVILEGIADAS} competências privilegiadas (${d.privilegiadas.length}/${R.PRIVILEGIADAS}).`);
    return p;
  },
  render(ctx) {
    const d = ctx.dados;
    const preset = R.PRESETS[d.arquetipo];
    return h('div', null,
      R.ARQUETIPOS.map(g => [
        h('h3', { class: 'subtitulo-secao' }, g.grupo),
        h('div', { class: 'abas' }, g.itens.map(a => h('button', {
          type: 'button', class: 'aba' + (d.arquetipo === a ? ' ativa' : ''),
          onClick: () => {
            d.arquetipo = a;
            const pr = R.PRESETS[a];
            d.privilegiadas = pr ? [...pr.privilegiadas] : [];
            if (pr?.dom && !d.dons.some(x => x.nome === pr.dom)) d.dons.unshift({ id: uid(), nome: pr.dom, obrigatorio: true });
            ctx.mudou(true);
          },
        }, a))),
      ]),
      h('div', { class: 'abas', style: 'margin-top:12px' },
        h('button', { type: 'button', class: 'aba' + (d.arquetipo === 'nenhum' ? ' ativa' : ''), onClick: () => { d.arquetipo = 'nenhum'; d.privilegiadas = []; ctx.mudou(true); } }, 'Sem arquétipo (todas custam 2)')),
      d.arquetipo && d.arquetipo !== 'nenhum' && [
        h('div', { class: 'detalhe-escolha' },
          h('h3', null, d.arquetipo),
          preset
            ? h('p', null, `Privilegiadas: Atletismo, Esquiva, Intimidação, Sobrevivência e uma competência de combate à sua escolha. Dom obrigatório: ${preset.dom}. Fúria: ${preset.furia}.`)
            : h('p', null, 'Marque abaixo as 5 competências privilegiadas e anote o dom obrigatório deste arquétipo conforme o livro.')),
        contadorEscolha('competência(s) privilegiada(s)', d.privilegiadas.length, R.PRIVILEGIADAS),
        seletor({
          opcoes: competencias(d).map(c => ({ id: c.id, nome: c.nome, desc: c.tipo === 'combate' ? 'Combate' : c.tipo === 'magia' ? 'Magia' : '' })),
          selecionados: d.privilegiadas, limite: R.PRIVILEGIADAS,
          onChange: ids => { d.privilegiadas = ids; ctx.mudou(true); },
        }),
      ]);
  },
};

const passoCarac = {
  id: 'caracteristicas',
  titulo: 'Características',
  subtitulo: `Nove características em três grupos. Todas começam em ${R.MIN_CARAC}; a soma total deve ser ${R.TOTAL_CARAC}, e nenhuma passa de ${R.MAX_CARAC} na criação. Nos testes você rola tantos d10 quanto a característica e soma os dois maiores.`,
  pendencias(d) {
    const resto = R.TOTAL_CARAC - soma(d.carac);
    return [resto > 0 && `Ainda faltam ${resto} ponto(s) de característica.`, resto < 0 && `Você passou ${-resto} ponto(s).`].filter(Boolean);
  },
  render(ctx) {
    const d = ctx.dados;
    const resto = R.TOTAL_CARAC - soma(d.carac);
    const der = derivar(d);
    return h('div', null,
      h('div', { class: `contador-d20 ${resto === 0 ? 'zerado' : resto < 0 ? 'estourado' : ''}` }, h('strong', null, resto), ` ponto(s) restante(s) · soma ${soma(d.carac)} de ${R.TOTAL_CARAC}`),
      h('div', { class: 'grupos-ygg' }, R.GRUPOS.map(g => h('section', { class: 'grupo-ygg' },
        h('h3', null, g.nome, h('small', null, ` · soma ${der.grupos[g.id]} (×${g.mult} nos PV)`)),
        R.CARACTERISTICAS.filter(c => c.grupo === g.id).map(c => h('div', { class: 'linha-atr' },
          h('div', { class: 'linha-atr-nome' }, h('strong', null, c.nome)),
          stepper(d.carac[c.id], { rotulo: c.nome, min: R.MIN_CARAC, max: R.MAX_CARAC, podeSubir: resto > 0, onChange: v => { d.carac[c.id] = v; ctx.mudou(true); } }),
          h('span'), h('span', { class: 'linha-atr-total' }, `${d.carac[c.id]}d10`)))))),
      h('div', { class: 'derivados-ygg' },
        [['Pontos de Vida', der.pv, 'Corpo×3 + Mente×2 + Alma'], ['Reação', der.reacao, 'Int + Per + Ins'], ['Defesa Física', der.defFisica, 'Agi + Vig + Ins'],
          ['Defesa Mental', der.defMental, 'Ten + Int + Ins'], ['Movimento', der.movimento, 'Agi + Vig'], ['Carga', der.carga, 'For×2 + Vig'], ['Fúria', `${der.furia}d10`, 'Vig + Ins + Ten']]
          .map(([rot, val, f]) => h('div', null, h('b', null, val), h('span', null, rot), h('small', null, f)))));
  },
};

const passoComp = {
  id: 'competencias',
  titulo: 'Competências',
  subtitulo: `${R.PONTOS_COMPETENCIA} pontos. Privilegiadas custam 1 por nível; as demais, 2. Máximo ${R.MAX_COMPETENCIA} na criação (nível “competente”). Testes: dados da característica + nível da competência.`,
  pendencias(d) {
    const der = derivar(d);
    const resto = R.PONTOS_COMPETENCIA - der.custoComp;
    return [resto > 0 && `Ainda faltam ${resto} ponto(s) de competência.`, resto < 0 && `Você gastou ${-resto} ponto(s) a mais.`].filter(Boolean);
  },
  render(ctx) {
    const d = ctx.dados;
    const der = derivar(d);
    const resto = R.PONTOS_COMPETENCIA - der.custoComp;
    const nova = { nome: '', tipo: 'geral' };
    const linha = c => {
      const priv = d.privilegiadas.includes(c.id);
      const n = d.competencias[c.id] || 0;
      const custo = priv ? 1 : 2;
      return h('div', { class: 'pl35' + (priv ? ' de-classe' : '') + (n ? ' ativa' : '') },
        h('span', { class: 'pl35-nome' }, h('strong', null, c.nome), h('small', null, priv ? ' · privilegiada (1/nível)' : ' · 2/nível')),
        stepper(n, { rotulo: c.nome, max: R.MAX_COMPETENCIA, podeSubir: resto >= custo, onChange: v => { if (v) d.competencias[c.id] = v; else delete d.competencias[c.id]; ctx.mudou(true); } }),
        h('span', { class: 'pl35-grad' }, n * custo), h('b', { class: 'pl35-total' }, n));
    };
    return h('div', null,
      h('div', { class: `contador-d20 ${resto === 0 ? 'zerado' : resto < 0 ? 'estourado' : ''}` }, h('strong', null, resto), ` de ${R.PONTOS_COMPETENCIA} pontos restantes`),
      [['geral', 'Gerais'], ['combate', 'Combate'], ['magia', 'Magia']].map(([tipo, rot]) => [
        h('h3', { class: 'subtitulo-secao' }, rot),
        h('div', { class: 'tabela-pericias35' },
          h('div', { class: 'pl35 cabeca' }, h('span', null, 'Competência'), h('span', null, 'Nível'), h('span', null, 'Custo'), h('span', null, 'Nível')),
          competencias(d).filter(c => c.tipo === tipo).map(linha)),
      ]),
      h('form', {
        class: 'form-inline', onSubmit: e => {
          e.preventDefault();
          if (!nova.nome.trim()) return;
          d.competenciasExtras.push({ id: 'extra-' + uid(), nome: nova.nome.trim(), tipo: nova.tipo });
          ctx.mudou(true);
        },
      },
        h('p', { class: 'nota-d20' }, 'A lista acima é uma sugestão. Falta alguma competência do seu livro? Adicione aqui:'),
        h('div', { class: 'linha-2' },
          campo('Nome da competência', () => nova.nome, v => { nova.nome = v; }),
          h('label', { class: 'campo' }, h('span', { class: 'campo-rotulo' }, 'Tipo'),
            h('select', { onChange: e => { nova.tipo = e.target.value; } }, [['geral', 'Geral'], ['combate', 'Combate'], ['magia', 'Magia']].map(([v, r]) => h('option', { value: v }, r))))),
        h('button', { type: 'submit', class: 'btn' }, '+ Adicionar competência')));
  },
};

const passoDons = {
  id: 'dons',
  titulo: 'Dons e fraquezas',
  subtitulo: 'Você começa com um dom gratuito (mais o obrigatório do arquétipo). Cada dom extra exige uma fraqueza. Um dom dá um dado a mais nos testes em que se aplica; a fraqueza, uma vez por sessão, obriga a ficar com o maior e o menor dado.',
  pendencias(d) {
    const livres = d.dons.filter(x => !x.obrigatorio).length;
    const fraquezas = d.fraquezas.length;
    if (livres < 1) return ['Escolha seu dom gratuito.'];
    if (livres - 1 > fraquezas) return [`Cada dom além do gratuito precisa de uma fraqueza (${livres - 1} dom(ns) extra, ${fraquezas} fraqueza(s)).`];
    return [];
  },
  render(ctx) {
    const d = ctx.dados;
    return h('div', null,
      h('h3', { class: 'subtitulo-secao' }, 'Dons'),
      listaEditavel(d.dons, [['nome', 'Dom', 'Corpo de Ferro'], ['efeito', 'Quando se aplica', '+1 dado ao resistir a golpes']], ctx, '+ Adicionar dom'),
      d.dons.some(x => x.obrigatorio) && h('p', { class: 'nota-d20' }, 'O dom do arquétipo é obrigatório e não conta como o gratuito.'),
      h('h3', { class: 'subtitulo-secao' }, 'Fraquezas'),
      listaEditavel(d.fraquezas, [['nome', 'Fraqueza', 'Frio'], ['efeito', 'Quando atrapalha', 'Inepto em sedução e simpatia']], ctx, '+ Adicionar fraqueza'));
  },
};

const passoProezas = {
  id: 'proezas',
  titulo: 'Proezas e magia',
  subtitulo: `${R.PONTOS_PROEZAS} pontos para proezas de combate (ou feitiços, para iniciados). Cada proeza custa nível × 3.`,
  pendencias(d) {
    const der = derivar(d);
    return der.custoProezas > R.PONTOS_PROEZAS ? [`Proezas custam ${der.custoProezas} pontos (máximo ${R.PONTOS_PROEZAS}).`] : [];
  },
  render(ctx) {
    const d = ctx.dados;
    const der = derivar(d);
    const resto = R.PONTOS_PROEZAS - der.custoProezas;
    return h('div', null,
      h('div', { class: `contador-d20 ${resto === 0 ? 'zerado' : resto < 0 ? 'estourado' : ''}` }, h('strong', null, resto), ` de ${R.PONTOS_PROEZAS} pontos restantes`),
      h('div', { class: 'lista-editavel' },
        d.proezas.map((p, i) => h('div', { class: 'item-editavel' },
          h('label', { class: 'campo' }, h('span', { class: 'campo-rotulo' }, 'Proeza / feitiço'),
            h('input', { value: p.nome, placeholder: 'Salto do Lince', onInput: e => { p.nome = e.target.value; ctx.mudou(); } })),
          h('label', { class: 'campo' }, h('span', { class: 'campo-rotulo' }, 'Tipo'),
            h('select', { onChange: e => { p.tipo = e.target.value; ctx.mudou(); } }, R.TIPOS_PROEZA.map(t => h('option', { value: t, selected: p.tipo === t }, t)))),
          h('label', { class: 'campo' }, h('span', { class: 'campo-rotulo' }, `Nível (custo ${(Number(p.nivel) || 0) * 3})`),
            h('select', { onChange: e => { p.nivel = Number(e.target.value); ctx.mudou(true); } }, [1, 2, 3, 4].map(n => h('option', { value: n, selected: Number(p.nivel) === n }, n)))),
          h('button', { type: 'button', class: 'mini perigo', 'aria-label': 'Remover', onClick: () => { d.proezas.splice(i, 1); ctx.mudou(true); } }, '✕'))),
        h('button', { type: 'button', class: 'btn', disabled: resto < 3, onClick: () => { d.proezas.push({ nome: '', tipo: 'Ataque', nivel: 1 }); ctx.mudou(true); } }, '+ Adicionar proeza')),
      h('p', { class: 'nota-d20' }, 'Exemplos de 1º nível para um berserker: Salto do Lince (defesa), Uivo Sanguinário e Rápido como o Raio (utilidade), Investida Impetuosa (ataque).'));
  },
};

const passoEquip = {
  id: 'equipamento',
  titulo: 'Equipamento',
  subtitulo: 'Armas, proteção e prata. A riqueza inicial é d10 × d10 moedas de prata.',
  render(ctx) {
    const d = ctx.dados;
    const der = derivar(d);
    const aj = d.ajustes;
    return h('div', null,
      h('h3', { class: 'subtitulo-secao' }, 'Armas'),
      listaEditavel(d.armas, [['nome', 'Arma', 'Machado dinamarquês'], ['dano', 'Dano', ''], ['notas', 'Notas', 'Duas mãos']], ctx, '+ Adicionar arma'),
      h('div', { class: 'linha-2' },
        campo('Armadura e escudo', () => d.armadura, v => { d.armadura = v; ctx.mudou(); }, { placeholder: 'Cota de malha, escudo redondo' }),
        h('div', { class: 'campo' },
          campo('Prata', () => d.prata, v => { d.prata = v || 0; ctx.mudou(); }, { tipo: 'number' }),
          h('button', { type: 'button', class: 'mini', onClick: () => { d.prata = (1 + Math.floor(Math.random() * 10)) * (1 + Math.floor(Math.random() * 10)); ctx.mudou(true); } }, '🎲 Rolar d10 × d10'))),
      campo('Outros itens', () => d.itens, v => { d.itens = v; ctx.mudou(); }, { multi: true }),
      h('h3', { class: 'subtitulo-secao' }, 'Ajustes de dons, arquétipo e equipamento'),
      h('p', { class: 'nota-d20' }, 'Alguns dons e arquétipos alteram os valores secundários. Ajuste aqui conforme o livro.'),
      h('div', { class: 'ajustes-ygg' }, [['pv', 'Pontos de Vida', der.pv], ['reacao', 'Reação', der.reacao], ['defFisica', 'Defesa Física', der.defFisica], ['defMental', 'Defesa Mental', der.defMental], ['movimento', 'Movimento', der.movimento], ['carga', 'Carga', der.carga], ['furia', 'Fúria (dados)', der.furia]]
        .map(([k, rot, total]) => h('div', { class: 'linha-atr' },
          h('div', { class: 'linha-atr-nome' }, h('strong', null, rot)),
          stepper(aj[k], { rotulo: rot, min: -10, max: 20, onChange: v => { aj[k] = v; ctx.mudou(true); } }),
          h('span'), h('span', { class: 'linha-atr-total' }, total)))));
  },
};

const passos = [passoConceito, passoRunas, passoArquetipo, passoCarac, passoComp, passoDons, passoProezas, passoEquip];

// ---------------------------------------------------------------- resumo e ficha

const linha = d => [d.arquetipo && d.arquetipo !== 'nenhum' ? d.arquetipo : null, d.profissao, d.reino].filter(Boolean).join(' · ');
const atrModelo = d => R.CARACTERISTICAS.map(c => ({ sigla: c.nome.slice(0, 3).toUpperCase(), principal: d.carac[c.id] }));
const runaTexto = (d, i) => {
  const r = d.runas[i];
  if (r.indice == null) return null;
  const x = R.AETTIR[i].runas[r.indice];
  return `${x[1]} ${x[0]}${r.aspecto ? ` (${r.aspecto === '+' ? 'positiva' : 'negativa'})` : ''}`;
};

function resumo(ctx) {
  const d = ctx.dados;
  const der = derivar(d);
  return resumoD20({
    nome: d.nome, linha: linha(d), atributos: atrModelo(d),
    destaques: [
      { rot: 'PV', val: der.pv }, { rot: 'Reação', val: der.reacao },
      { rot: 'Def. Física', val: der.defFisica }, { rot: 'Def. Mental', val: der.defMental },
      { rot: 'Movimento', val: der.movimento }, { rot: 'Fúria', val: `${der.furia}d10` },
    ],
    extras: [
      d.runas.some(r => r.indice != null) && 'Runas: ' + [0, 1, 2].map(i => runaTexto(d, i)).filter(Boolean).join(' · '),
      Object.keys(d.competencias).length && `Competências: ${der.custoComp}/${R.PONTOS_COMPETENCIA} pontos`,
    ],
  });
}

function ficha(ctx) {
  const d = ctx.dados;
  const der = derivar(d);
  const comps = Object.entries(d.competencias).sort((a, b) => b[1] - a[1]);
  return fichaD20({
    pendencias: passos.flatMap(p => (p.pendencias ? p.pendencias(d) : [])),
    sistema: 'Yggdrasill',
    nome: d.nome, linha: linha(d),
    meta: [d.idade && `${d.idade}`, d.jogador && `Jogador(a): ${d.jogador}`, `Renome ${der.renome}`],
    atributos: atrModelo(d).map((a, i) => ({ ...a, secundario: R.GRUPOS.find(g => g.id === R.CARACTERISTICAS[i].grupo).nome })),
    destaques: [
      { rot: 'Reação', val: der.reacao }, { rot: 'Defesa Física', val: der.defFisica }, { rot: 'Defesa Mental', val: der.defMental },
      { rot: 'Movimento', val: der.movimento }, { rot: 'Carga', val: der.carga }, { rot: 'Renome', val: der.renome },
    ],
    vida: { rot: 'Pontos de vida', max: der.pv, marcados: d.jogo.pvPerdidos, onChange: v => { d.jogo.pvPerdidos = v; ctx.mudou(); }, dica: 'Marque o dano sofrido.' },
    outros: [{ rot: 'Fúria (d10)', max: der.furia, marcados: d.jogo.furiaGasta, onChange: v => { d.jogo.furiaGasta = v; ctx.mudou(); }, dica: 'Marque os dados de Fúria gastos.' }],
    pericias: comps.map(([id, n]) => ({ nome: nomeComp(d, id), prof: true, texto: String(n), dupla: d.privilegiadas.includes(id) })),
    rotuloPericias: 'Competências (◉ privilegiada)',
    blocos: [
      blocoTexto('Runas do destino', h('ul', null, [0, 1, 2].map(i => h('li', null, `${R.AETTIR[i].nome}: `, runaTexto(d, i) || '—'))), d.notasRunas && h('p', { class: 'fd-texto' }, d.notasRunas)),
      (d.dons.length || d.fraquezas.length) && blocoTexto('Dons e fraquezas',
        h('ul', null, d.dons.map(x => h('li', null, h('strong', null, x.nome || 'Dom'), x.efeito && ` — ${x.efeito}`, x.obrigatorio ? ' (arquétipo)' : ''))),
        d.fraquezas.length ? h('ul', null, d.fraquezas.map(x => h('li', null, h('strong', null, x.nome || 'Fraqueza'), x.efeito && ` — ${x.efeito}`))) : null),
      d.proezas.length && blocoTexto('Proezas e feitiços', h('ul', null, d.proezas.map(p => h('li', null, h('strong', null, p.nome || 'Proeza'), ` — ${p.tipo}, nível ${p.nivel}`)))),
      d.armas.length ? blocoTexto('Armas', h('table', { class: 'fd-tabela' },
        h('thead', null, h('tr', null, h('th', null, 'Arma'), h('th', null, 'Dano'), h('th', null, 'Notas'))),
        h('tbody', null, d.armas.map(a => h('tr', null, h('td', null, a.nome), h('td', null, a.dano), h('td', null, a.notas)))))) : null,
      blocoTexto('Equipamento', d.armadura && h('p', null, d.armadura), d.itens && h('p', { class: 'fd-texto' }, d.itens), h('p', null, h('strong', null, d.prata || 0), ' moedas de prata')),
      (d.aparencia || d.historia) && blocoTexto('Saga', d.aparencia && h('p', { class: 'fd-texto' }, d.aparencia), d.historia && h('p', { class: 'fd-texto' }, d.historia)),
    ],
  });
}

function novo() {
  return {
    versao: 1,
    nome: '', jogador: '', reino: '', idade: '', profissao: '', aparencia: '', historia: '',
    runas: [{ indice: null, aspecto: '' }, { indice: null, aspecto: '' }, { indice: null, aspecto: '' }], notasRunas: '',
    arquetipo: '', privilegiadas: [],
    carac: Object.fromEntries(R.CARACTERISTICAS.map(c => [c.id, 1])),
    competencias: {}, competenciasExtras: [],
    dons: [], fraquezas: [], proezas: [],
    armas: [], armadura: '', prata: 0, itens: '',
    ajustes: { pv: 0, reacao: 0, defFisica: 0, defMental: 0, movimento: 0, carga: 0, furia: 0 },
    jogo: { pvPerdidos: 0, furiaGasta: 0 },
  };
}

const CENA = `
  <div class="ygg-ceu"></div>
  <div class="ygg-aurora"><span></span><span></span></div>
  <div class="ygg-neve"></div>
  <div class="ygg-montanhas"></div>
  <div class="ygg-pedras">
    <div class="ygg-pedra"><span>ᚠ</span></div>
    <div class="ygg-pedra"><span>ᛉ</span></div>
    <div class="ygg-pedra"><span>ᛖ</span></div>
  </div>`;

export default {
  tema: 'theme.css',
  temaClasse: 'tema-ygg',
  textoNovo: 'Nova saga',
  intro: raiz => introGenerica(raiz, {
    classe: 'intro-ygg', cena: CENA, titulo: 'Yggdrasill',
    frases: ['As Nornas tecem o destino…', 'Lançando as runas…', 'Afiando o machado…', 'Os corvos de Odin observam…'],
    botao: 'Aceitar o destino', duracao: 3400, saida: 1500,
  }),
  lobby: () => h('header', { class: 'lobby-sistema' },
    h('span', { class: 'lobby-pre' }, 'Sagas épicas dos nórdicos'),
    h('h1', null, 'Yggdrasill'),
    h('p', null, 'Runas do destino, arquétipos da sociedade nórdica, nove características (Corpo, Mente e Alma), competências privilegiadas, dons e fraquezas e proezas de combate. Os valores secundários são calculados sozinhos.')),
  novo,
  migrar: d => ({ ...novo(), ...d, ajustes: { ...novo().ajustes, ...d.ajustes }, jogo: { ...novo().jogo, ...d.jogo } }),
  titulo: d => d.nome,
  subtitulo: linha,
  passos, resumo, ficha,
};
