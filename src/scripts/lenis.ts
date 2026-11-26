// Single global Lenis instance for the whole site, driven by GSAP's ticker
// and kept in sync with ScrollTrigger. Call initLenis() once per page (see
// BaseLayout.astro) — later calls just return the existing instance.
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | undefined;
let initialized = false;

export function initLenis(): Lenis | undefined {
	if (initialized) return lenis;
	initialized = true;

	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

	lenis = new Lenis({ autoRaf: false });
	lenis.on('scroll', ScrollTrigger.update);
	gsap.ticker.add((time) => {
		lenis?.raf(time * 1000);
	});
	gsap.ticker.lagSmoothing(0);

	return lenis;
}
