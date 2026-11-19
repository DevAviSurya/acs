# Attribute Connected Hero — Premium Motion V2

A focused upgrade to the original ConnectedHero. Keeps the existing page heading and CTA above the animation.

## What's new

- Miniature realistic Astro code editor (syntax highlighting, line numbers, file tab, Mac traffic lights, live connection status, blinking caret).
- Four curved SVG connections measured directly from the core and each card at runtime.
- Eight continuously travelling signal dots (two per connection), independent of the 15-second GSAP module animation.
- Gentle pointer-responsive motion on the core and inner card surfaces, without stopping autoplay.
- Refined card interactions and mobile card sizing.
- Maintains Three.js central rings, CSS fallback, motion reduction, and offscreen animation pause.

## Install

1. From your existing ACS Astro project, run:

   npm install three gsap
   npm install -D @types/three

2. Copy these files **retaining paths**:

   src/components/ConnectedHero.astro
   src/lib/connected-hero/mount.ts
   src/lib/connected-hero/createScene.ts

3. Keep your existing homepage heading and CTA; place `<ConnectedHero />` immediately below them. There is no need to change those elements.

4. Run `npm run dev` and `npm run build` in your Astro project.

## Previews

`preview/preview-v2.html` works on its own without npm. It showcases the layout, responsive placement, pointer interaction, and animated dots, using CSS fallback rings. The production component uses Three.js for the real rotating orbital core.

`preview/v2-1440.png` / `preview/v2-390.png` are screenshot previews.

## Notes

- This is an original design inspired by premium interactive studio sites, not a copy of nk.studio's proprietary effects.
- The growth card's +24.8% is an illustrative placeholder, not an actual performance claim. Replace with a verified result before publishing or change it to a non-numeric descriptor.
- Please test the production Astro build locally; the available environment validated TypeScript syntax and static-browser layout, but not the full Astro bundler with installed dependencies.
