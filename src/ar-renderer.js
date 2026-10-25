import {SPECIES} from './models.js';

const FORMULA_LABELS=['H₂SO₄','NaOH','Na₂SO₄','H₂O'];
const KEYS=['h2so4','naoh','na2so4','h2o'];
const COLORS={H:['#fff','#e6f0f7','#9aaaba'],O:['#ffe1e2','#fd687e','#ae2845'],S:['#fff6bf','#ffce5a','#9b651a'],Na:['#e6dbff','#a58af7','#6549b3']};
const clamp=(x,min,max)=>Math.max(min,Math.min(max,x));
const between=(a,b,t)=>({x:a.x*(1-t)+b.x*t,y:a.y*(1-t)+b.y*t});

/** Offsets normalizados: até 3 unidades em coluna (como no jogo de Carol),
 * 4 a 8 em duas colunas. CADA coeficiente desenha uma estrutura completa.
 */
export function copyOffsets(count){
  const n=Math.max(1,Math.min(8,Math.round(count)));
  if(n<=3)return Array.from({length:n},(_,i)=>({x:0,y:i-(n-1)/2}));
  const rows=Math.ceil(n/2);
  return Array.from({length:n},(_,i)=>({x:(i%2===0?-.52:.52),y:Math.floor(i/2)-(rows-1)/2}));
}

