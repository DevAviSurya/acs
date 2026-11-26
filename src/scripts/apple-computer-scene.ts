// Realistic, procedurally-built iMac-style desktop computer (no branding —
// plain brushed-aluminum chassis, no logo of any kind) that rotates from
// back-facing to front-facing on scroll, then "ejects" six service cards
// from its screen like physical sheets of paper. Built entirely from Three.js
// primitives/canvas textures — no external 3D model or image assets.
//
// Driven by a single GSAP-ticker render loop and one scrubbed ScrollTrigger
// that pins the section; every visual state is a pure function of the
// ScrollTrigger's 0..1 progress, so the whole sequence is trivially
// reversible when the user scrolls back up.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ---------------------------------------------------------------------------
// Service content (mirrors src/data/services.ts' allServices copy/order —
// duplicated as plain strings so this client-rendered scene never has to
// import the Astro-icon-bearing data module).
// ---------------------------------------------------------------------------

type IconNode = ['path', { d: string }] | ['circle', { cx: string; cy: string; r: string }] | ['rect', { x: string; y: string; width: string; height: string; rx?: string }];

interface ServiceCardData {
	title: string;
	blurb: string;
	icon: IconNode[];
}

const SERVICES: ServiceCardData[] = [
	{
		title: 'Website',
		blurb: 'Fast, modern sites built to convert visitors',
		icon: [
			['circle', { cx: '12', cy: '12', r: '10' }],
			['path', { d: 'M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20' }],
			['path', { d: 'M2 12h20' }],
		],
	},
	{
		title: 'AI Integration',
		blurb: 'Practical AI built into how you already work',
		icon: [
			['path', { d: 'M12 8V4H8' }],
			['rect', { x: '4', y: '8', width: '16', height: '12', rx: '2' }],
			['path', { d: 'M2 14h2' }],
			['path', { d: 'M20 14h2' }],
			['path', { d: 'M15 13v2' }],
			['path', { d: 'M9 13v2' }],
		],
	},
	{
		title: 'SEO & AEO',
		blurb: 'Get found in search results and AI answers',
		icon: [
			['path', { d: 'm21 21-4.34-4.34' }],
			['circle', { cx: '11', cy: '11', r: '8' }],
		],
	},
	{
		title: 'Digital Marketing',
		blurb: 'Campaigns that turn attention into customers',
		icon: [
			['path', { d: 'M11 6a13 13 0 0 0 8.4-2.8A1 1 0 0 1 21 4v12a1 1 0 0 1-1.6.8A13 13 0 0 0 11 14H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z' }],
			['path', { d: 'M6 14a12 12 0 0 0 2.4 7.2 2 2 0 0 0 3.2-2.4A8 8 0 0 1 10 14' }],
			['path', { d: 'M8 6v8' }],
		],
	},
	{
		title: 'Graphic Design & Printing',
		blurb: 'Brand identity, produced to a premium standard',
		icon: [
			['path', { d: 'm18 13-.654-4.736a4 4 0 00-2.756-3.266l-9.163-2.9a2 2 0 00-2.017.493l-.82.819a2 2 0 00-.492 2.017l2.9 9.163a4 4 0 003.266 2.756L13 18' }],
			['path', { d: 'M18.648 12.352a1.205 1.205 0 011.704 0l1.296 1.296a1.205 1.205 0 010 1.704l-6.296 6.296a1.205 1.205 0 01-1.704 0l-1.296-1.296a1.205 1.205 0 010-1.704z' }],
			['path', { d: 'm3 3 6.586 6.586' }],
			['circle', { cx: '11', cy: '11', r: '2' }],
		],
	},
	{
		title: 'Corporate Merchandising',
		blurb: 'Branded gear, sourced and delivered at scale',
		icon: [
			['path', { d: 'M12 7v14' }],
			['path', { d: 'M20 11v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8' }],
			['path', { d: 'M7.5 7a1 1 0 0 1 0-5A4.8 8 0 0 1 12 7a4.8 8 0 0 1 4.5-5 1 1 0 0 1 0 5' }],
			['rect', { x: '3', y: '7', width: '18', height: '4', rx: '1' }],
		],
	},
];

const INK = '#201e1b';
const MUTED = '#595959';
const PAPER_BORDER = '#d6d6d6';

// ---------------------------------------------------------------------------
// Canvas-drawn card texture (paper card: icon + title + blurb)
// ---------------------------------------------------------------------------

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.arcTo(x + w, y, x + w, y + h, r);
	ctx.arcTo(x + w, y + h, x, y + h, r);
	ctx.arcTo(x, y + h, x, y, r);
	ctx.arcTo(x, y, x + w, y, r);
	ctx.closePath();
}

