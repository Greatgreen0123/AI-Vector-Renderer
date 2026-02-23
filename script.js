// ── ImgGen Renderer v2.0 ──────────────────────────────────────────────────

const canvas  = document.getElementById('output');
const ctx     = canvas.getContext('2d');
const codeEl  = document.getElementById('code');
const statusEl  = document.getElementById('status');
const dimsEl    = document.getElementById('dims');
const lineCountEl = document.getElementById('line-count');

// ── DEFAULT DEMO ─────────────────────────────────────────────────────────

const DEMO = `# ImgGen v2.0 — Logo Demo

C 500 500 0 #000000 #0a0a18

# Background rect
r 0 0 500 500 0 #000000 #0d0d20

# Outer glow ring
e 250 250 200 190 2 #3322aa #111133

# Inner dark ellipse
e 250 250 155 145 0 #000000 #080814

# Decorative arc — top
a 250 250 170 200 340 2 #6655ff none

# Decorative arc — bottom
a 250 250 170 20 160 2 #ff5599 none

# Centre circle
c 250 250 12 0 #000000 #6655ff

# Main title — bold
t "IMGGEN" 250 238 42 #ffffff 1

# Subtitle — italic
t "Visual Language" 250 282 14 #7766cc 2

# Bottom tag — normal
t "v2.0" 250 310 11 #444466 0

# Base line
l 160 335 340 335 1 #3322aa

# Corner dots
c 160 335 4 0 #000000 #6655ff
c 340 335 4 0 #000000 #ff5599`;

codeEl.value = DEMO;
updateLineCount();

// ── HELPERS ──────────────────────────────────────────────────────────────

function updateLineCount() {
  const n = codeEl.value.split('\n').filter(l => l.trim() && !l.trim().startsWith('#')).length;
  lineCountEl.textContent = `${n} lines`;
}

/**
 * Tokenise a line respecting "quoted strings" as single tokens.
 */
function tokenize(line) {
  const tokens = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === ' ') { i++; continue; }
    if (line[i] === '"') {
      let j = i + 1;
      while (j < line.length && line[j] !== '"') j++;
      tokens.push(line.slice(i + 1, j));
      i = j + 1;
    } else {
      let j = i;
      while (j < line.length && line[j] !== ' ') j++;
      tokens.push(line.slice(i, j));
      i = j;
    }
  }
  return tokens;
}

function deg(d) { return (d * Math.PI) / 180; }

function styleString(styleCode, size) {
  switch (String(styleCode)) {
    case '1': return `bold ${size}px Syne, sans-serif`;
    case '2': return `italic ${size}px Syne, sans-serif`;
    case '3': return `bold italic ${size}px Syne, sans-serif`;
    default:  return `${size}px Syne, sans-serif`;
  }
}

// ── RENDER ────────────────────────────────────────────────────────────────

