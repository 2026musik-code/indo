import CryptoJS from "crypto-js";

// Client-side fallback API client to bypass the need for a Node.js backend
// when deployed on static environments like Cloudflare Pages, GitHub Pages, etc.

const PROXY = "https://api.codetabs.com/v1/proxy?quest=";
const SECRET_KEY = "Sansekai-SekaiDrama";
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36",
  "Referer": "https://drama.sansekai.my.id/",
  "Accept": "application/json"
};

async function proxiedFetch(url: string) {
  const res = await fetch(PROXY + url);
  if (!res.ok) throw new Error("Proxy error");
  return await res.json();
}

function decryptData(encryptedData: string) {
  const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
}

export async function fetchLatestClientFallback() {
  const [pineRes, dramaRes] = await Promise.all([
    proxiedFetch('https://drama.sansekai.my.id/api/pinedrama/trending'),
    proxiedFetch('https://drama.sansekai.my.id/api/dramabox/latest')
  ]);

  let cleanData: any[] = [];

  if (pineRes.data) {
    const pineData = decryptData(pineRes.data);
    const pineFormatted = (pineData.collections || []).map((item: any) => ({
      id: item.collection_id,
      title: item.title,
      cover: item.cover_urls?.[0] || item.cover || '',
      episodes: item.total_episodes,
      desc: item.description || item.categories,
      views: item.views,
      tags: item.categories ? item.categories.split(',').map((t: string) => t.trim()) : [],
      provider: 'pinedrama'
    }));
    cleanData = [...cleanData, ...pineFormatted];
  }

  if (dramaRes.data) {
    const dramaData = decryptData(dramaRes.data);
    const dramaFormatted = (Array.isArray(dramaData) ? dramaData : []).map((item: any) => ({
      id: item.bookId,
      title: item.bookName,
      cover: item.coverWap,
      episodes: item.chapterCount,
      desc: item.introduction,
      views: item.rankVo?.hotCode || '',
      tags: item.tags || [],
      provider: 'dramabox'
    }));
    cleanData = [...cleanData, ...dramaFormatted];
  }

  return {
    success: true,
    total: cleanData.length,
    data: cleanData.sort(() => Math.random() - 0.5)
  };
}

export async function fetchDetailsClientFallback(provider: string, id: string) {
  let url = provider === "dramabox" 
    ? `https://drama.sansekai.my.id/api/dramabox/detail?bookId=${id}`
    : `https://drama.sansekai.my.id/api/pinedrama/detail?collection_id=${id}`;

  const result = await proxiedFetch(url);
  if (!result.data) throw new Error("Invalid response");

  const rawData = decryptData(result.data);
  return {
    success: true,
    data: {
      id: id,
      title: provider === "dramabox" ? rawData.bookName : rawData.title,
      desc: provider === "dramabox" ? rawData.introduction : rawData.description,
      total_episodes: provider === "dramabox" ? rawData.chapterCount : rawData.total_episodes,
      cover: provider === "dramabox" ? rawData.coverWap : (rawData.cover_urls?.[0] || ''),
    }
  };
}

export async function fetchPlayClientFallback(provider: string, id: string, ep: string) {
  let url = provider === "dramabox" 
    ? `https://drama.sansekai.my.id/api/dramabox/episode?bookId=${id}&episodeNumber=${ep}`
    : `https://drama.sansekai.my.id/api/pinedrama/episode?collection_id=${id}&episodeNumber=${ep}`;

  const result = await proxiedFetch(url);
  if (!result.data) throw new Error("Invalid response");

  const decryptedData = decryptData(result.data);
  const videoUrl = decryptedData.best_url || (decryptedData.main && decryptedData.main.indo_hd_cdn_urls && decryptedData.main.indo_hd_cdn_urls[0]) || decryptedData.videoUrl || decryptedData.url;

  if (!videoUrl) throw new Error("URL video tidak ditemukan.");

  return {
    success: true,
    title: decryptedData.title || decryptedData.bookName || '',
    videoUrl: videoUrl,
    rawUrl: videoUrl,
    quality: decryptedData.quality || 'HD'
  };
}

export async function safeFetch(apiPath: string) {
  const originalRes = await fetch(apiPath);
  const text = await originalRes.text();
  try {
    const json = JSON.parse(text);
    // If it's a valid JSON but an upstream API error with "Format tidak valid"
    // Or if the backend explicitly threw our formatting error
    if (!json.success && json.message && json.message.includes("Upstream API error")) {
       throw new Error("Upstream failed");
    }
    return json;
  } catch (err) {
    if (text.startsWith("<!DOCTYPE") || String(err).includes("Upstream failed")) {
      // Fallback! We are likely running on Cloudflare Pages without the backend.
      console.log("Using client-side API fallback for", apiPath);
      
      if (apiPath.startsWith("/api/latest")) {
        return await fetchLatestClientFallback();
      }
      if (apiPath.startsWith("/api/details/")) {
        const parts = apiPath.split('/');
        return await fetchDetailsClientFallback(parts[3], parts[4]);
      }
      if (apiPath.startsWith("/api/play/")) {
        const parts = apiPath.split('/');
        return await fetchPlayClientFallback(parts[3], parts[4], parts[5]);
      }
    }
    throw new Error("Gagal parsing JSON: " + text.slice(0, 50));
  }
}
