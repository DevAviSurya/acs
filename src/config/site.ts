// Shared site-wide configuration consumed by BaseLayout (SEO) and the
// Header/Footer components. Update the placeholder values below with the
// client's real production domain and contact details before launch.

export const siteConfig = {
	name: 'Attribute Corporate Solutions',
	shortName: 'Attribute',
	defaultTitle: 'Attribute Corporate Solutions | Website, AI, Marketing & Brand Solutions',
	titleTemplate: '%s | Attribute Corporate Solutions',
	description:
		'Attribute Corporate Solutions delivers websites, AI integration, SEO & AEO, digital marketing, graphic design & printing, and corporate merchandising for growing businesses.',
	url: 'https://attribute.solutions',
	// TODO: add a real 1200x630 OG image at public/og-image.jpg.
	ogImage: '/og-image.jpg',
	locale: 'en_US',
	contact: {
		// TODO: replace with the client's real contact details.
		email: 'contact@attribute.solutions',
		phone: '+1 (778) 628-6251',
	},
} as const;