function drawIcon(ctx: CanvasRenderingContext2D, nodes: IconNode[]) {
	ctx.strokeStyle = INK;
	ctx.lineWidth = 1.7;
	ctx.lineJoin = 'round';
	ctx.lineCap = 'round';
	for (const [tag, attrs] of nodes) {
		if (tag === 'path') {
			ctx.stroke(new Path2D(attrs.d));
		} else if (tag === 'circle') {
			ctx.beginPath();
			ctx.arc(Number(attrs.cx), Number(attrs.cy), Number(attrs.r), 0, Math.PI * 2);
			ctx.stroke();
		} else {
			roundRectPath(ctx, Number(attrs.x), Number(attrs.y), Number(attrs.width), Number(attrs.height), Number(attrs.rx ?? 0));
			ctx.stroke();
		}
	}
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
	const words = text.split(' ');
	let line = '';
	let cursorY = y;
	for (const word of words) {
		const test = line ? `${line} ${word}` : word;
		if (ctx.measureText(test).width > maxWidth && line) {
			ctx.fillText(line, x, cursorY);
			line = word;
			cursorY += lineHeight;
		} else {
			line = test;
		}
	}
	if (line) ctx.fillText(line, x, cursorY);
}

function buildCardTexture(service: ServiceCardData): THREE.CanvasTexture {
	const w = 640;
	const h = 800;
	const canvas = document.createElement('canvas');
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext('2d');
	if (!ctx) return new THREE.CanvasTexture(canvas);

	const gradient = ctx.createLinearGradient(0, 0, 0, h);
	gradient.addColorStop(0, '#ffffff');
	gradient.addColorStop(1, '#f4f4f5');
	ctx.fillStyle = gradient;
	roundRectPath(ctx, 6, 6, w - 12, h - 12, 34);
	ctx.fill();
	ctx.strokeStyle = PAPER_BORDER;
	ctx.lineWidth = 3;
	ctx.stroke();

	ctx.save();
	ctx.translate(w / 2 - 12 * 4.4, 170);
	ctx.scale(4.4, 4.4);
	drawIcon(ctx, service.icon);
	ctx.restore();

	ctx.fillStyle = INK;
	ctx.textAlign = 'center';
	ctx.font = '700 44px "Rethink Sans Variable", "Rethink Sans", sans-serif';
	wrapText(ctx, service.title, w / 2, 400, w - 140, 50);

	ctx.fillStyle = MUTED;
	ctx.font = '400 27px "Rethink Sans Variable", "Rethink Sans", sans-serif';
	wrapText(ctx, service.blurb, w / 2, 490, w - 160, 36);

	const texture = new THREE.CanvasTexture(canvas);
	texture.colorSpace = THREE.SRGBColorSpace;
	texture.anisotropy = 4;
	return texture;
}

// ---------------------------------------------------------------------------
// Card geometry — a subdivided plane with a baked per-vertex curl profile so
// curvature can be scaled live (more curved mid-flight, flatter at rest).
// ---------------------------------------------------------------------------

const CARD_WIDTH = 1.5;
const CARD_HEIGHT = 1.875;

interface CurledCard {
	mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>;
	baseCurve: Float32Array;
}

function buildCard(service: ServiceCardData): CurledCard {
	const geometry = new THREE.PlaneGeometry(CARD_WIDTH, CARD_HEIGHT, 20, 12);
	const position = geometry.attributes.position;
	const baseCurve = new Float32Array(position.count);
	for (let i = 0; i < position.count; i++) {
		const x = position.getX(i) / (CARD_WIDTH / 2);
		baseCurve[i] = Math.sin((x * Math.PI) / 2);
	}

	const material = new THREE.MeshStandardMaterial({
		map: buildCardTexture(service),
		roughness: 0.82,
		metalness: 0,
		envMapIntensity: 0.25,
		side: THREE.DoubleSide,
	});

	const mesh = new THREE.Mesh(geometry, material);
	mesh.visible = false;
	return { mesh, baseCurve };
}

function applyCurl(card: CurledCard, amount: number) {
	const position = card.mesh.geometry.attributes.position;
	for (let i = 0; i < position.count; i++) {
		position.setZ(i, card.baseCurve[i] * amount);
	}
	position.needsUpdate = true;
	card.mesh.geometry.computeVertexNormals();
}

// ---------------------------------------------------------------------------
// The computer itself — plain brushed-aluminum iMac-style all-in-one.
// No logo or branding geometry anywhere on the chassis.
// ---------------------------------------------------------------------------

interface Computer {
	group: THREE.Group;
	screenMaterial: THREE.MeshStandardMaterial;
}

