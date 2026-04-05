import { PreviewArticle } from "@/types";
import { extractTag, extractAttribute, decodeHtmlEntities, extractDomain, generateId } from "./shared";

export async function fetchRss(
  url: string
): Promise<{ articles: PreviewArticle[]; rssUrl: string; feedTitle: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; FeedboardPro/1.0)",
      },
    });

    if (!response.ok) {
      throw new Error(`Feed fetch failed: ${response.status}`);
    }

    const xml = await response.text();

    // Detect format and parse
    if (xml.includes("<rss") || xml.includes("<channel>")) {
      const channelMatch = xml.match(/<channel>([\s\S]*?)<item/i);
      const feedTitle = (channelMatch ? extractTag(channelMatch[1], "title") : null) || extractDomain(url);
      const articles = parseRss2(xml);
      return { articles, rssUrl: url, feedTitle };
    } else if (xml.includes("<feed")) {
      const feedMatch = xml.match(/<feed[^>]*>([\s\S]*?)<entry/i);
      const feedTitle = (feedMatch ? extractTag(feedMatch[1], "title") : null) || extractDomain(url);
      const articles = parseAtom(xml);
      return { articles, rssUrl: url, feedTitle };
    } else {
      throw new Error("This URL doesn't appear to be an RSS or Atom feed.");
    }
  } finally {
    clearTimeout(timeout);
  }
}

function cleanDescription(html: string): string | undefined {
  const text = decodeHtmlEntities(html)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length < 5) return undefined;
  return text.slice(0, 200);
}

function extractThumbnail(itemXml: string): string | undefined {
  // media:content url
  let thumb = extractAttribute(itemXml, "media:content", "url");
  // media:thumbnail url
  if (!thumb) thumb = extractAttribute(itemXml, "media:thumbnail", "url");
  // enclosure with image type
  if (!thumb) {
    const enclosureType = extractAttribute(itemXml, "enclosure", "type");
    if (enclosureType && enclosureType.startsWith("image")) {
      thumb = extractAttribute(itemXml, "enclosure", "url");
    }
  }
  // First <img> in content
  if (!thumb) {
    const imgMatch = itemXml.match(/<img[^>]+src="([^"]+)"/i);
    if (imgMatch) thumb = decodeHtmlEntities(imgMatch[1]);
  }
  return thumb || undefined;
}

function parseRss2(xml: string): PreviewArticle[] {
  const items: PreviewArticle[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];

    const title = extractTag(itemXml, "title");
    const link = extractTag(itemXml, "link");
    const pubDate = extractTag(itemXml, "pubDate");
    const description = extractTag(itemXml, "description");
    const contentEncoded = extractTag(itemXml, "content:encoded");
    const source = extractTag(itemXml, "source") || extractTag(itemXml, "dc:creator");

    const thumbnail = extractThumbnail(itemXml) ||
      (contentEncoded ? extractThumbnailFromHtml(contentEncoded) : undefined);

    if (title && link) {
      items.push({
        id: generateId("rss", link),
        title: decodeHtmlEntities(title),
        source: source || extractDomain(link),
        url: link,
        publishedAt: pubDate || new Date().toISOString(),
        thumbnail,
        description: description ? cleanDescription(description) : undefined,
      });
    }

    if (items.length >= 50) break;
  }

  return items;
}

function parseAtom(xml: string): PreviewArticle[] {
  const items: PreviewArticle[] = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xml)) !== null) {
    const entryXml = match[1];

    const title = extractTag(entryXml, "title");
    const link = extractAttribute(entryXml, "link", "href");
    const updated = extractTag(entryXml, "updated") || extractTag(entryXml, "published");
    const summary = extractTag(entryXml, "summary") || extractTag(entryXml, "content");
    const authorName = extractTag(entryXml, "name");

    const thumbnail = extractThumbnail(entryXml);

    if (title && link) {
      items.push({
        id: generateId("rss", link),
        title: decodeHtmlEntities(title),
        source: authorName || extractDomain(link),
        url: link,
        publishedAt: updated || new Date().toISOString(),
        thumbnail,
        description: summary ? cleanDescription(summary) : undefined,
      });
    }

    if (items.length >= 50) break;
  }

  return items;
}

function extractThumbnailFromHtml(html: string): string | undefined {
  const imgMatch = html.match(/<img[^>]+src="([^"]+)"/i);
  return imgMatch ? decodeHtmlEntities(imgMatch[1]) : undefined;
}
