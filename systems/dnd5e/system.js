// D&D 5e (2014). Dados mecânicos do SRD 5.1 + raças/antecedentes do Livro do Jogador
// (apenas números e nomes; descrições são resumos próprios).
import { h } from '../../js/core/ui.js';
import { introGenerica } from '../../js/core/intro.js';
import { criarSistema5e } from '../_dnd5/motor.js';
import { TODAS } from '../_dnd5/comum.js';

const racas = [
  {
    id: 'anao', nome: 'Anão', resumo: 'Resistentes, teimosos e mestres da pedra.', desl: 25, bonus: { con: 2 },
    tracos: ['Visão no escuro (18 m).', 'Resiliência anã: vantagem contra veneno e resistência a dano de veneno.', 'Treinamento em machados e martelos de guerra.', 'Afinidade com rochas: bônus em História sobre trabalhos em pedra.', 'Deslocamento não é reduzido por armadura pesada.'],
    rotuloSub: 'Sub-raça',
    subracas: [
      { id: 'colina', nome: 'Anão da Colina', bonus: { sab: 1 }, pvPorNivel: 1, tracos: ['Robustez anã: +1 PV por nível.'] },
      { id: 'montanha', nome: 'Anão da Montanha', bonus: { for: 2 }, tracos: ['Proficiência em armaduras leves e médias.'] },
    ],
  },
  {
    id: 'elfo', nome: 'Elfo', resumo: 'Graciosos, longevos e ligados à magia.', desl: 30, bonus: { des: 2 }, pericias: ['percepcao'],
    tracos: ['Visão no escuro (18 m).', 'Sentidos aguçados: proficiência em Percepção.', 'Ancestral feérico: vantagem contra ser enfeitiçado; magia não te faz dormir.', 'Transe: 4 horas de meditação equivalem a 8 de sono.'],
    rotuloSub: 'Sub-raça',
    subracas: [
      { id: 'alto', nome: 'Alto Elfo', bonus: { int: 1 }, tracos: ['Um truque de mago (Inteligência).', 'Treinamento com espadas longas e curtas e arcos.', 'Um idioma extra.'] },
      { id: 'floresta', nome: 'Elfo da Floresta', bonus: { sab: 1 }, desl: 35, tracos: ['Pés ligeiros: deslocamento 10,5 m.', 'Máscara da natureza: pode se esconder sob fenômenos naturais leves.', 'Treinamento com espadas e arcos élficos.'] },
      { id: 'drow', nome: 'Drow (Elfo Negro)', bonus: { car: 1 }, tracos: ['Visão no escuro superior (36 m).', 'Sensibilidade à luz solar.', 'Magia drow: globos de luz (truque).', 'Treinamento com rapieiras, espadas curtas e bestas de mão.'] },
    ],
  },
  {
    id: 'halfling', nome: 'Halfling', resumo: 'Pequenos, sortudos e corajosos.', desl: 25, tamanho: 'Pequeno', bonus: { des: 2 },
    tracos: ['Sortudo: rerrola 1 natural em ataques, testes e salvaguardas.', 'Bravura: vantagem contra ficar amedrontado.', 'Agilidade halfling: atravessa o espaço de criaturas maiores.'],
    rotuloSub: 'Sub-raça',
    subracas: [
      { id: 'pes-leves', nome: 'Pés-Leves', bonus: { car: 1 }, tracos: ['Furtividade natural: pode se esconder atrás de criaturas maiores.'] },
      { id: 'robusto', nome: 'Robusto', bonus: { con: 1 }, tracos: ['Resiliência dos robustos: vantagem e resistência contra veneno.'] },
    ],
  },
  {
    id: 'humano', nome: 'Humano', resumo: 'Versáteis e ambiciosos.', desl: 30,
    tracos: ['Um idioma extra à escolha.'],
    rotuloSub: 'Variante',
    subracas: [
      { id: 'padrao', nome: 'Humano padrão', bonus: { for: 1, des: 1, con: 1, int: 1, sab: 1, car: 1 }, tracos: ['+1 em todos os atributos.'] },
      { id: 'variante', nome: 'Humano variante', escolhaBonus: { qtd: 2, valor: 1 }, periciasLivres: 1, talento: { rotulo: 'Talento do humano variante' }, tracos: ['+1 em dois atributos, uma perícia e um talento.'] },
    ],
  },
  {
    id: 'draconato', nome: 'Draconato', resumo: 'Herdeiros dos dragões, com sopro elemental.', desl: 30, bonus: { for: 2, car: 1 },
    tracos: ['Ancestralidade dracônica: define o tipo de dano do sopro e da resistência.', 'Arma de sopro (2d6, recarrega em descanso).', 'Resistência ao dano da sua ancestralidade.'],
  },
  {
    id: 'gnomo', nome: 'Gnomo', resumo: 'Curiosos, inventivos e cheios de energia.', desl: 25, tamanho: 'Pequeno', bonus: { int: 2 },
    tracos: ['Visão no escuro (18 m).', 'Esperteza gnômica: vantagem em salvaguardas de Int, Sab e Car contra magia.'],
    rotuloSub: 'Sub-raça',
    subracas: [
      { id: 'floresta', nome: 'Gnomo da Floresta', bonus: { des: 1 }, tracos: ['Ilusionista nato: truque ilusão menor.', 'Fala com bestas pequenas.'] },
      { id: 'rochas', nome: 'Gnomo das Rochas', bonus: { con: 1 }, tracos: ['Conhecimento de artífice.', 'Engenhoqueiro: constrói pequenos mecanismos.'] },
    ],
  },
  {
    id: 'meio-elfo', nome: 'Meio-Elfo', resumo: 'Entre dois mundos, carismáticos e adaptáveis.', desl: 30, bonus: { car: 2 },
    escolhaBonus: { qtd: 2, valor: 1, exceto: ['car'] }, periciasLivres: 2,
    tracos: ['Visão no escuro (18 m).', 'Ancestral feérico.', 'Versatilidade em perícias: duas perícias à escolha.', '+1 em dois atributos à escolha (exceto Carisma).'],
  },
  {
    id: 'meio-orc', nome: 'Meio-Orc', resumo: 'Fortes, ferozes e difíceis de derrubar.', desl: 30, bonus: { for: 2, con: 1 }, pericias: ['intimidacao'],
    tracos: ['Visão no escuro (18 m).', 'Ameaçador: proficiência em Intimidação.', 'Resistência implacável: cai para 1 PV em vez de 0, uma vez por descanso longo.', 'Ataques selvagens: dado extra em críticos corpo a corpo.'],
  },
  {
    id: 'tiefling', nome: 'Tiefling', resumo: 'Marcados por uma herança infernal.', desl: 30, bonus: { car: 2, int: 1 },
    tracos: ['Visão no escuro (18 m).', 'Resistência infernal: resistência a fogo.', 'Legado infernal: taumaturgia (e magias extras em níveis mais altos).'],
  },
];

