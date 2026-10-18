// D&D 5.5 (Livro do Jogador 2024). Mecânicas do SRD 5.2 (CC-BY-4.0) + nomes do livro;
// descrições são resumos próprios.
import { h } from '../../js/core/ui.js';
import { introGenerica } from '../../js/core/intro.js';
import { criarSistema5e } from '../_dnd5/motor.js';
import { TODAS } from '../_dnd5/comum.js';

const talentosOrigem = [
  { id: 'alerta', nome: 'Alerta', desc: 'Soma a proficiência na Iniciativa e pode trocar a iniciativa com um aliado.' },
  { id: 'artifice', nome: 'Artífice', desc: 'Proficiência em 3 ferramentas de artesão, desconto em compras e fabrica itens mais rápido.' },
  { id: 'curandeiro', nome: 'Curandeiro', desc: 'Usa kit de curandeiro para curar com dados de vida e rerrola 1 em curas.' },
  { id: 'sortudo', nome: 'Sortudo', desc: 'Pontos de sorte (= proficiência) para ganhar vantagem ou impor desvantagem.' },
  { id: 'iniciado', nome: 'Iniciado em Magia', desc: '2 truques e uma magia de 1º círculo de clérigo, druida ou mago.' },
  { id: 'musico', nome: 'Músico', desc: 'Proficiência em 3 instrumentos; ao fim de um descanso dá Inspiração Heroica a aliados.' },
  { id: 'atacante', nome: 'Atacante Selvagem', desc: 'Uma vez por turno, rola o dano da arma duas vezes e fica com o maior.' },
  { id: 'habilidoso', nome: 'Habilidoso', desc: 'Proficiência em 3 perícias ou ferramentas à escolha.' },
  { id: 'brigao', nome: 'Brigão de Taverna', desc: 'Soco mais forte (1d4), rerrola 1 no dano desarmado e empurra o alvo.' },
  { id: 'robusto', nome: 'Robusto', desc: '+2 PV por nível de personagem.' },
];

