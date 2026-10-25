/** Coordenadas pedagógicas (unidades arbitrárias), não cristalografia experimental. */
const t = 1 / Math.sqrt(3);
export const TETRA_DIRECTIONS = Object.freeze([
  [ t, t, t], [ t,-t,-t], [-t, t,-t], [-t,-t, t]
]);
const add = (a, b, scale = 1) => a.map((v, i) => v + b[i] * scale);
const vec = a => ({x: a[0], y: a[1], z: a[2]});
const atom = (symbol, coords, extra = {}) => ({symbol, ...vec(coords), ...extra});

function sulfate(acid = false) {
  const atoms = [atom('S', [0,0,0])];
  const bonds = [];
  TETRA_DIRECTIONS.forEach((direction, i) => {
    atoms.push(atom('O', direction.map(v => v * 1.52)));
    bonds.push([0, i + 1]);
  });
  if (acid) {
    // Dois grupos –OH: H apontado para fora da direção S–O, geometria aproximada.
    for (const i of [1, 3]) {
      const o = atoms[i];
      const oCoords = [o.x, o.y, o.z];
      const toward = TETRA_DIRECTIONS[(i + 1) % 4];
      const hyd = add(oCoords, [toward[0] * .45 + o.x * .36, toward[1] * .45 + o.y * .36, toward[2] * .45 + o.z * .36]);
      atoms.push(atom('H', hyd));
      bonds.push([i, atoms.length - 1]);
    }
  }
  return {atoms, bonds};
}

const sulphate = sulfate(false);
const sulfuric = sulfate(true);
const halfAngle = 104.5 * Math.PI / 360;

export const SPECIES = Object.freeze({
  h2so4: {
    label: 'Ácido sulfúrico', formula: 'H₂SO₄ · modelo de conectividade', category: 'ÁCIDO MOLECULAR',
    explanation: 'Modelo esquemático H–O–S(=O)₂–O–H: quatro direções S–O tetraédricas ideais. Comprimentos, ângulos O–H e ligações S–O são aproximações didáticas.',
    scale: 1.03, ...sulfuric
  },
  naoh: {
    label: 'Hidróxido de sódio', formula: 'Na⁺ + OH⁻ · espécies em solução', category: 'BASE IÔNICA',
    explanation: 'Em solução aquosa, NaOH é representado por Na⁺ e OH⁻ separados; a ligação O–H é covalente. Não existe aqui uma ligação covalente Na–O.',
    scale: .93,
    atoms: [atom('Na', [-2.2,-.30,.05], {charge: '+'}), atom('O', [.70,.14,0], {charge: '−'}), atom('H', [1.64,.45,0])],
    bonds: [[1,2]]
  },
  na2so4: {
    label: 'Sulfato de sódio', formula: '2 Na⁺ + SO₄²⁻ · íons em solução', category: 'SAL IÔNICO',
    explanation: 'Modelo esquemático de SO₄²⁻ com quatro oxigênios em geometria tetraédrica ideal (~109,47°), acompanhado de dois Na⁺ sem ligação covalente. Não representa a estrutura cristalina.',
    scale: .82,
    atoms: [...sulphate.atoms, atom('Na',[-3.05,.15,0],{charge:'+'}), atom('Na',[3.05,-.2,0],{charge:'+'})],
    bonds: sulphate.bonds,
    clusterLabel: 'SO₄²⁻'
  },
  h2o: {
    label: 'Água', formula: 'H₂O · geometria angular', category: 'MOLÉCULA POLAR',
    explanation: 'A água possui geometria angular, com ângulo H–O–H de aproximadamente 104,5°. O desenho mostra as duas ligações O–H em um plano.',
    scale: 1.15,
    atoms: [atom('O',[0,-.35,0]), atom('H',[-Math.sin(halfAngle)*1.19,-.35+Math.cos(halfAngle)*1.19,0]), atom('H',[Math.sin(halfAngle)*1.19,-.35+Math.cos(halfAngle)*1.19,0])],
    bonds: [[0,1],[0,2]]
  }
});

export function angleBetween(a, b) {
  const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);
  const norm = v => Math.sqrt(v.reduce((sum, n) => sum + n*n, 0));
  return Math.acos(Math.max(-1, Math.min(1, dot / (norm(a) * norm(b))))) * 180 / Math.PI;
}
