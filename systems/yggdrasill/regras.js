// Yggdrasill (Le 7ème Cercle / New Order no Brasil). Regras de criação conforme resenhas e
// walkthroughs públicos; listas de competências são sugestões editáveis — confira no livro.

export const CARACTERISTICAS = [
  { id: 'for', nome: 'Força', grupo: 'corpo' },
  { id: 'vig', nome: 'Vigor', grupo: 'corpo' },
  { id: 'agi', nome: 'Agilidade', grupo: 'corpo' },
  { id: 'int', nome: 'Intelecto', grupo: 'mente' },
  { id: 'per', nome: 'Percepção', grupo: 'mente' },
  { id: 'ten', nome: 'Tenacidade', grupo: 'mente' },
  { id: 'car', nome: 'Carisma', grupo: 'alma' },
  { id: 'ins', nome: 'Instinto', grupo: 'alma' },
  { id: 'com', nome: 'Comunicação', grupo: 'alma' },
];
export const GRUPOS = [
  { id: 'corpo', nome: 'Corpo', mult: 3 },
  { id: 'mente', nome: 'Mente', mult: 2 },
  { id: 'alma', nome: 'Alma', mult: 1 },
];

export const TOTAL_CARAC = 19;   // soma das 9 características (cada uma começa em 1)
export const MIN_CARAC = 1;
export const MAX_CARAC = 4;
export const PONTOS_COMPETENCIA = 35;
export const MAX_COMPETENCIA = 7;
export const PRIVILEGIADAS = 5;
export const PONTOS_PROEZAS = 12; // proeza custa nível × 3

export const COMPETENCIAS = [
  { id: 'acrobacia', nome: 'Acrobacia', tipo: 'geral' },
  { id: 'arte', nome: 'Arte (escáldica, entalhe…)', tipo: 'geral' },
  { id: 'artesanato', nome: 'Artesanato / Ofício', tipo: 'geral' },
  { id: 'atletismo', nome: 'Atletismo', tipo: 'geral' },
  { id: 'caca', nome: 'Caça', tipo: 'geral' },
  { id: 'cavalgar', nome: 'Cavalgar', tipo: 'geral' },
  { id: 'comercio', nome: 'Comércio', tipo: 'geral' },
  { id: 'cura', nome: 'Cura', tipo: 'geral' },
  { id: 'eloquencia', nome: 'Eloquência', tipo: 'geral' },
  { id: 'empatia', nome: 'Empatia', tipo: 'geral' },
  { id: 'esquiva', nome: 'Esquiva', tipo: 'geral' },
  { id: 'estrategia', nome: 'Estratégia', tipo: 'geral' },
  { id: 'furtividade', nome: 'Furtividade', tipo: 'geral' },
  { id: 'idiomas', nome: 'Idiomas', tipo: 'geral' },
  { id: 'intimidacao', nome: 'Intimidação', tipo: 'geral' },
  { id: 'leis', nome: 'Leis e Tradições', tipo: 'geral' },
  { id: 'natacao', nome: 'Natação', tipo: 'geral' },
  { id: 'navegacao', nome: 'Navegação', tipo: 'geral' },
  { id: 'observacao', nome: 'Observação', tipo: 'geral' },
  { id: 'sagas', nome: 'Sagas', tipo: 'geral' },
  { id: 'seducao', nome: 'Sedução', tipo: 'geral' },
  { id: 'sobrevivencia', nome: 'Sobrevivência', tipo: 'geral' },
  { id: 'galdr', nome: 'Galdr', tipo: 'magia' },
  { id: 'runas', nome: 'Runas', tipo: 'magia' },
  { id: 'seidr', nome: 'Seidr', tipo: 'magia' },
  { id: 'briga', nome: 'Briga', tipo: 'combate' },
  { id: 'armas-curtas', nome: 'Armas Curtas', tipo: 'combate' },
  { id: 'armas-longas', nome: 'Armas Longas', tipo: 'combate' },
  { id: 'armas-haste', nome: 'Armas de Haste', tipo: 'combate' },
  { id: 'armas-pesadas', nome: 'Armas Pesadas (duas mãos)', tipo: 'combate' },
  { id: 'arremesso', nome: 'Armas de Arremesso', tipo: 'combate' },
  { id: 'arco', nome: 'Arco', tipo: 'combate' },
];