const especies = [
  { id: 'aasimar', nome: 'Aasimar', resumo: 'Tocados pelos planos celestiais.', desl: 30, tracos: ['Resistência celestial: necrótico e radiante.', 'Visão no escuro (18 m).', 'Mãos curativas: cura dados d4 iguais à proficiência, 1 vez por descanso longo.', 'Portador da luz: truque luz.', 'Revelação celestial no 3º nível.'] },
  {
    id: 'draconato', nome: 'Draconato', resumo: 'Herdeiros dos dragões.', desl: 30,
    tracos: ['Arma de sopro (substitui um ataque; 1d10 no 1º nível).', 'Resistência ao dano da ancestralidade.', 'Visão no escuro (18 m).', 'Voo dracônico no 5º nível.'],
    rotuloSub: 'Ancestralidade dracônica',
    subracas: ['Azul (elétrico)', 'Branco (frio)', 'Bronze (elétrico)', 'Cobre (ácido)', 'Latão (fogo)', 'Ouro (fogo)', 'Prata (frio)', 'Preto (ácido)', 'Verde (veneno)', 'Vermelho (fogo)'].map(n => ({ id: n, nome: n, tracos: [] })),
  },
  { id: 'anao', nome: 'Anão', resumo: 'Robustos e ligados à pedra.', desl: 30, pvPorNivel: 1, tracos: ['Visão no escuro (36 m).', 'Resiliência anã: resistência e vantagem contra veneno.', 'Robustez anã: +1 PV por nível.', 'Sentido de pedra: percepção sísmica por um tempo, usos = proficiência.'] },
  {
    id: 'elfo', nome: 'Elfo', resumo: 'Longevos e feéricos.', desl: 30,
    periciaEscolha: { qtd: 1, de: ['intuicao', 'percepcao', 'sobrevivencia'], rotulo: 'Sentidos aguçados (Intuição, Percepção ou Sobrevivência)' },
    tracos: ['Visão no escuro (18 m).', 'Ancestralidade feérica: vantagem contra ficar enfeitiçado.', 'Sentidos aguçados: uma perícia entre Intuição, Percepção e Sobrevivência.', 'Transe: descanso longo em 4 horas.'],
    rotuloSub: 'Linhagem élfica',
    subracas: [
      { id: 'drow', nome: 'Drow', tracos: ['Visão no escuro de 36 m e o truque globos de luz.'] },
      { id: 'alto', nome: 'Alto Elfo', tracos: ['Truque prestidigitação (pode trocar após descanso longo).'] },
      { id: 'silvestre', nome: 'Elfo Silvestre', desl: 35, tracos: ['Deslocamento 10,5 m e o truque arte druídica.'] },
    ],
  },
  {
    id: 'gnomo', nome: 'Gnomo', resumo: 'Pequenos, astutos e inventivos.', desl: 30, tamanho: 'Pequeno',
    tracos: ['Visão no escuro (18 m).', 'Astúcia gnômica: vantagem em salvaguardas de Int, Sab e Car.'],
    rotuloSub: 'Linhagem gnômica',
    subracas: [
      { id: 'floresta', nome: 'Gnomo da Floresta', tracos: ['Truque ilusão menor e falar com animais.'] },
      { id: 'rochas', nome: 'Gnomo das Rochas', tracos: ['Truques consertar e prestidigitação; cria pequenos engenhos.'] },
    ],
  },
  {
    id: 'golias', nome: 'Golias', resumo: 'Descendentes de gigantes.', desl: 35,
    tracos: ['Forma grande no 5º nível.', 'Constituição poderosa: conta como um tamanho maior para carregar.'],
    rotuloSub: 'Ancestralidade gigante',
    subracas: [
      { id: 'nuvem', nome: 'Nuvem', tracos: ['Teleporte curto.'] }, { id: 'fogo', nome: 'Fogo', tracos: ['Dano extra de fogo.'] },
      { id: 'gelo', nome: 'Gelo', tracos: ['Dano de frio e reduz deslocamento.'] }, { id: 'colina', nome: 'Colina', tracos: ['Derruba o alvo.'] },
      { id: 'pedra', nome: 'Pedra', tracos: ['Reduz dano recebido.'] }, { id: 'tempestade', nome: 'Tempestade', tracos: ['Dano de trovão em quem te atinge.'] },
    ],
  },
  { id: 'halfling', nome: 'Halfling', resumo: 'Pequenos, bravos e sortudos.', desl: 30, tamanho: 'Pequeno', tracos: ['Bravura: vantagem contra ficar amedrontado.', 'Agilidade halfling.', 'Sorte: rerrola 1 natural no d20.', 'Furtividade natural.'] },
  {
    id: 'humano', nome: 'Humano', resumo: 'Versáteis e engenhosos.', desl: 30,
    periciasLivres: 1, talento: { rotulo: 'Versátil: talento de origem' },
    tracos: ['Engenhoso: ganha Inspiração Heroica a cada descanso longo.', 'Habilidoso: uma perícia à escolha.', 'Versátil: um talento de origem à escolha.'],
  },
  { id: 'orc', nome: 'Orc', resumo: 'Vigorosos e implacáveis.', desl: 30, tracos: ['Fúria de adrenalina: Disparada como ação bônus e PV temporários.', 'Visão no escuro (36 m).', 'Resistência implacável: cai para 1 PV em vez de 0, uma vez por descanso longo.'] },
  {
    id: 'tiefling', nome: 'Tiefling', resumo: 'Herdeiros de um legado infernal.', desl: 30,
    tracos: ['Visão no escuro (18 m).', 'Presença sobrenatural: truque taumaturgia.'],
    rotuloSub: 'Legado ínfero',
    subracas: [
      { id: 'abissal', nome: 'Abissal', tracos: ['Resistência a veneno; truque rajada de veneno.'] },
      { id: 'ctonico', nome: 'Ctônico', tracos: ['Resistência a necrótico; truque toque arrepiante.'] },
      { id: 'infernal', nome: 'Infernal', tracos: ['Resistência a fogo; truque raio de fogo.'] },
    ],
  },
];

