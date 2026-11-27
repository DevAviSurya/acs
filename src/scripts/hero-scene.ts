// Studio-style product reveal: a slim all-in-one computer floats on a
// seamless backdrop, back panel facing forward. Scrolling is pinned for one
// continuous sequence — the computer rotates to face front, then its screen
// steps through each service once per scroll "slot" — before releasing back
// to normal page scroll. Renders via GSAP's ticker so drawing stays in
// lockstep with the scroll-scrubbed rotation/screen state, pauses off-screen,
// and collapses to a single static front-facing pose under
// prefers-reduced-motion.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { allServices, type Service } from '../data/services';

gsap.registerPlugin(ScrollTrigger);

const GROUND_Y = 0;
const BODY_WIDTH = 2.6;
const BODY_HEIGHT = 1.62;
const BODY_DEPTH = 0.075;
const CHIN_HEIGHT = 0.22;
const FOOT_HEIGHT = 0.04;
const NECK_HEIGHT = 0.42;
const BACK_ROTATION_Y = Math.PI;
const FRONT_ROTATION_Y = 0;
const REST_TILT_X = 0.045;
const ROTATE_FRACTION = 0.32;

const ease = (value: number) => value * value * (3 - 2 * value);
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

function createServiceTexture(service: Service, index: number, total: number): THREE.CanvasTexture {
	const width = 1024;
	const height = 648;
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d');
	if (!ctx) return new THREE.CanvasTexture(canvas);

	const backdrop = ctx.createLinearGradient(0, 0, width, height);
	backdrop.addColorStop(0, '#1b1a18');
	backdrop.addColorStop(1, '#262420');
	ctx.fillStyle = backdrop;
	ctx.fillRect(0, 0, width, height);

	ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
	ctx.font = '600 28px "Helvetica Neue", Arial, sans-serif';
	ctx.textBaseline = 'alphabetic';
	ctx.fillText(`${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`, 72, 128);

	ctx.fillStyle = '#eae8e4';
	ctx.font = '600 20px "Helvetica Neue", Arial, sans-serif';
	ctx.fillText(service.tag.toUpperCase(), 72, 168);

	ctx.fillStyle = '#ffffff';
	ctx.font = '700 64px "Helvetica Neue", Arial, sans-serif';
	const words = service.title.split(' ');
	let line = '';
	let y = 268;
	const maxWidth = width - 144;
	for (const word of words) {
		const candidate = line ? `${line} ${word}` : word;
		if (ctx.measureText(candidate).width > maxWidth && line) {
			ctx.fillText(line, 72, y);
			line = word;
			y += 74;
		} else {
			line = candidate;
		}
	}
	ctx.fillText(line, 72, y);

	ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
	ctx.font = '400 26px "Helvetica Neue", Arial, sans-serif';
	const blurbMaxWidth = width - 144;
	const blurbWords = service.blurb.split(' ');
	let blurbLine = '';
	let blurbY = y + 70;
	for (const word of blurbWords) {
		const candidate = blurbLine ? `${blurbLine} ${word}` : word;
		if (ctx.measureText(candidate).width > blurbMaxWidth && blurbLine) {
			ctx.fillText(blurbLine, 72, blurbY);
			blurbLine = word;
			blurbY += 36;
		} else {
			blurbLine = candidate;
		}
	}
	ctx.fillText(blurbLine, 72, blurbY);

	ctx.fillStyle = '#eae8e4';
	ctx.beginPath();
	ctx.roundRect(72, blurbY + 48, 120, 6, 3);
	ctx.fill();

	const texture = new THREE.CanvasTexture(canvas);
	texture.colorSpace = THREE.SRGBColorSpace;
	texture.anisotropy = 4;
	return texture;
}

interface ComputerBuild {
	group: THREE.Group;
	screenMaterial: THREE.MeshStandardMaterial;
	bodyTopY: number;
}

