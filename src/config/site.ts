// Shared site-wide configuration consumed by BaseLayout (SEO) and the
// Header/Footer components. Update the placeholder values below with the
// client's real production domain and contact details before launch.

export const siteConfig = {
	name: 'Attribute Corporate Solutions',
	shortName: 'Attribute',
	defaultTitle: 'Attribute Corporate Solutions | Technology, Creative & Print Solutions',
	titleTemplate: '%s | Attribute Corporate Solutions',
	description:
		'Attribute Corporate Solutions delivers software development, IT support, corporate merchandise, graphic design, printing, and packaging solutions for growing businesses.',
	// TODO: replace with the live production domain once confirmed.
	url: 'https://www.attributecorporatesolutions.com',
	// TODO: add a real 1200x630 OG image at public/og-image.jpg.
	ogImage: '/og-image.jpg',
	locale: 'en_US',
	contact: {
		// TODO: replace with the client's real contact details.
		email: 'info@attributecorporatesolutions.com',
		phone: '+1 (000) 000-0000',
	},
} as const;
