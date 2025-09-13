import { JSDOM } from "jsdom";

export async function webSearch({ urls = [] }) {
  const out = [];
  for (const pageUrl of urls.slice(0, 3)) {
    const res = await fetch(pageUrl);
    if (!res.ok) continue;
    const html = await res.text();
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    doc
      .querySelectorAll("script, style,nav,footer")
      .forEach((el) => el.remove());
  }
  const article = doc.querySelector("article")?.textContent || "";
  const ps = [...doc.querySelectorAll("p")].map((p) =>
    p.textContent?.trim().filter(Boolean)
  );
  const body = article && article.length > 400 ? article : ps.join("\n");
  out.push({ url: pageUrl, text: body.slice(0, 4000) });
  return { item: out };
}
