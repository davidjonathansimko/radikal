// Extract text from a PDF by inflating FlateDecode streams.
// Recovery helper - reads the PDF and dumps any readable text to a .txt file.
const fs = require('fs');
const zlib = require('zlib');

const file = process.argv[2] || 'RADIKAL. - Radikale Bibellehre Blog.pdf';
const out = process.argv[3] || '_local/pdf-extract.txt';

const buf = fs.readFileSync(file);
let chunks = [];
let pos = 0;

while (true) {
  const s = buf.indexOf('stream', pos);
  if (s === -1) break;
  let start = s + 6;
  if (buf[start] === 0x0d) start++;
  if (buf[start] === 0x0a) start++;
  const e = buf.indexOf('endstream', start);
  if (e === -1) break;

  const raw = buf.slice(start, e);
  try {
    const inflated = zlib.inflateSync(raw);
    const txt = inflated.toString('latin1');
    // Keep only streams that look like page content (text drawing operators)
    if (/\bTJ\b|\bTj\b/.test(txt)) chunks.push(txt);
  } catch (_) {
    // not a deflate stream (images, fonts) - ignore
  }
  pos = e + 9;
}

// Pull the literal strings out of the PDF text operators
let text = '';
for (const c of chunks) {
  const parts = c.match(/\((?:\\.|[^\\()])*\)/g) || [];
  for (const p of parts) {
    text += p
      .slice(1, -1)
      .replace(/\\([()\\])/g, '$1')
      .replace(/\\n/g, '\n');
  }
  text += '\n\n';
}

fs.mkdirSync('_local', { recursive: true });
fs.writeFileSync(out, text, 'utf8');
console.log('Streams cu text gasite:', chunks.length);
console.log('Caractere extrase:', text.length);
console.log('Salvat in:', out);
console.log('\n--- PRIMELE 1500 CARACTERE ---\n');
console.log(text.slice(0, 1500));
