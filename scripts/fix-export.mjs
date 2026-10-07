// Next 16 static export writes route segment payloads as `<route>/__next.<seg>/__PAGE__.txt`,
// but the client prefetches `<route>/__next.<seg>.__PAGE__.txt`. Copy each one to the flat
// name the client asks for, so prefetch and offline navigation don't 404.
import { copyFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const out = new URL('../out/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
let copied = 0;

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (!statSync(p).isDirectory()) continue;
    if (name.startsWith('__next.')) {
      for (const f of readdirSync(p)) {
        const src = join(p, f);
        const dest = join(dir, `${name}.${f}`);
        if (statSync(src).isFile() && !existsSync(dest)) {
          copyFileSync(src, dest);
          copied++;
        }
      }
    } else {
      walk(p);
    }
  }
}

walk(decodeURIComponent(out));
console.log(`fix-export: ${copied} segment file(s) flattened`);
