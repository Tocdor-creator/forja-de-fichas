// Regras de criação de personagem do Sacramento RPG (nível 1).
// Fontes: livro básico (Jambô, 2024) via guia do Movimento RPG e matéria do Jogando D20.
// Os textos de descrição aqui são resumos próprios, não transcrições do livro.

export const CONDICOES_INICIAIS = {
  vida: 6,        // Círculos de Vida
  dor: 6,         // Círculos de Dor
  acoes: 1,       // Ações de Combate
  movimento: 1,
  defesa: 5,
  pontosAtributo: 4,
  pontosAntecedente: 4,
};

export const MAX_ATRIBUTO = 2;     // máximo em um único Atributo na criação
export const MAX_ANTECEDENTE = 2;  // máximo em um único Antecedente na criação
export const HABILIDADES_INICIAIS = 2;
export const PONTOS_MONTARIA = 3;
export const LACO_MAX = 5;
export const NUMERO_ALVO = 6;

export const ATRIBUTOS = [
  { id: 'fisico', nome: 'Físico', icone: '💪', desc: 'Saúde e resistência bruta contra venenos, doenças e ferimentos.', bonus: '+1 Círculo de Vida por ponto' },
  { id: 'velocidade', nome: 'Velocidade', icone: '🏃', desc: 'Agilidade, pernas rápidas e reflexo para escapar de dinamite e desmoronamento.', bonus: '+1 Movimento por ponto' },
  { id: 'intelecto', nome: 'Intelecto', icone: '🧠', desc: 'Sagacidade, memória, dedução e investigação.', bonus: '+1 Ponto de Antecedente por ponto' },
  { id: 'coragem', nome: 'Coragem', icone: '🔥', desc: 'Força da mente, controle do medo e sangue frio na adrenalina do combate.', bonus: '+1 Ação de Combate por ponto' },
];

export const ANTECEDENTES = [
  { id: 'atencao', nome: 'Atenção', desc: 'Perceber detalhes, emboscadas, mentiras e quem entra no saloon.' },
  { id: 'medicina', nome: 'Medicina', desc: 'Tratar feridas, tirar bala, conhecer remédios e venenos.' },
  { id: 'montaria', nome: 'Montaria', desc: 'Cavalgar, lidar com animais e conduzir carroças.' },
  { id: 'tradicao', nome: 'Tradição', desc: 'Lendas, crenças, rezas e saberes antigos do Oeste Selvagem.' },
  { id: 'violencia', nome: 'Violência', desc: 'Atirar, brigar, intimidar: resolver as coisas no chumbo ou no braço.' },
  { id: 'negocios', nome: 'Negócios', desc: 'Barganhar, convencer, negociar e lidar com dinheiro.' },
  { id: 'roubo', nome: 'Roubo', desc: 'Furtar, trapacear, abrir fechaduras e passar despercebido.' },
  { id: 'suor', nome: 'Suor', desc: 'Trabalho pesado, aguentar o tranco, sobreviver na lida.' },
];

// O livro traz 30 Habilidades em duas categorias. Estas são as já divulgadas publicamente;
// as demais o jogador cadastra a partir do próprio livro (passo Habilidades → "Adicionar do livro").
export const HABILIDADES = [
  { id: 'armas-da-natureza', nome: 'Armas da Natureza', desc: 'Lutando com armas rústicas (machadinha, lança, faca de pedra), o dano do ataque aumenta em +1 para cada ponto de Físico.' },
  { id: 'coldre-de-sabao', nome: 'Coldre de Sabão', desc: 'No começo do combate, puxe duas cartas para a iniciativa e fique com a melhor.' },
  { id: 'dedo-quente', nome: 'Dedo Quente', desc: '+1 nos testes de Violência ao atirar com revólver.' },
  { id: 'boca-na-botija', nome: 'Boca na Botija', desc: 'Role 2d6 e fique com o melhor nos testes de Atenção. Nunca perde Defesa por estar surpreso no início do combate.' },
];

export const REDENCAO = {
  habilidadeExtra: 1,
  bonusRolagem: 2,
  cartaExtraIniciativa: 1,
};

export const ESPECIES_MONTARIA = ['Cavalo', 'Égua', 'Burro', 'Mula', 'Jumento', 'Camelo', 'Boi de sela', 'Outro'];

export const CONCEITOS_EXEMPLO = [
  'Pistoleiro caçador de recompensas implacável',
  'Vigarista do pôquer que vive pulando de bar em bar',
  'Ex-operária da ferrovia que resolve tudo no kung fu',
  'Velho cachaceiro que já foi pistoleiro temido',
  'Ex-padre que perdeu a fé e vive embrenhado no mato',
  'Missionária andarilha com uma escopeta e muita fé',
  'Estudante pretensioso recém-chegado da capital',
  'Ex-membro da gangue Fivela-de-Cobra fugindo do passado',
];

export const APELIDOS = [
  'Garganta Seca', 'Mão de Pilão', 'Cabeça de Bagre', 'Pé de Poeira', 'Bala Mansa', 'Trem Bão',
  'Zói de Gato', 'Fumo Bravo', 'Quebra-Queixo', 'Rapadura', 'Cascavel', 'Sem Freio',
  'Pão de Queijo', 'Dois Dedos', 'Café Ralo', 'Uai Sô', 'Ferradura', 'Cachaça Fina',
];

export function derivados(d) {
  const a = d.atributos;
  const redimido = !!d.trilha?.redimido;
  return {
    vida: CONDICOES_INICIAIS.vida + a.fisico,
    dor: CONDICOES_INICIAIS.dor,
    movimento: CONDICOES_INICIAIS.movimento + a.velocidade,
    acoes: CONDICOES_INICIAIS.acoes + a.coragem,
    defesa: CONDICOES_INICIAIS.defesa,
    pontosAntecedente: CONDICOES_INICIAIS.pontosAntecedente + a.intelecto,
    habilidades: HABILIDADES_INICIAIS + (redimido ? REDENCAO.habilidadeExtra : 0),
    bonusRedencao: redimido ? REDENCAO.bonusRolagem : 0,
    cartasIniciativa: 1 + (redimido ? REDENCAO.cartaExtraIniciativa : 0),
    vidaMontaria: d.montaria.resistencia, // bônus de Círculos de Vida da montaria
  };
}

export const soma = obj => Object.values(obj).reduce((s, v) => s + v, 0);