const antecedentes = [
  { id: 'acolito', nome: 'Acólito', pericias: ['intuicao', 'religiao'], idiomas: 'Dois à escolha', caracteristica: 'Abrigo dos fiéis.', equip: 'Símbolo sagrado, livro de orações, incensos, vestes, 15 PO.' },
  { id: 'artesao', nome: 'Artesão de Guilda', pericias: ['intuicao', 'persuasao'], ferramentas: 'Um tipo de ferramenta de artesão', idiomas: 'Um à escolha', caracteristica: 'Membro de guilda.', equip: 'Ferramentas de artesão, carta da guilda, roupas, 15 PO.' },
  { id: 'artista', nome: 'Artista', pericias: ['acrobacia', 'atuacao'], ferramentas: 'Kit de disfarce, um instrumento musical', caracteristica: 'Por demanda popular.', equip: 'Instrumento, presente de um admirador, fantasia, 15 PO.' },
  { id: 'charlatao', nome: 'Charlatão', pericias: ['enganacao', 'prestidigitacao'], ferramentas: 'Kit de disfarce, kit de falsificação', caracteristica: 'Identidade falsa.', equip: 'Roupas finas, kit de disfarce, ferramentas do golpe, 15 PO.' },
  { id: 'criminoso', nome: 'Criminoso', pericias: ['enganacao', 'furtividade'], ferramentas: 'Um jogo, ferramentas de ladrão', caracteristica: 'Contato criminoso.', equip: 'Pé de cabra, roupas escuras com capuz, 15 PO.' },
  { id: 'eremita', nome: 'Eremita', pericias: ['medicina', 'religiao'], ferramentas: 'Kit de herbalismo', idiomas: 'Um à escolha', caracteristica: 'Descoberta.', equip: 'Estojo de pergaminhos, cobertor, kit de herbalismo, 5 PO.' },
  { id: 'forasteiro', nome: 'Forasteiro', pericias: ['atletismo', 'sobrevivencia'], ferramentas: 'Um instrumento musical', idiomas: 'Um à escolha', caracteristica: 'Andarilho.', equip: 'Bordão, armadilha de caça, troféu de animal, 10 PO.' },
  { id: 'heroi', nome: 'Herói do Povo', pericias: ['adestrar', 'sobrevivencia'], ferramentas: 'Ferramenta de artesão, veículos terrestres', caracteristica: 'Hospitalidade rústica.', equip: 'Ferramentas, pá, panela de ferro, 10 PO.' },
  { id: 'marinheiro', nome: 'Marinheiro', pericias: ['atletismo', 'percepcao'], ferramentas: 'Ferramentas de navegador, veículos aquáticos', caracteristica: 'Passagem de navio.', equip: 'Malagueta, corda de seda (15 m), amuleto da sorte, 10 PO.' },
  { id: 'nobre', nome: 'Nobre', pericias: ['historia', 'persuasao'], ferramentas: 'Um jogo', idiomas: 'Um à escolha', caracteristica: 'Posição privilegiada.', equip: 'Roupas finas, anel de sinete, pergaminho de linhagem, 25 PO.' },
  { id: 'orfao', nome: 'Órfão', pericias: ['furtividade', 'prestidigitacao'], ferramentas: 'Kit de disfarce, ferramentas de ladrão', caracteristica: 'Segredos da cidade.', equip: 'Faca pequena, mapa da cidade, rato de estimação, 10 PO.' },
  { id: 'sabio', nome: 'Sábio', pericias: ['arcanismo', 'historia'], idiomas: 'Dois à escolha', caracteristica: 'Pesquisador.', equip: 'Tinta, pena, faca pequena, carta de um colega, 10 PO.' },
  { id: 'soldado', nome: 'Soldado', pericias: ['atletismo', 'intimidacao'], ferramentas: 'Um jogo, veículos terrestres', caracteristica: 'Patente militar.', equip: 'Insígnia, troféu de um inimigo, dados ou cartas, 10 PO.' },
];

