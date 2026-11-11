export interface NavItem {
	label: string;
	href: string;
}

// Primary navigation shared by the Header and Footer. Routes correspond to
// the page files already scaffolded under src/pages/.
export const mainNav: NavItem[] = [
	{ label: 'Home', href: '/' },
	{ label: 'Services', href: '/services' },
	{ label: 'Portfolio', href: '/portfolio' },
	{ label: 'About', href: '/about' },
	{ label: 'Contact', href: '/contact' },
];
