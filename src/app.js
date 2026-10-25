import {analyzeBalance,MAX_COEFF,MIN_COEFF} from './chemistry.js';
import {ARRenderer} from './ar-renderer.js';
import {HandCamera} from './hand-camera.js';

const $=id=>document.getElementById(id);
const labels=['H₂SO₄','NaOH','Na₂SO₄','H₂O'];
const names=['ácido sulfúrico','hidróxido de sódio','sulfato de sódio','água'];
let coefficients=[1,1,1,1];let mode='idle';let lastSelection=-1;let selectionTimer;
const renderer=new ARRenderer($('ar-layer'),$('scene'));
const camera=new HandCamera($('camera'),(landmarks,video,mirrored)=>{
  renderer.setHand(landmarks,video,mirrored);
},onCameraState);
function setStatus(label,active=false){$('status-text').textContent=label;$('status-pill').classList.toggle('active',active);}
function showHelp(text,show=true){$('hand-help').hidden=!show;$('hand-help-text').textContent=text;}
function setMode(next){mode=next;renderer.setMode(next);$('center-prompt').hidden=next!=='idle';$('camera-flip').hidden=!['requesting','loading','searching','tracking'].includes(next);$('demo-button').hidden=next==='demo';$('camera-action').textContent=['requesting','loading','searching','tracking'].includes(next)?'Desativar câmera':'Ativar câmera';$('camera-toggle').setAttribute('aria-label',$('camera-action').textContent);
  document.querySelector('.demo-background').classList.toggle('is-hidden',['requesting','loading','searching','tracking'].includes(next));
}
function onCameraState(state,error){
  if(state==='off'){if(['searching','tracking','loading','requesting'].includes(mode)){setMode('idle');setStatus('MODO EXPLORAR');showHelp('',false);}return;}
  if(state==='requesting'){setMode('requesting');setStatus('PERMISSÃO DE CÂMERA');showHelp('Permita o acesso à câmera para continuar.');}
  if(state==='loading'){setMode('loading');setStatus('INICIANDO RASTREAMENTO');showHelp('Preparando reconhecimento da mão...');}
  if(state==='searching'){if(mode!=='searching'){renderer.clearHand();setMode('searching');}setStatus('PROCURANDO A MÃO');showHelp('✋ Mostre a palma aberta na região central da câmera.');$('instruction-text').textContent='Posicione a mão aberta no centro da câmera; os quatro modelos aparecem junto aos dedos.';}
  if(state==='tracking'){mode='tracking';renderer.mode='tracking';setStatus('MÃO DETECTADA · RA',true);showHelp('',false);$('instruction-text').textContent='Toque em uma estrutura para destacá-la. Ajuste os números e confira a reação.';}
  if(state==='error'){setStatus('FALHA NO RASTREAMENTO');showHelp(error?.message||'O rastreamento falhou. Use o modo demonstração.');}
}
async function startCamera(facing){
  try{await camera.start(facing);}catch(e){
    console.error('Falha de câmera:',e);
    setMode('idle');setStatus('CÂMERA INDISPONÍVEL');
    const msg=e.name==='NotAllowedError'?'A câmera foi bloqueada. Habilite nas permissões do navegador.':e.name==='NotFoundError'?'Nenhuma câmera foi encontrada neste dispositivo.':e.message||'Não foi possível iniciar a câmera.';
    $('prompt-title').textContent='Não foi possível iniciar a câmera';$('prompt-desc').textContent=msg+' Você ainda pode usar o jogo sem câmera.';
    $('start-button').textContent='Tentar novamente';showHelp('',false);
  }
}
function demo(){camera.stop();setMode('demo');setStatus('DEMONSTRAÇÃO · 4 MODELOS',true);showHelp('',false);
  $('instruction-text').textContent='Toque em uma estrutura para identificá-la. Ajuste os coeficientes e verifique os átomos.';
}
$('start-button').addEventListener('click',()=>startCamera('user'));
$('camera-toggle').addEventListener('click',()=>['requesting','loading','searching','tracking'].includes(mode)?demo():startCamera(camera.facingMode));
$('camera-flip').addEventListener('click',()=>startCamera(camera.facingMode==='user'?'environment':'user'));
$('demo-button').addEventListener('click',demo);
$('start-demo').addEventListener('click',demo);

