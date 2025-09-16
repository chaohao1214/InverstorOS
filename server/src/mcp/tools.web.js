import { JSDOM } from "jsdom";

export async function webSearch({ urls = [] }) {
  const items = [];

  for (const pageUrl of (urls || []).slice(0, 3)) {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 8000);

    try {
      const res = await fetch(pageUrl, {
        signal: ac.signal,
        headers: {
          "user-agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari",
          accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });
      if (!res.ok) continue;
      const html = await res.text();
      const dom = new JSDOM(html);
      const doc = dom.window.document;
      doc
        .querySelectorAll("script,style,nav,footer")
        .forEach((el) => el.remove());
      const article = doc.querySelector("article")?.textContent || "";
      const ps = [...doc.querySelectorAll("p")]
        .map((p) => p.textContent?.trim())
        .filter(Boolean);
      const text = (
        article && article.length > 400 ? article : ps.join("\n")
      ).slice(0, 4000);
      items.push({ url: pageUrl, text });
    } catch (e) {
      // swallow one URL error; continue next
      console.warn(
        "[web.search] fetch fail:",
        pageUrl,
        e.name === "AbortError" ? "timeout" : e.message
      );
    } finally {
      clearTimeout(t);
    }
  }

  return { items };
}
