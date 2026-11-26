// Ported from ConnectedHero-hover.astro's "ai" workspace panel
// (drawWorkspace, kind === 'ai', ~lines 756-781): a burst of small blue
// particles radiating from the AI chip while that panel is hovered.
// Reused here as a one-shot burst fired on click, rather than continuing
// for as long as a 3D panel is hovered — same particle count, golden-
// angle distribution, stagger, colours, and fade envelope as the source;
// only the spread/lift distances are reparametrized from 3D world units
// into on-screen pixels sized for a small UI element.
const PARTICLE_COUNT = 12;
const GOLDEN_ANGLE = 2.399963;
const BURST_DURATION = 1320;
const SPREAD_PX = 34;
const LIFT_PX = 30;

const ease = (value: number) => value * value * (3 - 2 * value);
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export function burstChipParticles(origin: HTMLElement): void {
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

	const rect = origin.getBoundingClientRect();
	const originX = rect.left + rect.width / 2;
	const originY = rect.top + rect.height / 2;

	const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
		const radius = Math.max(2, 2 + (i % 4) * 1.1);
		const el = document.createElement('span');
		el.style.position = 'fixed';
		el.style.left = '0';
		el.style.top = '0';
		el.style.width = `${radius * 2}px`;
		el.style.height = `${radius * 2}px`;
		el.style.marginLeft = `${-radius}px`;
		el.style.marginTop = `${-radius}px`;
		el.style.borderRadius = '50%';
		el.style.pointerEvents = 'none';
		el.style.zIndex = '9999';
		el.style.opacity = '0';
		el.style.background = 'radial-gradient(circle, #bdf4ff 0%, #bdf4ff 52%, #008fd6 53%, #008fd6 100%)';
		document.body.appendChild(el);
		return el;
	});

	const start = performance.now();

	const step = (time: number) => {
		const elapsed = time - start;
		if (elapsed >= BURST_DURATION) {
			for (const el of particles) el.remove();
			return;
		}

		for (const [i, el] of particles.entries()) {
			const age = (elapsed - (i % 6) * 65) / (710 + (i % 5) * 55);
			if (age <= 0 || age >= 1) {
				el.style.opacity = '0';
				continue;
			}
			const angle = i * GOLDEN_ANGLE;
			const spread = ease(age) * (0.38 + (i % 7) * 0.075);
			const lift = age * (0.35 + (i % 5) * 0.13);
			const x = originX + Math.cos(angle) * spread * SPREAD_PX;
			const y = originY + Math.sin(angle) * spread * SPREAD_PX - lift * LIFT_PX;

			el.style.transform = `translate(${x}px, ${y}px)`;
			el.style.opacity = String(ease(clamp01(age * 8)) * (1 - age));
		}

		requestAnimationFrame(step);
	};

	requestAnimationFrame(step);
}
