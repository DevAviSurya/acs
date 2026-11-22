import type { AstroComponent } from '@lucide/astro';
import Globe from '@lucide/astro/icons/globe';
import Bot from '@lucide/astro/icons/bot';
import Search from '@lucide/astro/icons/search';
import Megaphone from '@lucide/astro/icons/megaphone';
import PenTool from '@lucide/astro/icons/pen-tool';
import Gift from '@lucide/astro/icons/gift';

export interface Service {
	slug: string;
	tag: string;
	title: string;
	blurb: string;
	summary: string;
	points: string[];
	icon: AstroComponent;
}

export interface ServiceCategory {
	id: string;
	label: string;
	title: string;
	description: string;
	services: Service[];
}

// Grouped per the homepage structure: Technology, Visibility & Marketing, and
// Design & Merchandise. Each category pairs two of the six services.
export const serviceCategories: ServiceCategory[] = [
	{
		id: 'technology',
		label: 'WEBSITE & AI',
		title: 'Websites and AI built for how you operate',
		description:
			'From the site your customers see to the AI tools running behind the scenes, we build the technology your business runs on.',
		services: [
			{
				slug: 'website',
				tag: 'Website',
				title: 'Website',
				blurb: 'Fast, modern sites built to convert visitors',
				summary: 'Custom-designed websites built for performance, credibility, and converting visitors into leads.',
				points: ['Custom design & development', 'Mobile-first & fast-loading', 'Ongoing maintenance & support'],
				icon: Globe,
			},
			{
				slug: 'ai-integration',
				tag: 'AI',
				title: 'AI Integration',
				blurb: 'Practical AI built into how you already work',
				summary: 'AI-powered chatbots, automation, and workflow tools built around your existing processes.',
				points: ['Chatbots & virtual assistants', 'Workflow automation', 'Custom AI integrations'],
				icon: Bot,
			},
		],
	},
	{
		id: 'marketing',
		label: 'SEO & MARKETING',
		title: 'Visibility and marketing that drive real growth',
		description:
			'We help you get found and stay top of mind — from search rankings to the campaigns that turn attention into customers.',
		services: [
			{
				slug: 'seo-aeo',
				tag: 'SEO & AEO',
				title: 'SEO & AEO',
				blurb: 'Get found in search results and AI answers',
				summary:
					'Search engine optimization paired with AEO — Answer & Generative Engine Optimization — so you show up in both search results and AI answers like ChatGPT and Google AI Overviews.',
				points: ['Technical & on-page SEO', 'AI/answer engine optimization (AEO/GEO)', 'Ongoing rank & visibility tracking'],
				icon: Search,
			},
			{
				slug: 'digital-marketing',
				tag: 'Marketing',
				title: 'Digital Marketing',
				blurb: 'Campaigns that turn attention into customers',
				summary: 'Paid and organic marketing campaigns designed to build awareness and drive measurable growth.',
				points: ['Paid social & search campaigns', 'Content & email marketing', 'Performance tracking & reporting'],
				icon: Megaphone,
			},
		],
	},
	{
		id: 'creative',
		label: 'DESIGN & MERCHANDISE',
		title: 'Branded design and merchandise that represent you well',
		description:
			'We help you look the part everywhere your brand shows up — from printed collateral to promotional merchandise.',
		services: [
			{
				slug: 'graphic-design-printing',
				tag: 'Design',
				title: 'Graphic Design & Printing',
				blurb: 'Brand identity, produced to a premium standard',
				summary: 'Brand identity, marketing collateral, and commercial printing finished to a premium standard.',
				points: ['Brand identity & guidelines', 'Marketing collateral & signage', 'Commercial & large-format printing'],
				icon: PenTool,
			},
			{
				slug: 'corporate-merchandising',
				tag: 'Merchandise',
				title: 'Corporate Merchandising',
				blurb: 'Branded gear, sourced and delivered at scale',
				summary: 'Branded apparel and promotional products sourced, decorated, and delivered at scale.',
				points: ['Branded apparel & gifts', 'Bulk sourcing & fulfilment', 'Event & onboarding kits'],
				icon: Gift,
			},
		],
	},
];

export const allServices: Service[] = serviceCategories.flatMap((category) => category.services);