function buildComputer(): Computer {
	const group = new THREE.Group();

	const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xe8e8ea, metalness: 0.72, roughness: 0.33 });
	const bezelMaterial = new THREE.MeshStandardMaterial({ color: 0x191816, metalness: 0.15, roughness: 0.6 });
	const standMaterial = new THREE.MeshStandardMaterial({ color: 0xdadadb, metalness: 0.78, roughness: 0.3 });
	const ventMaterial = new THREE.MeshStandardMaterial({ color: 0xb9b9ba, metalness: 0.5, roughness: 0.45 });
	const screenMaterial = new THREE.MeshStandardMaterial({
		color: 0x050505,
		emissive: 0x000000,
		emissiveIntensity: 0,
		metalness: 0.05,
		roughness: 0.42,
	});

	const chassis = new THREE.Mesh(new RoundedBoxGeometry(2.3, 1.55, 0.14, 4, 0.055), bodyMaterial);
	group.add(chassis);

	const bezel = new THREE.Mesh(new RoundedBoxGeometry(2.1, 1.38, 0.02, 4, 0.03), bezelMaterial);
	bezel.position.z = 0.075;
	group.add(bezel);

	const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.96, 1.24), screenMaterial);
	screen.position.z = 0.086;
	group.add(screen);

	for (let i = 0; i < 9; i++) {
		const vent = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.014, 0.012), ventMaterial);
		vent.position.set(0, -0.5 + i * 0.05, -0.071);
		group.add(vent);
	}

	const neck = new THREE.Mesh(new RoundedBoxGeometry(0.46, 0.4, 0.09, 2, 0.025), standMaterial);
	neck.position.set(0, -1.02, -0.01);
	group.add(neck);

	const foot = new THREE.Mesh(new RoundedBoxGeometry(1.15, 0.045, 0.74, 3, 0.02), standMaterial);
	foot.position.set(0, -1.235, 0.17);
	group.add(foot);

	group.position.y = 0.55;
	group.rotation.y = Math.PI; // start back-facing the camera

	return { group, screenMaterial };
}

function buildContactShadow(): THREE.Mesh {
	const size = 256;
	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext('2d');
	if (ctx) {
		const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
		gradient.addColorStop(0, 'rgba(0, 0, 0, 0.32)');
		gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.1)');
		gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, size, size);
	}
	const texture = new THREE.CanvasTexture(canvas);
	const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false });
	const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.4), material);
	mesh.rotation.x = -Math.PI / 2;
	mesh.position.set(0, -0.685, 0.17);
	return mesh;
}

// ---------------------------------------------------------------------------
// Card layout — six slots in a balanced arc around the computer, filled in
// an order that keeps the composition balanced at every point along the way.
// ---------------------------------------------------------------------------

interface Slot {
	position: THREE.Vector3;
	rotationY: number;
	rotationZ: number;
}

function deg(value: number) {
	return (value * Math.PI) / 180;
}

const SLOTS: Slot[] = [
	{ position: new THREE.Vector3(-2.25, 0.5, 0.55), rotationY: deg(14), rotationZ: deg(-5) },
	{ position: new THREE.Vector3(2.25, 0.45, 0.4), rotationY: deg(-13), rotationZ: deg(4) },
	{ position: new THREE.Vector3(-2.05, 1.65, 0.3), rotationY: deg(11), rotationZ: deg(5) },
	{ position: new THREE.Vector3(2.05, 1.6, 0.6), rotationY: deg(-12), rotationZ: deg(-4) },
	{ position: new THREE.Vector3(-2.1, -0.65, 0.6), rotationY: deg(9), rotationZ: deg(-4) },
	{ position: new THREE.Vector3(2.15, -0.6, 0.3), rotationY: deg(-10), rotationZ: deg(6) },
];

const SCREEN_EXIT = new THREE.Vector3(0, 0.62, 0.17);

function clamp01(value: number) {
	return Math.min(1, Math.max(0, value));
}

function smoothstep(value: number) {
	const t = clamp01(value);
	return t * t * (3 - 2 * t);
}

