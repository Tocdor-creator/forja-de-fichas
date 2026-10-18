// Dados compartilhados entre D&D 5e (2014) e D&D 5.5 (2024), baseados nos SRDs 5.1 e 5.2 (CC-BY-4.0).
// Os textos são resumos próprios, em português.

export const PERICIAS = [
  { id: 'acrobacia', nome: 'Acrobacia', atr: 'des' },
  { id: 'adestrar', nome: 'Adestrar Animais', atr: 'sab' },
  { id: 'arcanismo', nome: 'Arcanismo', atr: 'int' },
  { id: 'atletismo', nome: 'Atletismo', atr: 'for' },
  { id: 'atuacao', nome: 'Atuação', atr: 'car' },
  { id: 'enganacao', nome: 'Enganação', atr: 'car' },
  { id: 'furtividade', nome: 'Furtividade', atr: 'des' },
  { id: 'historia', nome: 'História', atr: 'int' },
  { id: 'intimidacao', nome: 'Intimidação', atr: 'car' },
  { id: 'intuicao', nome: 'Intuição', atr: 'sab' },
  { id: 'investigacao', nome: 'Investigação', atr: 'int' },
  { id: 'medicina', nome: 'Medicina', atr: 'sab' },
  { id: 'natureza', nome: 'Natureza', atr: 'int' },
  { id: 'percepcao', nome: 'Percepção', atr: 'sab' },
  { id: 'persuasao', nome: 'Persuasão', atr: 'car' },
  { id: 'prestidigitacao', nome: 'Prestidigitação', atr: 'des' },
  { id: 'religiao', nome: 'Religião', atr: 'int' },
  { id: 'sobrevivencia', nome: 'Sobrevivência', atr: 'sab' },
];
export const TODAS = PERICIAS.map(p => p.id);
export const nomePericia = id => PERICIAS.find(p => p.id === id)?.nome || id;

export const ALINHAMENTOS = ['Leal e Bom', 'Neutro e Bom', 'Caótico e Bom', 'Leal e Neutro', 'Neutro', 'Caótico e Neutro', 'Leal e Mau', 'Neutro e Mau', 'Caótico e Mau'];

// CA base, se soma Des e o limite de Des
export const ARMADURAS = [
  { id: 'nenhuma', nome: 'Sem armadura', base: 10, des: true, max: null },
  { id: 'acolchoada', nome: 'Acolchoada (leve)', base: 11, des: true, max: null },
  { id: 'couro', nome: 'Couro (leve)', base: 11, des: true, max: null },
  { id: 'couro-batido', nome: 'Couro batido (leve)', base: 12, des: true, max: null },
  { id: 'gibao', nome: 'Gibão de peles (média)', base: 12, des: true, max: 2 },
  { id: 'camisao', nome: 'Camisão de malha (média)', base: 13, des: true, max: 2 },
  { id: 'brunea', nome: 'Brunea (média)', base: 14, des: true, max: 2 },
  { id: 'peitoral', nome: 'Peitoral (média)', base: 14, des: true, max: 2 },
  { id: 'meia', nome: 'Meia armadura (média)', base: 15, des: true, max: 2 },
  { id: 'aneis', nome: 'Cota de anéis (pesada)', base: 14, des: false },
  { id: 'malha', nome: 'Cota de malha (pesada)', base: 16, des: false },
  { id: 'talas', nome: 'Cota de talas (pesada)', base: 17, des: false },
  { id: 'placas', nome: 'Placas (pesada)', base: 18, des: false },
];

export const PONTOS = {
  total: 27, min: 8, max: 15, inicial: 8,
  custo: { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 },
};
export const ARRANJO = [15, 14, 13, 12, 10, 8];

/** Base das 12 classes; cada edição completa/ajusta (perícias, magias, características). */
export const CLASSES_BASE = {
  barbaro: { nome: 'Bárbaro', dv: 12, salv: ['for', 'con'], prof: 'Armaduras leves e médias, escudos, armas simples e marciais.', defesaSemArmadura: 'con' },
  bardo: { nome: 'Bardo', dv: 8, salv: ['des', 'car'], conj: 'car', prof: 'Armaduras leves, armas simples, 3 instrumentos musicais.' },
  bruxo: { nome: 'Bruxo', dv: 8, salv: ['sab', 'car'], conj: 'car', prof: 'Armaduras leves, armas simples.' },
  clerigo: { nome: 'Clérigo', dv: 8, salv: ['sab', 'car'], conj: 'sab', prof: 'Armaduras leves e médias, escudos, armas simples.' },
  druida: { nome: 'Druida', dv: 8, salv: ['int', 'sab'], conj: 'sab', prof: 'Armaduras leves e médias e escudos (não metálicos), kit de herbalismo.' },
  feiticeiro: { nome: 'Feiticeiro', dv: 6, salv: ['con', 'car'], conj: 'car', prof: 'Adagas, dardos, fundas, bordões e bestas leves.' },
  guerreiro: { nome: 'Guerreiro', dv: 10, salv: ['for', 'con'], prof: 'Todas as armaduras, escudos, armas simples e marciais.' },
  ladino: { nome: 'Ladino', dv: 8, salv: ['des', 'int'], prof: 'Armaduras leves, armas simples, bestas de mão, espadas longas, rapieiras, espadas curtas, ferramentas de ladrão.', especialidade: 2 },
  mago: { nome: 'Mago', dv: 6, salv: ['int', 'sab'], conj: 'int', prof: 'Adagas, dardos, fundas, bordões e bestas leves.' },
  monge: { nome: 'Monge', dv: 8, salv: ['for', 'des'], prof: 'Armas simples e espadas curtas, uma ferramenta de artesão ou instrumento.', defesaSemArmadura: 'sab' },
  paladino: { nome: 'Paladino', dv: 10, salv: ['sab', 'car'], conj: 'car', prof: 'Todas as armaduras, escudos, armas simples e marciais.' },
  patrulheiro: { nome: 'Patrulheiro', dv: 10, salv: ['for', 'des'], conj: 'sab', prof: 'Armaduras leves e médias, escudos, armas simples e marciais.' },
};

export const pes = ft => `${(ft * 0.3).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} m`;
