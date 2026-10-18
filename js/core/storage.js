// Persistência das fichas no navegador (localStorage), com fallback em memória.
// Formato de cada ficha: { id, sistema, criadoEm, atualizadoEm, dados }
import { uid } from './ui.js';

const KEY = 'forja.fichas.v1';
let memoria = null; // usado quando o localStorage não está disponível

function lerTudo() {
  if (memoria) return memoria;
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    memoria = [];
    return memoria;
  }
}

function gravarTudo(lista) {
  try {
    localStorage.setItem(KEY, JSON.stringify(lista));
  } catch {
    memoria = lista;
  }
}

export function listar() {
  return lerTudo().sort((a, b) => (b.atualizadoEm || 0) - (a.atualizadoEm || 0));
}

export function obter(id) {
  return lerTudo().find(f => f.id === id) || null;
}

export function criar(sistema, dados) {
  const agora = Date.now();
  const ficha = { id: uid(), sistema, criadoEm: agora, atualizadoEm: agora, dados };
  gravarTudo([...lerTudo(), ficha]);
  return ficha;
}

export function salvar(ficha) {
  ficha.atualizadoEm = Date.now();
  const lista = lerTudo().filter(f => f.id !== ficha.id);
  lista.push(ficha);
  gravarTudo(lista);
}

export function remover(id) {
  gravarTudo(lerTudo().filter(f => f.id !== id));
}

export function duplicar(id) {
  const orig = obter(id);
  if (!orig) return null;
  return criar(orig.sistema, structuredClone(orig.dados));
}

/** Lê um arquivo .json exportado e cria uma ficha nova a partir dele. */
export async function importar(arquivo) {
  const obj = JSON.parse(await arquivo.text());
  if (!obj || typeof obj.sistema !== 'string' || typeof obj.dados !== 'object') {
    throw new Error('Arquivo não parece ser uma ficha da Forja.');
  }
  return criar(obj.sistema, obj.dados);
}

export function exportar(ficha) {
  const { sistema, dados } = ficha;
  return JSON.stringify({ formato: 'forja-de-fichas', versao: 1, sistema, dados }, null, 2);
}
