import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import CryptoJS from "crypto-js";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // JSON parsing middleware
  app.use(express.json());

  // API routing
  app.get("/api/latest", async (req, res) => {
    try {
      const secretKey = "Sansekai-SekaiDrama";
      const headers = {
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36",
        "Referer": "https://drama.sansekai.my.id/",
        "Accept": "application/json"
      };

      // Make both requests
      const [pineRes, dramaRes] = await Promise.all([
        fetch('https://drama.sansekai.my.id/api/pinedrama/trending', { headers }),
        fetch('https://drama.sansekai.my.id/api/dramabox/latest', { headers })
      ]);

      let cleanData: any[] = [];

      // Process Pinedrama
      if (pineRes.ok) {
        const pineResult = await pineRes.json();
        if (pineResult.data) {
          const pineBytes = CryptoJS.AES.decrypt(pineResult.data, secretKey);
          const pineData = JSON.parse(pineBytes.toString(CryptoJS.enc.Utf8));
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
        if (dramaResult.data) {
          const dramaBytes = CryptoJS.AES.decrypt(dramaResult.data, secretKey);
          const dramaData = JSON.parse(dramaBytes.toString(CryptoJS.enc.Utf8));
          // Dramabox returns an array directly
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
    
    let url = "";
    if (provider === "dramabox") {
      url = `https://drama.sansekai.my.id/api/dramabox/detail?bookId=${id}`;
    } else {
      url = `https://drama.sansekai.my.id/api/pinedrama/detail?collection_id=${id}`;
    }

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Referer": "https://drama.sansekai.my.id/",
          "Accept": "application/json"
        }
      });
      
      if (response.status !== 200) {
        return res.status(response.status).json({ success: false, message: "Penyedia tidak mengembalikan detail." });
      }

      const result = await response.json();
      if (!result.data) {
        return res.json({ success: false, message: "Response invalid." });
      }

      const bytes = CryptoJS.AES.decrypt(result.data, secretKey);
      const rawData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

      res.json({
        success: true,
        data: {
          id: id,
          title: provider === "dramabox" ? rawData.bookName : rawData.title,
          desc: provider === "dramabox" ? rawData.introduction : rawData.description,
          total_episodes: provider === "dramabox" ? rawData.chapterCount : rawData.total_episodes,
          cover: provider === "dramabox" ? rawData.coverWap : (rawData.cover_urls?.[0] || ''),
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
    
    let url = "";
    if (provider === "dramabox") {
      url = `https://drama.sansekai.my.id/api/dramabox/episode?bookId=${id}&episodeNumber=${ep}`;
    } else {
      url = `https://drama.sansekai.my.id/api/pinedrama/episode?collection_id=${id}&episodeNumber=${ep}`;
    }

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36",
          "Referer": "https://drama.sansekai.my.id/",
          "Accept": "application/json"
        }
      });

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
      
      if (!result.data) {
        return res.status(404).json({ success: false, message: "Data tidak ditemukan." });
      }

      const bytes = CryptoJS.AES.decrypt(result.data, secretKey);
      const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
      
      let decryptedData;
      try {
        decryptedData = JSON.parse(decryptedText);
      } catch (decryptErr) {
        return res.status(500).json({ success: false, message: "Gagal mendekripsi video." });
      }

      // Dramabox data parsing may be slightly different from pinedrama
      // Usually dramabox has videoUrl directly, pinedrama has main.indo_hd_cdn_urls
      const videoUrl = decryptedData.best_url || (decryptedData.main && decryptedData.main.indo_hd_cdn_urls && decryptedData.main.indo_hd_cdn_urls[0]) || decryptedData.videoUrl || decryptedData.url;

      if (!videoUrl) {
        return res.status(404).json({ success: false, message: "URL video tidak ditemukan di data." });
      }

      return res.json({
        success: true,
        title: decryptedData.title || decryptedData.bookName || '',
        videoUrl: videoUrl,
        rawUrl: videoUrl,
        quality: decryptedData.quality || 'HD'
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