function markActive(index){lastSelection=index;renderer.setActive(index);document.querySelectorAll('.chem-control').forEach((el,i)=>el.classList.toggle('selected',i===index));
  $('selection-pill').textContent=labels[index]+' · '+names[index];$('selection-pill').hidden=false;
  clearTimeout(selectionTimer);selectionTimer=setTimeout(()=>{$('selection-pill').hidden=true;document.querySelectorAll('.chem-control').forEach(el=>el.classList.remove('selected'));},1100);
}
renderer.onPick=markActive;
function renderCoefficients(){renderer.setCoefficients(coefficients);coefficients.forEach((c,i)=>{$('c'+i).textContent=c;$('eq'+i).textContent=c;});
  document.querySelectorAll('.stepper button').forEach(button=>{const i=Number(button.dataset.i),change=Number(button.dataset.d);button.disabled=coefficients[i]+change<MIN_COEFF||coefficients[i]+change>MAX_COEFF;});
}
$('steppers').addEventListener('click',event=>{
  const button=event.target.closest('button[data-i]');
  if(button){const i=Number(button.dataset.i),delta=Number(button.dataset.d);const next=coefficients[i]+delta;if(next<1||next>8)return;coefficients[i]=next;renderCoefficients();markActive(i);}
  else {const control=event.target.closest('.chem-control');if(control)markActive(Number(control.dataset.index));}
});
function reset(){coefficients=[1,1,1,1];renderCoefficients();renderer.setActive(-1);document.querySelectorAll('.chem-control').forEach(el=>el.classList.remove('selected'));$('selection-pill').hidden=true;}
$('reset').addEventListener('click',reset);

function openDialog(id){const dialog=$(id);if(!dialog.open)dialog.showModal();}
document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>$(button.dataset.close).close()));
for(const dialog of [$('info-dialog'),$('result-dialog')]){
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
}
$('info-button').addEventListener('click',()=>openDialog('info-dialog'));
$('result-restart').addEventListener('click',()=>{$('result-dialog').close();reset();});

function verify(){
  const analysis=analyzeBalance(coefficients);const modal=$('result-dialog');
  modal.classList.toggle('is-error',!analysis.conservation);
  $('result-flag').textContent=analysis.conservation?'CONSERVAÇÃO CONFIRMADA':'CONSERVAÇÃO INCOMPLETA';
  $('result-symbol').textContent=analysis.conservation?'✓':'!';
  $('result-title').textContent=analysis.conservation?(analysis.minimal?'Balanceamento correto!':'Átomos conservados!'):'Ainda não está balanceada';
  const mistakes=analysis.rows.filter(row=>!row.balanced).map(r=>r.element);
  $('result-description').textContent=analysis.conservation?
    analysis.minimal?'Excelente! Você encontrou a menor proporção inteira e conservou todos os átomos.':'Os átomos estão conservados, mas os coeficientes podem ser simplificados pela mesma razão.':
    'Confira os elementos '+mistakes.join(', ')+'. Os dois lados precisam conter a mesma quantidade de cada elemento.';
  $('result-equation').innerHTML=coefficients.map((c,i)=>`<span><b>${c}</b>${labels[i]}</span>${i===0||i===2?'<span>+</span>':i===1?'<span>→</span>':''}`).join('');
  $('atom-results').replaceChildren(...analysis.rows.map(row=>{
    const tr=document.createElement('tr');
    [row.element,row.reactants,row.products,row.balanced?'✓ Igual':'✕ Diferente'].forEach((val,i)=>{const td=document.createElement('td');td.textContent=val;if(i===3)td.className=row.balanced?'ok':'bad';tr.append(td);});
    return tr;
  }));
  $('result-note').textContent=analysis.conservation?
    analysis.minimal?'Equação global: H₂SO₄ + 2 NaOH → Na₂SO₄ + 2 H₂O. Os índices das fórmulas não mudam.':
      `Divida todos os coeficientes por ${analysis.divisor} para obter a menor proporção inteira.`:
      `Você já igualou ${analysis.matched} de 4 elementos. Ajuste os coeficientes sem modificar as fórmulas químicas.`;
  openDialog('result-dialog');
}
$('verify').addEventListener('click',verify);
window.addEventListener('pagehide',()=>camera.stop());
renderCoefficients();
