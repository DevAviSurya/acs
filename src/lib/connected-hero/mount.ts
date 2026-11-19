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
      const sx=ox+(right?1:-1)*hub.width*.28;
      const sy=oy+(lower?1:-1)*hub.height*.17;
      // A single straight connector from the core to the adjacent card edge.
      // SVG presentation attributes are required: Astro's scoped CSS does not
      // automatically match paths created with document.createElementNS().
      const d=`M ${sx.toFixed(2)} ${sy.toFixed(2)} L ${x.toFixed(2)} ${y.toFixed(2)}`;
      const line=document.createElementNS(svgNs,'path');
      line.setAttribute('d',d);
      line.setAttribute('class','ac-link');
      line.setAttribute('fill','none');
      line.setAttribute('stroke','#b3a894');
      line.setAttribute('stroke-width','1');
      line.setAttribute('stroke-linecap','round');
      line.setAttribute('opacity','.6');
      pathsLayer.append(line);
      const length=line.getTotalLength();
      for(let j=0;j<2;j++){
        const dot=document.createElementNS(svgNs,'circle');dot.setAttribute('r',j===0?'2.5':'1.8');dot.setAttribute('class','ac-traveler');dot.setAttribute('fill', '#46423a');dot.setAttribute('stroke','#fff');dot.setAttribute('stroke-width','.5');
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
    const {rings, core, nodes, frameA, frameB, rails, plate, plate2} = scene3d as ReturnType<typeof createScene> & any;
    const tl = gsap.timeline({ repeat: -1, defaults: {ease: 'sine.inOut'} });
    tl.to(rings[0].rotation,{z: `+=${Math.PI*2}`, duration:22, ease:'none'},0);
    tl.to(rings[1].rotation,{z: `-=${Math.PI*2}`, duration:22, ease:'none'},0);
    tl.to(rings[2].rotation,{y: `+=${Math.PI*2}`, duration:22, ease:'none'},0);
    tl.to(frameA.rotation,{z:`+=${Math.PI*2}`, duration:26, ease:'none'},0);
    tl.to(frameB.rotation,{z:`-=${Math.PI*2}`, duration:24, ease:'none'},0);
    tl.to(core.rotation,{z:.08, x:-.06, duration:5, yoyo:true, repeat:3},0);
    tl.to(core.position,{y:.1,duration:10,ease:'sine.inOut',yoyo:true,repeat:1},0);
    nodes.forEach((node:any,i:number)=>{
      tl.to(node.position,{z:.18 + (i%2)*.08, duration:2.2, yoyo:true, repeat:9, ease:'sine.inOut'}, i*.12);
      tl.to(node.scale,{x:1.18,y:1.18,z:1.18,duration:1.6,yoyo:true,repeat:12,ease:'sine.inOut'}, i*.2);
    });
    [plate,plate2,...rails].forEach((obj:any,i:number)=>{
      tl.to(obj.rotation,{z:`+=${(i%2?1:-1)*0.14}`, duration:4.2, yoyo:true, repeat:3, ease:'sine.inOut'}, .4+i*.08);
    });
    (['web','ai','growth','brand'] as const).forEach((name,i)=>{
      const element=modules[name];
      if (!element) return;
      const start=.55+i*3;
      tl.fromTo(element,
        {y:0, boxShadow:'0 20px 50px -14px rgba(40,32,20,.14),0 3px 10px rgba(40,32,20,.045)'},
        {y:-6,boxShadow:'0 28px 60px -14px rgba(40,32,20,.18),0 4px 14px rgba(40,32,20,.05)', duration:1.5,ease:'power2.out'}, start);
      tl.to(element,{y:0,boxShadow:'0 20px 50px -14px rgba(40,32,20,.14),0 3px 10px rgba(40,32,20,.045)',duration:2.3,ease:'power3.inOut'},start+1.5);
      const inner=element.querySelector('.ac-editor, .ac-workflow, .ac-chart, .ac-brand-display') as HTMLElement | null;
      if(inner){
        tl.fromTo(inner,{y:0, rotate:0},{y:-2.5, rotate:(i%2?-.3:.3), duration:1.3, yoyo:true, repeat:1, ease:'sine.inOut'}, start+.1);
      }
    });
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
