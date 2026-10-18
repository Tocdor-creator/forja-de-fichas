import { h, campo, stepper, circulos, uid } from '../../js/core/ui.js';
import * as R from './regras.js';
import { intro } from './intro.js';

const nomeAtr = id => R.ATRIBUTOS.find(a => a.id === id).nome;

function novo() {
  return {
    versao: 1,
    nome: '', apelido: '', jogador: '', conceito: '', idade: '', origem: '', aparencia: '', historia: '',
    atributos: { fisico: 0, velocidade: 0, intelecto: 0, coragem: 0 },
    antecedentes: Object.fromEntries(R.ANTECEDENTES.map(a => [a.id, 0])),
    habilidades: [],
    habilidadesLivro: [], // { id, nome, categoria, desc } cadastradas pelo jogador
    trilha: { problema: '', resolucao: '', consequencias: '', sacrificio: '', alianca: '', redimido: false },
    montaria: { nome: '', especie: 'Cavalo', potencia: 0, resistencia: 0, laco: 0, descricao: '' },
    armas: [],
    itens: '',
    reis: 0,
    anotacoes: '',
    jogo: { vida: 0, dor: 0, vidaMontaria: 0 }, // círculos marcados durante a sessão
  };
}

function migrar(d) {
  const base = novo();
  return {
    ...base, ...d,
    atributos: { ...base.atributos, ...d.atributos },
    antecedentes: { ...base.antecedentes, ...d.antecedentes },
    trilha: { ...base.trilha, ...d.trilha },
    montaria: { ...base.montaria, ...d.montaria },
    jogo: { ...base.jogo, ...d.jogo },
  };
}

const todasHabilidades = d => [...R.HABILIDADES, ...d.habilidadesLivro];
const titulo = d => [d.nome, d.apelido && `“${d.apelido}”`].filter(Boolean).join(' ');

// ---------------------------------------------------------------- Passos

const passoConceito = {
  id: 'conceito',
  titulo: 'Conceito',
  subtitulo: 'Quem diabos é você no Oeste Selvagem? Uma frase curta e marcante que resume como seu personagem sobrevive.',
  pendencias: d => [!d.nome.trim() && 'Dê um nome ao personagem.', !d.conceito.trim() && 'Escreva o conceito.'].filter(Boolean),
  render(ctx) {
    const d = ctx.dados;
    const set = k => v => { d[k] = v; ctx.mudou(); };
    const conceito = campo('Conceito', () => d.conceito, set('conceito'), { placeholder: 'Ex.: Velho cachaceiro que já foi pistoleiro temido', multi: true });
    const apelido = campo('Apelido', () => d.apelido, set('apelido'), { placeholder: 'Garganta Seca' });
    return h('div', null,
      h('div', { class: 'linha-2' },
        campo('Nome', () => d.nome, set('nome'), { placeholder: 'Sebastião Ferreira' }),
        h('div', { class: 'campo-com-acao' }, apelido,
          h('button', {
            type: 'button', class: 'mini', onClick: () => {
              d.apelido = R.APELIDOS[Math.floor(Math.random() * R.APELIDOS.length)];
              apelido.querySelector('input').value = d.apelido;
              ctx.mudou();
            },
          }, '🎲 Sugerir apelido'))),
      conceito,
      h('div', { class: 'chips', 'aria-label': 'Exemplos de conceito' },
        h('span', { class: 'chips-rotulo' }, 'Inspiração:'),
        R.CONCEITOS_EXEMPLO.map(c => h('button', {
          type: 'button', class: 'chip', onClick: () => {
            d.conceito = c;
            conceito.querySelector('textarea').value = c;
            ctx.mudou();
          },
        }, c))),
      h('div', { class: 'linha-2' },
        campo('Jogador(a)', () => d.jogador, set('jogador')),
        campo('Idade', () => d.idade, set('idade'), { placeholder: 'Ex.: 58 anos' })),
      campo('De onde vem', () => d.origem, set('origem'), { placeholder: 'Belo Horizonte, Araguari, Varginha, Maria da Fé…' }),
      campo('Aparência', () => d.aparencia, set('aparencia'), { multi: true, placeholder: 'Chapéu furado de bala, bigode amarelado de fumo…' }),
      campo('História', () => d.historia, set('historia'), { multi: true, placeholder: 'O que trouxe você até aqui?' }));
  },
};

