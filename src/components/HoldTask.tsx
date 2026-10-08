import {useEffect,useRef,useState} from 'react';

export function HoldTask({label,onComplete,disabled=false}:{label:string;onComplete:()=>void;disabled?:boolean}) {
  const button=useRef<HTMLButtonElement>(null),frame=useRef(0),started=useRef(0),pointer=useRef<number|null>(null),latest=useRef(onComplete);
  const pressedAt=useRef(0),ignoreClick=useRef(false),completed=useRef(false);
  const [working,setWorking]=useState(false);
  latest.current=onComplete;
  const stop=()=>{cancelAnimationFrame(frame.current);frame.current=0;pointer.current=null;started.current=0;setWorking(false);button.current?.style.setProperty('--work-progress','0%');};
  const start=()=>{
    if(disabled||frame.current)return;
    completed.current=false;setWorking(true);
    const tick=(now:number)=>{
      if(!started.current)started.current=now;
      const progress=Math.min(1,(now-started.current)/1300);
      button.current?.style.setProperty('--work-progress',`${progress*100}%`);
      if(progress===1){completed.current=true;ignoreClick.current=true;stop();latest.current();return;}
      frame.current=requestAnimationFrame(tick);
    };
    frame.current=requestAnimationFrame(tick);
  };
  useEffect(()=>{window.addEventListener('blur',stop);document.addEventListener('visibilitychange',stop);return()=>{cancelAnimationFrame(frame.current);window.removeEventListener('blur',stop);document.removeEventListener('visibilitychange',stop);};},[]);
  useEffect(()=>{if(disabled)stop();},[disabled]);
  return <button ref={button} className="hold-task" disabled={disabled} data-working={working} aria-busy={working}
    onPointerDown={e=>{if(pointer.current!==null||e.button!==0)return;if(frame.current){ignoreClick.current=true;stop();return;}ignoreClick.current=false;pointer.current=e.pointerId;pressedAt.current=performance.now();e.currentTarget.setPointerCapture(e.pointerId);start();}}
    onPointerUp={e=>{if(pointer.current===e.pointerId){ignoreClick.current=performance.now()-pressedAt.current>220;stop();}}}
    onPointerCancel={()=>{ignoreClick.current=true;stop();}} onLostPointerCapture={()=>{if(pointer.current!==null)stop();}}
    onClick={()=>{if(ignoreClick.current||completed.current){ignoreClick.current=false;completed.current=false;return;}if(frame.current)stop();else start();}} onBlur={stop}>
    <span>{label}</span><small>{disabled?'Tạm dừng hoặc cần hồi sức':working?'Đang làm… chạm để dừng':'Chạm để làm · hoặc giữ 1,3 giây'}</small>
  </button>;
}
