// ── ImgGen Renderer v2.1 ──────────────────────────────────────────────────

const canvas      = document.getElementById('output');
const ctx         = canvas.getContext('2d');
const codeEl      = document.getElementById('code');
const statusEl    = document.getElementById('status');
const dimsEl      = document.getElementById('dims');
const lineCountEl = document.getElementById('line-count');

// ── CHEATSHEET — auto-generated ──────────────────────────────────────────

const COMMANDS = [
  ['C', 'w h border bCol bgCol',                    null],
  ['r', 'x y w h thick bCol fill [opacity]',        null],
  ['c', 'x y r thick bCol fill [opacity]',          null],
  ['e', 'x y rx ry thick bCol fill [opacity]',      null],
  ['a', 'x y r start end thick bCol fill [opacity]',null],
  ['t', '"text" x y size col style(0-3) [opacity]', null],
  ['l', 'x y x2 y2 thick col [opacity]',            null],
  ['#', 'comment — ignored',                        'doc-comment'],
];

function buildCheatsheet() {
  document.getElementById('docs-grid').innerHTML = COMMANDS
    .map(([cmd, args, cls]) =>
      `<div class="doc-row">
        <span class="${cls || 'doc-cmd'}">${cmd}</span>
        <span class="doc-args">${args}</span>
      </div>`
    ).join('');
}

// ── DEFAULT DEMO ─────────────────────────────────────────────────────────

const DEMO = `# ImgGen v2.1 — opacity demo

C 500 500 0 #000000 #0a0a18

# Background
r 0 0 500 500 0 #000000 #0d0d20

# Outer ring
e 250 250 200 190 2 #3322aa #111133

# Inner dark ellipse
e 250 250 155 145 0 #000000 #080814

# Arcs
a 250 250 170 200 340 2 #6655ff none
a 250 250 170 20 160 2 #ff5599 none

# Soft overlay circle — semi-transparent
c 250 250 130 0 #000000 #6655ff 0.07

# Centre dot
c 250 250 12 0 #000000 #6655ff

# Title — bold
t "IMGGEN" 250 238 42 #ffffff 1

# Subtitle — italic, faded
t "Visual Language" 250 282 14 #7766cc 2 0.8

# Version — very faded
t "v2.1" 250 310 11 #444466 0 0.6

# Base line
l 160 335 340 335 1 #3322aa

# Corner dots
c 160 335 4 0 #000000 #6655ff
c 340 335 4 0 #000000 #ff5599`;

codeEl.value = DEMO;
updateLineCount();

// ── HELPERS ──────────────────────────────────────────────────────────────

function updateLineCount() {
  const n = codeEl.value
    .split('\n')
    .filter(l => l.trim() && !l.trim().startsWith('#'))
    .length;
  lineCountEl.textContent = `${n} lines`;
}

/** Tokenise a line — respects "quoted strings" as single tokens. */
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

/**
 * Parse opacity — optional last token, defaults to 1.
 * Clamps to 0–1 range.
 */
function parseOpacity(tok) {
  if (tok === undefined || tok === null) return 1;
  const n = parseFloat(tok);
  if (isNaN(n)) return 1;
  return Math.min(1, Math.max(0, n));
}

// ── RENDER ────────────────────────────────────────────────────────────────

function run() {
  const lines = codeEl.value.split('\n');
  let ok = 0, errors = 0;

  lines.forEach((raw, lineIdx) => {
    const line = raw.trim();
    if (!line || line.startsWith('#')) return;

    const tok = tokenize(line);
    if (!tok.length) return;

    const cmd = tok[0];

    try {
      ctx.save();

      switch (cmd) {

        // C w h border-size border-colour bg-colour
        // No opacity — canvas is the root
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

        // r x y w h border-thickness border-colour fill [opacity]
        case 'r': {
          const [, x, y, w, h, bt, bc, fill, op] = tok;
          ctx.globalAlpha = parseOpacity(op);
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

        // c x y r border-size border-colour fill [opacity]
        case 'c': {
          const [, x, y, r, bs, bc, fill, op] = tok;
          ctx.globalAlpha = parseOpacity(op);
          ctx.beginPath();
          ctx.arc(+x, +y, +r, 0, Math.PI * 2);
          if (fill && fill !== 'none') { ctx.fillStyle = fill; ctx.fill(); }
          if (+bs > 0) { ctx.strokeStyle = bc; ctx.lineWidth = +bs; ctx.stroke(); }
          ok++;
          break;
        }

        // e x y rx ry border-thickness border-colour fill [opacity]
        case 'e': {
          const [, x, y, rx, ry, bt, bc, fill, op] = tok;
          ctx.globalAlpha = parseOpacity(op);
          ctx.beginPath();
          ctx.ellipse(+x, +y, +rx, +ry, 0, 0, Math.PI * 2);
          if (fill && fill !== 'none') { ctx.fillStyle = fill; ctx.fill(); }
          if (+bt > 0) { ctx.strokeStyle = bc; ctx.lineWidth = +bt; ctx.stroke(); }
          ok++;
          break;
        }

        // a x y r startDeg endDeg border-thickness border-colour fill [opacity]
        case 'a': {
          const [, x, y, r, start, end, bt, bc, fill, op] = tok;
          ctx.globalAlpha = parseOpacity(op);
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

        // t "text" x y size colour style(0-3) [opacity]
        case 't': {
          const [, text, x, y, size, colour, style = '0', op] = tok;
          ctx.globalAlpha  = parseOpacity(op);
          ctx.font         = styleString(style, +size);
          ctx.fillStyle    = colour;
          ctx.textAlign    = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(text, +x, +y);
          ok++;
          break;
        }

        // l x y x2 y2 thickness colour [opacity]
        case 'l': {
          const [, x, y, x2, y2, thick, colour, op] = tok;
          ctx.globalAlpha = parseOpacity(op);
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

      ctx.restore(); // resets globalAlpha back to 1 each element
    } catch (err) {
      console.error(`Line ${lineIdx + 1} error:`, err);
      errors++;
      ctx.restore();
    }
  });

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

codeEl.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    run();
  }
});


// ── INIT ──────────────────────────────────────────────────────────────────

buildCheatsheet();
document.fonts.ready.then(run).catch(run);