const classes = {
  barbaro: {
    resumo: 'Fúria e força bruta.',
    pericias: { qtd: 2, de: ['adestrar', 'atletismo', 'intimidacao', 'natureza', 'percepcao', 'sobrevivencia'] },
    carac: ['Fúria (2 por descanso longo, +2 no dano, resistência a dano físico).', 'Defesa sem armadura: CA 10 + Des + Con.'],
    equip: 'Machado grande (ou arma marcial), duas machadinhas (ou arma simples), pacote de aventureiro, 4 azagaias.',
  },
  bardo: {
    resumo: 'Magia através da música e das palavras.',
    pericias: { qtd: 3, de: TODAS },
    magia: '2 truques e 4 magias conhecidas; 2 espaços de 1º círculo.',
    carac: ['Conjuração (Carisma).', 'Inspiração de bardo (d6, usos = mod. de Carisma).'],
    equip: 'Rapieira (ou espada longa/arma simples), pacote de diplomata ou artista, instrumento, armadura de couro, adaga.',
  },
  bruxo: {
    resumo: 'Poder vindo de um pacto com um patrono.',
    pericias: { qtd: 2, de: ['arcanismo', 'enganacao', 'historia', 'intimidacao', 'investigacao', 'natureza', 'religiao'] },
    magia: '2 truques e 2 magias conhecidas; 1 espaço de pacto (recupera em descanso curto).',
    carac: ['Patrono transcendental (escolha no 1º nível).', 'Magia de pacto (Carisma).'],
    escolhas: 'Patrono', escolhasExemplo: 'Ex.: O Corruptor',
    equip: 'Besta leve e 20 virotes (ou arma simples), bolsa de componentes ou foco arcano, pacote de estudioso ou explorador, armadura de couro, 2 adagas.',
  },
  clerigo: {
    resumo: 'Servo divino com magias de cura e proteção.',
    pericias: { qtd: 2, de: ['historia', 'intuicao', 'medicina', 'persuasao', 'religiao'] },
    magia: '3 truques; prepara Sab + nível magias; 2 espaços de 1º círculo.',
    carac: ['Conjuração (Sabedoria).', 'Domínio divino (escolha no 1º nível).'],
    escolhas: 'Domínio divino', escolhasExemplo: 'Ex.: Domínio da Vida',
    equip: 'Maça (ou martelo de guerra), cota de escamas ou couro ou cota de malha, besta leve (ou arma simples), pacote de sacerdote ou explorador, escudo, símbolo sagrado.',
  },
  druida: {
    resumo: 'Guardião da natureza que muda de forma.',
    pericias: { qtd: 2, de: ['arcanismo', 'adestrar', 'intuicao', 'medicina', 'natureza', 'percepcao', 'religiao', 'sobrevivencia'] },
    magia: '2 truques; prepara Sab + nível magias; 2 espaços de 1º círculo.',
    carac: ['Druídico (idioma secreto).', 'Conjuração (Sabedoria).'],
    equip: 'Escudo de madeira (ou arma simples), cimitarra (ou arma simples corpo a corpo), armadura de couro, pacote de explorador, foco druídico.',
  },
  feiticeiro: {
    resumo: 'Magia inata que corre no sangue.',
    pericias: { qtd: 2, de: ['arcanismo', 'enganacao', 'intuicao', 'intimidacao', 'persuasao', 'religiao'] },
    magia: '4 truques e 2 magias conhecidas; 2 espaços de 1º círculo.',
    carac: ['Conjuração (Carisma).', 'Origem de feitiçaria (escolha no 1º nível).'],
    escolhas: 'Origem de feitiçaria', escolhasExemplo: 'Ex.: Linhagem Dracônica',
    equip: 'Besta leve e 20 virotes (ou arma simples), bolsa de componentes ou foco arcano, pacote de explorador ou aventureiro, 2 adagas.',
  },
  guerreiro: {
    resumo: 'Mestre das armas e das armaduras.',
    pericias: { qtd: 2, de: ['acrobacia', 'adestrar', 'atletismo', 'historia', 'intuicao', 'intimidacao', 'percepcao', 'sobrevivencia'] },
    carac: ['Estilo de luta (escolha um).', 'Retomar o fôlego: recupera 1d10 + nível de PV, uma vez por descanso.'],
    escolhas: 'Estilo de luta', escolhasExemplo: 'Ex.: Defesa (+1 CA com armadura)',
    equip: 'Cota de malha (ou couro + arco longo), arma marcial e escudo (ou duas armas marciais), besta leve ou 2 machadinhas, pacote de aventureiro ou explorador.',
  },
  ladino: {
    resumo: 'Furtivo, habilidoso e letal no momento certo.',
    pericias: { qtd: 4, de: ['acrobacia', 'atletismo', 'enganacao', 'intuicao', 'intimidacao', 'investigacao', 'percepcao', 'atuacao', 'persuasao', 'prestidigitacao', 'furtividade'] },
    carac: ['Especialização: dobra a proficiência em duas perícias (ou ferramentas de ladrão).', 'Ataque furtivo (1d6).', 'Gíria de ladrão.'],
    equip: 'Rapieira (ou espada curta), arco curto e aljava (ou espada curta), pacote de assaltante, aventureiro ou explorador, armadura de couro, 2 adagas, ferramentas de ladrão.',
  },
  mago: {
    resumo: 'Estudioso da magia arcana com grimório.',
    pericias: { qtd: 2, de: ['arcanismo', 'historia', 'intuicao', 'investigacao', 'medicina', 'religiao'] },
    magia: '3 truques; grimório com 6 magias; prepara Int + nível; 2 espaços de 1º círculo.',
    carac: ['Conjuração (Inteligência) com grimório.', 'Recuperação arcana: recupera espaços em descanso curto, 1 vez por dia.'],
    equip: 'Bordão (ou adaga), bolsa de componentes ou foco arcano, pacote de estudioso ou explorador, grimório.',
  },
  monge: {
    resumo: 'Artista marcial movido pelo ki.',
    pericias: { qtd: 2, de: ['acrobacia', 'atletismo', 'historia', 'intuicao', 'religiao', 'furtividade'] },
    carac: ['Defesa sem armadura: CA 10 + Des + Sab.', 'Artes marciais (d4; ataque desarmado bônus).'],
    equip: 'Espada curta (ou arma simples), pacote de aventureiro ou explorador, 10 dardos.',
  },
  paladino: {
    resumo: 'Guerreiro sagrado movido por um juramento.',
    pericias: { qtd: 2, de: ['atletismo', 'intuicao', 'intimidacao', 'medicina', 'persuasao', 'religiao'] },
    magia: 'Começa a conjurar no 2º nível.',
    carac: ['Sentido divino.', 'Cura pelas mãos (reserva de 5 × nível PV).'],
    equip: 'Arma marcial e escudo (ou duas armas marciais), 5 azagaias (ou arma simples), pacote de sacerdote ou aventureiro, cota de malha, símbolo sagrado.',
  },
  patrulheiro: {
    resumo: 'Caçador e batedor das terras selvagens.',
    pericias: { qtd: 3, de: ['adestrar', 'atletismo', 'intuicao', 'investigacao', 'natureza', 'percepcao', 'furtividade', 'sobrevivencia'] },
    magia: 'Começa a conjurar no 2º nível.',
    carac: ['Inimigo favorito (escolha um tipo de criatura).', 'Explorador nato (escolha um terreno).'],
    escolhas: 'Inimigo favorito e terreno', escolhasExemplo: 'Ex.: Inimigo favorito: mortos-vivos · Terreno: floresta',
    equip: 'Brunea (ou couro), duas espadas curtas (ou duas armas simples), pacote de aventureiro ou explorador, arco longo e aljava com 20 flechas.',
  },
};

