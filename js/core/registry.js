// Catálogo de sistemas. Para adicionar um sistema novo:
//  1. crie systems/<id>/system.js exportando `default` no formato descrito no README
//  2. troque a entrada abaixo de `carregar: null` para o import dinâmico
//  3. marque `status: 'disponivel'`

export const SISTEMAS = [
  {
    id: 'sacramento',
    nome: 'Sacramento RPG',
    resumo: 'Faroeste mineiro de Calango e Ramon Mineiro (Jambô). D6, baralho e redenção.',
    genero: 'Velho Oeste',
    status: 'disponivel',
    cor: '#c2703d',
    emblema: '🤠',
    carregar: () => import('../../systems/sacramento/system.js'),
  },
  { id: 'dnd5e', nome: 'D&D 5e (2014)', resumo: 'O clássico das mesas: raças, classes e antecedentes.', genero: 'Fantasia', status: 'disponivel', cor: '#b3262b', emblema: '🐉', carregar: () => import('../../systems/dnd5e/system.js') },
  { id: 'dnd2024', nome: 'D&D 5.5 (2024)', resumo: 'Regras revisadas do Livro do Jogador de 2024.', genero: 'Fantasia', status: 'disponivel', cor: '#8f1d22', emblema: '⚔️', carregar: () => import('../../systems/dnd2024/system.js') },
  { id: 'dnd35', nome: 'D&D 3.5', resumo: 'Talentos, perícias e multiclasse à moda antiga.', genero: 'Fantasia', status: 'disponivel', cor: '#6d4c9f', emblema: '📜', carregar: () => import('../../systems/dnd35/system.js') },
  { id: 'tormenta20', nome: 'Tormenta 20', resumo: 'Arton, deuses, poderes e a Tormenta à espreita.', genero: 'Fantasia', status: 'disponivel', cor: '#c4161c', emblema: '🌩️', carregar: () => import('../../systems/tormenta20/system.js') },
  { id: 'yggdrasill', nome: 'Yggdrasill', resumo: 'Sagas nórdicas (New Order): runas do destino, Fúria e proezas.', genero: 'Mitologia nórdica', status: 'disponivel', cor: '#3b6e8f', emblema: '🌳', carregar: () => import('../../systems/yggdrasill/system.js') },
];

const cache = new Map();

export function info(id) {
  return SISTEMAS.find(s => s.id === id) || null;
}

/** Carrega o módulo do sistema (e o CSS do tema dele) sob demanda. */
export async function carregar(id) {
  if (cache.has(id)) return cache.get(id);
  const meta = info(id);
  if (!meta || !meta.carregar) throw new Error(`Sistema "${id}" ainda não está disponível.`);
  const mod = (await meta.carregar()).default;
  if (mod.tema) {
    const href = new URL(mod.tema, new URL(`../../systems/${id}/`, import.meta.url)).href;
    if (!document.querySelector(`link[data-tema="${id}"]`)) {
      await new Promise(res => {
        const link = Object.assign(document.createElement('link'), { rel: 'stylesheet', href });
        link.dataset.tema = id;
        link.onload = link.onerror = res;
        document.head.append(link);
      });
    }
  }
  const sistema = { ...meta, ...mod };
  cache.set(id, sistema);
  return sistema;
}
