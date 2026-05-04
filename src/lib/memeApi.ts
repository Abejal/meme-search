export type Meme = {
  id: string;
  title: string;
  url: string; // image or gif url
  source: "reddit" | "giphy" | "imgflip" | "tenor";
  permalink?: string;
  width?: number;
  height?: number;
};

// Public Giphy beta key — works for low-volume demos. Replace with your own for production.
const GIPHY_KEY = "dc6zaTOxFJmzC";
// Public Tenor demo key from Google's docs — fine for low volume. Swap for your own in prod.
const TENOR_KEY = "LIVDSRZULELA";
// Imgur Client ID — safe to expose in frontend (designed for public API access)
const IMGUR_CLIENT_ID = "7accbaf7665acd3f8d4be2be76b3bfc5";

const isImage = (url: string) =>
  /\.(jpe?g|png|gif|webp)(\?.*)?$/i.test(url) ||
  url.includes("i.redd.it") ||
  url.includes("i.imgur.com");

const NSFW_WORDS = [
  "nsfw", "porn", "sexy", "nude", "naked", "boob", "tit ", "thicc",
  "thirst", "horny", "onlyfans", "hentai", "xxx", "milf", "cum",
  "dick", "pussy", "kink", "fetish", "lewd", "r34", "rule34",
];

const containsNSFW = (text: string) => {
  const t = (text || "").toLowerCase();
  return NSFW_WORDS.some((w) => t.includes(w));
};

// Broader pool of SFW meme subreddits — much better recall for niche topics
const SFW_SUBS = [
  "memes",
  "wholesomememes",
  "meme",
  "AdviceAnimals",
  "MemeEconomy",
  "facepalm",
  "gamingmemes",
  "gaming",
  "PrequelMemes",
  "HistoryMemes",
  "ProgrammerHumor",
  "MovieMemes",
  "Animemes",
  "okbuddyretard",
  "terriblefacebookmemes",
  "memeeconomy",
  "ComedyCemetery",
  "dankmemes", // re-included but heavily filtered below
].join("+");

