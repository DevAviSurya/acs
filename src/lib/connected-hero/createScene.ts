import * as THREE from 'three';

export function createScene(canvas: HTMLCanvasElement, container: HTMLElement) {
  const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true});
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-4,4,4,-4,.1,40);
  camera.position.set(0,0,10);

  const ambient = new THREE.AmbientLight(0xfff6ee, 1.45);
  const key = new THREE.DirectionalLight(0xfff8f0, 1.05); key.position.set(3.4,4.6,5.8);
  const fill = new THREE.DirectionalLight(0xf0e2d2, .55); fill.position.set(-4.2,-1.8,3.2);
  const rim = new THREE.DirectionalLight(0xffffff, .48); rim.position.set(0.5,2.2,-4);
  scene.add(ambient,key,fill,rim);

  const geometry: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const core = new THREE.Group();
  scene.add(core);

  const silver = new THREE.MeshStandardMaterial({color:0xf5f1ea, metalness:.2, roughness:.38});
  const graphite = new THREE.MeshStandardMaterial({color:0x2a2620, metalness:.58, roughness:.36});
  const pale = new THREE.MeshStandardMaterial({color:0xede6da, metalness:.14, roughness:.58, transparent:true, opacity:.94});
  const charcoal = new THREE.MeshStandardMaterial({color:0x46423a, emissive:0x1c1a16, emissiveIntensity:.12, metalness:.4, roughness:.34});
  materials.push(silver, graphite, pale, charcoal);

  function addThinTorus(radius:number, tube:number, rot:[number,number,number], mat:THREE.Material){
    const g = new THREE.TorusGeometry(radius, tube, 10, 180);
    geometry.push(g);
    const m = new THREE.Mesh(g, mat);
    m.rotation.set(...rot);
    core.add(m);
    return m;
  }

  const rings = [
    addThinTorus(2.05,.016,[0.82,0.2,0], silver),
    addThinTorus(1.56,.018,[0.18,1.08,0.3], pale),
    addThinTorus(1.06,.014,[1.1,0.52,0], silver)
  ];

  // Architectural matrix frames
  const frameGeo1 = new THREE.BoxGeometry(2.15,2.15,.035);
  const frameGeo2 = new THREE.BoxGeometry(1.58,1.58,.035);
  geometry.push(frameGeo1, frameGeo2);
  const frameA = new THREE.Mesh(frameGeo1, new THREE.MeshBasicMaterial({color:0xb0a89a, transparent:true, opacity:.45, wireframe:true}));
  const frameB = new THREE.Mesh(frameGeo2, new THREE.MeshBasicMaterial({color:0xa39b8c, transparent:true, opacity:.42, wireframe:true}));
  frameA.rotation.set(.9,.35,.42); frameB.rotation.set(.22,1.1,-.18);
  core.add(frameA, frameB);
  materials.push(frameA.material as THREE.Material, frameB.material as THREE.Material);

  // central plate
  const plateGeo = new THREE.BoxGeometry(.92,.92,.22);
  geometry.push(plateGeo);
  const plate = new THREE.Mesh(plateGeo, pale);
  plate.rotation.set(.25,.35,0.15);
  core.add(plate);
  const plate2Geo = new THREE.BoxGeometry(.58,.58,.18); geometry.push(plate2Geo);
  const plate2 = new THREE.Mesh(plate2Geo, graphite); plate2.rotation.set(-.1,.28,-.06); core.add(plate2);

  // radial rails
  const railGeo = new THREE.BoxGeometry(.04,1.45,.04); geometry.push(railGeo);
  const rails: THREE.Mesh[] = [];
  for(let i=0;i<4;i++){
    const rail = new THREE.Mesh(railGeo, new THREE.MeshStandardMaterial({color:0xd8cfc0, metalness:.12, roughness:.62}));
    materials.push(rail.material as THREE.Material);
    rail.rotation.z = i*Math.PI/2 + Math.PI/4;
    rail.position.z = -0.12;
    core.add(rail);
    rails.push(rail);
  }

  // nodes
  const nodeGeo = new THREE.SphereGeometry(.046, 14, 14); geometry.push(nodeGeo);
  const nodes = [-1.45,-.68,.24,1.18,2.12].map((a, i) => {
    const node = new THREE.Mesh(nodeGeo, charcoal);
    node.position.set(Math.cos(a)*1.98, Math.sin(a)*1.98, 0.1 + i*0.015);
    core.add(node);
    return node;
  });

  function resize() {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    const aspect = width / height;
    const span = 5.9;
    if (aspect >= 1) {
      camera.left = -span*aspect/2; camera.right = span*aspect/2; camera.top = span/2; camera.bottom = -span/2;
    } else {
      camera.left = -span/2; camera.right = span/2; camera.top = span/(2*aspect); camera.bottom = -span/(2*aspect);
    }
    camera.updateProjectionMatrix();
  }
  function render() { renderer.render(scene, camera); }
  function dispose() {
    geometry.forEach(g=>g.dispose());
    materials.forEach(m=>m.dispose());
    renderer.dispose();
  }
  resize(); render();
  return {renderer, scene, camera, core, rings, nodes, frameA, frameB, rails, plate, plate2, resize, render, dispose};
}