/** Four simultaneous particle-level depictions, camera-relative on tracked landmarks. */
export class ARRenderer{
  constructor(canvas,stage){
    this.canvas=canvas;this.stage=stage;this.ctx=canvas.getContext('2d');
    this.mode='idle';this.hand=null;this.active=-1;this.activeUntil=0;this.coefficients=[1,1,1,1];
    this.lastSeen=0;this.dimensions={width:1,height:1};this.hitTargets=[];this.onPick=null;
    this.motionReduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(stage);
    this.resize();this.handleTap=this.handleTap.bind(this);this.canvas.addEventListener('click',this.handleTap);this.anim=this.anim.bind(this);this.loop=requestAnimationFrame(this.anim);
  }
  resize(){
    const width=Math.max(1,this.stage.clientWidth),height=Math.max(1,this.stage.clientHeight);
    const dpr=Math.min(2,window.devicePixelRatio||1);
    this.canvas.width=Math.round(width*dpr);this.canvas.height=Math.round(height*dpr);
    this.ctx.setTransform(dpr,0,0,dpr,0,0);
    this.dimensions={width,height};
  }
  setMode(mode){this.mode=mode;this.hitTargets=[];if(mode!=='tracking')this.hand=null;}
  pickAt(x,y){
    let best=null,closest=Infinity;
    for(const target of this.hitTargets){
      const distance=Math.hypot(target.x-x,target.y-y);
      if(distance<target.radius&&distance<closest){best=target.index;closest=distance;}
    }
    return best;
  }
  handleTap(event){
    if(!this.onPick)return;
    const rect=this.canvas.getBoundingClientRect();
    const x=(event.clientX-rect.left)*this.dimensions.width/rect.width;
    const y=(event.clientY-rect.top)*this.dimensions.height/rect.height;
    const index=this.pickAt(x,y);
    if(index!==null)this.onPick(index);
  }
  setActive(index){this.active=index;this.activeUntil=performance.now()+900;}
  setCoefficients(values){this.coefficients=values.slice();}
  setHand(points,video,mirrored){
    const w=this.dimensions.width,h=this.dimensions.height;
    const vw=video.videoWidth||640,vh=video.videoHeight||480;
    const scale=Math.max(w/vw,h/vh),rw=vw*scale,rh=vh*scale;
    const xCrop=(rw-w)/2,yCrop=(rh-h)/2;
    const converted=points.map(p=>({x:((mirrored?1-p.x:p.x)*rw-xCrop),y:(p.y*rh-yCrop)}));
    if(this.hand?.length===converted.length){
      this.hand=converted.map((p,i)=>between(this.hand[i],p,.38));
    }else this.hand=converted;
    this.lastSeen=performance.now();this.mode='tracking';
  }
  clearHand(){this.hand=null;if(this.mode==='tracking')this.mode='searching';}
  rotate(p,angleY,angleX){
    const cy=Math.cos(angleY),sy=Math.sin(angleY),cx=Math.cos(angleX),sx=Math.sin(angleX);
    const x=p.x*cy+p.z*sy,z=-p.x*sy+p.z*cy;
    return {x,y:p.y*cx-z*sx,z:p.y*sx+z*cx};
  }
  sphere(x,y,r,symbol,charge){
    const ctx=this.ctx,[lite,main,dark]=COLORS[symbol];
    ctx.save();ctx.shadowBlur=clamp(r*.75,3,22);ctx.shadowColor=main+'98';
    const fill=ctx.createRadialGradient(x-r*.33,y-r*.42,r*.09,x,y,r);
    fill.addColorStop(0,lite);fill.addColorStop(.43,main);fill.addColorStop(1,dark);
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();
    ctx.shadowBlur=0;ctx.lineWidth=.9;ctx.strokeStyle='rgba(255,255,255,.3)';ctx.stroke();
    if(r>8.3){ctx.fillStyle=symbol==='H'?'#172336':'#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`800 ${clamp(r*.88,9,16)}px system-ui`;ctx.fillText(symbol,x,y+1)}
    ctx.restore();
    if(charge&&r>5){
      // Íons identificados com legenda discreta: evita caixas grandes
      // cobrindo o modelo (problema especialmente visível no celular).
      ctx.save();ctx.textAlign='left';ctx.textBaseline='middle';
      ctx.font=`800 ${clamp(r*.84,8.5,12)}px system-ui`;
      ctx.strokeStyle='rgba(3,12,22,.96)';ctx.lineWidth=3;ctx.lineJoin='round';
      ctx.strokeText(symbol+charge,x+r*.58,y-r*.9);
      ctx.fillStyle='#f6ffff';ctx.fillText(symbol+charge,x+r*.58,y-r*.9);
      ctx.restore();
    }
  }
  renderMolecule(id,cx,cy,unit,rotation,highlight,drawLabel=true){
    const item=SPECIES[KEYS[id]],ctx=this.ctx;
    const tilt=rotation*.8+id*.74,rotX=-.21+Math.sin(rotation*.75+id)*.18;
    const points=item.atoms.map(a=>{
      const p=this.rotate(a,tilt,rotX);const perspective=clamp(7/(7-p.z),.7,1.5);
      return {...p,x:cx+p.x*unit*perspective,y:cy-p.y*unit*perspective,r:perspective,symbol:a.symbol,charge:a.charge};
    });
    // Bonds drawn before balls; ions remain spatially separated by design.
    item.bonds.forEach(([i,j])=>{
      const a=points[i],b=points[j];ctx.save();ctx.strokeStyle='rgba(5,18,34,.98)';ctx.lineWidth=clamp(unit*.34,3,7);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
      const grad=ctx.createLinearGradient(a.x,a.y,b.x,b.y);grad.addColorStop(0,'#afcbd3');grad.addColorStop(.5,'#e4f8ff');grad.addColorStop(1,'#839cad');ctx.strokeStyle=grad;ctx.lineWidth=clamp(unit*.23,2,5);ctx.stroke();ctx.restore();
    });
    points.sort((a,b)=>a.z-b.z).forEach(p=>{
      const r=unit*({H:.32,O:.44,S:.57,Na:.60}[p.symbol])*p.r;
      this.sphere(p.x,p.y,r,p.symbol,p.charge);
    });
    if(highlight){ctx.save();ctx.strokeStyle='rgba(108,255,211,.83)';ctx.setLineDash([4,5]);ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy,unit*4.1,0,2*Math.PI);ctx.stroke();ctx.restore();}
    if(drawLabel)this.pill(cx,cy+unit*2.75,FORMULA_LABELS[id],item.category.includes('IÔN')?'ÍONS EM SOLUÇÃO':null);
  }
  pill(cx,cy,label,detail){
    const ctx=this.ctx;ctx.save();const small=this.dimensions.width<480;
    const size=small?10:12;ctx.font=`850 ${size}px system-ui`;
    const tw=ctx.measureText(label).width;const d=detail&&(!small||this.mode==='demo');
    const width=Math.max(tw+19,d?97:0),height=d?35:23;
    cx=clamp(cx,width/2+5,this.dimensions.width-width/2-5);
    cy=clamp(cy,height+5,this.dimensions.height-10);
    ctx.fillStyle='rgba(7,21,35,.94)';ctx.strokeStyle='rgba(101,241,209,.51)';ctx.lineWidth=1;
    ctx.beginPath();ctx.roundRect(cx-width/2,cy-height/2,width,height,9);ctx.fill();ctx.stroke();
    ctx.fillStyle='#e8fff8';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,cx,cy-(d?7:0));
    if(d){ctx.font='700 7px system-ui';ctx.fillStyle='#7ef6dd';ctx.fillText(detail,cx,cy+8)}ctx.restore();
  }
  /** Um grupo mantém todas as cópias sobre a mão/na demonstração. */
  renderGroup(index,cx,cy,unit,spin,now){
    const n=this.coefficients[index];
    const offsets=copyOffsets(n);
    const step=unit*(this.dimensions.width<520?3.9:4.45);
    const xStep=unit*4.1;
    // Seleção indicada no nome flutuante; sem círculos grandes sobre os modelos.
    const emphasis=false;
    const smallCopy=unit*(n>=5?.80:n>=3?.88:n===2?.96:1);
    offsets.forEach((pt,j)=>{
      const x=cx+pt.x*xStep,y=cy+pt.y*step;
      this.renderMolecule(index,x,y,smallCopy,spin+j*.095,emphasis,false);
    });
    const minY=Math.min(...offsets.map(q=>q.y))*step;
    const maxY=Math.max(...offsets.map(q=>q.y))*step;
    this.hitTargets.push({index,x:cx,y:cy,radius:Math.max(29,Math.max(Math.abs(minY),Math.abs(maxY))+unit*2)});
    const labelY=cy+maxY+unit*(index===2?2.55:2.35)+14;
    this.pill(cx,labelY,`${n} × ${FORMULA_LABELS[index]}`,null);
  }
  render(now){
    const ctx=this.ctx,w=this.dimensions.width,h=this.dimensions.height;
    ctx.clearRect(0,0,w,h);this.hitTargets=[];
    if(['idle','loading','requesting','searching'].includes(this.mode))return;
    if(this.mode==='tracking'&&(!this.hand||now-this.lastSeen>1700)){
      if(now-this.lastSeen>1700)this.clearHand();return;
    }
    const spin=this.motionReduced?0:now*.00015;
    // Adota a composição horizontal do jogo original, em vez de colocar
    // as moléculas isoladamente em dedos distintos.
    const mobile=w<700;
    const dock=document.querySelector('.control-deck');
    const dockTop=dock?.getBoundingClientRect()?.top ?? h-160;
    const hud=document.querySelector('.instruction');
    const hudBottom=hud?.getBoundingClientRect()?.bottom ?? 96;
    const safeTop=Math.max(115,hudBottom+44);
    const safeBottom=Math.max(safeTop+150,Math.min(h-140,dockTop-48));
    const areaMid=(safeTop+safeBottom)*.5;
    let centerX=w*.5, centerY=areaMid;
    let rowWidth=Math.min(w*.84,mobile?360:600);
    if(this.mode==='tracking'){
      const anchor=this.hand[9];
      const across=Math.hypot(this.hand[5].x-this.hand[17].x,this.hand[5].y-this.hand[17].y);
      centerX=clamp(anchor.x,w*.43,w*.57);
      centerY=clamp(anchor.y,safeTop+70,safeBottom-65);
      // Preserva a reação inteira sobre a região da mão sem deixar sair da tela.
      rowWidth=Math.min(w*.88,Math.max(mobile?265:350,across*3.6));
    }
    const unit=mobile?clamp(w*.029,8,12):clamp(w*.018,10,18);
    const columns=[-.36,-.12,.12,.36];
    columns.forEach((relative,i)=>{
      const x=clamp(centerX+relative*rowWidth,38,w-38);
      this.renderGroup(i,x,centerY,unit*SPECIES[KEYS[i]].scale,spin,now);
    });
  }
  anim(now){if(!document.hidden)this.render(now);this.loop=requestAnimationFrame(this.anim);}
  stop(){cancelAnimationFrame(this.loop);this.canvas.removeEventListener('click',this.handleTap);this.resizeObserver.disconnect();}
}
