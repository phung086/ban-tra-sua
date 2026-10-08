import {useEffect,useRef} from 'react';
import {normalizeStick,type Stick} from '../game/movement';

export function MovementStick({onMove,disabled=false}:{onMove:(stick:Stick)=>void;disabled?:boolean}) {
  const base=useRef<HTMLDivElement>(null),knob=useRef<HTMLSpanElement>(null);
  const pointer=useRef<number|null>(null), center=useRef({x:0,y:0}),latest=useRef(onMove);
  latest.current=onMove;
  const reset=()=>{
    pointer.current=null;
    if(knob.current) knob.current.style.transform='translate(0px,0px)';
    if(base.current) base.current.dataset.active='false';
    latest.current({x:0,y:0});
  };
  const update=(x:number,y:number)=>{
    const dx=x-center.current.x,dy=y-center.current.y,length=Math.hypot(dx,dy);
    // Fit the travel radius to CSS-controlled joystick dimensions after rotation.
    // Keep the knob inside the round base on 320px-high landscape displays.
    const radius=Math.max(12,((base.current?.clientWidth??116)-(knob.current?.offsetWidth??53))/2);
    const clamp=Math.min(1,radius/Math.max(1,length));
    if(knob.current) knob.current.style.transform=`translate(${dx*clamp}px,${dy*clamp}px)`;
    latest.current(normalizeStick(dx,dy,radius));
  };
  useEffect(()=>{
    const stop=()=>reset();
    window.addEventListener('blur',stop); document.addEventListener('visibilitychange',stop);
    // Browser rotation can preserve a captured pointer without a pointerup.
    window.addEventListener('resize',stop); window.addEventListener('orientationchange',stop);
    return ()=>{stop();window.removeEventListener('blur',stop);document.removeEventListener('visibilitychange',stop);
      window.removeEventListener('resize',stop);window.removeEventListener('orientationchange',stop);};
  },[]);
  useEffect(()=>{if(disabled) reset();},[disabled]);
  return <div className="movement-stick-wrap"><div ref={base} className="movement-stick" role="group" aria-label="Núm tròn di chuyển. Kéo theo hướng muốn đi; thả để dừng. Phím mũi tên cũng dùng được." aria-disabled={disabled} tabIndex={disabled?-1:0}
    onPointerDown={event=>{
      if(disabled || pointer.current!==null || event.button!==0) return;
      event.preventDefault();event.stopPropagation();
      const rect=event.currentTarget.getBoundingClientRect();center.current={x:rect.left+rect.width/2,y:rect.top+rect.height/2};
      pointer.current=event.pointerId;event.currentTarget.setPointerCapture(event.pointerId);event.currentTarget.dataset.active='true';update(event.clientX,event.clientY);
    }}
    onPointerMove={event=>{if(event.pointerId===pointer.current){event.preventDefault();update(event.clientX,event.clientY);}}}
    onPointerUp={event=>{if(event.pointerId===pointer.current) reset();}}
    onPointerCancel={event=>{if(event.pointerId===pointer.current) reset();}}
    onLostPointerCapture={event=>{if(event.pointerId===pointer.current) reset();}}
    onBlur={reset}
    onKeyDown={event=>{
      const keys:Record<string,Stick>={ArrowUp:{x:0,y:-1},ArrowDown:{x:0,y:1},ArrowLeft:{x:-1,y:0},ArrowRight:{x:1,y:0}};
      if(keys[event.key]&&!disabled){event.preventDefault();latest.current(keys[event.key]);}
    }}
    onKeyUp={event=>{if(event.key.startsWith('Arrow')){event.preventDefault();reset();}}}>
    <span className="stick-axis stick-horizontal"/><span className="stick-axis stick-vertical"/><span ref={knob} className="stick-knob"/>
  </div><small>Kéo để đi · thả để dừng</small></div>;
}
