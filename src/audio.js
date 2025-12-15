let audioCtx = null;
function getAudioCtx(){
  if (audioCtx) return audioCtx;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  audioCtx = new AudioCtx();
  return audioCtx;
}

export function playClickSound(){
  const ctx = getAudioCtx();
  if (!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  o.frequency.value = 880;
  g.gain.value = 0.0001;
  o.connect(g); g.connect(ctx.destination);
  const now = ctx.currentTime;
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.18, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
  o.start(now);
  o.stop(now + 0.18);
}

export function playWinSound(){
  const ctx = getAudioCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const freqs = [660, 880, 1100];
  freqs.forEach((f, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.value = f;
    o.connect(g); g.connect(ctx.destination);
    const t = now + i * 0.12;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    o.start(t);
    o.stop(t + 0.3);
  });
}

export function playDrawSound(){
  const ctx = getAudioCtx();
  if (!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'triangle';
  o.frequency.value = 320;
  o.connect(g); g.connect(ctx.destination);
  const now = ctx.currentTime;
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
  o.start(now);
  o.stop(now + 0.24);
}
