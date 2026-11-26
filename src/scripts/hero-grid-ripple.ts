// Ported from ConnectedHero-hover.astro's grid-floor + mouse-ripple
// sub-system (an unused draft hero with a hand-rolled pseudo-3D canvas
// scene). Only the grid and its mouse-ripple animation are reused here —
// the circuit letter, signal dots, panels, connectors, and landing/
// impact effects are intentionally dropped, since none of that applies
// without the letter. Everything else — grid geometry, perspective,
// spacing, density, line thickness, colour/opacity, fade, ripple
// physics, and easing — is kept verbatim from the source for exact
// visual and behavioural parity.
export function initGridRipple(container: HTMLElement, canvas: HTMLCanvasElement): () => void {
	const context = canvas.getContext('2d');
	if (!context) return () => {};

	type Point = [number, number, number];

	const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
	const target = { x: 0, y: 0, ripple: 0 };
	const view = { ...target };

	let width = 0;
	let height = 0;
	let frame = 0;
	let lastTime = 0;
	let visible = true;

	const render = () => {
		if (!width || !height) return;
		context.clearRect(0, 0, width, height);

		const unit = Math.min(height * 0.126, width * 0.087);
		const stacked = width < 760;
		const centerX = width * (stacked ? 0.48 : 0.5);
		const centerY = height * (stacked ? 0.52 : 0.51);
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

		// Invert the floor projection so the ripple is circular on the 3D surface.
		const pointerAcross = (((view.x + 1) * width) / 2 - centerX) / unit;
		const pointerDepth = (((view.y + 1) * height) / 2 - centerY) / (unit * sinPitch);
		const pointerX = pointerAcross * cosYaw - pointerDepth * sinYaw;
		const pointerZ = pointerAcross * sinYaw + pointerDepth * cosYaw;
		const rippleRadius = 2.25;
		const rippleHeight = 0.08 * view.ripple;

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
			if (rippleHeight > 0.0003) {
				const distance = Math.hypot(x - pointerX, z - pointerZ) / rippleRadius;
				const envelope = 1 - softBend(distance, 1);
				y += rippleHeight * envelope * Math.cos(distance * Math.PI * 3.2);
			}
			return project([x, y, z]);
		};

		const traceGrid = (fixed: number, across: boolean) => {
			for (let i = 0; i <= 100; i++) {
				const coordinate = -10 + i * 0.2;
				const [x, y] = across ? gridPoint(coordinate, fixed) : gridPoint(fixed, coordinate);
				if (i === 0) context.moveTo(x, y);
				else context.lineTo(x, y);
			}
		};

		const floor = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, width * 0.63);
		floor.addColorStop(0, 'rgba(72, 72, 72, .18)');
		floor.addColorStop(0.49, 'rgba(72, 72, 72, .11)');
		floor.addColorStop(0.78, 'rgba(72, 72, 72, .05)');
		floor.addColorStop(1, 'rgba(72, 72, 72, 0)');
		context.lineCap = 'butt';
		context.strokeStyle = floor;
		context.lineWidth = 0.48;
		context.beginPath();
		const halfCells = 64;
		for (let line = -halfCells; line <= halfCells; line++) {
			const coordinate = (line * 10) / halfCells;
			traceGrid(coordinate, true);
			traceGrid(coordinate, false);
		}
		context.stroke();

		// Fade the floor at the canvas edges, same as the source.
		const edgeFade = context.createLinearGradient(0, 0, width, 0);
		edgeFade.addColorStop(0.006, 'rgba(0, 0, 0, 1)');
		edgeFade.addColorStop(0.055, 'rgba(0, 0, 0, .72)');
		edgeFade.addColorStop(0.16, 'rgba(0, 0, 0, 0)');
		edgeFade.addColorStop(0.84, 'rgba(0, 0, 0, 0)');
		edgeFade.addColorStop(0.945, 'rgba(0, 0, 0, .72)');
		edgeFade.addColorStop(0.994, 'rgba(0, 0, 0, 1)');
		context.save();
		context.globalCompositeOperation = 'destination-out';
		context.fillStyle = edgeFade;
		context.fillRect(0, 0, width, height);
		const verticalFade = context.createLinearGradient(0, 0, 0, height);
		verticalFade.addColorStop(0.08, 'rgba(0, 0, 0, 1)');
		verticalFade.addColorStop(0.43, 'rgba(0, 0, 0, 0)');
		verticalFade.addColorStop(0.8, 'rgba(0, 0, 0, 0)');
		verticalFade.addColorStop(0.94, 'rgba(0, 0, 0, .6)');
		verticalFade.addColorStop(1, 'rgba(0, 0, 0, 1)');
		context.fillStyle = verticalFade;
		context.fillRect(0, 0, width, height);
		context.restore();
	};

	const queue = () => {
		if (!frame && visible && !motion.matches) frame = requestAnimationFrame(animate);
	};

	const animate = (time: number) => {
		frame = 0;
		const frameElapsed = lastTime ? time - lastTime : 16;
		const elapsed = Math.min(frameElapsed, 48);
		lastTime = time;

		const blend = 1 - Math.exp(-elapsed / 290);
		const moving = view.x !== target.x || view.y !== target.y || view.ripple !== target.ripple;
		view.x += (target.x - view.x) * blend;
		view.y += (target.y - view.y) * blend;
		view.ripple += (target.ripple - view.ripple) * blend;
		const remaining =
			Math.abs(target.x - view.x) + Math.abs(target.y - view.y) + Math.abs(target.ripple - view.ripple);
		if (remaining <= 0.001) Object.assign(view, target);

		render();

		if (moving) queue();
		else lastTime = 0;
	};

	const reset = () => {
		target.x = 0;
		target.y = 0;
		target.ripple = 0;
		if (view.x || view.y || view.ripple) queue();
		else render();
	};

	const resize = () => {
		const bounds = container.getBoundingClientRect();
		width = bounds.width;
		height = bounds.height;
		const density = Math.min(window.devicePixelRatio || 1, 2);
		canvas.width = Math.max(1, Math.round(width * density));
		canvas.height = Math.max(1, Math.round(height * density));
		context.setTransform(density, 0, 0, density, 0, 0);
		render();
	};

	const aim = (event: PointerEvent) => {
		const rect = container.getBoundingClientRect();
		if (motion.matches || !rect.width || !rect.height) return;
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;
		target.x = (2 * x) / rect.width - 1;
		target.y = (2 * y) / rect.height - 1;
		target.ripple = 1;
		queue();
	};

	const events = new AbortController();
	const options = { signal: events.signal, passive: true };

	container.addEventListener(
		'pointermove',
		(event) => {
			if (event.pointerType === 'mouse') aim(event);
		},
		options,
	);
	container.addEventListener(
		'pointerleave',
		(event) => {
			if (event.pointerType === 'mouse') reset();
		},
		options,
	);
	container.addEventListener('pointercancel', reset, options);

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

	return () => {
		resizeObserver.disconnect();
		intersectionObserver.disconnect();
		events.abort();
		cancelAnimationFrame(frame);
	};
}