const passoAtributos = {
  id: 'atributos',
  titulo: 'Atributos',
  subtitulo: `Distribua ${R.CONDICOES_INICIAIS.pontosAtributo} pontos entre os quatro Atributos (no máximo ${R.MAX_ATRIBUTO} em cada). Cada um melhora uma Condição Inicial.`,
  pendencias(d) {
    const resto = R.CONDICOES_INICIAIS.pontosAtributo - R.soma(d.atributos);
    return [
      resto > 0 && `Ainda faltam ${resto} ponto(s) de Atributo.`,
      resto < 0 && `Você gastou ${-resto} ponto(s) a mais de Atributo.`,
      ...Object.entries(d.atributos).filter(([, v]) => v > R.MAX_ATRIBUTO).map(([k]) => `${nomeAtr(k)} passou do máximo de ${R.MAX_ATRIBUTO}.`),
    ].filter(Boolean);
  },
  render(ctx) {
    const d = ctx.dados;
    const gasto = R.soma(d.atributos);
    const resto = R.CONDICOES_INICIAIS.pontosAtributo - gasto;
    const der = R.derivados(d);
    const efeito = { fisico: `${der.vida} Círculos de Vida`, velocidade: `${der.movimento} de Movimento`, intelecto: `${der.pontosAntecedente} Pontos de Antecedente`, coragem: `${der.acoes} Ações de Combate` };
    return h('div', null,
      contador('Pontos de Atributo', resto, R.CONDICOES_INICIAIS.pontosAtributo),
      h('div', { class: 'grade-atributos' }, R.ATRIBUTOS.map(a => h('div', { class: 'atributo-cartao' + (d.atributos[a.id] ? ' ativo' : '') },
        h('div', { class: 'atributo-topo' }, h('span', { class: 'atributo-icone', 'aria-hidden': 'true' }, a.icone), h('h3', null, a.nome)),
        h('p', null, a.desc),
        h('div', { class: 'atributo-controle' },
          stepper(d.atributos[a.id], {
            rotulo: a.nome, max: R.MAX_ATRIBUTO, podeSubir: resto > 0,
            onChange: v => { d.atributos[a.id] = v; ctx.mudou(true); },
          }),
          h('div', { class: 'atributo-efeito' }, h('small', null, a.bonus), h('strong', null, '→ ', efeito[a.id])))))),
      h('p', { class: 'nota' }, 'Condições Iniciais de todo personagem: 6 Círculos de Vida, 6 de Dor, 1 Ação de Combate, 1 Movimento, Defesa 5, 4 Pontos de Antecedente.'));
  },
};

const passoAntecedentes = {
  id: 'antecedentes',
  titulo: 'Antecedentes',
  subtitulo: `Suas “perícias”: o que você aprendeu a fazer na vida. 4 pontos + 1 por ponto de Intelecto, no máximo ${R.MAX_ANTECEDENTE} em cada. Testes: 1d6 + Antecedente contra Número-Alvo ${R.NUMERO_ALVO}.`,
  pendencias(d) {
    const total = R.derivados(d).pontosAntecedente;
    const resto = total - R.soma(d.antecedentes);
    return [
      resto > 0 && `Ainda faltam ${resto} ponto(s) de Antecedente.`,
      resto < 0 && `Você gastou ${-resto} ponto(s) a mais de Antecedente (talvez tenha baixado o Intelecto).`,
      ...R.ANTECEDENTES.filter(a => d.antecedentes[a.id] > R.MAX_ANTECEDENTE).map(a => `${a.nome} passou do máximo de ${R.MAX_ANTECEDENTE}.`),
    ].filter(Boolean);
  },
  render(ctx) {
    const d = ctx.dados;
    const total = R.derivados(d).pontosAntecedente;
    const resto = total - R.soma(d.antecedentes);
    return h('div', null,
      contador('Pontos de Antecedente', resto, total),
      h('ul', { class: 'lista-antecedentes' }, R.ANTECEDENTES.map(a => h('li', { class: d.antecedentes[a.id] ? 'ativo' : '' },
        h('div', null, h('strong', null, a.nome), h('small', null, a.desc)),
        h('span', { class: 'teste' }, `1d6 + ${d.antecedentes[a.id]}`),
        stepper(d.antecedentes[a.id], {
          rotulo: a.nome, max: R.MAX_ANTECEDENTE, podeSubir: resto > 0,
          onChange: v => { d.antecedentes[a.id] = v; ctx.mudou(true); },
        })))),
      h('p', { class: 'nota' }, 'Sem ponto em um Antecedente? Melhor nem tentar arrancar a bala do peito do amigo…'));
  },
};

