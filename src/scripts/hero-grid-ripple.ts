// Ported from ConnectedHero-hover.astro's grid-floor + mouse-ripple
// sub-system (an unused draft hero with a hand-rolled pseudo-3D canvas
// scene). Only the static grid and its click-triggered wave ripple are
// reused here — the circuit letter, signal dots, panels, connectors,
// landing/impact effects, and the continuous mouse-follow tilt/ripple are
// intentionally dropped. The mouse-follow version kept this module's render
// loop running on every animation frame for as long as the pointer moved
// across the hero, which was expensive enough (full-canvas gradient
// composites every frame) to starve the main thread and visibly stall the
// hero typewriter's timers — not worth it for a decorative hover effect.
// What's left — grid geometry, perspective, spacing, colour/opacity, fade,
// and the click-wave physics/easing — is kept verbatim from the source for
// exact visual and behavioural parity.
export interface GridRippleHandle {
	/** Fires one big ripple on the grid from a point in viewport (client)
	 * coordinates — e.g. a clicked button's center. Same big center-ripple
	 * recipe as the letter hover in ConnectedHero-hover.astro (fixed-radius
	 * envelope + a continuously advancing cosine phase), just self-timed
	 * instead of being driven by an ongoing hover, and placed at the click's
	 * position instead of a fixed point. Bounded to WAVE_DURATION_MS, so
	 * unlike the removed mouse-follow ripple this can't keep the render
	 * loop running indefinitely. */
	triggerWave(clientX: number, clientY: number): void;
	destroy(): void;
}

