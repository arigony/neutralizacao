# Correção 2.2.1 — seta de reação

## Alteração solicitada

A seta **→** agora é exibida entre os dois reagentes (H₂SO₄ e NaOH) e os dois produtos (Na₂SO₄ e H₂O) dentro da **cena de RA**, no mesmo referencial das estruturas. Ela acompanha a mão e está presente também no modo demonstração.

## Implementação

- `src/ar-renderer.js`: método `renderReactionArrow(cx, cy, unit)` com traço claro, borda escura e desenho redimensionável.
- A seta é redesenhada no fim de `render()`, após os quatro grupos, sem interferir na contagem de moléculas.
- Não houve mudanças nas fórmulas, modelos, coeficientes nem nos componentes do painel inferior.

## Validação

- 13 testes de código passaram com `node --test tests/*.test.mjs`, incluindo verificação da seta.
- Em navegador Chromium emulado nos tamanhos 320×700, 390×844 e 768×900 foram testados os controles 1,2,1,2, o botão de verificação e a ausência de rolagem horizontal ou erros JavaScript.
- Prévias: `screenshots/smartphone_arrow_320.png`, `screenshots/smartphone_arrow_390.png`, `screenshots/smartphone_arrow_768.png`.
- A interação real da câmera e do rastreamento físico ainda exige teste com smartphone.

## Publicação

Extraia o ZIP e publique os **arquivos internos** na raiz da branch GitHub Pages do seu repositório. Faça backup da versão anterior antes de substituir. O endereço `arigony.github.io/neutralizacao-1/` não foi alterado por este pacote.
