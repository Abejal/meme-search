export type Meme = {
  id: string;
  title: string;
  url: string; // image or gif url
  source: "reddit" | "giphy";
  permalink?: string;
  width?: number;
  height?: number;
};

// Public Giphy beta key — works for low-volume demos. Replace with your own for production.
const GIPHY_KEY = "dc6zaTOxFJmzC";

const isImage = (url: string) =>
  /\.(jpe?g|png|gif|webp)(\?.*)?$/i.test(url) || url.includes("i.redd.it") || url.includes("i.imgur.com");

async function fetchReddit(query: string): Promise<Meme[]> {
  const sub = query.trim() ? "memes" : "memes";
  const url = query.trim()
    ? `https://www.reddit.com/r/memes+dankmemes+wholesomememes/search.json?q=${encodeURIComponent(
        query
      )}&restrict_sr=1&limit=40&sort=relevance`
    : `https://www.reddit.com/r/${sub}/hot.json?limit=40`;

  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = await res.json();
    const posts = json?.data?.children ?? [];
    return posts
      .map((p: any) => p.data)
      .filter((d: any) => d?.url && isImage(d.url) && !d.over_18)
      .map((d: any) => ({
        id: `r_${d.id}`,
        title: d.title as string,
        url: d.url as string,
        source: "reddit" as const,
        permalink: `https://reddit.com${d.permalink}`,
        width: d?.preview?.images?.[0]?.source?.width,
        height: d?.preview?.images?.[0]?.source?.height,
      }));
  } catch {
    return [];
  }
}

async function fetchGiphy(query: string): Promise<Meme[]> {
  const endpoint = query.trim()
    ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(query)}&limit=30&rating=pg-13`
    : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_KEY}&limit=30&rating=pg-13`;
  try {
    const res = await fetch(endpoint);
    if (!res.ok) return [];
    const json = await res.json();
    return (json?.data ?? []).map((g: any) => ({
      id: `g_${g.id}`,
      title: g.title || "Giphy",
      url: g.images?.downsized_medium?.url || g.images?.original?.url,
      source: "giphy" as const,
      permalink: g.url,
      width: Number(g.images?.original?.width) || undefined,
      height: Number(g.images?.original?.height) || undefined,
    }));
  } catch {
    return [];
  }
}

export async function searchMemes(query: string): Promise<Meme[]> {
  const [reddit, giphy] = await Promise.all([fetchReddit(query), fetchGiphy(query)]);
  // interleave for visual variety
  const out: Meme[] = [];
  const max = Math.max(reddit.length, giphy.length);
  for (let i = 0; i < max; i++) {
    if (reddit[i]) out.push(reddit[i]);
    if (giphy[i]) out.push(giphy[i]);
  }
  return out;
}