function buildComputer(initialTexture: THREE.CanvasTexture): ComputerBuild {
	const group = new THREE.Group();
	const aluminum = new THREE.MeshPhysicalMaterial({
		color: 0xeceef0, metalness: 0.7, roughness: 0.25, clearcoat: 0.3, clearcoatRoughness: 0.25,
	});
	const darkAluminum = new THREE.MeshStandardMaterial({ color: 0x3f3f43, metalness: 0.55, roughness: 0.4 });

	const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.37, FOOT_HEIGHT, 32), aluminum);
	foot.position.y = GROUND_Y + FOOT_HEIGHT / 2;
	foot.castShadow = true;
	foot.receiveShadow = true;
	group.add(foot);

	const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.125, NECK_HEIGHT, 20), aluminum);
	neck.position.y = GROUND_Y + FOOT_HEIGHT + NECK_HEIGHT / 2;
	neck.castShadow = true;
	group.add(neck);

	const bodyCenterY = GROUND_Y + FOOT_HEIGHT + NECK_HEIGHT + BODY_HEIGHT / 2 - CHIN_HEIGHT * 0.3;
	const body = new THREE.Mesh(new RoundedBoxGeometry(BODY_WIDTH, BODY_HEIGHT, BODY_DEPTH, 5, 0.16), aluminum);
	body.position.y = bodyCenterY;
	body.castShadow = true;
	group.add(body);

	const bezelWidth = BODY_WIDTH - 0.1;
	const bezelHeight = BODY_HEIGHT - 0.1;
	const bezel = new THREE.Mesh(new RoundedBoxGeometry(bezelWidth, bezelHeight, 0.018, 3, 0.09), darkAluminum);
	bezel.position.set(0, bodyCenterY + CHIN_HEIGHT * 0.22, BODY_DEPTH / 2 + 0.01);
	group.add(bezel);

	const screenWidth = bezelWidth - 0.09;
	const screenHeight = bezelHeight - 0.3;
	const screenMaterial = new THREE.MeshStandardMaterial({
		map: initialTexture,
		emissiveMap: initialTexture,
		emissive: new THREE.Color(0xffffff),
		emissiveIntensity: 0.45,
		roughness: 0.16,
		metalness: 0,
		transparent: true,
	});
	const screen = new THREE.Mesh(new THREE.PlaneGeometry(screenWidth, screenHeight), screenMaterial);
	screen.position.set(0, bezel.position.y + 0.06, bezel.position.z + 0.011);
	group.add(screen);

	return { group, screenMaterial, bodyTopY: bodyCenterY + BODY_HEIGHT / 2 };
}

function addLights(scene: THREE.Scene, castShadows: boolean) {
	scene.add(new THREE.HemisphereLight(0xffffff, 0x4a4844, 0.6));

	const key = new THREE.DirectionalLight(0xfff6ec, 1.5);
	key.position.set(2.6, 4.6, 4.2);
	if (castShadows) {
		key.castShadow = true;
		key.shadow.mapSize.set(1024, 1024);
		key.shadow.camera.near = 1;
		key.shadow.camera.far = 12;
		key.shadow.camera.left = -3;
		key.shadow.camera.right = 3;
		key.shadow.camera.top = 3;
		key.shadow.camera.bottom = -3;
		key.shadow.bias = -0.0015;
	}
	scene.add(key);

	const fill = new THREE.DirectionalLight(0xe4ecff, 0.45);
	fill.position.set(-3.6, 2.2, 2.4);
	scene.add(fill);

	const rim = new THREE.DirectionalLight(0xffffff, 0.4);
	rim.position.set(-1.2, 2.8, -4);
	scene.add(rim);
}

interface Disposable {
	dispose(): void;
}

class AttributeHeroComputer extends HTMLElement {
	private cleanup?: () => void;

