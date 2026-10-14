/* 截图压缩：按图片长宽比自适应限宽 + WebP 编码，供 HTML 内联使用 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const SRC = 'd:\\VibeCodingDemo\\需求单\\assets';
const DST = 'd:\\VibeCodingDemo\\需求单\\assets-opt';
const QUALITY = 0.82;

function walk(d, out = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.png$/i.test(e.name)) out.push(p);
  }
  return out;
}

const SEG = 8000; // 单段最大高度（超过则切段，规避 canvas 16384 上限并提升可读性）

(async () => {
  const files = walk(SRC).sort();
  const browser = await chromium.launch({ channel: 'msedge' });
  const page = await browser.newPage();
  await page.goto('about:blank');

  let before = 0, after = 0;
  const rows = [];
  const manifest = {};
  for (const f of files) {
    const rel = path.relative(SRC, f).replace(/\\/g, '/');
    const key = rel.replace(/\.png$/i, '');
    const b64 = fs.readFileSync(f).toString('base64');
    const r = await page.evaluate(async ({ b64, quality, seg }) => {
      const img = new Image();
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = 'data:image/png;base64,' + b64; });
      const nw = img.naturalWidth, nh = img.naturalHeight;
      const w = Math.min(nw, 1000);                 // 保持原生宽度，避免文内被放大后发虚
      const h = Math.round((nh * w) / nw);
      const parts = [];
      for (let y = 0; y < h; y += seg) {
        const sh = Math.min(seg, h - y);
        const c = document.createElement('canvas');
        c.width = w; c.height = sh;
        const g = c.getContext('2d');
        g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
        g.fillStyle = '#fff'; g.fillRect(0, 0, w, sh);
        g.drawImage(img, 0, y, w, sh, 0, 0, w, sh);
        parts.push(c.toDataURL('image/webp', quality));
      }
      // 索引页封面缩略图（宽 420，压低体积）
      const cw = Math.min(nw, 420);
      const ch = Math.min(Math.round((nh * cw) / nw), 560);
      const cc = document.createElement('canvas');
      cc.width = cw; cc.height = ch;
      const cg = cc.getContext('2d');
      cg.fillStyle = '#fff'; cg.fillRect(0, 0, cw, ch);
      cg.drawImage(img, 0, 0, cw, ch);
      return { parts, cover: cc.toDataURL('image/webp', 0.72), nw, nh, w, h };
    }, { b64, quality: QUALITY, seg: SEG });

    const outDir = path.join(DST, path.dirname(rel));
    fs.mkdirSync(outDir, { recursive: true });
    const base = path.basename(key);
    const written = [];
    r.parts.forEach((url, i) => {
      const name = r.parts.length === 1 ? base + '.webp' : `${base}.p${i + 1}.webp`;
      const buf = Buffer.from(url.split(',')[1], 'base64');
      fs.writeFileSync(path.join(outDir, name), buf);
      written.push(path.dirname(rel) === '.' ? name : path.dirname(rel).replace(/\\/g, '/') + '/' + name);
      after += buf.length;
    });
    // 封面缩略图
    const coverDir = path.join(DST, 'covers', path.dirname(rel));
    fs.mkdirSync(coverDir, { recursive: true });
    const coverRel = path.dirname(rel) === '.' ? base + '.webp' : path.dirname(rel).replace(/\\/g, '/') + '/' + base + '.webp';
    const coverBuf = Buffer.from(r.cover.split(',')[1], 'base64');
    fs.writeFileSync(path.join(DST, 'covers', coverRel), coverBuf);
    after += coverBuf.length;

    before += fs.statSync(f).size;
    manifest[key] = { parts: written, cover: 'covers/' + coverRel, w: r.w, h: r.h, seg: r.parts.length, ow: r.nw, oh: r.nh };
    rows.push(`${rel}  ${r.nw}x${r.nh} -> ${r.w}x${r.h}（${r.parts.length} 段）`);
  }
  await browser.close();
  fs.writeFileSync(path.join(DST, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  console.log(rows.join('\n'));
  console.log(`\n共 ${files.length} 张：${(before / 1048576).toFixed(1)}MB -> ${(after / 1048576).toFixed(1)}MB`);
})().catch((e) => { console.error(e); process.exit(1); });
