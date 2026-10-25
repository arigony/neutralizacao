import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeBalance, parseFormula, gcd} from '../src/chemistry.js';
import {angleBetween, TETRA_DIRECTIONS, SPECIES} from '../src/models.js';

test('leitura das fórmulas e parênteses',()=>{
  assert.deepEqual(parseFormula('H2SO4'),{H:2,S:1,O:4});
  assert.deepEqual(parseFormula('Ca(OH)2'),{Ca:1,O:2,H:2});
  assert.deepEqual(parseFormula('Al2(SO4)3'),{Al:2,S:3,O:12});
  assert.deepEqual(parseFormula('Mg(OH)2'),{Mg:1,O:2,H:2});
});
test('não aceita índices inválidos',()=>{
  assert.throws(()=>parseFormula('H0O'),/Índice/);
  assert.throws(()=>parseFormula('Ca(OH'),/Parêntese/);
  assert.throws(()=>parseFormula('Ca)OH('),/Parêntese/);
});
test('detecta a reação correta na menor proporção',()=>{
  const result=analyzeBalance([1,2,1,2]);
  assert.equal(result.conservation,true);
  assert.equal(result.minimal,true);
  assert.equal(result.matched,4);
  assert.deepEqual(result.rows.map(({element,reactants,products})=>[element,reactants,products]),
    [['H',4,4],['O',6,6],['S',1,1],['Na',2,2]]);
});
test('diferencia desbalanceamento e coeficientes não mínimos',()=>{
  assert.equal(analyzeBalance([1,1,1,1]).conservation,false);
  const multiple=analyzeBalance([2,4,2,4]);
  assert.equal(multiple.conservation,true);
  assert.equal(multiple.minimal,false);
  assert.equal(multiple.divisor,2);
});
test('impede coeficientes negativos, não inteiros ou fora da faixa',()=>{
  for(const input of [[0,2,1,2],[-1,2,1,2],[1.5,2,1,2],[1,9,1,2],[1,2,1]])assert.throws(()=>analyzeBalance(input));
});
test('direções tetraédricas são rigorosamente 109,4712° entre si',()=>{
  for(let i=0;i<4;i++)for(let j=i+1;j<4;j++){
    assert.ok(Math.abs(angleBetween(TETRA_DIRECTIONS[i],TETRA_DIRECTIONS[j])-109.47122063449069)<1e-7);
  }
});
test('ângulo da água é de 104,5°',()=>{
  const atoms=SPECIES.h2o.atoms;
  const first=[atoms[1].x-atoms[0].x,atoms[1].y-atoms[0].y,atoms[1].z-atoms[0].z];
  const second=[atoms[2].x-atoms[0].x,atoms[2].y-atoms[0].y,atoms[2].z-atoms[0].z];
  assert.ok(Math.abs(angleBetween(first,second)-104.5)<1e-8);
});
test('não há ligações covalentes desenhadas entre Na+ e as espécies iônicas',()=>{
  for(const key of ['naoh','na2so4']) {
    const mol=SPECIES[key];
    for(const [a,b] of mol.bonds) {
      assert.notEqual(mol.atoms[a].symbol,'Na');
      assert.notEqual(mol.atoms[b].symbol,'Na');
    }
  }
});
