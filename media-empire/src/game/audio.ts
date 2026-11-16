type Cue = 'tap' | 'paper' | 'coin' | 'bell' | 'press' | 'build';
let context: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = false;

function audio(): AudioContext | null {
  try {
    if (!context) {
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = .16;
      master.connect(context.destination);
    }
    if (context.state === 'suspended') void context.resume();
    return context;
  } catch { return null; }
}
function tone(ctx: AudioContext, at: number, hz: number, duration: number, volume: number, shape: OscillatorType = 'sine') {
  if (!master) return;
  const oscillator = ctx.createOscillator(), gain = ctx.createGain();
  oscillator.type = shape;
  oscillator.frequency.setValueAtTime(hz, at);
  gain.gain.setValueAtTime(0, at);
  gain.gain.linearRampToValueAtTime(volume, at + .008);
  gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
  oscillator.connect(gain); gain.connect(master);
  oscillator.start(at); oscillator.stop(at + duration + .02);
}
function rustle(ctx: AudioContext, duration: number, frequency: number, volume: number) {
  if (!master) return;
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / data.length);
  const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
  filter.type = 'bandpass'; filter.frequency.value = frequency; filter.Q.value = .5;
  gain.gain.value = volume;
  source.buffer = buffer; source.connect(filter); filter.connect(gain); gain.connect(master);
  source.start();
}
export function setSound(value: boolean) {
  enabled = value;
  if (value) audio();
  else if (context) void context.suspend();
}
export function sound(cue: Cue) {
  if (!enabled) return;
  const ctx = audio();
  if (!ctx) return;
  const now = ctx.currentTime;
  if (cue === 'tap') tone(ctx, now, 420, .07, .14);
  if (cue === 'paper') rustle(ctx, .32, 1800, .35);
  if (cue === 'coin') { tone(ctx, now, 1175, .2, .17); tone(ctx, now + .06, 1568, .3, .10); }
  if (cue === 'bell') { tone(ctx, now, 880, .6, .18); tone(ctx, now + .015, 1320, .45, .08); }
  if (cue === 'build') { rustle(ctx, .24, 500, .28); tone(ctx, now + .1, 220, .3, .14, 'triangle'); }
  if (cue === 'press') {
    rustle(ctx, .8, 900, .38);
    for (let i = 0; i < 4; i++) tone(ctx, now + i * .14, 84 + i * 12, .14, .25, 'triangle');
    tone(ctx, now + .65, 660, .4, .12);
  }
}