const passoHabilidades = {
  id: 'habilidades',
  titulo: 'Habilidades',
  subtitulo: 'A assinatura do seu personagem. No nível 1, escolha exatamente duas.',
  pendencias(d) {
    const n = R.derivados(d).habilidades;
    const qtd = d.habilidades.length;
    return [qtd < n && `Escolha mais ${n - qtd} Habilidade(s).`, qtd > n && `Você escolheu ${qtd - n} Habilidade(s) a mais.`].filter(Boolean);
  },
  render(ctx) {
    const d = ctx.dados;
    const limite = R.derivados(d).habilidades;
    const cheio = d.habilidades.length >= limite;
    const lista = todasHabilidades(d);

    const form = { nome: '', categoria: '', desc: '' };
    const formEl = h('form', {
      class: 'form-habilidade',
      onSubmit: e => {
        e.preventDefault();
        if (!form.nome.trim()) return;
        d.habilidadesLivro.push({ id: 'livro-' + uid(), nome: form.nome.trim(), categoria: form.categoria.trim(), desc: form.desc.trim() });
        ctx.mudou(true);
      },
    },
      h('h3', null, 'Adicionar Habilidade do livro'),
      h('p', { class: 'nota' }, 'O livro básico tem 30 Habilidades em duas categorias; aqui já vêm as que foram divulgadas. Cadastre as outras a partir do seu livro e elas ficam disponíveis nesta ficha.'),
      h('div', { class: 'linha-2' },
        campo('Nome', () => form.nome, v => { form.nome = v; }),
        campo('Categoria', () => form.categoria, v => { form.categoria = v; })),
      campo('Efeito', () => form.desc, v => { form.desc = v; }, { multi: true }),
      h('button', { type: 'submit', class: 'btn' }, '+ Adicionar'));

    return h('div', null,
      contador('Habilidades escolhidas', limite - d.habilidades.length, limite, 'restante(s)'),
      d.trilha.redimido && h('p', { class: 'nota destaque' }, '✦ Redimido: você tem direito a uma Habilidade extra.'),
      h('div', { class: 'grade-habilidades' }, lista.map(hab => {
        const sel = d.habilidades.includes(hab.id);
        const doLivro = hab.id.startsWith('livro-');
        return h('div', { class: 'habilidade' + (sel ? ' selecionada' : '') },
          h('button', {
            type: 'button', class: 'habilidade-toggle', 'aria-pressed': String(sel), disabled: !sel && cheio,
            onClick: () => {
              d.habilidades = sel ? d.habilidades.filter(x => x !== hab.id) : [...d.habilidades, hab.id];
              ctx.mudou(true);
            },
          },
            h('span', { class: 'habilidade-marca', 'aria-hidden': 'true' }, sel ? '★' : '☆'),
            h('strong', null, hab.nome),
            hab.categoria && h('span', { class: 'habilidade-cat' }, hab.categoria),
            h('span', { class: 'habilidade-desc' }, hab.desc || 'Sem descrição.')),
          doLivro && h('button', {
            type: 'button', class: 'mini perigo', onClick: () => {
              d.habilidadesLivro = d.habilidadesLivro.filter(x => x.id !== hab.id);
              d.habilidades = d.habilidades.filter(x => x !== hab.id);
              ctx.mudou(true);
            },
          }, 'remover'));
      })),
      formEl);
  },
};

