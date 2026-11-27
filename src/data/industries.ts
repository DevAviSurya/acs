import type { AstroComponent } from '@lucide/astro';
import Landmark from '@lucide/astro/icons/landmark';
import ShoppingBag from '@lucide/astro/icons/shopping-bag';
import Utensils from '@lucide/astro/icons/utensils';
import HeartPulse from '@lucide/astro/icons/heart-pulse';
import GraduationCap from '@lucide/astro/icons/graduation-cap';
import Rocket from '@lucide/astro/icons/rocket';
import Building from '@lucide/astro/icons/building';
import Store from '@lucide/astro/icons/store';

export interface Industry {
	label: string;
	icon: AstroComponent;
	description: string;
}

export const industries: Industry[] = [
	{
		label: 'Professional Services',
		icon: Landmark,
		description: 'Polished collateral and internal tools firms can put in front of clients.',
	},
	{
		label: 'Retail & E-commerce',
		icon: ShoppingBag,
		description: 'Storefronts, campaign materials, and branded merchandise that move product.',
	},
	{
		label: 'Hospitality & Events',
		icon: Utensils,
		description: 'Signage, merchandise, and booking tools for guest-facing teams.',
	},
	{
		label: 'Healthcare',
		icon: HeartPulse,
		description: 'Patient-facing materials and secure, compliant internal systems.',
	},
	{
		label: 'Education',
		icon: GraduationCap,
		description: 'Campus signage, enrollment tools, and branded materials.',
	},
	{
		label: 'Technology & Startups',
		icon: Rocket,
		description: 'Product builds, brand identity, and launch-ready collateral.',
	},
	{
		label: 'Government & Public Sector',
		icon: Building,
		description: 'Public-facing print, signage, and citizen-facing applications.',
	},
	{
		label: 'Franchise & Multi-location',
		icon: Store,
		description: 'Consistent branding and marketing held to spec across every location.',
	},
];
