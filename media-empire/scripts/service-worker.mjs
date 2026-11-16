import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
const files = readdirSync('dist', { recursive: true }).filter(file => !file.endsWith('sw.js') && /\.[a-z0-9]+$/.test(file));
const urls = files.map(file => '/' + file.split(path.sep).join('/'));
const hash = createHash('sha256').update(files.map(file => readFileSync(path.join('dist', file))).reduce((sum, bytes) => sum + createHash('sha256').update(bytes).digest('hex'), '')).digest('hex').slice(0, 12);
const source = readFileSync('public/sw.js', 'utf8').replace("const CACHE = 'media-empire-mobile-v1';", "const CACHE = 'media-empire-mobile-" + hash + "';").replace('const PRECACHE = [];', 'const PRECACHE = ' + JSON.stringify(urls) + ';');
writeFileSync('dist/sw.js', source);
console.log('Offline package:', files.length, 'files,', hash);