const passoTrilha = {
  id: 'trilha',
  titulo: 'Trilha e Redenção',
  subtitulo: 'O arco dramático do personagem. Cumprindo a Trilha durante a campanha, ele alcança a Redenção.',
  pendencias: d => [!d.trilha.problema.trim() && 'Defina o problema (começo) da Trilha.', !d.trilha.resolucao.trim() && 'Defina o que resolve a Trilha (fim).'].filter(Boolean),
  render(ctx) {
    const t = ctx.dados.trilha;
    const set = k => v => { t[k] = v; ctx.mudou(); };
    return h('div', null,
      h('div', { class: 'linha-2' },
        campo('Começo: o problema', () => t.problema, set('problema'), { multi: true, placeholder: 'Roubaram minha arma, “A Viúva Negra”.' }),
        campo('Fim: o que resolve', () => t.resolucao, set('resolucao'), { multi: true, placeholder: 'Recuperar a arma e me aposentar em paz.' })),
      campo('Consequências', () => t.consequencias, set('consequencias'), { multi: true, placeholder: 'Como essa busca vai complicar sua vida e botar a gangue em apuros?' }),
      campo('Sacrifício', () => t.sacrificio, set('sacrificio'), { multi: true, placeholder: 'O que (ou quem) você ama e vai ter que deixar para trás?' }),
      campo('Alianças', () => t.alianca, set('alianca'), { multi: true, placeholder: 'Um NPC ou vínculo que pode ajudar na jornada.' }),
      h('label', { class: 'redencao' + (t.redimido ? ' ativa' : '') },
        h('input', { type: 'checkbox', checked: t.redimido, onChange: e => { t.redimido = e.target.checked; ctx.mudou(true); } }),
        h('span', null,
          h('strong', null, 'Personagem redimido'),
          h('small', null, 'Marque só quando completar a Trilha em jogo. Recompensa: +1 Habilidade extra, +2 em rolagens e uma carta a mais na Iniciativa (fica com a melhor).'))));
  },
};

const passoMontaria = {
  id: 'montaria',
  titulo: 'Montaria',
  subtitulo: `Ninguém atravessa o deserto a pé. Distribua ${R.PONTOS_MONTARIA} pontos entre Potência e Resistência.`,
  pendencias(d) {
    const resto = R.PONTOS_MONTARIA - d.montaria.potencia - d.montaria.resistencia;
    return [resto > 0 && `Faltam ${resto} ponto(s) na montaria.`, resto < 0 && `Pontos da montaria passaram de ${R.PONTOS_MONTARIA}.`].filter(Boolean);
  },
  render(ctx) {
    const m = ctx.dados.montaria;
    const set = k => v => { m[k] = v; ctx.mudou(); };
    const resto = R.PONTOS_MONTARIA - m.potencia - m.resistencia;
    return h('div', null,
      h('div', { class: 'linha-2' },
        campo('Nome do bicho', () => m.nome, set('nome'), { placeholder: 'Pangaré' }),
        h('label', { class: 'campo' }, h('span', { class: 'campo-rotulo' }, 'Espécie'),
          h('select', { onChange: e => { m.especie = e.target.value; ctx.mudou(); } },
            R.ESPECIES_MONTARIA.map(s => h('option', { value: s, selected: s === m.especie }, s))))),
      contador('Pontos da montaria', resto, R.PONTOS_MONTARIA),
      h('div', { class: 'grade-atributos' },
        h('div', { class: 'atributo-cartao' + (m.potencia ? ' ativo' : '') },
          h('div', { class: 'atributo-topo' }, h('span', { class: 'atributo-icone' }, '🐎'), h('h3', null, 'Potência')),
          h('p', null, `Proezas e força bruta. Desafios da montaria: 1d6 + Potência + seu Antecedente Montaria contra NA ${R.NUMERO_ALVO}.`),
          h('div', { class: 'atributo-controle' },
            stepper(m.potencia, { rotulo: 'Potência', podeSubir: resto > 0, onChange: v => { m.potencia = v; ctx.mudou(true); } }),
            h('div', { class: 'atributo-efeito' }, h('strong', null, `1d6 + ${m.potencia + ctx.dados.antecedentes.montaria}`))) ),
        h('div', { class: 'atributo-cartao' + (m.resistencia ? ' ativo' : '') },
          h('div', { class: 'atributo-topo' }, h('span', { class: 'atributo-icone' }, '🛡️'), h('h3', null, 'Resistência')),
          h('p', null, 'A saúde do animal: +1 Círculo de Vida por ponto.'),
          h('div', { class: 'atributo-controle' },
            stepper(m.resistencia, { rotulo: 'Resistência', podeSubir: resto > 0, onChange: v => { m.resistencia = v; ctx.mudou(true); } }),
            h('div', { class: 'atributo-efeito' }, h('strong', null, `+${m.resistencia} Círculos de Vida`))))),
      h('div', { class: 'campo' },
        h('span', { class: 'campo-rotulo' }, `Laço (0 a ${R.LACO_MAX})`),
        h('div', { class: 'laco' },
          stepper(m.laco, { rotulo: 'Laço', max: R.LACO_MAX, onChange: v => { m.laco = v; ctx.mudou(true); } }),
          h('small', { class: 'campo-dica' }, 'O vínculo com o animal cresce com o tempo: ele atende pelo nome, dá bônus e, lá no alto, vem galopando de longe para te salvar.'))),
      campo('Jeitão do bicho', () => m.descricao, set('descricao'), { multi: true, placeholder: 'Burrico velho e teimoso, couro duro, empaca de vez em quando.' }));
  },
};

