const t = await (
  await fetch("https://colorcodedlyrics.com/2023/07/06/newjeans-nyujinseu-new-jeans/")
).text();
const html = t.match(/<div class="card-body[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/article/i)[1];

for (const label of ["Romanization", "Hangul", "Translation", "Credits"]) {
  const i = html.indexOf(label);
  console.log(label, i);
  if (i >= 0) console.log(html.slice(i - 80, i + 400).replace(/\s+/g, " "));
}