const antecedentes = [
  { id: 'acolito', nome: 'Acólito', atr: ['int', 'sab', 'car'], talento: 'Iniciado em Magia (Clérigo)', pericias: ['intuicao', 'religiao'], ferramentas: 'Suprimentos de caligrafia', equip: 'Ou 50 PO.' },
  { id: 'artesao', nome: 'Artesão', atr: ['for', 'des', 'int'], talento: 'Artífice', pericias: ['investigacao', 'persuasao'], ferramentas: 'Uma ferramenta de artesão', equip: 'Ou 50 PO.' },
  { id: 'charlatao', nome: 'Charlatão', atr: ['des', 'con', 'car'], talento: 'Habilidoso', pericias: ['enganacao', 'prestidigitacao'], ferramentas: 'Kit de falsificação', equip: 'Ou 50 PO.' },
  { id: 'criminoso', nome: 'Criminoso', atr: ['des', 'con', 'int'], talento: 'Alerta', pericias: ['prestidigitacao', 'furtividade'], ferramentas: 'Ferramentas de ladrão', equip: 'Ou 50 PO.' },
  { id: 'artista', nome: 'Artista', atr: ['for', 'des', 'car'], talento: 'Músico', pericias: ['acrobacia', 'atuacao'], ferramentas: 'Um instrumento musical', equip: 'Ou 50 PO.' },
  { id: 'fazendeiro', nome: 'Fazendeiro', atr: ['for', 'con', 'sab'], talento: 'Robusto', pericias: ['adestrar', 'natureza'], ferramentas: 'Ferramentas de carpinteiro', equip: 'Ou 50 PO.' },
  { id: 'guarda', nome: 'Guarda', atr: ['for', 'int', 'sab'], talento: 'Alerta', pericias: ['atletismo', 'percepcao'], ferramentas: 'Um jogo', equip: 'Ou 50 PO.' },
  { id: 'guia', nome: 'Guia', atr: ['des', 'con', 'sab'], talento: 'Iniciado em Magia (Druida)', pericias: ['furtividade', 'sobrevivencia'], ferramentas: 'Ferramentas de cartógrafo', equip: 'Ou 50 PO.' },
  { id: 'eremita', nome: 'Eremita', atr: ['con', 'sab', 'car'], talento: 'Curandeiro', pericias: ['medicina', 'religiao'], ferramentas: 'Kit de herbalismo', equip: 'Ou 50 PO.' },
  { id: 'mercador', nome: 'Mercador', atr: ['con', 'int', 'car'], talento: 'Sortudo', pericias: ['adestrar', 'persuasao'], ferramentas: 'Ferramentas de navegador', equip: 'Ou 50 PO.' },
  { id: 'nobre', nome: 'Nobre', atr: ['for', 'int', 'car'], talento: 'Habilidoso', pericias: ['historia', 'persuasao'], ferramentas: 'Um jogo', equip: 'Ou 50 PO.' },
  { id: 'sabio', nome: 'Sábio', atr: ['con', 'int', 'sab'], talento: 'Iniciado em Magia (Mago)', pericias: ['arcanismo', 'historia'], ferramentas: 'Suprimentos de caligrafia', equip: 'Ou 50 PO.' },
  { id: 'marinheiro', nome: 'Marinheiro', atr: ['for', 'des', 'sab'], talento: 'Brigão de Taverna', pericias: ['acrobacia', 'percepcao'], ferramentas: 'Ferramentas de navegador', equip: 'Ou 50 PO.' },
  { id: 'escriba', nome: 'Escriba', atr: ['des', 'int', 'sab'], talento: 'Habilidoso', pericias: ['investigacao', 'percepcao'], ferramentas: 'Suprimentos de caligrafia', equip: 'Ou 50 PO.' },
  { id: 'soldado', nome: 'Soldado', atr: ['for', 'des', 'con'], talento: 'Atacante Selvagem', pericias: ['atletismo', 'intimidacao'], ferramentas: 'Um jogo', equip: 'Ou 50 PO.' },
  { id: 'andarilho', nome: 'Andarilho', atr: ['des', 'sab', 'car'], talento: 'Sortudo', pericias: ['intuicao', 'furtividade'], ferramentas: 'Ferramentas de ladrão', equip: 'Ou 50 PO.' },
];