async function fetchReddit(query: string): Promise<Meme[]> {
  const q = query.trim();
  // Two parallel queries: restricted to SFW subs AND a broader site-wide search,
  // both filtered hard for NSFW. This dramatically improves recall for niche topics.
  const urls = q
    ? [
        `https://www.reddit.com/r/${SFW_SUBS}/search.json?q=${encodeURIComponent(q)}&restrict_sr=1&limit=75&sort=relevance&include_over_18=off`,
        `https://www.reddit.com/search.json?q=${encodeURIComponent(q + " meme")}&limit=75&sort=relevance&include_over_18=off&type=link`,
      ]
    : [`https://www.reddit.com/r/memes/hot.json?limit=75&include_over_18=off`];

  try {
    const responses = await Promise.all(
      urls.map((u) => fetch(u).then((r) => (r.ok ? r.json() : null)).catch(() => null))
    );
    const seen = new Set<string>();
    const out: Meme[] = [];
    for (const json of responses) {
      const posts = json?.data?.children ?? [];
      for (const p of posts) {
        const d = p.data;
        if (!d?.url || !isImage(d.url)) continue;
        if (d.over_18) continue;
        if (d.thumbnail?.toString().includes("nsfw")) continue;
        if (containsNSFW(d.title) || containsNSFW(d.subreddit)) continue;
        if (seen.has(d.id)) continue;
        seen.add(d.id);
        out.push({
          id: `r_${d.id}`,
          title: d.title,
          url: d.url,
          source: "reddit",
          permalink: `https://reddit.com${d.permalink}`,
          width: d?.preview?.images?.[0]?.source?.width,
          height: d?.preview?.images?.[0]?.source?.height,
        });
      }
    }
    return out;
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
    return (json?.data ?? [])
      .filter((g: any) => !containsNSFW(g.title))
      .map((g: any) => ({
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

// Tenor — huge GIF library, much better topical coverage than Giphy for pop culture
async function fetchTenor(query: string): Promise<Meme[]> {
  const q = query.trim();
  if (!q) return [];
  const url = `https://g.tenor.com/v1/search?q=${encodeURIComponent(q + " meme")}&key=${TENOR_KEY}&limit=30&contentfilter=high&media_filter=minimal`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = await res.json();
    return (json?.results ?? [])
      .filter((g: any) => !containsNSFW(g.content_description || g.title || ""))
      .map((g: any) => {
        const media = g.media?.[0]?.gif || g.media?.[0]?.tinygif;
        return {
          id: `t_${g.id}`,
          title: g.content_description || g.title || "Tenor",
          url: media?.url,
          source: "tenor" as const,
          permalink: g.itemurl || g.url,
          width: media?.dims?.[0],
          height: media?.dims?.[1],
        };
      })
      .filter((m: Meme) => !!m.url);
  } catch {
    return [];
  }
}

// Imgflip — classic meme template database. Great for "popular meme" discovery.
let imgflipCache: any[] | null = null;
async function fetchImgflip(query: string): Promise<Meme[]> {
  try {
    if (!imgflipCache) {
      const res = await fetch("https://api.imgflip.com/get_memes");
      if (!res.ok) return [];
      const json = await res.json();
      imgflipCache = json?.data?.memes ?? [];
    }
    const memes = imgflipCache || [];
    const q = query.trim().toLowerCase();
    const filtered = q
      ? memes.filter((m: any) => m.name.toLowerCase().includes(q))
      : memes.slice(0, 20);
    return filtered.map((m: any) => ({
      id: `i_${m.id}`,
      title: m.name,
      url: m.url,
      source: "imgflip" as const,
      permalink: `https://imgflip.com/memetemplate/${m.id}`,
      width: m.width,
      height: m.height,
    }));
  } catch {
    return [];
  }
}

// Imgur — massive meme repository, great for popular & niche topics
async function fetchImgur(query: string): Promise<Meme[]> {
  const q = query.trim();
  if (!q) return [];
  const url = `https://api.imgur.com/3/gallery/search/top/all/0?q=${encodeURIComponent(q + " meme")}`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${IMGUR_CLIENT_ID}` },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const items = json?.data ?? [];
    const out: Meme[] = [];
    for (const it of items) {
      if (it.nsfw) continue;
      if (containsNSFW(it.title || "") || containsNSFW(it.tags?.map((t: any) => t.name).join(" ") || "")) continue;
      // Albums: take first image. Single images: use directly.
      const img = it.is_album ? it.images?.[0] : it;
      if (!img?.link) continue;
      if (img.type && !img.type.startsWith("image/")) continue;
      if (!isImage(img.link)) continue;
      out.push({
        id: `im_${it.id}`,
        title: it.title || "Imgur",
        url: img.link,
        source: "imgur" as const,
        permalink: it.link || `https://imgur.com/gallery/${it.id}`,
        width: img.width,
        height: img.height,
      });
      if (out.length >= 30) break;
    }
    return out;
  } catch {
    return [];
  }
}

export async function searchMemes(query: string): Promise<Meme[]> {
  const [reddit, giphy, tenor, imgflip, imgur] = await Promise.all([
    fetchReddit(query),
    fetchGiphy(query),
    fetchTenor(query),
    fetchImgflip(query),
    fetchImgur(query),
  ]);

  // Imgflip first (classic templates surface for popular searches), then interleave the rest
  const out: Meme[] = [...imgflip];
  const max = Math.max(reddit.length, giphy.length, tenor.length, imgur.length);
  for (let i = 0; i < max; i++) {
    if (reddit[i]) out.push(reddit[i]);
    if (imgur[i]) out.push(imgur[i]);
    if (tenor[i]) out.push(tenor[i]);
    if (giphy[i]) out.push(giphy[i]);
  }
  return out;
}