const passoEquipamento = {
  id: 'equipamento',
  titulo: 'Equipamento',
  subtitulo: 'Armas, tralhas e os réis no bolso. Combine com o Juiz o que seu personagem carrega no começo.',
  render(ctx) {
    const d = ctx.dados;
    return h('div', null,
      h('h3', null, 'Armas'),
      d.armas.length === 0 && h('p', { class: 'nota' }, 'Nenhuma arma ainda.'),
      h('div', { class: 'lista-armas' }, d.armas.map((a, i) => h('div', { class: 'arma' },
        campo('Arma', () => a.nome, v => { a.nome = v; ctx.mudou(); }, { placeholder: 'Revólver enferrujado' }),
        campo('Dano', () => a.dano, v => { a.dano = v; ctx.mudou(); }, { placeholder: 'Conforme o livro' }),
        campo('Notas', () => a.notas, v => { a.notas = v; ctx.mudou(); }, { placeholder: '6 balas, recarga lenta…' }),
        h('button', { type: 'button', class: 'mini perigo', 'aria-label': `Remover ${a.nome || 'arma'}`, onClick: () => { d.armas.splice(i, 1); ctx.mudou(true); } }, '✕')))),
      h('button', { type: 'button', class: 'btn', onClick: () => { d.armas.push({ nome: '', dano: '', notas: '' }); ctx.mudou(true); } }, '+ Adicionar arma'),
      h('div', { class: 'linha-2', style: 'margin-top:24px' },
        campo('Réis', () => d.reis, v => { d.reis = v || 0; ctx.mudou(); }, { tipo: 'number' }),
        h('div')),
      campo('Tralhas e itens', () => d.itens, v => { d.itens = v; ctx.mudou(); }, { multi: true, placeholder: 'Cafeteira amassada, garrafa de pinga, pão de queijo embrulhado no lenço…' }),
      campo('Anotações', () => d.anotacoes, v => { d.anotacoes = v; ctx.mudou(); }, { multi: true }));
  },
};

function contador(rotulo, resto, total, sufixo = 'restante(s)') {
  const estado = resto === 0 ? 'zerado' : resto < 0 ? 'estourado' : '';
  return h('div', { class: `contador ${estado}` },
    h('span', null, rotulo),
    h('strong', null, resto), h('small', null, ` de ${total} ${sufixo}`));
}

// ---------------------------------------------------------------- Resumo lateral

