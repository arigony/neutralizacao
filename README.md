# Neutraliza LAB AR 2.2.1 — visual clássico da professora Carol + seta

**Projeto colaborativo**: baseado na proposta didática da **Prof. Carolina Souza**, com aperfeiçoamentos científicos e técnicos para dispositivos móveis.

Jogo de balanceamento de neutralização com estruturas químicas desenhadas sobre a imagem da mão, reconhecimento pelo MediaPipe e demonstração sem câmera. Projeto estático (HTML, CSS e JavaScript), publicável diretamente no **GitHub Pages**, sem build.

## Ajuste da versão 2.2.1

- **Seta → inserida entre reagentes e produtos**, ao lado das estruturas sobre a mão ou na demonstração. O símbolo é redesenhado em tempo real junto com a cena e permanece visível enquanto os coeficientes mudam.
- Mantidos painel compacto e reprodução visual de cada estrutura ao pressionar `+` e `−`.

## O que mudou em relação à versão 2.1

| Recurso | 2.1 | 2.2 |
|---|---|---|
| Interface | Painel grande, com título, equação e cartões | **Painel compacto em uma fila**, inspirado no jogo da Carol |
| Coeficiente + | Apenas atualizava os números | **Desenha uma cópia adicional completa** da estrutura química na cena |
| Coeficiente − | Apenas diminuía o número | **Retira uma cópia** da estrutura química |
| Posição dos modelos | Quatro âncoras distintas nos dedos | **Uma reação disposta lado a lado**, centrada sobre a região acompanhada da mão |
| Geometria e espécies | Modelos corrigidos | **Mantidos**: tetraedro do sulfato, ângulo da água e distinção entre molécula e íons |
| Verificação | Conservação de átomos | **Mantida**: verificação de H, O, S e Na e identificação dos erros |

Exemplo: configurar `1 H₂SO₄ + 2 NaOH → 1 Na₂SO₄ + 2 H₂O` desenha, respectivamente, **1 estrutura de ácido, 2 de base, 1 de sal e 2 de água**. As cópias aparecem também no modo demonstração e acompanham a mão quando a câmera está ativa. De 1 a 3 as estruturas são empilhadas verticalmente como no original; de 4 a 8, são distribuídas em duas colunas para reduzir sobreposições. Os controles continuam permitindo de 1 a 8.

## Testar no smartphone

1. Publique os arquivos na raiz de um repositório GitHub Pages (instruções abaixo).
2. Abra o endereço `https://...github.io/.../` **no Chrome ou Safari atualizado**.
3. Toque em **Ativar câmera** e autorize a permissão.
4. Use a câmera frontal, mostre a palma da mão aberta e mantenha-a visível sob boa iluminação.
5. Toque em `+` para **observar as cópias adicionais**; `−` remove uma cópia.
6. Toque em **Verificar balanceamento**. A menor proporção correta é `[1, 2, 1, 2]`.

**Alternativa:** toque em **Explorar sem câmera** para testar toda a interação sem webcam. Na tela de câmera, existe também um botão de **Demonstração**; a opção **Trocar** alterna câmeras quando disponível.

### Publicar no GitHub Pages sem modificar o projeto original da Carol

- Faça **backup** do repositório `arigony/neutralizacao-1` antes de qualquer substituição, preferencialmente criando uma branch de teste.
- Extraia este ZIP. **Envie o conteúdo da pasta** `neutraliza_lab_v22_carol/`, não uma pasta aninhada, para a **raiz da branch** que serve o GitHub Pages.
- Em GitHub → Settings → Pages, confirme `Deploy from a branch` → `main` / `/(root)` (ou mantenha o método já configurado).
- Aguarde a atualização do endereço; use uma janela anônima ou atualização forçada se aparecer uma versão antiga em cache.
- **Não é necessário** Node.js para servir o site publicado.

## Estrutura dos arquivos

