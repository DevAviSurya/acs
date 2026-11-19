// Lightweight scroll-reveal for elements marked with [data-animate].
// Progressive enhancement only: without JS, or with reduced motion / small
// viewports, content stays fully visible — nothing here is required to read
// the page.
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isSmallViewport = window.innerWidth < 640;

if (!prefersReducedMotion && !isSmallViewport && 'IntersectionObserver' in window) {
	const targets = document.querySelectorAll<HTMLElement>('[data-animate]');

	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					entry.target.classList.add('is-visible');
					observer.unobserve(entry.target);
				}
			}
		},
		{ threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
	);

	for (const target of targets) {
		target.classList.add('reveal-on-scroll');
		observer.observe(target);
	}
}