function resumo(ctx) {
  const d = ctx.dados;
  const der = R.derivados(d);
  const habs = todasHabilidades(d).filter(x => d.habilidades.includes(x.id));
  return h('div', { class: 'resumo-sac' },
    h('div', { class: 'resumo-cartaz' },
      h('span', { class: 'resumo-procura' }, 'PROCURA-SE'),
      h('strong', { class: 'resumo-nome' }, d.nome || '???'),
      d.apelido && h('span', { class: 'resumo-apelido' }, `“${d.apelido}”`),
      d.conceito && h('em', null, d.conceito)),
    h('dl', { class: 'resumo-stats' },
      stat('Vida', der.vida), stat('Dor', der.dor), stat('Defesa', der.defesa),
      stat('Movim.', der.movimento), stat('Ações', der.acoes)),
    h('ul', { class: 'resumo-lista' },
      R.ATRIBUTOS.map(a => h('li', null, h('span', null, a.nome), h('b', null, d.atributos[a.id])))),
    h('ul', { class: 'resumo-lista' },
      R.ANTECEDENTES.filter(a => d.antecedentes[a.id]).map(a => h('li', null, h('span', null, a.nome), h('b', null, `+${d.antecedentes[a.id]}`)))),
    habs.length ? h('p', { class: 'resumo-habs' }, '★ ', habs.map(x => x.nome).join(' · ')) : null,
    d.montaria.nome && h('p', { class: 'resumo-habs' }, '🐎 ', d.montaria.nome, ` (${d.montaria.especie})`));
}

const stat = (rot, v) => h('div', null, h('dt', null, rot), h('dd', null, v));

// ---------------------------------------------------------------- Ficha pronta

