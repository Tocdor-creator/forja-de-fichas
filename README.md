# Forja de Fichas

Criador de fichas de RPG para vários sistemas, no estilo D&D Beyond. Site estático (HTML + JS puro, sem build);
as fichas ficam salvas no `localStorage` do navegador e podem ser exportadas/importadas em `.json` e impressas.

## Rodar

```bash
python -m http.server 5510 --directory forja-de-fichas
```

Abra http://localhost:5510. Os módulos ES não funcionam abrindo o `index.html` direto (`file://`).

## Estrutura

```
index.html
css/base.css            tema do hub + componentes compartilhados (variáveis CSS que os temas sobrescrevem)
js/main.js              roteador por hash e telas do hub / lobby
js/core/registry.js     catálogo de sistemas (status, cor, emblema, import dinâmico)
js/core/builder.js      assistente passo a passo + visualização da ficha (genéricos)
js/core/storage.js      salvar / listar / duplicar / importar / exportar fichas
js/core/ui.js           helper h() de DOM, campos, stepper, círculos, toast
js/core/intro.js        motor de intro reutilizável (cena + carregando + botão + saída)
css/componentes.css     componentes compartilhados (atributos, seletores, resumo, ficha pronta)
systems/_d20/comum.js   peças da família d20: atributos (pontos/arranjo/4d6/manual), seletores, ficha
systems/_dnd5/          motor do D&D 5e, parametrizado por edição (2014 e 2024)
systems/<id>/           um sistema = um módulo (regras, passos, ficha, tema, intro)
```

## Sistemas

| Sistema | Pasta | Destaques |
|---|---|---|
| Sacramento RPG | `systems/sacramento` | Atributos 4 pts (máx. 2), Antecedentes, Habilidades, Trilha/Redenção, Montaria |
| D&D 5e (2014) | `systems/dnd5e` | Raças/sub-raças com bônus, 13 antecedentes, 12 classes, compra de 27 pts |
| D&D 5.5 (2024) | `systems/dnd2024` | Espécies sem bônus, antecedente dá +2/+1 ou +1/+1/+1 e talento de origem |
| D&D 3.5 | `systems/dnd35` | 25 pts, graduações de classe/fora de classe, talentos com pré-requisitos, BBA, CA toque/surpreso |
| Tormenta20 (JdA) | `systems/tormenta20` | Atributos −1 a +4 (10 pts), 17 raças, 14 classes, 35 origens, 20 deuses |
| Yggdrasill | `systems/yggdrasill` | Runas do destino (3d8), 19 pts em 9 características, 35 pts de competências, proezas |

Todas cobrem a criação no **1º nível**. Fontes: SRD 5.1/5.2 (CC-BY-4.0), SRD 3.5 (OGL), wiki da comunidade
de Tormenta20 e resenhas/walkthroughs públicos de Sacramento e Yggdrasill. Textos de habilidades são resumos
próprios; listas que não estão disponíveis publicamente (habilidades do Sacramento, competências e arquétipos
do Yggdrasill) são editáveis na própria ficha.

Rotas: `#/` hub · `#/s/<sistema>` lobby do sistema · `#/f/<id>/editar/<passo>` criação · `#/f/<id>` ficha pronta.

## Como adicionar um sistema (ex.: D&D 5e)

1. Crie `systems/dnd5e/system.js` exportando por padrão:

```js
export default {
  tema: 'theme.css',            // opcional, relativo à pasta do sistema
  temaClasse: 'tema-dnd5e',     // opcional
  intro: async (raiz) => {},    // opcional: animação de entrada (1x por sessão)
  lobby: () => Node,            // opcional: cabeçalho da página do sistema
  textoNovo: 'Novo aventureiro',
  novo: () => ({ ...dados iniciais }),
  migrar: (dados) => dados,     // opcional: atualiza fichas antigas
  titulo: (dados) => string,
  subtitulo: (dados) => string,
  passos: [{ id, titulo, subtitulo?, render(ctx) => Node, pendencias?(dados) => string[] }],
  resumo: (ctx) => Node,        // painel lateral durante a criação
  ficha: (ctx) => Node,         // ficha pronta / modo de jogo
};
```

`ctx` traz `dados` (o objeto da ficha, edite direto), `mudou(redesenhar?)` para salvar
(passe `true` em contadores para redesenhar o passo; não passe em inputs de texto para não perder o foco)
e `ir(idDoPasso)`.

2. Em `js/core/registry.js`, troque `carregar: null` por `() => import('../../systems/dnd5e/system.js')`
   e `status: 'em-breve'` por `'disponivel'`.

## Sacramento RPG

Regras de criação (nível 1) em `systems/sacramento/regras.js`:
4 pontos de Atributo (máx. 2 cada), Vida 6 + Físico, Dor 6, Movimento 1 + Velocidade,
Ações 1 + Coragem, Defesa 5, Antecedentes 4 + Intelecto (máx. 2 cada), 2 Habilidades,
Trilha (começo/fim, consequências, sacrifício, alianças), Redenção (+1 Habilidade, +2 nas rolagens,
+1 carta na Iniciativa), Montaria com 3 pontos entre Potência e Resistência, e Laço de 0 a 5.

O livro tem 30 Habilidades; só as divulgadas publicamente vêm cadastradas, e o jogador adiciona as demais
a partir do próprio livro, no passo Habilidades. As descrições são resumos, não transcrições do livro.
