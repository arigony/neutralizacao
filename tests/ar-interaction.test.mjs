import test from 'node:test';
import assert from 'node:assert/strict';
import {openPalm} from '../src/hand-camera.js';
import {ARRenderer,copyOffsets} from '../src/ar-renderer.js';
function fakeHand(){
  const pts=Array.from({length:21},()=>({x:.50,y:.60}));
  pts[0]={x:.5,y:.85};pts[5]={x:.35,y:.54};pts[9]={x:.46,y:.51};pts[13]={x:.56,y:.53};pts[17]={x:.67,y:.60};
  for(const [tip,pip,mcp,x,y] of [[8,6,5,.29,.24],[12,10,9,.44,.18],[16,14,13,.59,.23],[20,18,17,.74,.33]]){
    pts[pip]={x:(x+pts[mcp].x)/2,y:(y+pts[mcp].y)/2};pts[tip]={x,y};
  }return pts;
}
test('reconhece palma aberta independentemente do eixo vertical',()=>{
  const points=fakeHand();assert.equal(openPalm(points),true);
  const inverted=points.map(p=>({x:1-p.x,y:1-p.y}));assert.equal(openPalm(inverted),true);
  assert.equal(openPalm(points.slice(0,6)),false);
});
test('não aceita mão com quatro dedos recolhidos',()=>{
  const points=fakeHand();for(const [tip,pip] of [[8,6],[12,10],[16,14],[20,18]])points[tip]={...points[pip]};
  assert.equal(openPalm(points),false);
});
test('quatro modelos aparecem no modo demonstração e em rastreamento; espelhamento é consistente',()=>{
  global.window={devicePixelRatio:1,matchMedia:()=>({matches:true})};
  global.document={hidden:false,querySelector:()=>({getBoundingClientRect:()=>({height:250})})};
  global.ResizeObserver=class{observe(){}disconnect(){}};
  global.requestAnimationFrame=()=>1;global.cancelAnimationFrame=()=>{};
  const ctx={setTransform(){},clearRect(){},save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},stroke(){}};
  const canvas={getContext:()=>ctx,addEventListener(){},removeEventListener(){}};const stage={clientWidth:390,clientHeight:844};
  const renderer=new ARRenderer(canvas,stage);const drawn=[];
  renderer.renderMolecule=(i,x,y,unit)=>{drawn.push({i,x,y,unit});};
  renderer.pill=()=>{};
  renderer.setMode('demo');renderer.render(100);
  assert.deepEqual(drawn.map(o=>o.i),[0,1,2,3]);
  assert.ok(drawn.every(o=>o.x>0&&o.x<390&&o.y>200&&o.y<600));
  const target=renderer.hitTargets[0];
  assert.equal(renderer.pickAt(target.x,target.y),0);
  assert.equal(renderer.pickAt(-1000,-1000),null);
  drawn.length=0;
  const points=fakeHand();const video={videoWidth:640,videoHeight:480};
  renderer.setHand(points,video,false);renderer.render(200);
  assert.deepEqual(drawn.map(o=>o.i),[0,1,2,3]);
  assert.equal(renderer.hitTargets.length,4);
  const firstNonMirrored=renderer.hand[5].x;
  renderer.hand=null;renderer.setHand(points,video,true);
  const firstMirrored=renderer.hand[5].x;
  assert.ok(firstNonMirrored<firstMirrored);
  renderer.clearHand();drawn.length=0;renderer.render(300);
  assert.equal(drawn.length,0);
  renderer.stop();
});

test('coeficiente gera N estruturas completas, mantendo cada espécie separada',()=>{
  assert.deepEqual([1,2,3,4,8].map(n=>copyOffsets(n).length),[1,2,3,4,8]);
  global.window={devicePixelRatio:1,matchMedia:()=>({matches:true})};
  global.document={hidden:false,querySelector:()=>({getBoundingClientRect:()=>({top:680,bottom:115,height:155})})};
  global.ResizeObserver=class{observe(){}disconnect(){}};
  global.requestAnimationFrame=()=>1;global.cancelAnimationFrame=()=>{};
  const ctx={setTransform(){},clearRect(){},save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},stroke(){}};
  const canvas={getContext:()=>ctx,addEventListener(){},removeEventListener(){}};
  const stage={clientWidth:390,clientHeight:844};
  const renderer=new ARRenderer(canvas,stage);const drawn=[];
  renderer.pill=()=>{};renderer.renderMolecule=(i,x,y)=>drawn.push({i,x,y});
  renderer.setMode('demo');renderer.setCoefficients([1,2,1,3]);renderer.render(100);
  assert.deepEqual([0,1,2,3].map(i=>drawn.filter(d=>d.i===i).length),[1,2,1,3]);
  const naoh=drawn.filter(d=>d.i===1);
  assert.notEqual(naoh[0].y,naoh[1].y);
  const positionsDemo=drawn.map(d=>[d.i,d.x,d.y]);
  drawn.length=0;renderer.setCoefficients([3,2,2,1]);renderer.render(200);
  assert.deepEqual([0,1,2,3].map(i=>drawn.filter(d=>d.i===i).length),[3,2,2,1]);
  assert.notDeepEqual(drawn.map(d=>[d.i,d.x,d.y]),positionsDemo);
  // O mesmo vetor de coeficientes precisa multiplicar os modelos sobre a mão.
  const hand=fakeHand();
  renderer.setHand(hand,{videoWidth:640,videoHeight:480},true);
  renderer.mode='tracking';drawn.length=0;renderer.render(240);
  assert.deepEqual([0,1,2,3].map(i=>drawn.filter(d=>d.i===i).length),[3,2,2,1]);
  renderer.stop();
});


test('seta entre reagentes e produtos é projetada com traço visível',()=>{
  const commands=[];
  const ctx={save(){commands.push('save')},restore(){commands.push('restore')},beginPath(){commands.push('begin')},moveTo(x,y){commands.push(['M',x,y])},lineTo(x,y){commands.push(['L',x,y])},stroke(){commands.push('stroke')}};
  ARRenderer.prototype.renderReactionArrow.call({ctx,dimensions:{width:390}},195,410,10);
  assert.equal(commands.filter(c=>c==='stroke').length,2,'contorno e traço branco');
  assert.ok(commands.some(c=>Array.isArray(c)&&c[0]==='M'&&c[1]<195));
  assert.ok(commands.some(c=>Array.isArray(c)&&c[0]==='L'&&c[1]>195));
});