function ficha(ctx) {
  const d = ctx.dados;
  const der = R.derivados(d);
  const habs = todasHabilidades(d).filter(x => d.habilidades.includes(x.id));
  const pend = [passoConceito, passoAtributos, passoAntecedentes, passoHabilidades, passoTrilha, passoMontaria].flatMap(p => p.pendencias(d));
  const marcar = k => v => { d.jogo[k] = v; ctx.mudou(); };
  const bloco = (tit, ...conteudo) => h('section', { class: 'fs-bloco' }, h('h3', null, tit), ...conteudo);

  return h('article', { class: 'ficha-sac' },
    pend.length ? h('div', { class: 'fs-aviso nao-imprimir' }, h('strong', null, 'Ficha incompleta: '), pend.join(' ')) : null,
    h('header', { class: 'fs-topo' },
      h('div', { class: 'fs-logo' }, 'SACRAMENTO'),
      h('h1', null, d.nome || 'Sem nome'),
      d.apelido && h('p', { class: 'fs-apelido' }, `“${d.apelido}”`),
      h('p', { class: 'fs-conceito' }, d.conceito || '—'),
      h('p', { class: 'fs-meta' }, [d.jogador && `Jogador(a): ${d.jogador}`, d.idade && `Idade: ${d.idade}`, d.origem && `De: ${d.origem}`, 'Nível 1'].filter(Boolean).join('  ·  ')),
      d.trilha.redimido && h('span', { class: 'fs-carimbo' }, 'Redimido')),

    h('div', { class: 'fs-grade' },
      bloco('Atributos', h('div', { class: 'fs-atributos' }, R.ATRIBUTOS.map(a => h('div', { class: 'fs-atr' }, h('b', null, d.atributos[a.id]), h('span', null, a.nome))))),
      bloco('Condições',
        h('div', { class: 'fs-condicoes' },
          h('div', null, h('b', null, der.defesa), h('span', null, 'Defesa')),
          h('div', null, h('b', null, der.movimento), h('span', null, 'Movimento')),
          h('div', null, h('b', null, der.acoes), h('span', null, 'Ações de Combate')),
          h('div', null, h('b', null, der.cartasIniciativa), h('span', null, 'Carta(s) na Iniciativa'))),
        der.bonusRedencao ? h('p', { class: 'fs-nota' }, `+${der.bonusRedencao} em rolagens (Redenção)`) : null),
      bloco('Círculos de Vida', circulos(der.vida, Math.min(d.jogo.vida, der.vida), marcar('vida'), { rotulo: 'Vida' }), h('p', { class: 'fs-nota' }, 'Clique para marcar ferimentos graves.')),
      bloco('Círculos de Dor', circulos(der.dor, Math.min(d.jogo.dor, der.dor), marcar('dor'), { rotulo: 'Dor' }), h('p', { class: 'fs-nota' }, 'Ferimentos leves.')),
      bloco('Antecedentes', h('ul', { class: 'fs-antecedentes' }, R.ANTECEDENTES.map(a => h('li', null,
        h('span', null, a.nome),
        h('span', { class: 'fs-pips', 'aria-label': `${d.antecedentes[a.id]} de ${R.MAX_ANTECEDENTE}` }, '●'.repeat(d.antecedentes[a.id]) + '○'.repeat(Math.max(0, R.MAX_ANTECEDENTE - d.antecedentes[a.id]))),
        h('b', null, `1d6+${d.antecedentes[a.id] + der.bonusRedencao}`)))),
        h('p', { class: 'fs-nota' }, `Número-Alvo padrão: ${R.NUMERO_ALVO}`)),
      bloco('Habilidades', habs.length
        ? h('ul', { class: 'fs-habilidades' }, habs.map(x => h('li', null, h('strong', null, x.nome), x.categoria && h('small', null, ` (${x.categoria})`), h('p', null, x.desc))))
        : h('p', { class: 'fs-nota' }, 'Nenhuma escolhida.')),
      bloco('Trilha',
        h('dl', { class: 'fs-trilha' },
          trilhaItem('Problema', d.trilha.problema), trilhaItem('Resolução', d.trilha.resolucao),
          trilhaItem('Consequências', d.trilha.consequencias), trilhaItem('Sacrifício', d.trilha.sacrificio),
          trilhaItem('Alianças', d.trilha.alianca))),
      bloco(`Montaria${d.montaria.nome ? ': ' + d.montaria.nome : ''}`,
        h('p', { class: 'fs-nota' }, d.montaria.especie),
        h('div', { class: 'fs-condicoes' },
          h('div', null, h('b', null, d.montaria.potencia), h('span', null, 'Potência')),
          h('div', null, h('b', null, d.montaria.resistencia), h('span', null, 'Resistência')),
          h('div', null, h('b', null, d.montaria.laco), h('span', null, 'Laço'))),
        d.montaria.resistencia > 0 && h('div', { style: 'margin-top:8px' }, h('small', null, 'Círculos de Vida (bônus de Resistência)'), circulos(d.montaria.resistencia, Math.min(d.jogo.vidaMontaria, d.montaria.resistencia), marcar('vidaMontaria'), { rotulo: 'Vida da montaria' })),
        d.montaria.descricao && h('p', null, d.montaria.descricao)),
      bloco('Equipamento',
        d.armas.length ? h('table', { class: 'fs-armas' },
          h('thead', null, h('tr', null, h('th', null, 'Arma'), h('th', null, 'Dano'), h('th', null, 'Notas'))),
          h('tbody', null, d.armas.map(a => h('tr', null, h('td', null, a.nome), h('td', null, a.dano), h('td', null, a.notas))))) : null,
        d.itens && h('p', { class: 'fs-texto' }, d.itens),
        h('p', { class: 'fs-reis' }, h('b', null, d.reis || 0), ' réis')),
      (d.aparencia || d.historia || d.anotacoes) && bloco('Aparência e história',
        d.aparencia && h('p', { class: 'fs-texto' }, d.aparencia),
        d.historia && h('p', { class: 'fs-texto' }, d.historia),
        d.anotacoes && h('p', { class: 'fs-texto' }, d.anotacoes))));
}

const trilhaItem = (rot, v) => v ? [h('dt', null, rot), h('dd', null, v)] : null;

// ---------------------------------------------------------------- Lobby

function lobby() {
  return h('header', { class: 'lobby-sac' },
    h('div', { class: 'lobby-placa' },
      h('span', { class: 'lobby-pre' }, 'Bem-vindo ao Oeste Selvagem, sô'),
      h('h1', null, 'Sacramento'),
      h('span', { class: 'lobby-pos' }, 'Livro de registro de pistoleiros, vigaristas e almas perdidas')),
    h('p', { class: 'lobby-intro' },
      'Monte seu personagem passo a passo: Conceito, Atributos, Antecedentes, Habilidades, Trilha de Redenção e Montaria. A contagem de pontos e os limites do nível 1 são conferidos automaticamente.'));
}

export default {
  tema: 'theme.css',
  temaClasse: 'tema-sacramento',
  textoNovo: 'Novo pistoleiro',
  intro,
  novo,
  migrar,
  titulo,
  subtitulo: d => d.conceito,
  passos: [passoConceito, passoAtributos, passoAntecedentes, passoHabilidades, passoTrilha, passoMontaria, passoEquipamento],
  resumo,
  ficha,
  lobby,
};