const classes = {
  barbaro: {
    resumo: 'Fúria primal e força bruta.',
    pericias: { qtd: 2, de: ['adestrar', 'atletismo', 'intimidacao', 'natureza', 'percepcao', 'sobrevivencia'] },
    carac: ['Fúria (2 usos, +2 de dano, resistência a dano físico).', 'Defesa sem armadura: CA 10 + Des + Con.', 'Maestria em armas (2 armas).'],
    escolhas: 'Armas com maestria', escolhasExemplo: 'Ex.: Machado grande (Cleave), Machadinha (Vex)',
    equip: 'Machado grande, 4 machadinhas, pacote de aventureiro e 15 PO — ou 75 PO.',
  },
  bardo: {
    resumo: 'Magia da música e da palavra.',
    pericias: { qtd: 3, de: TODAS },
    magia: '2 truques e 4 magias preparadas; 2 espaços de 1º círculo.',
    carac: ['Inspiração de bardo (d6, usos = mod. de Carisma).', 'Conjuração (Carisma).'],
    equip: 'Armadura de couro, 2 adagas, instrumento musical, pacote de artista e 19 PO — ou 90 PO.',
  },
  bruxo: {
    resumo: 'Poder de um pacto sobrenatural.',
    pericias: { qtd: 2, de: ['arcanismo', 'enganacao', 'historia', 'intimidacao', 'investigacao', 'natureza', 'religiao'] },
    magia: '2 truques e 2 magias preparadas; 1 espaço de pacto (recupera em descanso curto).',
    carac: ['Invocações místicas (1).', 'Magia de pacto (Carisma).'],
    escolhas: 'Invocação mística', escolhasExemplo: 'Ex.: Pacto do Tomo',
    equip: 'Armadura de couro, foice, 2 adagas, foco arcano (orbe), livro, pacote de estudioso e 15 PO — ou 100 PO.',
  },
  clerigo: {
    resumo: 'Canal do poder divino.',
    pericias: { qtd: 2, de: ['historia', 'intuicao', 'medicina', 'persuasao', 'religiao'] },
    magia: '3 truques e 4 magias preparadas; 2 espaços de 1º círculo.',
    carac: ['Conjuração (Sabedoria).', 'Ordem divina: Protetor (armas marciais e armadura pesada) ou Taumaturgo (truque extra e bônus em Arcanismo/Religião).'],
    escolhas: 'Ordem divina', escolhasExemplo: 'Protetor ou Taumaturgo',
    equip: 'Camisão de malha, escudo, maça, símbolo sagrado, pacote de sacerdote e 7 PO — ou 110 PO.',
  },
  druida: {
    resumo: 'Guardião da natureza.',
    pericias: { qtd: 2, de: ['arcanismo', 'adestrar', 'intuicao', 'medicina', 'natureza', 'percepcao', 'religiao', 'sobrevivencia'] },
    magia: '2 truques e 4 magias preparadas; 2 espaços de 1º círculo.',
    carac: ['Conjuração (Sabedoria).', 'Druídico (idioma secreto).', 'Ordem primal: Mago (truque extra, bônus em Arcanismo/Natureza) ou Guardião (armas marciais e armadura média).'],
    escolhas: 'Ordem primal', escolhasExemplo: 'Mago ou Guardião',
    equip: 'Armadura de couro, escudo, foice, foco druídico (cajado), pacote de explorador, kit de herbalismo e 9 PO — ou 50 PO.',
  },
  feiticeiro: {
    resumo: 'Magia inata no sangue.',
    pericias: { qtd: 2, de: ['arcanismo', 'enganacao', 'intuicao', 'intimidacao', 'persuasao', 'religiao'] },
    magia: '4 truques e 2 magias preparadas; 2 espaços de 1º círculo.',
    carac: ['Conjuração (Carisma).', 'Feitiçaria inata: por 1 minuto, CD +1 e vantagem nos ataques mágicos (2 usos).'],
    equip: 'Lança, 2 adagas, foco arcano (cristal), pacote de explorador e 28 PO — ou 50 PO.',
  },
  guerreiro: {
    resumo: 'Mestre das armas.',
    pericias: { qtd: 2, de: ['acrobacia', 'adestrar', 'atletismo', 'historia', 'intuicao', 'intimidacao', 'persuasao', 'percepcao', 'sobrevivencia'] },
    carac: ['Estilo de luta (um talento de estilo).', 'Retomar o fôlego (cura 1d10 + nível, 2 usos).', 'Maestria em armas (3 armas).'],
    escolhas: 'Estilo de luta e maestrias', escolhasExemplo: 'Ex.: Defesa · Espada grande (Graze), Mangual (Sap), Azagaia (Slow)',
    equip: 'Cota de malha, espada grande, mangual, 8 azagaias, pacote de explorador e 4 PO — ou couro batido + armas de distância — ou 155 PO.',
  },
  ladino: {
    resumo: 'Furtividade e golpes precisos.',
    pericias: { qtd: 4, de: ['acrobacia', 'atletismo', 'enganacao', 'intuicao', 'intimidacao', 'investigacao', 'percepcao', 'atuacao', 'persuasao', 'prestidigitacao', 'furtividade'] },
    carac: ['Especialização (2 perícias).', 'Ataque furtivo (1d6).', 'Gíria de ladrão.', 'Maestria em armas (2 armas).'],
    escolhas: 'Armas com maestria', escolhasExemplo: 'Ex.: Adaga (Nick), Arco curto (Vex)',
    equip: 'Armadura de couro, 2 adagas, espada curta, arco curto e 20 flechas, ferramentas de ladrão, pacote de assaltante e 8 PO — ou 100 PO.',
    especialidade: 2,
  },
  mago: {
    resumo: 'Estudioso da magia arcana.',
    pericias: { qtd: 2, de: ['arcanismo', 'historia', 'intuicao', 'investigacao', 'medicina', 'natureza', 'religiao'] },
    magia: '3 truques; grimório com 6 magias, 4 preparadas; 2 espaços de 1º círculo.',
    carac: ['Conjuração (Inteligência) com grimório.', 'Ritualista.', 'Recuperação arcana.'],
    equip: '2 adagas, foco arcano (cajado), túnica, grimório, pacote de estudioso e 5 PO — ou 55 PO.',
  },
  monge: {
    resumo: 'Artista marcial disciplinado.',
    pericias: { qtd: 2, de: ['acrobacia', 'atletismo', 'historia', 'intuicao', 'religiao', 'furtividade'] },
    carac: ['Artes marciais (d6; ataque desarmado bônus, usa Des).', 'Defesa sem armadura: CA 10 + Des + Sab.'],
    equip: 'Lança, 5 adagas, ferramenta de artesão ou instrumento, pacote de explorador e 11 PO — ou 50 PO.',
  },
  paladino: {
    resumo: 'Campeão de um juramento sagrado.',
    pericias: { qtd: 2, de: ['atletismo', 'intuicao', 'intimidacao', 'medicina', 'persuasao', 'religiao'] },
    magia: '2 magias preparadas; 2 espaços de 1º círculo.',
    carac: ['Cura pelas mãos (reserva de 5 × nível PV).', 'Conjuração (Carisma).', 'Maestria em armas (2 armas).'],
    escolhas: 'Armas com maestria', escolhasExemplo: 'Ex.: Espada longa (Sap), Azagaia (Slow)',
    equip: 'Cota de malha, escudo, espada longa, 6 azagaias, símbolo sagrado, pacote de sacerdote e 9 PO — ou 150 PO.',
  },
  patrulheiro: {
    resumo: 'Caçador das terras selvagens.',
    pericias: { qtd: 3, de: ['adestrar', 'atletismo', 'intuicao', 'investigacao', 'natureza', 'percepcao', 'furtividade', 'sobrevivencia'] },
    magia: '2 magias preparadas; 2 espaços de 1º círculo.',
    carac: ['Conjuração (Sabedoria).', 'Inimigo favorito: Marca do Caçador sempre preparada (2 usos grátis).', 'Maestria em armas (2 armas).'],
    escolhas: 'Armas com maestria', escolhasExemplo: 'Ex.: Arco longo (Slow), Cimitarra (Nick)',
    equip: 'Couro batido, cimitarra, espada curta, arco longo e 20 flechas, foco druídico, pacote de explorador e 7 PO — ou 150 PO.',
  },
};

