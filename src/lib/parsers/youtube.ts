import { PreviewArticle } from "@/types";
import { extractTag, decodeHtmlEntities } from "./shared";

export async function resolveChannelId(input: string): Promise<string> {
  const trimmed = input.trim();

  if (/^UC[\w-]{22}$/.test(trimmed)) {
    return trimmed;
  }

  const channelMatch = trimmed.match(/youtube\.com\/channel\/(UC[\w-]{22})/);
  if (channelMatch) {
    return channelMatch[1];
  }

  let handle = trimmed;
  const handleMatch = trimmed.match(/youtube\.com\/(@[\w.-]+)/);
  if (handleMatch) {
    handle = handleMatch[1];
  } else if (!handle.startsWith("@")) {
    handle = `@${handle}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`https://www.youtube.com/${handle}`, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`YouTube page fetch failed: ${response.status}`);
    }

    const html = await response.text();

    const patterns = [
      /"channelId":"(UC[\w-]{22})"/,
      /channel_id=(UC[\w-]{22})/,
      /<meta[^>]+itemprop="channelId"[^>]+content="(UC[\w-]{22})"/,
      /youtube\.com\/channel\/(UC[\w-]{22})/,
    ];

    for (const pattern of patterns) {
      const m = html.match(pattern);
      if (m) return m[1];
    }

    throw new Error(`Could not resolve channel ID for "${input}"`);
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchYouTube(
  channelId: string
): Promise<{
  articles: PreviewArticle[];
  rssUrl: string;
  channelName: string;
}> {
  const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

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
      throw new Error(`YouTube RSS fetch failed: ${response.status}`);
    }

    const xml = await response.text();
    const channelName = extractTag(xml, "title") || "YouTube Channel";
    const articles = parseYouTubeAtom(xml, channelName);
    return { articles, rssUrl, channelName };
  } finally {
    clearTimeout(timeout);
  }
}

function parseYouTubeAtom(
  xml: string,
  channelName: string
): PreviewArticle[] {
  const videos: PreviewArticle[] = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xml)) !== null) {
    const entryXml = match[1];

    const title = extractTag(entryXml, "title");
    const videoId = extractTag(entryXml, "yt:videoId");
    const published = extractTag(entryXml, "published");
    const description = extractTag(entryXml, "media:description");

    if (title && videoId) {
      const thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

      videos.push({
        id: `yt-${videoId}`,
        title: decodeHtmlEntities(title),
        source: channelName,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        publishedAt: published || new Date().toISOString(),
        thumbnail,
        description: description
          ? decodeHtmlEntities(description).slice(0, 200)
          : undefined,
      });
    }

    if (videos.length >= 50) break;
  }

  return videos;
}
