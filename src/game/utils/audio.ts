let context: AudioContext | null = null;
let muted = false;
export function muteAudio(value: boolean) {
  muted = value;
  if (value) void context?.suspend();
  else if (context?.state === "suspended") void context.resume();
}
export function sound(kind: "click" | "collect" | "win" | "jump") {
  if (muted) return;
  try {
    context ??= new AudioContext();
    if (context.state === "suspended") void context.resume();
    const notes =
      kind === "win"
        ? [523, 659, 784, 1046]
        : kind === "collect"
          ? [659, 988]
          : kind === "jump"
            ? [330, 440]
            : [520];
    notes.forEach((freq, i) => {
      const osc = context!.createOscillator(),
        gain = context!.createGain(),
        t = context!.currentTime + i * 0.09;
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.075, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(gain);
      gain.connect(context!.destination);
      osc.start(t);
      osc.stop(t + 0.24);
      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    });
  } catch {
    /* Audio is optional on devices that do not support Web Audio. */
  }
}
