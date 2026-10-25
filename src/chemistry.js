/** Lógica química pura, sem DOM e sem dependências externas. */
export const FORMULAS = Object.freeze(['H2SO4', 'NaOH', 'Na2SO4', 'H2O']);
export const ELEMENTS = Object.freeze(['H', 'O', 'S', 'Na']);
export const MIN_COEFF = 1;
export const MAX_COEFF = 8;

/** Parser de fórmulas convencionais com parênteses e índices: Ca(OH)2, H2SO4. */
export function parseFormula(formula) {
  if (typeof formula !== 'string' || !formula.length) throw new Error('Fórmula vazia.');
  let pos = 0;
  function readNumber() {
    const start = pos;
    while (pos < formula.length && /[0-9]/.test(formula[pos])) pos++;
    const n = start === pos ? 1 : Number(formula.slice(start, pos));
    if (!Number.isSafeInteger(n) || n < 1) throw new Error('Índice inválido.');
    return n;
  }
  function parseGroup(nested = false) {
    const counts = {};
    let hasItem = false;
    while (pos < formula.length && formula[pos] !== ')') {
      if (formula[pos] === '(') {
        pos++;
        const group = parseGroup(true);
        const factor = readNumber();
        for (const [element, n] of Object.entries(group)) counts[element] = (counts[element] || 0) + n * factor;
      } else {
        const match = /^[A-Z][a-z]?/.exec(formula.slice(pos));
        if (!match) throw new Error(`Símbolo inválido em ${pos}.`);
        pos += match[0].length;
        counts[match[0]] = (counts[match[0]] || 0) + readNumber();
      }
      hasItem = true;
    }
    if (!hasItem) throw new Error('Grupo químico vazio.');
    if (nested) {
      if (formula[pos] !== ')') throw new Error('Parêntese não fechado.');
      pos++;
    }
    return counts;
  }
  const counts = parseGroup();
  if (pos !== formula.length) throw new Error('Parêntese inesperado.');
  return counts;
}

const composition = FORMULAS.map(parseFormula);

export function gcd(a, b) { while (b !== 0) [a, b] = [b, a % b]; return a; }
export function analyzeBalance(coefficients) {
  if (!Array.isArray(coefficients) || coefficients.length !== FORMULAS.length ||
    !coefficients.every(c => Number.isSafeInteger(c) && c >= MIN_COEFF && c <= MAX_COEFF)) {
    throw new Error('Coeficientes devem ser inteiros entre 1 e 8.');
  }
  const rows = ELEMENTS.map(element => {
    const reactants = coefficients[0] * (composition[0][element] || 0) + coefficients[1] * (composition[1][element] || 0);
    const products = coefficients[2] * (composition[2][element] || 0) + coefficients[3] * (composition[3][element] || 0);
    return {element, reactants, products, balanced: reactants === products};
  });
  const conservation = rows.every(row => row.balanced);
  const divisor = coefficients.reduce(gcd);
  return {rows, conservation, minimal: conservation && divisor === 1, divisor, matched: rows.filter(r => r.balanced).length};
}
