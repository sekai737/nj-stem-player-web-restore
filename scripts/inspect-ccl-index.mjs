const t = await (
  await fetch("https://colorcodedlyrics.com/category/krn/newjeans-nyujinseu/")
).text();
const links = [...t.matchAll(/href="(https:\/\/colorcodedlyrics\.com\/[^"]+)"/gi)].map((m) => m[1]);
const posts = links.filter((u) => /\/20\d{2}\//.test(u));
console.log("posts", posts.length, posts.slice(0, 8));
const next = t.match(/href="([^"]+)"[^>]*>Next/i) || t.match(/rel="next"[^>]*href="([^"]+)"/i);
console.log("next", next?.[1]);