function run() {
  const lines = codeEl.value.split('\n');
  let ok = 0, errors = 0, skipped = 0;

  lines.forEach((raw, lineIdx) => {
    const line = raw.trim();

    // blank lines & comments
    if (!line || line.startsWith('#')) { skipped++; return; }

    const tok = tokenize(line);
    if (!tok.length) return;

    const cmd = tok[0];

    try {
      ctx.save();

      switch (cmd) {

        // ── CANVAS ────────────────────────────────────────────────────
        // C width height border-size border-colour bg-colour
        case 'C': {
          const [, w, h, bs, bc, bg] = tok;
          canvas.width  = +w;
          canvas.height = +h;
          dimsEl.textContent = `${w} × ${h}`;

          if (+bs > 0) {
            ctx.fillStyle = bc;
            ctx.fillRect(0, 0, +w, +h);
          }
          ctx.fillStyle = bg;
          const inset = +bs;
          ctx.fillRect(inset, inset, +w - inset * 2, +h - inset * 2);
          ok++;
          break;
        }

        // ── RECT ──────────────────────────────────────────────────────
        // r x y w h border-thickness border-colour fill
        case 'r': {
          const [, x, y, w, h, bt, bc, fill] = tok;
          if (fill && fill !== 'none') {
            ctx.fillStyle = fill;
            ctx.fillRect(+x, +y, +w, +h);
          }
          if (+bt > 0) {
            ctx.strokeStyle = bc;
            ctx.lineWidth   = +bt;
            ctx.strokeRect(+x + +bt / 2, +y + +bt / 2, +w - +bt, +h - +bt);
          }
          ok++;
          break;
        }

        // ── CIRCLE ────────────────────────────────────────────────────
        // c x y r border-size border-colour fill
        case 'c': {
          const [, x, y, r, bs, bc, fill] = tok;
          ctx.beginPath();
          ctx.arc(+x, +y, +r, 0, Math.PI * 2);
          if (fill && fill !== 'none') { ctx.fillStyle = fill; ctx.fill(); }
          if (+bs > 0) { ctx.strokeStyle = bc; ctx.lineWidth = +bs; ctx.stroke(); }
          ok++;
          break;
        }

        // ── ELLIPSE ───────────────────────────────────────────────────
        // e x y rx ry border-thickness border-colour fill
        case 'e': {
          const [, x, y, rx, ry, bt, bc, fill] = tok;
          ctx.beginPath();
          ctx.ellipse(+x, +y, +rx, +ry, 0, 0, Math.PI * 2);
          if (fill && fill !== 'none') { ctx.fillStyle = fill; ctx.fill(); }
          if (+bt > 0) { ctx.strokeStyle = bc; ctx.lineWidth = +bt; ctx.stroke(); }
          ok++;
          break;
        }

        // ── ARC ───────────────────────────────────────────────────────
        // a x y r startDeg endDeg border-thickness border-colour fill
        case 'a': {
          const [, x, y, r, start, end, bt, bc, fill] = tok;
          ctx.beginPath();
          ctx.arc(+x, +y, +r, deg(+start), deg(+end));
          if (fill && fill !== 'none') {
            ctx.lineTo(+x, +y);
            ctx.closePath();
            ctx.fillStyle = fill;
            ctx.fill();
            ctx.beginPath();
            ctx.arc(+x, +y, +r, deg(+start), deg(+end));
          }
          if (+bt > 0) { ctx.strokeStyle = bc; ctx.lineWidth = +bt; ctx.stroke(); }
          ok++;
          break;
        }

        // ── TEXT ──────────────────────────────────────────────────────
        // t "text" x y size colour style(0=normal 1=bold 2=italic 3=both)
        case 't': {
          const [, text, x, y, size, colour, style = '0'] = tok;
          ctx.font         = styleString(style, +size);
          ctx.fillStyle    = colour;
          ctx.textAlign    = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(text, +x, +y);
          ok++;
          break;
        }

        // ── LINE ──────────────────────────────────────────────────────
        // l x y x2 y2 thickness colour
        case 'l': {
          const [, x, y, x2, y2, thick, colour] = tok;
          ctx.beginPath();
          ctx.moveTo(+x, +y);
          ctx.lineTo(+x2, +y2);
          ctx.strokeStyle = colour;
          ctx.lineWidth   = +thick;
          ctx.lineCap     = 'round';
          ctx.stroke();
          ok++;
          break;
        }

        default:
          console.warn(`Line ${lineIdx + 1}: unknown command "${cmd}"`);
          errors++;
      }

      ctx.restore();
    } catch (err) {
      console.error(`Line ${lineIdx + 1} error:`, err);
      errors++;
      ctx.restore();
    }
  });

  // Status
  if (errors === 0) {
    statusEl.innerHTML = `<span class="ok">✓ Rendered ${ok} elements</span>`;
  } else {
    statusEl.innerHTML =
      `<span class="ok">✓ ${ok} ok</span> &nbsp; <span class="err">✗ ${errors} error${errors > 1 ? 's' : ''}</span>`;
  }
}

// ── CLEAR ─────────────────────────────────────────────────────────────────

function clearCode() {
  codeEl.value = '';
  updateLineCount();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  statusEl.textContent = 'Cleared';
}

// ── SAVE PNG ──────────────────────────────────────────────────────────────

function saveImg() {
  const a = document.createElement('a');
  a.download = 'imggen-output.png';
  a.href = canvas.toDataURL('image/png');
  a.click();
}

// ── EVENT BINDINGS ────────────────────────────────────────────────────────

document.getElementById('btn-run').addEventListener('click', run);
document.getElementById('btn-clear').addEventListener('click', clearCode);
document.getElementById('btn-save').addEventListener('click', saveImg);

codeEl.addEventListener('input', updateLineCount);

// Ctrl+Enter / Cmd+Enter to render
codeEl.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    run();
  }
});

// ── INIT ──────────────────────────────────────────────────────────────────

document.fonts.ready.then(() => run());