const motor = criarSistema5e({
  edicao: '2014',
  nomeSistema: 'D&D 5ª Edição (2014)',
  nomeRaca: 'Raça',
  subRaca: 'Sua raça define bônus de atributo, deslocamento e traços especiais.',
  bonusDe: 'raca',
  racas, antecedentes, classes,
});

const CENA = `
  <div class="d5-mesa"></div>
  <div class="d5-dado-wrap"><svg class="d5-dado" viewBox="0 0 100 100" aria-hidden="true">
    <polygon points="50,4 93,28 93,72 50,96 7,72 7,28" fill="#8e1b1b" stroke="#f3d9a4" stroke-width="2"/>
    <polygon points="50,24 78,66 22,66" fill="#a82424" stroke="#f3d9a4" stroke-width="2"/>
    <path d="M50 4 L50 24 M93 28 L78 66 M7 28 L22 66 M50 96 L22 66 M50 96 L78 66 M93 72 L78 66 M7 72 L22 66 M50 24 L7 28 M50 24 L93 28" stroke="#f3d9a4" stroke-width="2" fill="none"/>
    <text x="50" y="56" text-anchor="middle" font-family="Cinzel, serif" font-weight="900" font-size="20" fill="#fff6dc" class="d5-num">20</text>
  </svg></div>
  <div class="d5-critico">CRÍTICO!</div>`;

export default {
  tema: 'theme.css',
  temaClasse: 'tema-dnd5e',
  textoNovo: 'Novo aventureiro',
  intro: raiz => introGenerica(raiz, {
    classe: 'intro-dnd5e', cena: CENA, titulo: 'Dungeons & Dragons',
    frases: ['Afiando a espada…', 'Preparando magias…', 'Desenrolando o mapa…', 'Rolando iniciativa…'],
    botao: 'Abrir o Livro do Jogador', duracao: 3000, saida: 1200,
  }),
  lobby: () => h('header', { class: 'lobby-sistema' },
    h('span', { class: 'lobby-pre' }, 'Quinta Edição · 2014'),
    h('h1', null, 'D&D 5e'),
    h('p', null, 'Raça, antecedente e classe, atributos por compra de pontos (27), arranjo padrão ou rolagem. Perícias, CA, PV e testes de resistência calculados automaticamente para o 1º nível.')),
  ...motor,
};
