// Soft, realistic MacBook-style keyboard click for the hero typewriter
// effect — synthesized entirely with the Web Audio API (no audio assets,
// no libraries). Each keystroke renders a short noise burst shaped by a
// resonant bandpass filter (the sharp "clack") plus a faint low-frequency
// body tone (the housing "thock" underneath it), with randomized pitch and
// envelope timing per call so repeated keystrokes don't sound identical.

const MASTER_VOLUME = 0.1; // ~10%, kept intentionally subtle

let audioCtx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;
let enabled = false;

function getContext(): AudioContext {
	if (!audioCtx) {
		audioCtx = new AudioContext();
	}
	if (audioCtx.state === 'suspended') {
		void audioCtx.resume();
	}
	return audioCtx;
}

// One shared noise buffer, reused for every keystroke — only the filter/
// envelope parameters are randomized per call, which is enough to avoid
// audibly identical repeats without re-generating noise each time.
function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
	if (!noiseBuffer) {
		const length = Math.ceil(ctx.sampleRate * 0.08);
		noiseBuffer = ctx.createBuffer(1, length, ctx.sampleRate);
		const data = noiseBuffer.getChannelData(0);
		for (let i = 0; i < length; i++) {
			data[i] = Math.random() * 2 - 1;
		}
	}
	return noiseBuffer;
}

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T,>(options: readonly T[]): T => options[Math.floor(Math.random() * options.length)];

type KeystrokeKind = 'type' | 'delete';

// A handful of loose "key" profiles (corner keys, home-row keys, the
// spacebar's duller thud, ...) picked at random per stroke, instead of one
// continuous range — a single range centered on one value plus a high-Q
// filter rings at essentially the same pitch every time, which is what
// reads as "the same key" rather than a hand moving across a keyboard. Low
// Q here keeps each hit a broadband transient click rather than a tonal
// ring.
interface KeyProfile {
	freq: readonly [number, number];
	q: readonly [number, number];
}

const TYPE_PROFILES: readonly KeyProfile[] = [
	{ freq: [2600, 3600], q: [0.4, 0.8] },
	{ freq: [1900, 2600], q: [0.5, 0.9] },
	{ freq: [3400, 4600], q: [0.35, 0.7] },
	{ freq: [1500, 2100], q: [0.6, 1.0] },
];

const DELETE_PROFILES: readonly KeyProfile[] = [
	{ freq: [1100, 1600], q: [0.5, 0.9] },
	{ freq: [1600, 2100], q: [0.4, 0.8] },
];

function playClick(kind: KeystrokeKind): void {
	if (!enabled) return;

	const ctx = getContext();
	const now = ctx.currentTime;
	const profile = pick(kind === 'delete' ? DELETE_PROFILES : TYPE_PROFILES);

	const noise = ctx.createBufferSource();
	noise.buffer = getNoiseBuffer(ctx);
	// Resampling the shared noise buffer at a random rate shifts its
	// perceived brightness per hit, on top of the filter sweep below.
	noise.playbackRate.value = randomBetween(0.85, 1.3);

	const bandpass = ctx.createBiquadFilter();
	bandpass.type = 'bandpass';
	bandpass.frequency.value = randomBetween(...profile.freq);
	bandpass.Q.value = randomBetween(...profile.q);

	const noiseGain = ctx.createGain();
	const peak = MASTER_VOLUME * randomBetween(0.7, 1);
	noiseGain.gain.setValueAtTime(0, now);
	noiseGain.gain.linearRampToValueAtTime(peak, now + randomBetween(0.001, 0.003));
	noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + randomBetween(0.012, 0.022));

	// A faint, inconsistent low-end thump underneath the click — real
	// keyboard switches don't all bottom out with the same body resonance,
	// so this is sometimes barely present rather than a fixed drone. Kept
	// short and quiet enough to fuse into the click transient above instead
	// of ringing on its own, which otherwise reads as a separate "tock"
	// (i.e. a ticking clock) rather than one keyboard clack.
	const body = ctx.createOscillator();
	body.type = pick(['triangle', 'sine'] as const);
	body.frequency.value = randomBetween(140, 320);

	const bodyGain = ctx.createGain();
	bodyGain.gain.setValueAtTime(MASTER_VOLUME * randomBetween(0.04, 0.14), now);
	bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + randomBetween(0.008, 0.015));

	// A different stereo position per stroke, like different physical keys
	// rather than one point repeating in place.
	const panner = ctx.createStereoPanner();
	panner.pan.value = randomBetween(-0.5, 0.5);

	noise.connect(bandpass).connect(noiseGain).connect(panner);
	body.connect(bodyGain).connect(panner);
	panner.connect(ctx.destination);

	noise.start(now);
	noise.stop(now + 0.03);
	body.start(now);
	body.stop(now + 0.02);
}

export function setKeyboardSoundEnabled(value: boolean): void {
	enabled = value;
	// Creating/resuming here happens on the click that enabled sound, which
	// is a user gesture — satisfies autoplay policies without a separate
	// "unlock audio" step.
	if (value) getContext();
}

export function isKeyboardSoundEnabled(): boolean {
	return enabled;
}

export function playTypeSound(): void {
	playClick('type');
}

export function playDeleteSound(): void {
	playClick('delete');
}