function poseCard(card: CurledCard, slot: Slot, progress: number) {
	if (progress <= 0) {
		card.mesh.visible = false;
		return;
	}
	card.mesh.visible = true;

	const eased = smoothstep(progress);
	const oneMinus = 1 - eased;
	const pop = new THREE.Vector3(
		(SCREEN_EXIT.x + slot.position.x) / 2,
		(SCREEN_EXIT.y + slot.position.y) / 2,
		Math.max(SCREEN_EXIT.z, slot.position.z) + 1.15,
	);

	const x = oneMinus * oneMinus * SCREEN_EXIT.x + 2 * oneMinus * eased * pop.x + eased * eased * slot.position.x;
	const y = oneMinus * oneMinus * SCREEN_EXIT.y + 2 * oneMinus * eased * pop.y + eased * eased * slot.position.y;
	const z = oneMinus * oneMinus * SCREEN_EXIT.z + 2 * oneMinus * eased * pop.z + eased * eased * slot.position.z;
	card.mesh.position.set(x, y, z);

	const flutter = Math.sin(progress * Math.PI) * 0.3 * (1 - progress * 0.5);
	card.mesh.rotation.set(0, slot.rotationY * eased + flutter * 0.5, slot.rotationZ * eased + flutter);

	const scale = 0.12 + 0.88 * eased;
	card.mesh.scale.setScalar(scale);

	const curl = 0.045 + 0.4 * (1 - eased) * (1 - eased);
	applyCurl(card, curl);
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export interface AppleComputerSceneOptions {
	section: HTMLElement;
	stage: HTMLElement;
	canvas: HTMLCanvasElement;
}

const ROTATE_PHASE_END = 0.22;
const HALF_WIDTH = 3.2;
const HALF_HEIGHT = 2.5;

export function initAppleComputerScene({ section, stage, canvas }: AppleComputerSceneOptions): () => void {
	const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 1.05;

	const scene = new THREE.Scene();

	const pmrem = new THREE.PMREMGenerator(renderer);
	scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
	pmrem.dispose();

	const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
	camera.position.set(0, 0.35, 8);
	camera.lookAt(0, 0.35, 0);

	scene.add(new THREE.AmbientLight(0xffffff, 0.3));
	const key = new THREE.DirectionalLight(0xffffff, 1.15);
	key.position.set(2.6, 3.4, 3.2);
	scene.add(key);
	const fill = new THREE.DirectionalLight(0xffffff, 0.4);
	fill.position.set(-3, 1.6, 2.2);
	scene.add(fill);
	const rim = new THREE.DirectionalLight(0xffffff, 0.55);
	rim.position.set(-1.4, 1.1, -3.4);
	scene.add(rim);

	const computer = buildComputer();
	scene.add(computer.group);
	scene.add(buildContactShadow());

	const cards = SERVICES.map((service) => buildCard(service));
	for (const card of cards) scene.add(card.mesh);

	function fitCamera() {
		const aspect = stage.clientWidth / Math.max(1, stage.clientHeight);
		camera.aspect = aspect;
		const vFov = (camera.fov * Math.PI) / 180;
		const distanceForHeight = HALF_HEIGHT / Math.tan(vFov / 2);
		const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
		const distanceForWidth = HALF_WIDTH / Math.tan(hFov / 2);
		camera.position.z = Math.max(distanceForHeight, distanceForWidth) * 1.08;
		camera.updateProjectionMatrix();
	}

	function handleResize() {
		const width = stage.clientWidth;
		const height = stage.clientHeight;
		if (!width || !height) return;
		renderer.setSize(width, height, false);
		fitCamera();
	}

	handleResize();

	function applyProgress(progress: number) {
		const rotateT = clamp01(progress / ROTATE_PHASE_END);
		computer.group.rotation.y = Math.PI + smoothstep(rotateT) * Math.PI;

		const screenOn = smoothstep(clamp01((rotateT - 0.65) / 0.35));
		computer.screenMaterial.emissive.setScalar(screenOn);
		computer.screenMaterial.emissiveIntensity = screenOn * 0.65;

		const cardsT = clamp01((progress - ROTATE_PHASE_END) / (1 - ROTATE_PHASE_END));
		const slice = 1 / cards.length;
		for (let i = 0; i < cards.length; i++) {
			const local = clamp01((cardsT - i * slice) / slice);
			poseCard(cards[i], SLOTS[i], local);
		}
	}

	applyProgress(0);

	const scrollTrigger = ScrollTrigger.create({
		trigger: section,
		start: 'top top',
		end: () => `+=${Math.round(window.innerHeight * 3.6)}`,
		pin: true,
		scrub: true,
		invalidateOnRefresh: true,
		onUpdate: (self) => applyProgress(self.progress),
		onRefresh: (self) => applyProgress(self.progress),
	});
	ScrollTrigger.refresh();

	let rafActive = false;
	function renderFrame() {
		renderer.render(scene, camera);
	}
	function startRaf() {
		if (rafActive) return;
		rafActive = true;
		gsap.ticker.add(renderFrame);
	}
	function stopRaf() {
		if (!rafActive) return;
		rafActive = false;
		gsap.ticker.remove(renderFrame);
	}

	const intersectionObserver = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) startRaf();
				else stopRaf();
			}
		},
		{ threshold: 0 },
	);
	intersectionObserver.observe(section);

	window.addEventListener('resize', handleResize);
	startRaf();
	renderFrame();

	return () => {
		stopRaf();
		intersectionObserver.disconnect();
		window.removeEventListener('resize', handleResize);
		scrollTrigger.kill();
		for (const card of cards) {
			card.mesh.geometry.dispose();
			card.mesh.material.map?.dispose();
			card.mesh.material.dispose();
		}
		scene.environment?.dispose();
		renderer.dispose();
	};
}
