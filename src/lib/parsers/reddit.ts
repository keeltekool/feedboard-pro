import { PreviewArticle } from "@/types";
import { extractTag, extractAttribute, decodeHtmlEntities, generateId } from "./shared";

export async function fetchReddit(
  query: string
): Promise<{ articles: PreviewArticle[]; rssUrl: string }> {
  let rssUrl: string;

  if (query.startsWith("r/")) {
    rssUrl = `https://www.reddit.com/${query}.rss`;
  } else if (/^[\w]+$/.test(query) && !query.includes(" ")) {
    rssUrl = `https://www.reddit.com/r/${query}.rss`;
  } else {
    const encoded = encodeURIComponent(query);
    rssUrl = `https://www.reddit.com/search.rss?q=${encoded}&sort=new&limit=50`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(rssUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/rss+xml, application/xml, text/xml",
      },
    });

    if (!response.ok) {
      throw new Error(`Reddit RSS failed: ${response.status}`);
    }

    const xml = await response.text();
    const articles = parseRedditRSS(xml);
    return { articles, rssUrl };
  } finally {
    clearTimeout(timeout);
  }
}

function parseRedditRSS(xml: string): PreviewArticle[] {
  const posts: PreviewArticle[] = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xml)) !== null) {
    const entryXml = match[1];

    const title = extractTag(entryXml, "title");
    const link = extractAttribute(entryXml, "link", "href");
    const updated = extractTag(entryXml, "updated");
    const id = extractTag(entryXml, "id");
    const content = extractTag(entryXml, "content");
    const subreddit = extractAttribute(entryXml, "category", "term") || "reddit";

    let thumbnail: string | undefined;
    if (content) {
      const imgMatch = content.match(/<img[^>]+src="([^"]+)"/i);
      if (imgMatch) {
        thumbnail = decodeHtmlEntities(imgMatch[1]);
      }
    }

    if (title && link) {
      const sub = subreddit.startsWith("r/") ? subreddit : `r/${subreddit}`;
      posts.push({
        id: id || generateId("reddit", link),
        title: decodeHtmlEntities(title),
        source: sub,
        url: link,
        publishedAt: updated || new Date().toISOString(),
        thumbnail,
        description: content
          ? decodeHtmlEntities(content.replace(/<[^>]*>/g, "")).slice(0, 200)
          : undefined,
      });
    }

    if (posts.length >= 50) break;
  }

  return posts;
}
