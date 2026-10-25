# Relatório de testes — Neutraliza LAB AR 2.1

Data: 22/10/2026

## Verificações concluídas

- `npm test` com 11 testes unitários: **11 passaram, 0 falharam**.
- `node --check` nos arquivos principais: sem erros de sintaxe.
- `index.html`: análise sintática estrutural e conferência de caminhos locais.
- Modelos geométricos: 4 direções tetraédricas, ângulo ~109,47°; água 104,5°.
- Conservação estequiométrica: 1:2:1:2 com H=4, O=6, S=1, Na=2 em cada lado.
- Modelo iônico: sem ligação artificial Na–O nos compostos NaOH e Na₂SO₄.
- Testes de lógica de mão aberta, espelhamento, quatro âncoras e detecção de toque no modelo.

## O que ainda NÃO foi validado

- **Teste de ponta a ponta com navegador**: a automação Chromium do ambiente de execução retornou `ERR_BLOCKED_BY_ADMINISTRATOR` até para páginas locais. Isso é uma limitação do ambiente de teste, não uma confirmação de defeito no código.
- **Câmera real** e MediaPipe em aparelhos Android/iOS, reconhecimento da mão, estabilidade de rastreamento e consumo de bateria.
- **Usabilidade com alunos** e comparação pré/pós-teste: exigem nova coleta empírica.

Use `VALIDACAO_SMARTPHONE.md` como checklist antes de uma aplicação acadêmica.
