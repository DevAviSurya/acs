import * as THREE from 'three';

export type ConnectedScene = ReturnType<typeof createScene>;

export function createScene(canvas: HTMLCanvasElement, container: HTMLElement) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setClearColor(0xffffff, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.45;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-3, 3, 3, -3, 0.1, 100);
  camera.position.set(0, 0, 13);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 2.2));
  const key = new THREE.DirectionalLight(0xffffff, 3.7);
  key.position.set(-3, 5, 8);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xb9d9f5, 2.6);
  fill.position.set(5, -3, 4);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, 2.4);
  rim.position.set(0, 0, -5);
  scene.add(rim);

  const core = new THREE.Group();
  scene.add(core);
  const rings: THREE.Mesh[] = [];
  const graphite = new THREE.MeshStandardMaterial({
    color: 0x5a626c, metalness: 0.82, roughness: 0.25,
  });
  const silver = new THREE.MeshStandardMaterial({
    color: 0xa3abb2, metalness: 0.72, roughness: 0.31,
  });
  const geometry: Array<THREE.BufferGeometry> = [];
  for (const [radius, tube, rx, ry, rz, material] of [
    [2.13, .038, .53, .67, .2, graphite],
    [1.78, .051, 1.21, -.31, .5, silver],
    [1.41, .038, -.6, 1.0, -.3, graphite],
  ] as const) {
    const geo = new THREE.TorusGeometry(radius, tube, 16, 160);
    geometry.push(geo);
    const ring = new THREE.Mesh(geo, material);
    ring.rotation.set(rx, ry, rz);
    core.add(ring);
    rings.push(ring);
  }

  // Low-profile central hub, behind the crisp HTML monogram.
  const hubGeo = new THREE.SphereGeometry(.54, 40, 24);
  geometry.push(hubGeo);
  const hubMat = new THREE.MeshStandardMaterial({ color: 0x27313b, metalness: .65, roughness: .4 });
  const hub = new THREE.Mesh(hubGeo, hubMat);
  hub.scale.set(1, 1, .4);
  core.add(hub);

  // Four tiny blue datapoints on the orbit: visual depth, not decorative particles.
  const nodeGeo = new THREE.SphereGeometry(.048, 12, 12);
  geometry.push(nodeGeo);
  const nodeMat = new THREE.MeshStandardMaterial({color:0x418fd1, emissive:0x194672, emissiveIntensity:.12, metalness:.5, roughness:.4});
  const nodes = [-1.45, -0.35, 1.15].map((angle, i) => {
    const node = new THREE.Mesh(nodeGeo, nodeMat);
    node.position.set(Math.cos(angle)*2.13, Math.sin(angle)*2.13, .09+i*.015);
    core.add(node);
    return node;
  });

  function resize() {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    const aspect = width / height;
    const span = 5.65; // Safely contains 2.13-radius outer orbit
    if (aspect >= 1) {
      camera.left = -span*aspect/2;
      camera.right = span*aspect/2;
      camera.top = span/2;
      camera.bottom = -span/2;
    } else {
      camera.left = -span/2;
      camera.right = span/2;
      camera.top = span/(2*aspect);
      camera.bottom = -span/(2*aspect);
    }
    camera.updateProjectionMatrix();
  }
  function render() { renderer.render(scene, camera); }
  function dispose() {
    geometry.forEach(g=>g.dispose());
    graphite.dispose(); silver.dispose(); hubMat.dispose(); nodeMat.dispose();
    renderer.dispose();
  }
  resize();
  render();
  return {renderer, scene, camera, core, rings, nodes, resize, render, dispose};
}
