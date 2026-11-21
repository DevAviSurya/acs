import type { AstroComponent } from '@lucide/astro';
import Code from '@lucide/astro/icons/code';
import Headset from '@lucide/astro/icons/headset';
import Gift from '@lucide/astro/icons/gift';
import PenTool from '@lucide/astro/icons/pen-tool';
import Printer from '@lucide/astro/icons/printer';
import Package from '@lucide/astro/icons/package';

export interface Service {
	slug: string;
	title: string;
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

// Grouped per the homepage structure: Technology, Creative & Brand, and
// Print & Packaging solutions. Each category pairs two of the six services.
export const serviceCategories: ServiceCategory[] = [
	{
		id: 'technology',
		label: 'WEB & SOFTWARE',
		title: 'Software and IT built for how you operate',
		description:
			'From custom applications to day-to-day infrastructure support, we build and maintain the technology your business runs on.',
		services: [
			{
				slug: 'software-development',
				title: 'Software Development',
				summary: 'Custom web, mobile, and internal applications engineered for reliability and scale.',
				points: ['Web & mobile applications', 'Internal tools & integrations', 'Ongoing maintenance & support'],
				icon: Code,
			},
			{
				slug: 'it-support',
				title: 'IT Support & Services',
				summary: 'Responsive managed IT support that keeps your teams productive and your systems secure.',
				points: ['Help desk & managed support', 'Network & infrastructure', 'Security & systems monitoring'],
				icon: Headset,
			},
		],
	},
	{
		id: 'creative',
		label: 'BRAND & MERCHANDISE',
		title: 'Branded merchandise and design that represent you well',
		description:
			'We help you look the part everywhere your brand shows up — from promotional merchandise to the visual identity behind it.',
		services: [
			{
				slug: 'corporate-merchandise',
				title: 'Corporate Merchandise',
				summary: 'Branded apparel and promotional products sourced, decorated, and delivered at scale.',
				points: ['Branded apparel & gifts', 'Bulk sourcing & fulfilment', 'Event & onboarding kits'],
				icon: Gift,
			},
			{
				slug: 'graphic-design',
				title: 'Graphic Design',
				summary: 'Brand identity, marketing collateral, and visual design that stays consistent everywhere.',
				points: ['Brand identity & guidelines', 'Marketing collateral', 'Digital & print-ready artwork'],
				icon: PenTool,
			},
		],
	},
	{
		id: 'print-packaging',
		label: 'SOCIAL MEDIA & PRINT',
		title: 'Print and packaging finished to a premium standard',
		description:
			'High-quality production for everything from business collateral to retail-ready packaging — on time and to spec.',
		services: [
			{
				slug: 'printing-services',
				title: 'Printing Services',
				summary: 'Commercial printing for business collateral, signage, and large-format materials.',
				points: ['Business & marketing collateral', 'Large-format & signage', 'Fast, reliable turnaround'],
				icon: Printer,
			},
			{
				slug: 'packaging-solutions',
				title: 'Packaging Solutions',
				summary: 'Custom structural and retail packaging designed to protect and present your product.',
				points: ['Custom structural design', 'Retail-ready packaging', 'Sustainable material options'],
				icon: Package,
			},
		],
	},
];

export const allServices: Service[] = serviceCategories.flatMap((category) => category.services);
