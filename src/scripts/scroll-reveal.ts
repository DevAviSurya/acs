// Centralized scroll-triggered content reveal for homepage sections below the
// Hero (which has its own entrance animation and is untouched by this file).
//
// Usage: tag markup with a single `data-reveal` attribute instead of writing
// GSAP calls per component.
//
//   data-reveal="text"     — heading: split into lines, each line masked and
//                             slid up into place (SplitText + mask: "lines").
//   data-reveal="up"       — single element: fades and slides up slightly.
//   data-reveal="stagger"  — container: its direct children (or the elements
//                             matched by `data-reveal-target`, a selector)
//                             fade/slide up in a staggered cascade.
//   data-reveal="image"    — visual block: fades in while scaling down from
//                             a slight zoom, clipped by an overflow-hidden
//                             ancestor if present.
//
// Every element plays once, driven purely by scroll position (no fixed
// delays) — so entrances cascade naturally as the page is scrolled rather
// than on a timer, and already-revealed content never re-hides when
// scrolling back up. Skips entirely under prefers-reduced-motion, leaving
// all content at its normal, final layout with no transform/opacity applied.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

const EASE = 'power3.out';
const TEXT_EASE = 'power4.out';

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Headings: each visual line rises out of a mask (overflow-hidden wrapper,
// added automatically by SplitText's `mask` option) rather than just fading,
// which reads as a far more deliberate, editorial entrance than a plain fade.
// Wrapped in autoSplit/onSplit so lines are re-measured if the heading
// rewraps (resize, orientation change) — before the reveal has played, a
// rewrap simply re-arms it; after, it just keeps the lines visible instead
// of replaying.
function revealHeading(el: HTMLElement): void {
	let played = false;

	SplitText.create(el, {
		type: 'lines',
		mask: 'lines',
		autoSplit: true,
		onSplit(self) {
			if (played) {
				gsap.set(self.lines, { yPercent: 0 });
				return undefined;
			}

			gsap.set(self.lines, { yPercent: 110 });
			return gsap.to(self.lines, {
				yPercent: 0,
				duration: 0.9,
				ease: TEXT_EASE,
				stagger: 0.08,
				scrollTrigger: {
					trigger: el,
					start: 'top 88%',
					once: true,
					onToggle(trigger) {
						if (trigger.isActive) played = true;
					},
				},
			});
		},
	});
}

// Plain `opacity` rather than GSAP's `autoAlpha` throughout this file: a few
// reveal targets (e.g. a card's `data-reveal="image"` block) nest inside
// another reveal target (the card itself, via `data-reveal="stagger"`).
// `autoAlpha` also toggles `visibility`, which is inherited — a still-hidden
// parent would force an already-finished child reveal to stay invisible
// until the parent catches up. Plain opacity has no such cross-talk.
function revealUp(el: HTMLElement): void {
	gsap.from(el, {
		y: 32,
		opacity: 0,
		duration: 0.8,
		ease: EASE,
		scrollTrigger: { trigger: el, start: 'top 88%', once: true },
	});
}

function revealStagger(container: HTMLElement): void {
	const selector = container.dataset.revealTarget;
	const items = selector
		? Array.from(container.querySelectorAll<HTMLElement>(selector))
		: (Array.from(container.children) as HTMLElement[]);
	if (!items.length) return;

	gsap.from(items, {
		y: 32,
		opacity: 0,
		duration: 0.7,
		ease: EASE,
		stagger: 0.09,
		scrollTrigger: { trigger: container, start: 'top 85%', once: true },
	});
}

// Scales down from a slight zoom while fading in. Pairs well with an
// overflow-hidden ancestor (most card/image containers in this codebase
// already clip overflow for hover effects), which turns the scale into a
// classic "image reveal" rather than visibly resizing the element.
function revealImage(el: HTMLElement): void {
	gsap.from(el, {
		scale: 1.1,
		opacity: 0,
		duration: 1.1,
		ease: EASE,
		scrollTrigger: { trigger: el, start: 'top 90%', once: true },
	});
}

export function initScrollReveals(root: ParentNode = document): void {
	if (prefersReducedMotion()) return;

	root.querySelectorAll<HTMLElement>('[data-reveal="text"]').forEach(revealHeading);
	root.querySelectorAll<HTMLElement>('[data-reveal="up"]').forEach(revealUp);
	root.querySelectorAll<HTMLElement>('[data-reveal="stagger"]').forEach(revealStagger);
	root.querySelectorAll<HTMLElement>('[data-reveal="image"]').forEach(revealImage);

	ScrollTrigger.refresh();
	document.fonts?.ready.then(() => ScrollTrigger.refresh());
	window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
}