```
index.html                Página do jogo, botões e diálogos
assets/style.css          CSS responsivo compacto
assets/favicon.svg        Ícone da aplicação
src/app.js                Eventos dos botões, coeficientes e resultado
src/ar-renderer.js        Renderização e multiplicação visual das estruturas
src/hand-camera.js        MediaPipe, webcam e rastreamento da mão
src/models.js             Coordenadas 3D esquemáticas e geometrias
src/chemistry.js          Parser químico e conservação de átomos
checks/                   (quando incluído) notas de comparação
screenshots/              Prévia do modo demonstração em smartphones
screenshots/              Apenas imagens de referência, não substituem testes físicos
tests/                    Testes automatizados Node.js
```

## Como foram resolvidos os dois problemas relatados

**1. Painel de desafio muito grande.** Removida a equação duplicada do painel (ela continua na descrição superior e no resultado), abandonados os cartões altos e preservados **quatro grupos compactos lado a lado**. Nos testes simulados, o painel inferior ocupou aproximadamente **139 a 165 px** entre 360 e 1440 px de largura; em 320 × 700 px ocupou **151 px**.

**2. A estrutura não aumentava ao tocar em +.** A causa era a ausência de integração entre os coeficientes e o renderizador. Agora `src/app.js` executa `renderer.setCoefficients(coefficients)` a cada ajuste; `src/ar-renderer.js` percorre `copyOffsets(n)` e desenha **n representações separadas** da espécie correspondente. Os testes verificam 1, 2, 3 e até 8 cópias.

## Validação automatizada

Se Node.js estiver instalado:

```bash
node --test tests/*.test.mjs
```

Cobertura: geometria tetraédrica de 109,47°, ângulo de 104,5° da água, ausência de ligações covalentes Na–O nos modelos iônicos, fórmula/estequiometria, detecção de palma aberta, renderização de quatro espécies e repetição de estruturas conforme os coeficientes. O modo demonstração e os controles foram adicionalmente testados em navegador Chromium com conteúdo local incorporado, em **320×700, 360×640, 390×844, 768×900 e 1440×900**, incluindo verificação do gabarito e ausência de erros JS/rolagem horizontal.

**Limites da validação:** o ambiente de testes não permitiu abrir um servidor HTTP local pelo navegador automatizado. Os testes visuais utilizaram uma cópia temporária com CSS e JS incorporados; os arquivos distribuídos continuam modulares. Não foi possível realizar um ensaio em câmera física de celular. Por isso, é necessário testar **autorização da câmera, rastreamento e desempenho em aparelhos reais** antes de uso pedagógico.

## Nota de rigor científico

A transformação global é `H₂SO₄ + 2 NaOH → Na₂SO₄ + 2 H₂O`. Os desenhos dos grupos SO₄ têm direções tetraédricas ideais (109,47°) e a água possui ângulo H–O–H idealizado de 104,5°. Para NaOH, representam-se Na⁺ e OH⁻; para Na₂SO₄, 2 Na⁺ e SO₄²⁻, **sem desenhar ligações covalentes Na–O**. A repetição visual demonstra a **proporção estequiométrica** e não deve ser interpretada como reprodução espacial real de soluções aquosas, solvatação, formação de produtos em tempo real, superfície de potencial ou descrição cristalográfica experimental. O ácido em solução pode apresentar especiação dependente do pH.

## Dependências e privacidade

- **Código do projeto**: HTML/CSS/JavaScript, sem framework de build.
- **Rastreamento de mão**: MediaPipe Hands, carregado via CDN ao iniciar a câmera (precisa de conexão pelo menos no carregamento inicial).
- **Câmera**: exige ambiente seguro (HTTPS ou localhost) e consentimento explícito. As imagens são processadas no dispositivo pelo código desta aplicação, não são gravadas pelo jogo nem enviadas a um servidor próprio. Bibliotecas externas/CDNs seguem seus próprios termos.
- **Sem A-Frame**: os átomos e ligações são projetados a partir de coordenadas espaciais no Canvas 2D, mantendo a renderização 3D esquemática eficiente no celular.

## Créditos e cuidado com os dados coletados

**Prof. Carolina Souza** — proposta original do jogo, mecânica de coeficientes e experiência AR sobre a mão. **Colaboração científica** — revisão de modelos e visualização, estequiometria, acessibilidade técnica e testes. Preserve a versão já aplicada à turma para permitir uma comparação honesta com esta nova versão. Alterações de versão não invalidam nem alteram os dados dos estudantes obtidos no experimento original.
