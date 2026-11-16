let context: AudioContext | null = null;
export function cue(
  kind: "paper" | "press" | "report" | "coin",
  enabled: boolean,
) {
  if (!enabled) return;
  try {
    context ??= new AudioContext();
    if (context.state === "suspended") void context.resume();
    const now = context.currentTime;
    if (kind === "paper" || kind === "press") {
      const length = context.sampleRate * (kind === "paper" ? 0.12 : 0.5),
        buffer = context.createBuffer(1, length, context.sampleRate),
        data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++)
        data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      const source = context.createBufferSource();
      source.buffer = buffer;
      const filter = context.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = kind === "press" ? 220 : 1800;
      const gain = context.createGain();
      gain.gain.value = kind === "press" ? 0.1 : 0.035;
      source.connect(filter).connect(gain).connect(context.destination);
      source.start();
    } else
      for (let i = 0; i < 2; i++) {
        const o = context.createOscillator(),
          g = context.createGain();
        o.type = "sine";
        o.frequency.value = (kind === "coin" ? 660 : 390) * (i ? 1.5 : 1);
        g.gain.setValueAtTime(0, now + i * 0.075);
        g.gain.linearRampToValueAtTime(0.035, now + i * 0.075 + 0.008);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.075 + 0.17);
        o.connect(g).connect(context.destination);
        o.start(now + i * 0.075);
        o.stop(now + i * 0.075 + 0.18);
      }
  } catch {}
}