export function initGridRipple(container: HTMLElement, canvas: HTMLCanvasElement): GridRippleHandle {
	const context = canvas.getContext('2d');
	if (!context) return { triggerWave: () => {}, destroy: () => {} };

	type Point = [number, number, number];
	type Wave = { x: number; z: number; start: number };

	// Same scale as the centerRipple effect on the letter in
	// ConnectedHero-hover.astro: a wide fixed-radius envelope (4.4 world
	// units, versus the mouse ripple's 2.25) modulating a traveling cosine
	// wave (distance * 6 - phase) whose phase keeps advancing for as long as
	// the ripple is active — same 0.004/ms phase speed as the source. Here
	// each click gets its own lifetime instead of running for as long as a
	// hover lasts: amplitude rises and falls smoothly (a sine envelope) over
	// WAVE_DURATION_MS while its phase keeps advancing throughout.
	const WAVE_DURATION_MS = 1800;
	const WAVE_RADIUS = 4.4;
	const WAVE_FREQUENCY = 6;
	const WAVE_PEAK_AMPLITUDE = 0.11;
	const WAVE_PHASE_SPEED = 0.004;

	const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
	const target = { x: 0, y: 0, ripple: 0 };
	const view = { ...target };
	let waves: Wave[] = [];

	let width = 0;
	let height = 0;
	let frame = 0;
	let lastTime = 0;
	let currentTime = 0;
	let visible = true;

	// Hoisted out of render(): these three gradients depend only on
	// width/height (via centerX/centerY/unit below), never on the mouse or
	// ripple state, so recreating them on every animation frame — as the
	// original ConnectedHero-hover draft did — was pure waste. Canvas
	// gradient creation plus the two full-canvas destination-out composite
	// fills are the most expensive part of this draw; doing that work once
	// per resize instead of once per frame is what keeps continuous
	// mouse-follow redraws (every frame while the pointer moves over the
	// hero) from stealing enough main-thread time to stall the hero
	// typewriter's setTimeout-driven cadence.
	let unit = 0;
	let centerX = 0;
	let centerY = 0;
	let floorGradient: CanvasGradient | null = null;
	let edgeFadeGradient: CanvasGradient | null = null;
	let verticalFadeGradient: CanvasGradient | null = null;

	const buildGradients = () => {
		unit = Math.min(height * 0.126, width * 0.087);
		const stacked = width < 760;
		centerX = width * (stacked ? 0.48 : 0.5);
		centerY = height * (stacked ? 0.52 : 0.51);

		const floor = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, width * 0.63);
		floor.addColorStop(0, 'rgba(72, 72, 72, .18)');
		floor.addColorStop(0.49, 'rgba(72, 72, 72, .12)');
		floor.addColorStop(0.78, 'rgba(72, 72, 72, .07)');
		floor.addColorStop(1, 'rgba(72, 72, 72, 0)');
		floorGradient = floor;

		const edgeFade = context.createLinearGradient(0, 0, width, 0);
		edgeFade.addColorStop(0.006, 'rgba(0, 0, 0, 1)');
		edgeFade.addColorStop(0.055, 'rgba(0, 0, 0, .72)');
		edgeFade.addColorStop(0.16, 'rgba(0, 0, 0, 0)');
		edgeFade.addColorStop(0.84, 'rgba(0, 0, 0, 0)');
		edgeFade.addColorStop(0.945, 'rgba(0, 0, 0, .72)');
		edgeFade.addColorStop(0.994, 'rgba(0, 0, 0, 1)');
		edgeFadeGradient = edgeFade;

		const verticalFade = context.createLinearGradient(0, 0, 0, height);
		verticalFade.addColorStop(0.08, 'rgba(0, 0, 0, 1)');
		verticalFade.addColorStop(0.43, 'rgba(0, 0, 0, 0)');
		verticalFade.addColorStop(0.8, 'rgba(0, 0, 0, 0)');
		verticalFade.addColorStop(0.94, 'rgba(0, 0, 0, .6)');
		verticalFade.addColorStop(1, 'rgba(0, 0, 0, 1)');
		verticalFadeGradient = verticalFade;
	};

	const render = () => {
		if (!width || !height || !floorGradient || !edgeFadeGradient || !verticalFadeGradient) return;
		context.clearRect(0, 0, width, height);

		const yaw = -Math.PI / 4 + view.x * 0.063;
		const pitch = 0.55 + view.y * 0.038;
		const sinYaw = Math.sin(yaw);
		const cosYaw = Math.cos(yaw);
		const sinPitch = Math.sin(pitch);
		const cosPitch = Math.cos(pitch);

		const project = ([x, y, z]: Point): Point => {
			const horizontal = x * cosYaw + z * sinYaw;
			const forward = z * cosYaw - x * sinYaw;
			const vertical = y * cosPitch - forward * sinPitch;
			const depth = y * sinPitch + forward * cosPitch;
			return [centerX + horizontal * unit, centerY - vertical * unit, depth];
		};

		const softBend = (distance: number, span: number) => {
			const progress = Math.min(1, Math.max(0, distance / span));
			return progress * progress * (3 - 2 * progress);
		};

		const gridPoint = (x: number, z: number): Point => {
			// The center stays level while the outer mesh rises and falls gently.
			const shoulder = softBend(Math.abs(x) - 4.6, 4.5);
			const back = softBend(-z - 3.65, 5.2);
			const front = softBend(z - 4.12, 4.4);
			const rearCorner = softBend(-x - 2.1, 3.6) * softBend(-z - 1.35, 2.75);
			const nearCorner = softBend(-x - 2.84, 3.7) * softBend(z - 1.63, 3.2);
			let y = 0.96 * back - 0.66 * shoulder - 0.46 * front + 0.86 * rearCorner - 0.78 * nearCorner;
			for (const wave of waves) {
				const elapsed = currentTime - wave.start;
				if (elapsed < 0 || elapsed > WAVE_DURATION_MS) continue;
				const amplitude = WAVE_PEAK_AMPLITUDE * Math.sin(Math.PI * (elapsed / WAVE_DURATION_MS));
				const distance = Math.hypot(x - wave.x, z - wave.z);
				const envelope = 1 - softBend(distance, WAVE_RADIUS);
				const phase = elapsed * WAVE_PHASE_SPEED;
				y += amplitude * envelope * Math.cos(distance * WAVE_FREQUENCY - phase);
			}
			return project([x, y, z]);
		};

		// Sampling step/line count: halved from the original 0.2-unit step and
		// 64-cell half-width (a ~3x cut in path points) — this grid redraws on
		// every animation frame while the pointer moves, and stroking a path
		// with tens of thousands of segments every frame was heavy enough to
		// starve the main thread and stall the hero typewriter's timers. At
		// this density the floor still reads as a continuous grid; only the
		// line count is coarser.
		const traceGrid = (fixed: number, across: boolean) => {
			for (let i = 0; i <= 50; i++) {
				const coordinate = -10 + i * 0.4;
				const [x, y] = across ? gridPoint(coordinate, fixed) : gridPoint(fixed, coordinate);
				if (i === 0) context.moveTo(x, y);
				else context.lineTo(x, y);
			}
		};

		context.lineCap = 'butt';
		context.strokeStyle = floorGradient;
		context.lineWidth = 0.7;
		context.beginPath();
		const halfCells = 40;
		for (let line = -halfCells; line <= halfCells; line++) {
			const coordinate = (line * 10) / halfCells;
			traceGrid(coordinate, true);
			traceGrid(coordinate, false);
		}
		context.stroke();

		// Fade the floor at the canvas edges, same as the source.
		context.save();
		context.globalCompositeOperation = 'destination-out';
		context.fillStyle = edgeFadeGradient;
		context.fillRect(0, 0, width, height);
		context.fillStyle = verticalFadeGradient;
		context.fillRect(0, 0, width, height);
		context.restore();
	};

	const queue = () => {
		if (!frame && visible && !motion.matches) frame = requestAnimationFrame(animate);
	};

	// Caps the actual canvas redraw (the expensive part) at ~30fps while the
	// pointer keeps this loop running continuously — the ripple motion is
	// slow/subtle enough that this is visually seamless, and it halves the
	// main-thread time this effect competes for against the hero
	// typewriter's timers during sustained mouse movement.
	const RENDER_INTERVAL_MS = 32;
	let lastRenderTime = -Infinity;

	const animate = (time: number) => {
		frame = 0;
		const frameElapsed = lastTime ? time - lastTime : 16;
		const elapsed = Math.min(frameElapsed, 48);
		lastTime = time;
		currentTime = time;

		waves = waves.filter((wave) => time - wave.start < WAVE_DURATION_MS);

		const blend = 1 - Math.exp(-elapsed / 290);
		const moving = view.x !== target.x || view.y !== target.y || view.ripple !== target.ripple;
		view.x += (target.x - view.x) * blend;
		view.y += (target.y - view.y) * blend;
		view.ripple += (target.ripple - view.ripple) * blend;
		const remaining =
			Math.abs(target.x - view.x) + Math.abs(target.y - view.y) + Math.abs(target.ripple - view.ripple);
		if (remaining <= 0.001) Object.assign(view, target);

		const stillActive = moving || waves.length > 0;
		// Always draw the final settle frame (stillActive just went false) so
		// the view doesn't visibly stop short of its target.
		if (!stillActive || time - lastRenderTime >= RENDER_INTERVAL_MS) {
			render();
			lastRenderTime = time;
		}

		if (stillActive) queue();
		else lastTime = 0;
	};

	const resize = () => {
		const bounds = container.getBoundingClientRect();
		width = bounds.width;
		height = bounds.height;
		const density = Math.min(window.devicePixelRatio || 1, 2);
		canvas.width = Math.max(1, Math.round(width * density));
		canvas.height = Math.max(1, Math.round(height * density));
		context.setTransform(density, 0, 0, density, 0, 0);
		buildGradients();
		render();
	};

	// Inverse of the floor projection in render() (same formulas as the
	// pointerX/pointerZ derivation there), parametrized by an arbitrary
	// normalized screen point instead of the live pointer position, so a
	// one-off trigger point (e.g. a clicked button, not the mouse) can be
	// placed on the grid under the current camera orientation.
	const toWorld = (normalizedX: number, normalizedY: number): [number, number] => {
		const yaw = -Math.PI / 4 + view.x * 0.063;
		const pitch = 0.55 + view.y * 0.038;
		const stacked = width < 760;
		const centerX = width * (stacked ? 0.48 : 0.5);
		const centerY = height * (stacked ? 0.52 : 0.51);
		const unit = Math.min(height * 0.126, width * 0.087);
		const across = (((normalizedX + 1) * width) / 2 - centerX) / unit;
		const depth = (((normalizedY + 1) * height) / 2 - centerY) / (unit * Math.sin(pitch));
		const x = across * Math.cos(yaw) - depth * Math.sin(yaw);
		const z = across * Math.sin(yaw) + depth * Math.cos(yaw);
		return [x, z];
	};

	const triggerWave = (clientX: number, clientY: number) => {
		if (motion.matches || !width || !height) return;
		const rect = container.getBoundingClientRect();
		if (!rect.width || !rect.height) return;
		const normalizedX = (2 * (clientX - rect.left)) / rect.width - 1;
		const normalizedY = (2 * (clientY - rect.top)) / rect.height - 1;
		const [x, z] = toWorld(normalizedX, normalizedY);
		waves.push({ x, z, start: performance.now() });
		queue();
	};

	const events = new AbortController();
	const options = { signal: events.signal, passive: true };

	motion.addEventListener(
		'change',
		() => {
			if (!motion.matches) {
				queue();
				return;
			}
			cancelAnimationFrame(frame);
			frame = 0;
			lastTime = 0;
			Object.assign(target, { x: 0, y: 0, ripple: 0 });
			Object.assign(view, target);
			render();
		},
		options,
	);

	const resizeObserver = new ResizeObserver(resize);
	resizeObserver.observe(container);

	const intersectionObserver = new IntersectionObserver(([entry]) => {
		visible = entry.isIntersecting;
		if (visible) {
			queue();
		} else {
			cancelAnimationFrame(frame);
			frame = 0;
			lastTime = 0;
		}
	});
	intersectionObserver.observe(container);

	resize();

	return {
		triggerWave,
		destroy: () => {
			resizeObserver.disconnect();
			intersectionObserver.disconnect();
			events.abort();
			cancelAnimationFrame(frame);
		},
	};
}
