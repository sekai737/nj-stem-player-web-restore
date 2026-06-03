const r = await fetch("https://www.lyricsify.com/lrc/newjeans-super-shy/11429363");
const t = await r.text();
console.log("len", t.length);
for (const s of ["textarea", "lrc", "00:12", "Danielle", "download"]) {
  console.log(s, t.includes(s));
}
const idx = t.indexOf("00:12");
console.log("slice", t.slice(Math.max(0, idx - 100), idx + 400));