export const ARQUETIPOS = [
  { grupo: 'Nobres', itens: ['Jarl', 'Chefe Guerreiro', 'Conselheiro'] },
  { grupo: 'Guerreiros', itens: ['Hirdman', 'Berserker', 'Mercenário'] },
  { grupo: 'Sábios', itens: ['Völva', 'Thulr', 'Escaldo', 'Curandeiro'] },
  { grupo: 'Trabalhadores', itens: ['Artesão', 'Fazendeiro', 'Lenhador', 'Minerador'] },
  { grupo: 'Viajantes', itens: ['Mercador', 'Emissário', 'Ferreiro Errante', 'Espião'] },
];
// Predefinições conhecidas (o resto o jogador marca a partir do livro)
export const PRESETS = {
  Berserker: { privilegiadas: ['atletismo', 'esquiva', 'intimidacao', 'sobrevivencia'], combate: 1, dom: 'Guerreiro Selvagem', furia: 'Vigor + Instinto + Tenacidade' },
};

export const REINOS = ['Dinamarca', 'Noruega', 'Svitjod (Suécia)', 'Gotalândia', 'Islândia', 'Ilhas do Norte', 'Terras dos Sami', 'Frísia', 'Outro'];

// três ættir de 8 runas cada (rolar 1d8 por ætt)
export const AETTIR = [
  { id: 'frey', nome: 'Ætt de Frey', runas: [
    ['Fehu', 'ᚠ', 'riqueza e posses'], ['Uruz', 'ᚢ', 'força bruta e vigor'], ['Thurisaz', 'ᚦ', 'conflito e gigantes'], ['Ansuz', 'ᚨ', 'palavra e sabedoria de Odin'],
    ['Raidho', 'ᚱ', 'jornada e caminho'], ['Kenaz', 'ᚲ', 'tocha, conhecimento e ofício'], ['Gebo', 'ᚷ', 'dádiva e pacto'], ['Wunjo', 'ᚹ', 'alegria e harmonia']] },
  { id: 'heimdall', nome: 'Ætt de Heimdall', runas: [
    ['Hagalaz', 'ᚺ', 'granizo e ruptura'], ['Naudhiz', 'ᚾ', 'necessidade e privação'], ['Isa', 'ᛁ', 'gelo e imobilidade'], ['Jera', 'ᛃ', 'colheita e ciclos'],
    ['Eihwaz', 'ᛇ', 'teixo, resistência e morte'], ['Perthro', 'ᛈ', 'sorte e mistério'], ['Algiz', 'ᛉ', 'proteção contra o mal', 'positivo'], ['Sowilo', 'ᛊ', 'sol e vitória']] },
  { id: 'tyr', nome: 'Ætt de Tyr', runas: [
    ['Tiwaz', 'ᛏ', 'justiça e sacrifício'], ['Berkano', 'ᛒ', 'nascimento e família'], ['Ehwaz', 'ᛖ', 'cavalo e progresso', 'positivo'], ['Mannaz', 'ᛗ', 'humanidade e laços'],
    ['Laguz', 'ᛚ', 'água e intuição'], ['Ingwaz', 'ᛜ', 'fertilidade e conclusão'], ['Dagaz', 'ᛞ', 'aurora e despertar'], ['Othala', 'ᛟ', 'herança e terra natal']] },
];

export const TIPOS_PROEZA = ['Ataque', 'Defesa', 'Utilidade', 'Magia'];