const motor = criarSistema5e({
  edicao: '2024',
  nomeSistema: 'D&D 5.5 · Livro do Jogador 2024',
  nomeRaca: 'Espécie',
  subRaca: 'Sua espécie dá traços (visão, resistências, deslocamento). Os bônus de atributo agora vêm do antecedente.',
  bonusDe: 'antecedente',
  racas: especies, antecedentes, classes, talentosOrigem,
});

const CENA = `
  <div class="d24-estrelas"></div>
  <div class="d24-circulo"><svg viewBox="0 0 200 200" aria-hidden="true">
    <circle cx="100" cy="100" r="92" fill="none" stroke="#e0b25c" stroke-width="1.5"/>
    <circle cx="100" cy="100" r="80" fill="none" stroke="#e0b25c" stroke-width=".8" stroke-dasharray="4 6"/>
    <polygon points="100,20 169,140 31,140" fill="none" stroke="#e0b25c" stroke-width="1.2"/>
    <polygon points="100,180 31,60 169,60" fill="none" stroke="#e0b25c" stroke-width="1.2"/>
    <text font-family="Cinzel" font-size="9" fill="#e0b25c" letter-spacing="6"><textPath href="#d24-arco">✦ FORÇA ✦ DESTREZA ✦ CONSTITUIÇÃO ✦ INTELIGÊNCIA ✦ SABEDORIA ✦ CARISMA</textPath></text>
    <path id="d24-arco" d="M100,100 m-86,0 a86,86 0 1,1 172,0 a86,86 0 1,1 -172,0" fill="none"/>
  </svg></div>
  <div class="d24-livro"><div class="d24-capa d24-capa-e"></div><div class="d24-capa d24-capa-d"></div><div class="d24-luz"></div></div>`;

export default {
  tema: 'theme.css',
  temaClasse: 'tema-dnd2024',
  textoNovo: 'Novo personagem',
  intro: raiz => introGenerica(raiz, {
    classe: 'intro-dnd2024', cena: CENA, titulo: 'D&D 2024',
    frases: ['Traçando o círculo arcano…', 'Escolhendo a origem…', 'Dominando as armas…', 'Abrindo o tomo…'],
    botao: 'Abrir o tomo', duracao: 3000, saida: 1400,
  }),
  lobby: () => h('header', { class: 'lobby-sistema' },
    h('span', { class: 'lobby-pre' }, 'Livro do Jogador 2024 · “5.5”'),
    h('h1', null, 'D&D 5.5'),
    h('p', null, 'Espécie, antecedente com bônus de atributo e talento de origem, classe com maestria em armas. Compra de pontos (27), arranjo padrão ou rolagem — tudo conferido para o 1º nível.')),
  ...motor,
};
