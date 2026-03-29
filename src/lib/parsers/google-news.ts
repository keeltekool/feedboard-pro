import { PreviewArticle } from "@/types";
import { extractTag, extractAttribute, decodeHtmlEntities, extractDomain, generateId } from "./shared";

export async function fetchGoogleNews(
  query: string,
  language: string = "en"
): Promise<{ articles: PreviewArticle[]; rssUrl: string }> {
  const encodedQuery = encodeURIComponent(query);
  const rssUrl = `https://news.google.com/rss/search?q=${encodedQuery}&hl=${language}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(rssUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; FeedboardPro/1.0)",
      },
    });

    if (!response.ok) {
      throw new Error(`RSS fetch failed: ${response.status}`);
    }

    const xml = await response.text();
    const articles = parseGoogleNewsRSS(xml);
    return { articles, rssUrl };
  } finally {
    clearTimeout(timeout);
  }
}

function parseGoogleNewsRSS(xml: string): PreviewArticle[] {
  const items: PreviewArticle[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];

    const title = extractTag(itemXml, "title");
    const link = extractTag(itemXml, "link");
    const pubDate = extractTag(itemXml, "pubDate");
    const source = extractTag(itemXml, "source");
    const description = extractTag(itemXml, "description");

    let thumbnail = extractAttribute(itemXml, "media:content", "url");
    if (!thumbnail) thumbnail = extractAttribute(itemXml, "media:thumbnail", "url");
    if (!thumbnail) thumbnail = extractAttribute(itemXml, "enclosure", "url");
    if (!thumbnail && description) {
      const imgPatterns = [
        /src="(https:\/\/[^"]+\.(jpg|jpeg|png|webp|gif)[^"]*)"/i,
        /src="(https:\/\/lh3\.googleusercontent\.com[^"]*)"/i,
        /src="(https:\/\/news\.google\.com\/api\/attachments[^"]*)"/i,
        /<img[^>]+src="([^"]+)"/i,
      ];
      for (const pattern of imgPatterns) {
        const imgMatch = description.match(pattern);
        if (imgMatch) {
          thumbnail = decodeHtmlEntities(imgMatch[1]);
          break;
        }
      }
    }

    if (title && link) {
      items.push({
        id: generateId("news", link),
        title: decodeHtmlEntities(title),
        source: source || extractDomain(link),
        url: link,
        publishedAt: pubDate || new Date().toISOString(),
        thumbnail: thumbnail || undefined,
        description: description ? decodeHtmlEntities(description.replace(/<[^>]*>/g, "")).slice(0, 200) : undefined,
      });
    }

    if (items.length >= 50) break;
  }

  return items;
}
