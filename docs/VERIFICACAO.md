# Auditoria da correção — neutralização 2.2

Comparado com:
- https://profcarolinasouza.github.io/jogoneutralizacao/
- https://arigony.github.io/neutralizacao-1/

**Fato confirmado no código original:** em `alterar(index, valor)`, a aplicação executa `renderizarMoleculas()` e cria um `a-entity` adicional para cada unidade do coeficiente. Isso explica a multiplicação na mão.

**Problema confirmado na versão 2.1:** a função `renderCoefficients()` atualizava os textos (`c0` ... `c3` e `eq0` ... `eq3`), mas não repassava o vetor de coeficientes para a projeção visual (`ARRenderer.render`).

**Correção:**
- `renderer.setCoefficients(coefficients)` ao iniciar e a cada clique.
- `copyOffsets(count)` calcula posições distintas; `renderGroup()` desenha a estrutura completa **count vezes**.
- A alteração afeta tanto demonstração quanto acompanhamento da mão; reduz `+` e restaura `−`.
- Painel de desafio trocado por versão baixa de quatro colunas, botões maiores e verificação acessível.

**Testes:** `node --test tests/*.test.mjs`. Inspeção visual simulada em 320, 360, 390, 768 e 1440 px. Uma sessão real de câmera e mão física permanece pendente.
