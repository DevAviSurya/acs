import { gsap } from 'gsap';
import { createScene } from './createScene';

/** Progressive enhancement: if Three.js/WebGL is unavailable, CSS orbital rings remain visible. */
export function mountConnectedHero(root: HTMLElement) {
  const canvas = root.querySelector<HTMLCanvasElement>('[data-ac-canvas]');
  const area = root.querySelector<HTMLElement>('.ac-orbit-area');
  const fallback = root.querySelector<HTMLElement>('.ac-core-fallback');
  if (!canvas || !area || !fallback) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce.matches) return;

  const stage = root.querySelector<HTMLElement>('.ac-stage');
  const wires = root.querySelector<SVGSVGElement>('[data-ac-connections]');
  const pathsLayer = wires?.querySelector<SVGGElement>('[data-ac-paths]');
  const travelersLayer = wires?.querySelector<SVGGElement>('[data-ac-travelers]');
  const modules = {
    web: root.querySelector<HTMLElement>('[data-ac-module="web"]'),
    ai: root.querySelector<HTMLElement>('[data-ac-module="ai"]'),
    growth: root.querySelector<HTMLElement>('[data-ac-module="growth"]'),
    brand: root.querySelector<HTMLElement>('[data-ac-module="brand"]'),
  };
  let disposed = false;
  let running = true;
  let visible = true;
  let scene3d: ReturnType<typeof createScene> | undefined;
  let timeline: gsap.core.Timeline | undefined;
  let raf = 0;
  let previousFrame = 0;
  let distanceTime = 0;
  const travelers: Array<{path: SVGPathElement; dot: SVGCircleElement; phase: number; speed: number; length: number}> = [];
  const svgNs = 'http://www.w3.org/2000/svg';
  function buildConnections() {
    if (!stage || !wires || !pathsLayer || !travelersLayer || !area) return;
    const frame = stage.getBoundingClientRect();
    const hub = area.getBoundingClientRect();
    const width=frame.width, height=frame.height;
    wires.setAttribute('viewBox', `0 0 ${width} ${height}`);
    pathsLayer.replaceChildren(); travelersLayer.replaceChildren(); travelers.length=0;
    const ox=hub.left-frame.left+hub.width/2, oy=hub.top-frame.top+hub.height/2;
    (['web','ai','growth','brand'] as const).forEach((name,i)=>{
      const target=modules[name];if (!target) return;
      const r=target.getBoundingClientRect();
      const right=i===1||i===3;
      const lower=i>=2;
      const x=right ? r.left-frame.left : r.right-frame.left;
      const y=r.top-frame.top+r.height/2;
      const sx=ox+(right?1:-1)*hub.width*.31;
      const sy=oy+(lower?1:-1)*hub.height*.25;
      const cx=(sx+x)/2, cy=(sy+y)/2 + (lower?12:-12);
      const d=`M ${sx.toFixed(2)} ${sy.toFixed(2)} Q ${cx.toFixed(2)} ${cy.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)}`;
      const line=document.createElementNS(svgNs,'path');line.setAttribute('d',d);line.setAttribute('class','ac-link');
      const under=document.createElementNS(svgNs,'path');under.setAttribute('d',d);under.setAttribute('class','ac-link-under');
      pathsLayer.append(under,line);
      const length=line.getTotalLength();
      for(let j=0;j<2;j++){
        const dot=document.createElementNS(svgNs,'circle');dot.setAttribute('r',j===0?'3.1':'2.1');dot.setAttribute('class','ac-traveler');
        travelersLayer.append(dot);travelers.push({path:line,dot,phase:(i*.23+j*.5)%1,speed:.24+(i%2)*.055,length});
      }
    });
  }
  function moveDots(elapsed:number){
    for(const item of travelers){
      const progress=(distanceTime*item.speed+item.phase)%1;
      const p=item.path.getPointAtLength(progress*item.length);
      item.dot.setAttribute('cx',p.x.toFixed(2));item.dot.setAttribute('cy',p.y.toFixed(2));
      item.dot.style.opacity=(Math.min(1,progress*8,(1-progress)*8)*.95).toFixed(2);
    }
  }
  const pointer=(event:PointerEvent)=>{
    if(!stage || event.pointerType==='touch')return;
    const b=stage.getBoundingClientRect();
    const x=((event.clientX-b.left)/b.width-.5)*2;
    const y=((event.clientY-b.top)/b.height-.5)*2;
    area.style.setProperty('--core-x',`${(x*7).toFixed(2)}px`);
    area.style.setProperty('--core-y',`${(y*5).toFixed(2)}px`);
    for(const element of Object.values(modules)){
      if(!element)continue;
      const r=element.getBoundingClientRect();const midx=r.left+r.width/2,midy=r.top+r.height/2;
      const proximity=Math.max(0,1-Math.hypot(event.clientX-midx,event.clientY-midy)/320);
      element.style.setProperty('--mouse-x',`${(x*5*proximity).toFixed(2)}px`);
      element.style.setProperty('--mouse-y',`${(y*4*proximity).toFixed(2)}px`);
    }
  };
  const pointerLeave=()=>{
    area.style.setProperty('--core-x','0px');area.style.setProperty('--core-y','0px');
    for(const element of Object.values(modules)){
      element?.style.setProperty('--mouse-x','0px');element?.style.setProperty('--mouse-y','0px');
    }
  };
  if(stage){stage.addEventListener('pointermove',pointer,{passive:true});stage.addEventListener('pointerleave',pointerLeave);}

  let observer: IntersectionObserver | undefined;
  let resizeObserver: ResizeObserver | undefined;

  const stop = () => {running = false; previousFrame=0; if (raf) cancelAnimationFrame(raf); raf=0; timeline?.pause();};
  const updateState = () => {
    const shouldRun = visible && !document.hidden && !reduce.matches;
    if (!shouldRun) {stop(); return;}
    if (running && raf) return;
    running = true;
    timeline?.resume();
    tick();
  };
  function tick() {
    if (!running) return;
    const now=performance.now();
    if (previousFrame) distanceTime+=Math.min((now-previousFrame)/1000,.05);
    previousFrame=now;
    moveDots(distanceTime);
    scene3d?.render();
    raf = requestAnimationFrame(tick);
  }

  function animate() {
    if (!scene3d) return;
    const {rings, core} = scene3d;
    const tl = gsap.timeline({ repeat: -1, defaults: {ease: 'sine.inOut'} });
    // EXACTLY 15 seconds; full revolutions make the loop invisible.
    tl.to(rings[0].rotation,{z: `+=${Math.PI*2}`, duration:15, ease:'none'},0);
    tl.to(rings[1].rotation,{z: `-=${Math.PI*2}`, duration:15, ease:'none'},0);
    tl.to(rings[2].rotation,{y: `+=${Math.PI*2}`, duration:15, ease:'none'},0);
    tl.to(core.position,{y:.09,duration:7.5,ease:'sine.inOut',yoyo:true,repeat:1},0);
    (['web','ai','growth','brand'] as const).forEach((name,i)=>{
      const element=modules[name];
      if (!element) return;
      const start=.5+i*3;
      tl.fromTo(element,
        {y:0, boxShadow:'0 15px 38px rgba(35,53,65,.065),0 2px 8px rgba(35,53,65,.03)'},
        {y:-6,boxShadow:'0 21px 46px rgba(37,80,115,.12),0 3px 10px rgba(35,53,65,.04)', duration:1.2,ease:'sine.out'}, start);
      tl.to(element,{y:0,boxShadow:'0 15px 38px rgba(35,53,65,.065),0 2px 8px rgba(35,53,65,.03)',duration:1.8,ease:'sine.inOut'},start+1.2);
    });
    // Explicitly pin the timeline to 15 seconds even if an effect changes.
    tl.set({}, {}, 15);
    timeline=tl;
  }

  const handleVisibility = () => updateState();
  const handleMotion = () => updateState();
  document.addEventListener('visibilitychange', handleVisibility);
  reduce.addEventListener('change', handleMotion);
  observer = new IntersectionObserver((entries)=>{
    visible=entries[0]?.isIntersecting ?? true;
    updateState();
  },{threshold:0.02});
  observer.observe(root);
  buildConnections();

  try {
    scene3d=createScene(canvas,area);
    canvas.classList.add('ac-ready');
    fallback.classList.add('ac-hidden');
    animate();
    resizeObserver=new ResizeObserver(()=>{scene3d?.resize();buildConnections();});
    resizeObserver.observe(stage || area);
    updateState();
  } catch(err) {
    // Fallback remains functional; no blank region or broken hero.
    console.warn('ConnectedHero: WebGL unavailable; using CSS fallback.',err);
    updateState();
  }

  const destroy=()=>{
    if(disposed)return;
    disposed=true;
    stop();timeline?.kill(); observer?.disconnect(); resizeObserver?.disconnect();
    document.removeEventListener('visibilitychange',handleVisibility);
    reduce.removeEventListener('change',handleMotion);
    document.removeEventListener('astro:before-swap',destroy);
    if(stage){stage.removeEventListener('pointermove',pointer);stage.removeEventListener('pointerleave',pointerLeave);}
    scene3d?.dispose();
    root.dataset.acMounted='false';
  };
  document.addEventListener('astro:before-swap',destroy,{once:true});
  return destroy;
}
