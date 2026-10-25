const MP_BASE='https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/';
let libraryPromise;
function loadHands(){
  if(window.Hands)return Promise.resolve();
  if(!libraryPromise)libraryPromise=new Promise((res,rej)=>{
    const script=document.createElement('script');script.src=MP_BASE+'hands.js';script.crossOrigin='anonymous';
    script.onload=()=>window.Hands?res():rej(new Error('Biblioteca MediaPipe indisponível.'));
    script.onerror=()=>rej(new Error('Não foi possível carregar MediaPipe. Confira a conexão.'));
    document.head.appendChild(script);
  }).catch(e=>{libraryPromise=null;throw e;});
  return libraryPromise;
}
export function openPalm(pts){
  if(!Array.isArray(pts)||pts.length<21)return false;
  const d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  // Orientation-independent fingertip-to-wrist vs proximal interphalangeal distance.
  return [[8,6],[12,10],[16,14],[20,18]].filter(([tip,pip])=>d(pts[tip],pts[0])>d(pts[pip],pts[0])*1.045).length>=3;
}
export class HandCamera{
  constructor(video,onFrame,onState){this.video=video;this.onFrame=onFrame;this.onState=onState;this.facingMode='user';this.running=false;this.stream=null;this.model=null;this.inferenceBusy=false;this.raf=0;this.token=0;this.lastDetected=0;}
  async start(facing=this.facingMode){
    this.stop();this.facingMode=facing;
    if(!navigator.mediaDevices?.getUserMedia||!window.isSecureContext)throw new Error('Abra por HTTPS ou localhost para ativar a câmera.');
    const currentToken=++this.token;
    try{
      this.onState('requesting');
      this.stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:facing},width:{ideal:640},height:{ideal:480},frameRate:{ideal:24,max:30}}});
      if(currentToken!==this.token){this.stream.getTracks().forEach(t=>t.stop());return;}
      this.video.srcObject=this.stream;this.video.hidden=false;this.video.classList.toggle('mirrored',facing==='user');
      await this.video.play();this.onState('loading');
      await loadHands();if(currentToken!==this.token)return;
      this.model=new window.Hands({locateFile:filename=>MP_BASE+filename});
      this.model.setOptions({maxNumHands:1,modelComplexity:0,minDetectionConfidence:.6,minTrackingConfidence:.56});
      this.model.onResults(results=>{
        if(currentToken!==this.token||!this.model)return;
        const pts=results?.multiHandLandmarks?.[0];
        if(pts&&openPalm(pts)){this.lastDetected=performance.now();this.onFrame(pts,this.video,facing==='user');this.onState('tracking');}
        else if(performance.now()-this.lastDetected>550)this.onState('searching');
      });
      this.running=true;this.onState('searching');let previous=0;
      const work=async now=>{
        if(!this.running||currentToken!==this.token)return;
        if(now-previous>110&&!this.inferenceBusy&&this.video.readyState>=2){
          previous=now;this.inferenceBusy=true;
          try{await this.model.send({image:this.video});}
          catch(e){if(this.running){this.stop();this.onState('error',e);}return;}
          finally{this.inferenceBusy=false;}
        }
        if(this.running&&currentToken===this.token)this.raf=requestAnimationFrame(work);
      };
      this.raf=requestAnimationFrame(work);
    }catch(e){this.stop();throw e;}
  }
  stop(){
    this.token++;this.running=false;cancelAnimationFrame(this.raf);
    if(this.stream){this.stream.getTracks().forEach(t=>t.stop());this.stream=null;}
    this.video.pause();this.video.srcObject=null;this.video.hidden=true;
    const obj=this.model;this.model=null;
    if(obj)Promise.resolve(obj.close()).catch(()=>{});
    this.onState('off');
  }
}
