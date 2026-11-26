# Attribute Corporate Solutions (ACS)

## Project Overview
Build a premium, modern corporate website for
Attribute Corporate Solutions.

The website showcases six services:
1. Website
2. AI Integration
3. SEO & AEO
4. Digital Marketing
5. Graphic Design & Printing
6. Corporate Merchandising

Primary goal:
Establish corporate credibility, showcase capabilities,
and generate qualified business inquiries.

## Technology Stack
- Astro with TypeScript
- Tailwind CSS v4
- GSAP for advanced animations
- HTML5 video backgrounds
- Lucide icons
- Static site generation
- GoDaddy cPanel hosting

Do not introduce React, Angular, Next.js, databases,
or backend frameworks without approval.

## Architecture
Use a component-based architecture.

src/
- pages/ Routes and page composition
- layouts/ Shared layouts
- components/ Reusable UI and feature components
- data/ Structured service and navigation data
- assets/ Optimized images
- styles/ Global styles and design tokens
- scripts/ Client-side animation utilities
- config/ Site configuration

public/
- videos/ Optimized background videos
- fonts/ Locally hosted fonts when appropriate

## Design Direction
Use a premium corporate visual identity inspired by:
- Monks https://www.monks.com/
- BASIC/DEPT https://www.basicagency.com/
- https://www.wix.com/symphony

Do not copy their layouts, branding, artwork, or code.

Design principles:
- Premium, minimal, modern
- Strong typography
- Generous whitespace
- Cinematic hero video
- Smooth, restrained animations
- Consistent visual hierarchy
- Responsive, mobile-first layouts

Brand colours (provisional):
- use color theme used by  websites manus.im and https://claude.com/product/claude-code

## Homepage Sections
1. Header and navigation
2. Cinematic video hero
3. Company introduction
4. Industries served
5. Services
6. Featured projects
7. Why Choose Attribute
8. Contact / Request a Quote
9. Footer

## Coding Standards
- Use TypeScript where applicable.
- Prefer Astro components.
- Use reusable, typed component props.
- Separate content from presentation.
- Use semantic HTML.
- Use Tailwind for styling.
- Avoid unnecessary dependencies.
- Keep components focused and maintainable.
- Avoid duplicating code.
- Use accessible navigation and controls.

## Animation Standards
- Use GSAP for complex animations.
- Use CSS for simple hover effects.
- Respect prefers-reduced-motion.
- Avoid unnecessary animation on mobile.
- Do not compromise usability for visual effects.

## Video Standards
- Use muted, looping, inline background videos.
- Provide a poster image.
- Optimize video files for performance.
- Provide a pause control.
- Use a static fallback when appropriate.

## SEO and Performance
- Generate static HTML pages.
- Use unique page titles and descriptions.
- Include canonical URLs.
- Generate a sitemap.
- Optimize images using Astro.
- Lazy-load below-the-fold images.
- Minimize client-side JavaScript.
- Target strong Core Web Vitals.
- Use descriptive alt text.

## Deployment
Hosting: GoDaddy cPanel

- Use Astro static output.
- Production build command: npm run build
- Build output directory: dist/
- Upload build contents to the correct domain root.
- Do not require a persistent Node.js server.
- Do not introduce SSR without approval.
- Contact form processing must use a compatible
 server-side solution or hosted form service.

## Claude Code Working Rules
1. Inspect existing code before modifying files.
2. Follow the established project architecture.
3. Explain significant architectural changes.
4. Do not add dependencies without justification.
5. Do not overwrite existing work unnecessarily.
6. Prefer small, maintainable components.
7. Keep accessibility and SEO in mind.
8. Run available validation and build commands.
9. Report errors instead of hiding them.
10. Do not deploy or modify production without approval.


## 3D Rendering and Animation Standards

- Use Three.js for 3D rendering, realistic materials, lighting and camera management.
- Use GSAP for animation sequencing and transformations.
- Use GSAP ScrollTrigger for scroll-driven animations, viewport pinning and release.
- Use Lenis for smooth scrolling.
- Refer to installed GSAP and Lenis skills when implementing animations.
- Maintain a single global Lenis instance.
- Use one coordinated animation rendering loop.
- Separate 3D rendering, animation logic and UI components.
- Prefer reusable, modular TypeScript implementations.
- Ensure animations are reversible and synchronized with scroll progress.
- Never manually intercept scrolling to pin a section.
- Maintain premium, minimalist, Apple-inspired design quality.
- Optimize GPU usage, asset sizes and rendering performance.
- Support responsive layouts and reduced-motion preferences.
- Provide fallbacks for devices without WebGL support.
- Do not introduce React or additional animation libraries without approval.
- Preserve existing components and functionality unless explicitly requested to change them.