	connectedCallback() {
		const canvas = this.querySelector('canvas');
		if (!canvas) return;

		// WebGLRenderer logs rather than throws when context creation fails (e.g. WebGL
		// disabled in the browser, GPU blocklisted), so probe for a real context first.
		let supportsWebGL = false;
		try {
			supportsWebGL = Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
		} catch {
			supportsWebGL = false;
		}
		if (!supportsWebGL) {
			this.classList.add('attribute-hero--fallback');
			return;
		}

		let renderer: THREE.WebGLRenderer;
		try {
			renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
		} catch {
			this.classList.add('attribute-hero--fallback');
			return;
		}

		const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
		const compact = window.innerWidth < 640;
		const disposables: Disposable[] = [];

		renderer.outputColorSpace = THREE.SRGBColorSpace;
		renderer.toneMapping = THREE.ACESFilmicToneMapping;
		renderer.toneMappingExposure = 1.05;
		renderer.shadowMap.enabled = !compact;
		renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1.5 : 2));

		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);

		const pmrem = new THREE.PMREMGenerator(renderer);
		const environment = pmrem.fromScene(new RoomEnvironment(), 0.04);
		scene.environment = environment.texture;
		pmrem.dispose();
		disposables.push(environment.texture);

		addLights(scene, renderer.shadowMap.enabled);

		const shadowCatcher = new THREE.Mesh(
			new THREE.CircleGeometry(1.1, 48),
			new THREE.ShadowMaterial({ opacity: 0.2 }),
		);
		shadowCatcher.rotation.x = -Math.PI / 2;
		shadowCatcher.position.y = GROUND_Y;
		shadowCatcher.receiveShadow = true;
		scene.add(shadowCatcher);

		const services = allServices;
		const serviceTextures = services.map((service, index) => createServiceTexture(service, index, services.length));
		for (const texture of serviceTextures) disposables.push(texture);

		const { group: computer, screenMaterial, bodyTopY } = buildComputer(serviceTextures[0]);
		const rig = new THREE.Group();
		rig.add(computer);
		rig.rotation.x = REST_TILT_X;
		scene.add(rig);

		const target = new THREE.Vector3(0, bodyTopY * 0.58, 0);

		const resize = () => {
			const bounds = this.getBoundingClientRect();
			const width = Math.max(1, bounds.width);
			const height = Math.max(1, bounds.height);
			renderer.setSize(width, height, false);
			const aspect = width / height;
			camera.aspect = aspect;
			const distance = THREE.MathUtils.clamp(9.4 / Math.min(aspect, 1.05), 7.6, 12.5);
			camera.position.set(0, target.y + 0.55, distance);
			camera.lookAt(target);
			camera.updateProjectionMatrix();
			ScrollTrigger.refresh();
		};

		let visible = true;
		let activeServiceIndex = -1;
		const setServiceIndex = (index: number) => {
			if (index === activeServiceIndex) return;
			activeServiceIndex = index;
			const texture = serviceTextures[index];
			screenMaterial.map = texture;
			screenMaterial.emissiveMap = texture;
			screenMaterial.needsUpdate = true;
			if (!motion.matches) {
				gsap.fromTo(screenMaterial, { opacity: 0.25 }, { opacity: 1, duration: 0.45, ease: 'power2.out' });
			}
		};
		setServiceIndex(0);

		const renderFrame = () => {
			if (!visible) return;
			renderer.render(scene, camera);
		};

		let scrollTrigger: ScrollTrigger | undefined;

		if (motion.matches) {
			rig.rotation.y = FRONT_ROTATION_Y;
		} else {
			rig.rotation.y = BACK_ROTATION_Y;
			rig.scale.setScalar(0.94);
			gsap.to(rig.scale, { x: 1, y: 1, z: 1, duration: 1.1, delay: 0.1, ease: 'power3.out' });

			scrollTrigger = ScrollTrigger.create({
				trigger: this,
				start: 'top top',
				end: () => `+=${Math.round(window.innerHeight * (compact ? 2.2 : 3.1))}`,
				scrub: true,
				pin: true,
				anticipatePin: 1,
				onUpdate: (self) => {
					const progress = self.progress;
					const rotateProgress = clamp01(progress / ROTATE_FRACTION);
					rig.rotation.y = THREE.MathUtils.lerp(BACK_ROTATION_Y, FRONT_ROTATION_Y, ease(rotateProgress));
					if (progress <= ROTATE_FRACTION) return;
					const serviceProgress = (progress - ROTATE_FRACTION) / (1 - ROTATE_FRACTION);
					const index = Math.min(services.length - 1, Math.floor(serviceProgress * services.length));
					setServiceIndex(index);
				},
			});
		}

		gsap.ticker.add(renderFrame);

		const observer = new ResizeObserver(resize);
		observer.observe(this);
		const visibility = new IntersectionObserver(([entry]) => {
			visible = entry.isIntersecting;
		});
		visibility.observe(this);
		resize();

		const onMotionChange = () => {
			if (!motion.matches) return;
			scrollTrigger?.kill();
			gsap.killTweensOf(rig.scale);
			gsap.killTweensOf(screenMaterial);
			rig.rotation.y = FRONT_ROTATION_Y;
			rig.scale.setScalar(1);
			screenMaterial.opacity = 1;
			setServiceIndex(0);
		};
		motion.addEventListener('change', onMotionChange);

		this.cleanup = () => {
			observer.disconnect();
			visibility.disconnect();
			motion.removeEventListener('change', onMotionChange);
			gsap.ticker.remove(renderFrame);
			scrollTrigger?.kill();
			gsap.killTweensOf(rig.scale);
			gsap.killTweensOf(screenMaterial);
			for (const disposable of disposables) disposable.dispose();
			scene.traverse((object) => {
				if (!(object instanceof THREE.Mesh) && !(object instanceof THREE.InstancedMesh)) return;
				object.geometry.dispose();
				const materials = Array.isArray(object.material) ? object.material : [object.material];
				for (const material of materials) material.dispose();
			});
			renderer.dispose();
		};
	}

	disconnectedCallback() {
		this.cleanup?.();
	}
}

if (!customElements.get('attribute-hero-computer')) {
	customElements.define('attribute-hero-computer', AttributeHeroComputer);
}
