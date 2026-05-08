import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import CryptoJS from "crypto-js";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // JSON parsing middleware
  app.use(express.json());

  let proxyIPs: string[] = [];
  let lastFetch = 0;

  const loadProxyIPs = async () => {
    try {
      if (Date.now() - lastFetch > 1000 * 60 * 60) {
        const response = await fetch('https://raw.githubusercontent.com/FoolVPN-ID/Nautica/main/proxyList.txt');
        const text = await response.text();
        const ips = text.split('\n')
          .map(line => line.split(',')[0].trim())
          .filter(ip => /^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/.test(ip));
        if (ips.length > 0) {
          proxyIPs = Array.from(new Set(ips));
          lastFetch = Date.now();
        }
      }
    } catch (e) {
      console.error('Failed to load proxy IPs:', e);
    }
  };
  
  loadProxyIPs();

  const getFakeIP = () => {
    if (proxyIPs.length > 0) {
      return proxyIPs[Math.floor(Math.random() * proxyIPs.length)];
    }
    const r = () => Math.floor(Math.random() * 255) + 1;
    return `${r()}.${r()}.${r()}.${r()}`;
  };

  const getHeaders = (reqIp?: string) => {
    let fakeIP = reqIp === "Auto" || !reqIp ? getFakeIP() : reqIp;
    if (!fakeIP) fakeIP = getFakeIP();
    return {
      "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36",
      "Referer": "https://drama.sansekai.my.id/",
      "Accept": "application/json",
      "X-Forwarded-For": fakeIP,
      "X-Real-IP": fakeIP,
      "Client-IP": fakeIP
    };
  };

  const safeFetch = async (url: string, userIp?: string) => {
    let attempt = 0;
    let currentIp = userIp;
    const maxAttempts = 10;
    while (attempt < maxAttempts) {
      const headers = getHeaders(currentIp);
      try {
        const res = await fetch(url, { headers });
        if (res.status === 429 || res.status === 502 || res.status === 503 || res.status === 504 || res.status === 403) {
          attempt++;
          // Auto switch IP on limit
          currentIp = "Auto";
          await new Promise(r => setTimeout(r, 300));
          continue;
        }
        return res;
      } catch (e) {
        attempt++;
        currentIp = "Auto";
        await new Promise(r => setTimeout(r, 300));
      }
    }
    return await fetch(url, { headers: getHeaders(currentIp) });
  };

  app.get('/api/proxies', async (req, res) => {
    await loadProxyIPs();
    return res.json({ success: true, data: proxyIPs });
  });

  // API routing
  app.get("/api/latest", async (req, res) => {
    try {
      const secretKey = "Sansekai-SekaiDrama";
      const userIp = req.headers['x-user-ip'] as string;
      
      const [pineRes, dramaRes, reelRes] = await Promise.all([
        safeFetch('https://api.sansekai.my.id/api/pinedrama/trending', userIp),
        safeFetch('https://api.sansekai.my.id/api/dramabox/foryou?page=1', userIp),
        safeFetch('https://api.sansekai.my.id/api/reelshort/foryou', userIp)
      ]);

      let cleanData: any[] = [];

      // Process Pinedrama
      if (pineRes.ok) {
        const pineResult = await pineRes.json();
        let pineData = null;
        if (pineResult.data && typeof pineResult.data === 'string') {
          const pineBytes = CryptoJS.AES.decrypt(pineResult.data, secretKey);
          pineData = JSON.parse(pineBytes.toString(CryptoJS.enc.Utf8));
        } else {
          pineData = pineResult;
        }
        
        if (pineData) {
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
      }

      // Process Dramabox
      if (dramaRes.ok) {
        const dramaResult = await dramaRes.json();
        let dramaData: any[] = [];
        
        if (Array.isArray(dramaResult)) {
          dramaData = dramaResult;
        } else if (dramaResult.data && typeof dramaResult.data === 'string') {
          const dramaBytes = CryptoJS.AES.decrypt(dramaResult.data, secretKey);
          dramaData = JSON.parse(dramaBytes.toString(CryptoJS.enc.Utf8));
        } else if (dramaResult.data) {
          dramaData = dramaResult.data;
        }

        const dramaFormatted = dramaData.map((item: any) => ({
          id: item.bookId || item.id,
          title: item.bookName || item.title,
          cover: item.coverWap || item.cover,
          episodes: item.chapterCount || item.episodes,
          desc: item.introduction || item.desc,
          views: item.rankVo?.hotCode || item.views || '',
          tags: item.tags || [],
          provider: 'dramabox'
        }));
        cleanData = [...cleanData, ...dramaFormatted];
      }

      // Process ReelShort
      if (reelRes.ok) {
        const reelResult = await reelRes.json();
        if (reelResult.success && reelResult.data?.lists) {
          const reelFormatted = reelResult.data.lists.map((item: any) => ({
            id: item.book_id,
            title: item.book_title,
            cover: item.book_pic,
            episodes: item.chapter_count || item.totalEpisodes || 0,
            desc: item.special_desc || item.description || '',
            views: item.read_count || '',
            tags: item.theme || item.tag_list?.map((t:any) => t.tag_name) || [],
            provider: 'reelshort'
          }));
          cleanData = [...cleanData, ...reelFormatted];
        }
      }

      // Send to frontend
      return res.json({
        success: true,
        total: cleanData.length,
        data: cleanData.sort(() => Math.random() - 0.5) // Shuffle them
      });

    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get('/api/proxy-video', async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== 'string') {
      return res.status(400).send('URL is required');
    }

    try {
      const headers: Record<string, string> = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://drama.sansekai.my.id/",
        "Accept": "*/*",
      };

      if (req.headers.range) {
        headers['Range'] = req.headers.range;
      }

      const response = await fetch(url, {
        headers,
      });

      res.status(response.status);
      response.headers.forEach((val, key) => {
        // Exclude some headers that shouldn't be proxied back directly if needed
        res.setHeader(key, val);
      });

      if (response.body) {
        const { Readable } = await import('stream');
        const nodeStream = Readable.fromWeb(response.body as any);
        nodeStream.pipe(res);
      } else {
        res.end();
      }
    } catch (error) {
      console.error("Proxy error:", error);
      res.status(500).end();
    }
  });

  app.get('/api/details/:provider/:id', async (req, res) => {
    const provider = req.params.provider;
    const id = req.params.id;
    const secretKey = "Sansekai-SekaiDrama";
    const userIp = req.headers['x-user-ip'] as string;
    
    let url = "";
    if (provider === "dramabox") {
      url = `https://api.sansekai.my.id/api/dramabox/detail?bookId=${id}`;
    } else if (provider === "reelshort") {
      url = `https://api.sansekai.my.id/api/reelshort/detail?bookId=${id}`;
    } else {
      url = `https://api.sansekai.my.id/api/pinedrama/detail?collection_id=${id}`;
    }

    try {
      const response = await safeFetch(url, userIp);
      
      if (response.status !== 200) {
        return res.status(response.status).json({ success: false, message: "Penyedia tidak mengembalikan detail." });
      }

      const result = await response.json();
      let rawData;
      if (result.data && typeof result.data === 'string') {
        const bytes = CryptoJS.AES.decrypt(result.data, secretKey);
        rawData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      } else {
        rawData = result;
      }

      res.json({
        success: true,
        data: {
          id: id,
          title: provider === "reelshort" ? rawData.title : (provider === "dramabox" ? rawData.bookName : rawData.title),
          desc: provider === "reelshort" ? rawData.description : (provider === "dramabox" ? rawData.introduction : rawData.description),
          total_episodes: provider === "reelshort" ? rawData.totalEpisodes : (provider === "dramabox" ? rawData.chapterCount : rawData.total_episodes),
          cover: provider === "reelshort" ? rawData.cover : (provider === "dramabox" ? rawData.coverWap : (rawData.cover_urls?.[0] || '')),
        }
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.get('/api/play/:provider/:id/:ep', async (req, res) => {
    const provider = req.params.provider;
    const id = req.params.id;
    const ep = req.params.ep;
    const secretKey = "Sansekai-SekaiDrama";
    const userIp = req.headers['x-user-ip'] as string;
    
    let url = "";
    if (provider === "dramabox") {
      url = `https://api.sansekai.my.id/api/dramabox/allepisode?bookId=${id}`;
    } else if (provider === "reelshort") {
      url = `https://api.sansekai.my.id/api/reelshort/episode?bookId=${id}&episodeNumber=${ep}`;
    } else {
      url = `https://api.sansekai.my.id/api/pinedrama/episode?collection_id=${id}&episodeNumber=${ep}`;
    }

    try {
      const response = await safeFetch(url, userIp);

      const responseText = await response.text();
      let result;
      
      try {
        result = JSON.parse(responseText);
      } catch (parseError: any) {
        return res.status(response.status !== 200 ? response.status : 500).json({ 
          success: false, 
          message: "Upstream API error: Format tidak valid", 
          debug: responseText.slice(0, 100) 
        });
      }
      
      let decryptedData;

      if (provider === 'dramabox') {
        if (Array.isArray(result)) {
          decryptedData = result;
        } else if (result.data && typeof result.data === 'string') {
          const bytes = CryptoJS.AES.decrypt(result.data, secretKey);
          decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        } else {
          decryptedData = result;
        }
      } else if (provider === 'reelshort') {
        decryptedData = result;
      } else {
        if (result.data && typeof result.data === 'string') {
          const bytes = CryptoJS.AES.decrypt(result.data, secretKey);
          decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        } else {
          decryptedData = result;
        }
      }

      let videoUrl = "";
      let title = "";
      let quality = "";

      if (provider === 'dramabox') {
        const epIndex = parseInt(ep) - 1;
        const episodeData = decryptedData[epIndex] || decryptedData[0];
        title = episodeData?.chapterName || `Episode ${ep}`;
        
        if (episodeData && episodeData.cdnList && episodeData.cdnList.length > 0) {
          const cdn = episodeData.cdnList.find((c: any) => c.isDefault === 1) || episodeData.cdnList[0];
          if (cdn && cdn.videoPathList && cdn.videoPathList.length > 0) {
            const video = cdn.videoPathList.find((v: any) => v.isDefault === 1) || cdn.videoPathList[0];
            videoUrl = video.videoPath;
            quality = video.quality + "p";
          }
        }
      } else if (provider === 'reelshort') {
        title = `Episode ${ep}`;
        if (decryptedData.videoList && decryptedData.videoList.length > 0) {
          // Prefer H264 for better browser compatibility
          const video = decryptedData.videoList.find((v: any) => v.encode === 'H264') || decryptedData.videoList[0];
          videoUrl = video.url;
          quality = video.quality ? video.quality + 'p' : 'HD';
        }
      } else {
        title = decryptedData.title;
        quality = decryptedData.quality || 'HD';
        videoUrl = decryptedData.best_url || (decryptedData.main && decryptedData.main.indo_hd_cdn_urls && decryptedData.main.indo_hd_cdn_urls[0]) || "";
      }

      if (!videoUrl) {
        return res.status(404).json({ success: false, message: "URL video tidak ditemukan di data." });
      }

      return res.json({
        success: true,
        title: title,
        videoUrl: videoUrl,
        rawUrl: videoUrl,
        quality: quality
      });

    } catch (error: any) {
      return res.status(500).json({ success: false, error: "Gagal memproses video. " + error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production serving
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Fallback to index.html for SPA router
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
