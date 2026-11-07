#!/usr/bin/env node
// Turn a spring into a CSS `linear()` easing + duration.
// Usage: node spring.mjs <stiffness> <damping> [mass=1] [points=40]
// Example: node spring.mjs 400 22   -> prints duration (ms) and linear(...) string
// Paste the result into a CSS custom property, e.g.
//   --spring-pop: linear(0, 0.21, ...);  --dur-pop: 460ms;

const [k = 400, c = 22, m = 1, n = 40] = process.argv.slice(2).map(Number);

function simulate(k, c, m) {
  const dt = 1 / 1000; // 1ms steps
  let x = 0, v = 0, t = 0;
  const samples = [];
  let restFor = 0;
  while (t < 4) {
    const a = (-k * (x - 1) - c * v) / m;
    v += a * dt;
    x += v * dt;
    t += dt;
    samples.push(x);
    if (Math.abs(x - 1) < 0.001 && Math.abs(v) < 0.01) {
      if ((restFor += dt) > 0.03) break;
    } else restFor = 0;
  }
  return samples;
}

const s = simulate(k, c, m);
const dur = s.length; // ms
const pts = [];
for (let i = 0; i <= n; i++) {
  const idx = Math.min(s.length - 1, Math.round((i / n) * (s.length - 1)));
  pts.push(i === 0 ? 0 : i === n ? 1 : +s[idx].toFixed(4));
}
const overshoot = Math.max(...s) - 1;
console.log(`duration: ${dur}ms  overshoot: ${(overshoot * 100).toFixed(1)}%`);
console.log(`linear(${pts.join(', ')})`);
