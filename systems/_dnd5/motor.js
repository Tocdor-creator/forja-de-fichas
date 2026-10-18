// Motor de criação de personagem de D&D 5e, parametrizado por edição (2014 ou 2024).
import { campo } from '../../js/core/ui.js';
import {
  h, ATR, nomeAtr, siglaAtr, mod, sinal, zeros, somaObj, atributosIniciais, valoresBase,
  passoAtributos, seletor, escolhaUnica, contadorEscolha, blocoTexto, fichaD20, resumoD20, listaEditavel,
} from '../_d20/comum.js';
import { PERICIAS, nomePericia, ALINHAMENTOS, ARMADURAS, PONTOS, ARRANJO, CLASSES_BASE, pes } from './comum.js';

const CFG_ATR_BASE = {
  pontos: PONTOS,
  arranjo: ARRANJO,
  rolagem: { regra: 'Role 4d6 seis vezes, descarte o menor dado de cada e distribua os totais.' },
  manual: { min: 3, max: 20, inicial: 10 },
  vazio: 8,
  mostrarMod: true,
};

export function criarSistema5e(ed) {
  const classes = Object.fromEntries(Object.entries(ed.classes).map(([id, c]) => [id, { id, ...CLASSES_BASE[id], ...c }]));
  const listaClasses = Object.values(classes);
  const raca = d => ed.racas.find(r => r.id === d.raca);
  const sub = d => raca(d)?.subracas?.find(s => s.id === d.subraca);
  const antecedente = d => ed.antecedentes.find(a => a.id === d.antecedente);
  const classe = d => classes[d.classe];

  // ------------------------------------------------------------ cálculos

  function bonusAtributos(d) {
    if (ed.bonusDe === 'antecedente') return { ...d.bonusAntecedente };
    const r = raca(d), s = sub(d);
    return somaObj(r?.bonus, s?.bonus, d.racaEscolhas.bonus);
  }

  function regraBonusRaca(d) {
    return sub(d)?.escolhaBonus || raca(d)?.escolhaBonus || null;
  }

  function periciasRaca(d) {
    const r = raca(d), s = sub(d);
    return [...(r?.pericias || []), ...(s?.pericias || []), ...d.racaEscolhas.pericias];
  }

  function periciasFixas(d) {
    return new Set([...periciasRaca(d), ...(antecedente(d)?.pericias || [])]);
  }

  function derivar(d) {
    const base = valoresBase(d.atributos, CFG_ATR);
    const bonus = bonusAtributos(d);
    const atr = Object.fromEntries(ATR.map(a => [a.id, base[a.id] + (bonus[a.id] || 0)]));
    const m = Object.fromEntries(ATR.map(a => [a.id, mod(atr[a.id])]));
    const prof = 2;
    const c = classe(d), r = raca(d), s = sub(d), ant = antecedente(d);
    const profs = new Set([...periciasFixas(d), ...d.periciasClasse]);
    const esp = new Set(d.especialidades);
    const pericias = PERICIAS.map(p => {
      const tem = profs.has(p.id), dup = esp.has(p.id);
      return { ...p, prof: tem, dupla: dup, bonus: m[p.atr] + (tem ? prof : 0) + (dup ? prof : 0) };
    });
    const talentoRaca = d.racaEscolhas.talento && (ed.talentosOrigem?.find(t => t.id === d.racaEscolhas.talento)?.nome || d.racaEscolhas.talento);
    const talentos = [ant?.talento, talentoRaca, ...d.talentos].filter(Boolean);
    const robusto = talentos.some(t => /robusto/i.test(t));
    const alerta = talentos.some(t => /alerta/i.test(t));
    const pvExtra = (r?.pvPorNivel || 0) + (s?.pvPorNivel || 0) + (robusto ? 2 : 0);
    const pv = c ? Math.max(1, c.dv + m.con + pvExtra) : 0;

    const arm = ARMADURAS.find(a => a.id === d.armadura) || ARMADURAS[0];
    let ca;
    if (arm.id === 'nenhuma' && c?.defesaSemArmadura && !(c.id === 'monge' && d.escudo)) {
      ca = 10 + m.des + m[c.defesaSemArmadura];
    } else {
      ca = arm.base + (arm.des ? (arm.max == null ? m.des : Math.min(arm.max, m.des)) : 0);
    }
    if (d.escudo) ca += 2;
    if (d.racaEscolhas.caExtra) ca += d.racaEscolhas.caExtra;

    const salv = ATR.map(a => ({ id: a.id, nome: a.nome, prof: !!c?.salv.includes(a.id), bonus: m[a.id] + (c?.salv.includes(a.id) ? prof : 0) }));
    const conj = c?.conj ? { atr: c.conj, cd: 8 + prof + m[c.conj], ataque: prof + m[c.conj] } : null;
    const percepcao = pericias.find(p => p.id === 'percepcao').bonus;
    return {
      atr, m, prof, pericias, salv, pv, ca, conj, talentos,
      iniciativa: m.des + (alerta && ed.edicao === '2024' ? prof : 0) + (alerta && ed.edicao === '2014' ? 5 : 0),
      deslocamento: s?.desl || r?.desl || 30,
      tamanho: r?.tamanho || 'Médio',
      passiva: 10 + percepcao,
    };
  }

  const CFG_ATR = {
    ...CFG_ATR_BASE,
    subtitulo: ed.bonusDe === 'antecedente'
      ? 'Defina os seis valores. Os bônus do Antecedente (+2/+1 ou +1/+1/+1) entram na coluna “Bônus”.'
      : 'Defina os seis valores. Os bônus da raça entram na coluna “Bônus”.',
    bonus: d => bonusAtributos(d),
    explicacao: m => ({
      pontos: 'Compra de pontos: todos começam em 8; você tem 27 pontos e nada passa de 15 antes dos bônus.',
      arranjo: 'Arranjo padrão: distribua 15, 14, 13, 12, 10 e 8 como quiser.',
      rolagem: 'Rolagem: combine com o Mestre antes de usar este método.',
      manual: 'Manual: use se o Mestre definiu outro método ou você já tem os valores.',
    })[m],
  };

  // ------------------------------------------------------------ passos

  const passoConceito = {
    id: 'conceito',
    titulo: 'Conceito',
    subtitulo: 'Quem é seu personagem? Nome, jeito e um pouco de história.',
    pendencias: d => [!d.nome.trim() && 'Dê um nome ao personagem.'].filter(Boolean),
    render(ctx) {
      const d = ctx.dados;
      const set = k => v => { d[k] = v; ctx.mudou(); };
      return h('div', null,
        h('div', { class: 'linha-2' },
          campo('Nome do personagem', () => d.nome, set('nome')),
          campo('Jogador(a)', () => d.jogador, set('jogador'))),
        h('div', { class: 'linha-2' },
          h('label', { class: 'campo' }, h('span', { class: 'campo-rotulo' }, 'Alinhamento'),
            h('select', { onChange: e => { d.alinhamento = e.target.value; ctx.mudou(); } },
              h('option', { value: '' }, '—'),
              ALINHAMENTOS.map(a => h('option', { value: a, selected: d.alinhamento === a }, a)))),
          campo('Idade', () => d.idade, set('idade'))),
        campo('Aparência', () => d.aparencia, set('aparencia'), { multi: true }),
        h('div', { class: 'linha-2' },
          campo('Traços de personalidade', () => d.personalidade, set('personalidade'), { multi: true }),
          campo('Ideais', () => d.ideais, set('ideais'), { multi: true }),
          campo('Vínculos', () => d.vinculos, set('vinculos'), { multi: true }),
          campo('Defeitos', () => d.defeitos, set('defeitos'), { multi: true })),
        campo('História', () => d.historia, set('historia'), { multi: true }));
    },
  };

  const passoRaca = {
    id: 'raca',
    titulo: ed.nomeRaca,
    subtitulo: ed.subRaca,
    pendencias(d) {
      const r = raca(d);
      if (!r) return [`Escolha uma ${ed.nomeRaca.toLowerCase()}.`];
      const p = [];
      if (r.subracas && !sub(d)) p.push(`Escolha ${r.rotuloSub || 'a sub-raça'}.`);
      const regra = regraBonusRaca(d);
      if (regra) {
        const usados = Object.keys(d.racaEscolhas.bonus).length;
        if (usados !== regra.qtd) p.push(`Escolha ${regra.qtd} atributo(s) para receber +${regra.valor}.`);
      }
      const livres = (r.periciasLivres || 0) + (sub(d)?.periciasLivres || 0);
      const deLista = r.periciaEscolha?.qtd || 0;
      if (d.racaEscolhas.pericias.length !== livres + deLista) p.push(`Escolha ${livres + deLista} perícia(s) da ${ed.nomeRaca.toLowerCase()}.`);
      if ((r.talento || sub(d)?.talento) && !d.racaEscolhas.talento) p.push('Escolha o talento da sua origem.');
      return p;
    },
    render(ctx) {
      const d = ctx.dados;
      const r = raca(d), s = sub(d);
      const regra = regraBonusRaca(d);
      const livres = (r?.periciasLivres || 0) + (s?.periciasLivres || 0);
      const deLista = r?.periciaEscolha;
      const fixasOutras = new Set([...(r?.pericias || []), ...(s?.pericias || []), ...(antecedente(d)?.pericias || [])]);
      const talentoRegra = s?.talento || r?.talento;
      return h('div', null,
        escolhaUnica({
          opcoes: ed.racas, valor: d.raca,
          onChange: id => { d.raca = id; d.subraca = ''; d.racaEscolhas = { bonus: {}, pericias: [], talento: '' }; ctx.mudou(true); },
          render: o => [h('strong', null, o.nome), h('small', null, o.resumo)],
        }),
        r && h('div', { class: 'detalhe-escolha' },
          h('h3', null, r.nome),
          h('p', null, `Tamanho ${r.tamanho || 'Médio'} · Deslocamento ${pes(s?.desl || r.desl || 30)}`,
            ed.bonusDe === 'raca' && r.bonus ? ` · ${Object.entries(r.bonus).map(([k, v]) => `${siglaAtr(k)} ${sinal(v)}`).join(', ')}` : ''),
          h('ul', null, r.tracos.map(t => h('li', null, t)))),
        r?.subracas && [
          h('h3', { class: 'subtitulo-secao' }, r.rotuloSub || 'Sub-raça'),
          escolhaUnica({
            opcoes: r.subracas, valor: d.subraca,
            onChange: id => { d.subraca = id; d.racaEscolhas = { bonus: {}, pericias: [], talento: '' }; ctx.mudou(true); },
            render: o => [h('strong', null, o.nome),
              ed.bonusDe === 'raca' && o.bonus ? h('small', null, Object.entries(o.bonus).map(([k, v]) => `${siglaAtr(k)} ${sinal(v)}`).join(', ')) : null,
              h('small', null, o.tracos.join(' '))],
          }),
        ],
        regra && [
          h('h3', { class: 'subtitulo-secao' }, `Bônus à escolha: +${regra.valor} em ${regra.qtd} atributo(s)`),
          seletor({
            opcoes: ATR.filter(a => !(regra.exceto || []).includes(a.id)).map(a => ({ id: a.id, nome: a.nome })),
            selecionados: Object.keys(d.racaEscolhas.bonus), limite: regra.qtd,
            onChange: ids => { d.racaEscolhas.bonus = Object.fromEntries(ids.map(i => [i, regra.valor])); ctx.mudou(true); },
          }),
        ],
        (livres || deLista) && [
          h('h3', { class: 'subtitulo-secao' }, deLista ? `Perícia: ${deLista.rotulo}` : `Perícias à escolha (${livres})`),
          seletor({
            opcoes: PERICIAS.filter(p => !deLista || deLista.de.includes(p.id)).map(p => ({ id: p.id, nome: p.nome, desc: nomeAtr(p.atr) })),
            selecionados: d.racaEscolhas.pericias, limite: livres + (deLista?.qtd || 0), travados: [...fixasOutras],
            onChange: ids => { d.racaEscolhas.pericias = ids; ctx.mudou(true); },
          }),
        ],
        talentoRegra && [
          h('h3', { class: 'subtitulo-secao' }, talentoRegra.rotulo),
          ed.talentosOrigem
            ? escolhaUnica({
              opcoes: ed.talentosOrigem, valor: d.racaEscolhas.talento,
              onChange: id => { d.racaEscolhas.talento = id; ctx.mudou(true); },
              render: o => [h('strong', null, o.nome), h('small', null, o.desc)],
            })
            : campo('Talento', () => d.racaEscolhas.talento, v => { d.racaEscolhas.talento = v; ctx.mudou(); }, { placeholder: 'Ex.: Sortudo, Mestre em Armas…', dica: 'Escolha um talento do Livro do Jogador cujos pré-requisitos você cumpra.' }),
        ]);
    },
  };

  const passoAntecedente = {
    id: 'antecedente',
    titulo: 'Antecedente',
    subtitulo: ed.edicao === '2024'
      ? 'O que você fazia antes da aventura. Ele define bônus de atributo, um talento de origem, duas perícias e uma ferramenta.'
      : 'O que você fazia antes da aventura. Ele dá duas perícias, ferramentas ou idiomas e uma característica.',
    pendencias(d) {
      const a = antecedente(d);
      if (!a) return ['Escolha um antecedente.'];
      const p = [];
      if (ed.bonusDe === 'antecedente') {
        const v = Object.values(d.bonusAntecedente).sort((x, y) => y - x).join(',');
        if (v !== '2,1' && v !== '1,1,1') p.push('Distribua os bônus do antecedente: +2 e +1, ou +1 em três atributos.');
      }
      const repetidas = a.pericias.filter(x => periciasRaca(d).includes(x));
      if (repetidas.length) p.push(`Perícia repetida com a ${ed.nomeRaca.toLowerCase()}: ${repetidas.map(nomePericia).join(', ')}. Troque a escolha da ${ed.nomeRaca.toLowerCase()}.`);
      return p;
    },
    render(ctx) {
      const d = ctx.dados;
      const a = antecedente(d);
      return h('div', null,
        escolhaUnica({
          opcoes: ed.antecedentes, valor: d.antecedente,
          onChange: id => { d.antecedente = id; d.bonusAntecedente = {}; ctx.mudou(true); },
          render: o => [h('strong', null, o.nome), h('small', null, o.pericias.map(nomePericia).join(', '))],
        }),
        a && h('div', { class: 'detalhe-escolha' },
          h('h3', null, a.nome),
          a.desc && h('p', null, a.desc),
          h('ul', null,
            h('li', null, h('strong', null, 'Perícias: '), a.pericias.map(nomePericia).join(', ')),
            a.ferramentas && h('li', null, h('strong', null, 'Ferramentas: '), a.ferramentas),
            a.idiomas && h('li', null, h('strong', null, 'Idiomas: '), a.idiomas),
            a.atr && h('li', null, h('strong', null, 'Atributos: '), a.atr.map(nomeAtr).join(', ')),
            a.talento && h('li', null, h('strong', null, 'Talento de origem: '), a.talento),
            a.caracteristica && h('li', null, h('strong', null, 'Característica: '), a.caracteristica),
            a.equip && h('li', null, h('strong', null, 'Equipamento: '), a.equip))),
        a?.atr && ed.bonusDe === 'antecedente' && [
          h('h3', { class: 'subtitulo-secao' }, 'Bônus de atributo'),
          h('p', { class: 'nota-d20' }, `Aumente um destes atributos em +2 e outro em +1, ou os três em +1: ${a.atr.map(nomeAtr).join(', ')}. Nenhum pode passar de 20.`),
          h('div', { class: 'tabela-atr' }, a.atr.map(id => h('div', { class: 'linha-atr' },
            h('div', { class: 'linha-atr-nome' }, h('strong', null, nomeAtr(id))),
            h('div', { class: 'abas' }, [0, 1, 2].map(v => h('button', {
              type: 'button', class: 'aba' + ((d.bonusAntecedente[id] || 0) === v ? ' ativa' : ''),
              onClick: () => {
                if (v) d.bonusAntecedente[id] = v; else delete d.bonusAntecedente[id];
                ctx.mudou(true);
              },
            }, v ? `+${v}` : '0'))),
            h('span'), h('span')))),
        ]);
    },
  };

  const passoClasse = {
    id: 'classe',
    titulo: 'Classe',
    subtitulo: 'Sua profissão de aventureiro: define pontos de vida, proficiências, perícias e habilidades de 1º nível.',
    pendencias(d) {
      const c = classe(d);
      if (!c) return ['Escolha uma classe.'];
      const p = [];
      const n = c.pericias.qtd;
      if (d.periciasClasse.length !== n) p.push(`Escolha ${n} perícia(s) da classe (${d.periciasClasse.length}/${n}).`);
      const fixas = periciasFixas(d);
      const rep = d.periciasClasse.filter(x => fixas.has(x));
      if (rep.length) p.push(`Perícia já obtida em outra escolha: ${rep.map(nomePericia).join(', ')}. Troque por outra.`);
      if (c.especialidade && d.especialidades.length !== c.especialidade) p.push(`Escolha ${c.especialidade} perícias para Especialização.`);
      return p;
    },
    render(ctx) {
      const d = ctx.dados;
      const c = classe(d);
      const fixas = periciasFixas(d);
      return h('div', null,
        escolhaUnica({
          opcoes: listaClasses, valor: d.classe,
          onChange: id => { d.classe = id; d.periciasClasse = []; d.especialidades = []; ctx.mudou(true); },
          render: o => [h('strong', null, o.nome), h('small', null, `d${o.dv} · ${o.resumo}`)],
        }),
        c && h('div', { class: 'detalhe-escolha' },
          h('h3', null, c.nome),
          h('ul', null,
            h('li', null, h('strong', null, 'Dado de vida: '), `d${c.dv} (PV no 1º nível: ${c.dv} + mod. de Constituição)`),
            h('li', null, h('strong', null, 'Testes de resistência: '), c.salv.map(nomeAtr).join(' e ')),
            h('li', null, h('strong', null, 'Proficiências: '), c.prof),
            c.conj && h('li', null, h('strong', null, 'Conjuração: '), `${nomeAtr(c.conj)} · ${c.magia}`)),
          h('h3', { class: 'subtitulo-secao' }, 'Habilidades de 1º nível'),
          h('ul', null, c.carac.map(t => h('li', null, t)))),
        c && [
          h('h3', { class: 'subtitulo-secao' }, `Perícias da classe`),
          contadorEscolha('perícia(s)', d.periciasClasse.length, c.pericias.qtd),
          seletor({
            opcoes: PERICIAS.filter(p => c.pericias.de.includes(p.id)).map(p => ({ id: p.id, nome: p.nome, desc: nomeAtr(p.atr) })),
            selecionados: d.periciasClasse, limite: c.pericias.qtd, travados: [...fixas],
            onChange: ids => { d.periciasClasse = ids; d.especialidades = d.especialidades.filter(x => ids.includes(x) || fixas.has(x)); ctx.mudou(true); },
          }),
          c.especialidade && [
            h('h3', { class: 'subtitulo-secao' }, `Especialização (${c.especialidade})`),
            h('p', { class: 'nota-d20' }, 'Dobra o bônus de proficiência em perícias que você já domina.'),
            seletor({
              opcoes: PERICIAS.filter(p => fixas.has(p.id) || d.periciasClasse.includes(p.id)).map(p => ({ id: p.id, nome: p.nome })),
              selecionados: d.especialidades, limite: c.especialidade,
              onChange: ids => { d.especialidades = ids; ctx.mudou(true); },
            }),
          ],
          h('h3', { class: 'subtitulo-secao' }, 'Escolhas de 1º nível'),
          campo(c.escolhas || 'Anotações da classe', () => d.escolhasClasse, v => { d.escolhasClasse = v; ctx.mudou(); }, { multi: true, placeholder: c.escolhasExemplo || '' }),
        ]);
    },
  };

  const passoAtr = passoAtributos(CFG_ATR);
  const pendAtr = passoAtr.pendencias;
  passoAtr.pendencias = d => {
    const p = pendAtr(d);
    const der = derivar(d);
    const acima = ATR.filter(a => der.atr[a.id] > 20);
    if (acima.length) p.push(`Atributo acima de 20: ${acima.map(a => a.nome).join(', ')}.`);
    return p;
  };

  const passoEquip = {
    id: 'equipamento',
    titulo: 'Equipamento e magias',
    subtitulo: 'Armadura, armas, itens e — se sua classe conjura — truques e magias.',
    render(ctx) {
      const d = ctx.dados;
      const c = classe(d);
      const der = derivar(d);
      return h('div', null,
        c && h('div', { class: 'detalhe-escolha' }, h('strong', null, 'Equipamento inicial da classe: '), c.equip),
        antecedente(d)?.equip && h('p', { class: 'nota-d20' }, `Do antecedente: ${antecedente(d).equip}`),
        h('div', { class: 'linha-2' },
          h('label', { class: 'campo' }, h('span', { class: 'campo-rotulo' }, 'Armadura'),
            h('select', { onChange: e => { d.armadura = e.target.value; ctx.mudou(true); } },
              ARMADURAS.map(a => h('option', { value: a.id, selected: d.armadura === a.id }, a.nome)))),
          h('label', { class: 'campo' }, h('span', { class: 'campo-rotulo' }, 'Escudo'),
            h('select', { onChange: e => { d.escudo = e.target.value === 's'; ctx.mudou(true); } },
              h('option', { value: 'n', selected: !d.escudo }, 'Sem escudo'),
              h('option', { value: 's', selected: d.escudo }, 'Escudo (+2 CA)')))),
        h('p', { class: 'contador-d20' }, h('strong', null, der.ca), ' Classe de Armadura'),
        h('h3', { class: 'subtitulo-secao' }, 'Armas e ataques'),
        listaEditavel(d.armas, [['nome', 'Arma', 'Espada longa'], ['ataque', 'Ataque', sinal(der.prof + der.m.for)], ['dano', 'Dano', `1d8${sinal(der.m.for)} cortante`]], ctx, '+ Adicionar arma'),
        h('div', { class: 'linha-2' },
          campo('Peças de ouro (PO)', () => d.po, v => { d.po = v || 0; ctx.mudou(); }, { tipo: 'number' }),
          campo('Idiomas', () => d.idiomas, v => { d.idiomas = v; ctx.mudou(); }, { placeholder: 'Comum, …' })),
        campo('Outros itens e ferramentas', () => d.itens, v => { d.itens = v; ctx.mudou(); }, { multi: true }),
        c?.conj && [
          h('h3', { class: 'subtitulo-secao' }, 'Magias'),
          h('p', { class: 'nota-d20' }, `${c.magia} · CD ${der.conj.cd} · ataque ${sinal(der.conj.ataque)}`),
          campo('Truques', () => d.truques, v => { d.truques = v; ctx.mudou(); }, { multi: true }),
          campo('Magias de 1º círculo', () => d.magias, v => { d.magias = v; ctx.mudou(); }, { multi: true }),
        ],
        campo('Outras características e anotações', () => d.anotacoes, v => { d.anotacoes = v; ctx.mudou(); }, { multi: true }));
    },
  };

  // ------------------------------------------------------------ resumo e ficha

  function linha(d) {
    const r = raca(d), s = sub(d), c = classe(d);
    return [s?.nome || r?.nome, c && `${c.nome} 1`].filter(Boolean).join(' · ');
  }

  function atributosModelo(der) {
    return ATR.map(a => ({ sigla: a.sigla, principal: sinal(der.m[a.id]), secundario: der.atr[a.id] }));
  }

  function resumo(ctx) {
    const d = ctx.dados;
    const der = derivar(d);
    return resumoD20({
      nome: d.nome, linha: linha(d),
      atributos: atributosModelo(der),
      destaques: [
        { rot: 'PV', val: der.pv || '—' }, { rot: 'CA', val: der.ca },
        { rot: 'Iniciativa', val: sinal(der.iniciativa) }, { rot: 'Deslocamento', val: pes(der.deslocamento) },
        { rot: 'Proficiência', val: sinal(der.prof) }, { rot: 'Perc. passiva', val: der.passiva },
      ],
      extras: [
        der.pericias.some(p => p.prof) && 'Perícias: ' + der.pericias.filter(p => p.prof).map(p => p.nome).join(', '),
        antecedente(d) && `Antecedente: ${antecedente(d).nome}`,
      ],
    });
  }

  function ficha(ctx) {
    const d = ctx.dados;
    const der = derivar(d);
    const c = classe(d), r = raca(d), s = sub(d), ant = antecedente(d);
    const pend = passos.flatMap(p => (p.pendencias ? p.pendencias(d) : []));
    const descTalento = nome => ed.talentosOrigem?.find(x => x.nome === nome)?.desc;
    return fichaD20({
      pendencias: pend,
      sistema: ed.nomeSistema,
      nome: d.nome,
      linha: linha(d),
      meta: [ant?.nome, d.alinhamento, d.jogador && `Jogador(a): ${d.jogador}`],
      atributos: atributosModelo(der),
      destaques: [
        { rot: 'Classe de Armadura', val: der.ca }, { rot: 'Iniciativa', val: sinal(der.iniciativa) },
        { rot: 'Deslocamento', val: pes(der.deslocamento) }, { rot: 'Proficiência', val: sinal(der.prof) },
        { rot: 'Percepção passiva', val: der.passiva }, { rot: 'Dado de vida', val: c ? `1d${c.dv}` : '—' },
      ],
      vida: der.pv ? { rot: 'Pontos de vida', max: der.pv, marcados: d.jogo.pvPerdidos, onChange: v => { d.jogo.pvPerdidos = v; ctx.mudou(); }, dica: 'Marque o dano sofrido.' } : null,
      salvaguardas: der.salv,
      pericias: der.pericias.map(p => ({ ...p, atr: siglaAtr(p.atr) })),
      blocos: [
        der.conj && blocoTexto('Conjuração',
          h('p', null, `${nomeAtr(c.conj)} · CD ${der.conj.cd} · ataque ${sinal(der.conj.ataque)}`),
          h('p', { class: 'fd-nota' }, c.magia),
          d.truques && h('p', { class: 'fd-texto' }, h('strong', null, 'Truques: '), d.truques),
          d.magias && h('p', { class: 'fd-texto' }, h('strong', null, '1º círculo: '), d.magias)),
        d.armas.length ? blocoTexto('Ataques', h('table', { class: 'fd-tabela' },
          h('thead', null, h('tr', null, h('th', null, 'Arma'), h('th', null, 'Ataque'), h('th', null, 'Dano'))),
          h('tbody', null, d.armas.map(a => h('tr', null, h('td', null, a.nome), h('td', null, a.ataque), h('td', null, a.dano)))))) : null,
        c && blocoTexto(`${c.nome}: habilidades`, h('ul', null, c.carac.map(t => h('li', null, t))), d.escolhasClasse && h('p', { class: 'fd-texto' }, d.escolhasClasse)),
        r && blocoTexto(`${s?.nome || r.nome}: traços`, h('ul', null, [...r.tracos, ...(s?.tracos || [])].map(t => h('li', null, t)))),
        der.talentos.length && blocoTexto('Talentos', h('ul', null, der.talentos.map(t => h('li', null, h('strong', null, t), descTalento(t) && ` — ${descTalento(t)}`)))),
        blocoTexto('Proficiências e idiomas',
          c && h('p', null, c.prof),
          ant?.ferramentas && h('p', null, `Ferramentas: ${ant.ferramentas}`),
          d.idiomas && h('p', null, `Idiomas: ${d.idiomas}`)),
        blocoTexto('Equipamento',
          h('p', null, ARMADURAS.find(a => a.id === d.armadura)?.nome, d.escudo ? ' + escudo' : ''),
          d.itens && h('p', { class: 'fd-texto' }, d.itens),
          h('p', null, h('strong', null, d.po || 0), ' PO')),
        (d.personalidade || d.ideais || d.vinculos || d.defeitos) && blocoTexto('Personalidade',
          d.personalidade && h('p', null, h('strong', null, 'Traços: '), d.personalidade),
          d.ideais && h('p', null, h('strong', null, 'Ideais: '), d.ideais),
          d.vinculos && h('p', null, h('strong', null, 'Vínculos: '), d.vinculos),
          d.defeitos && h('p', null, h('strong', null, 'Defeitos: '), d.defeitos)),
        (d.aparencia || d.historia || d.anotacoes) && blocoTexto('Aparência e história',
          d.aparencia && h('p', { class: 'fd-texto' }, d.aparencia),
          d.historia && h('p', { class: 'fd-texto' }, d.historia),
          d.anotacoes && h('p', { class: 'fd-texto' }, d.anotacoes)),
      ],
    });
  }

  function novo() {
    return {
      versao: 1,
      nome: '', jogador: '', alinhamento: '', idade: '', aparencia: '', personalidade: '', ideais: '', vinculos: '', defeitos: '', historia: '',
      raca: '', subraca: '', racaEscolhas: { bonus: {}, pericias: [], talento: '' },
      antecedente: '', bonusAntecedente: {},
      classe: '', periciasClasse: [], especialidades: [], escolhasClasse: '',
      atributos: atributosIniciais({ pontos: PONTOS, manual: CFG_ATR_BASE.manual, metodoPadrao: 'arranjo' }),
      talentos: [],
      armadura: 'nenhuma', escudo: false, armas: [], po: 0, idiomas: 'Comum', itens: '',
      truques: '', magias: '', anotacoes: '',
      jogo: { pvPerdidos: 0 },
    };
  }

  function migrar(d) {
    const b = novo();
    return { ...b, ...d, racaEscolhas: { ...b.racaEscolhas, ...d.racaEscolhas }, atributos: { ...b.atributos, ...d.atributos }, jogo: { ...b.jogo, ...d.jogo } };
  }

  const passos = [passoConceito, passoRaca, passoAntecedente, passoClasse, passoAtr, passoEquip];

  return {
    novo, migrar, passos, resumo, ficha,
    titulo: d => d.nome,
    subtitulo: d => linha(d),
  };
}
