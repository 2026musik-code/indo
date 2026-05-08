/**
 * Cloudflare Worker for SekaiDrama
 * 
 * Instructions to deploy on Cloudflare Workers:
 * 1. Build your Vite app (`npm run build`).
 * 2. Upload the `dist/` folder to Cloudflare Pages.
 * 3. Add this code to a Cloudflare Worker (or use Pages Functions `functions/api/[[path]].js`).
 * 4. Route `/api/*` to this Worker.
 */

import CryptoJS from 'crypto-js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
      'Access-Control-Max-Age': '86400',
    };
    
    function bikinIPPalsu() {
      const acak = () => Math.floor(Math.random() * 255) + 1;
      return `${acak()}.${acak()}.${acak()}.${acak()}`;
    }
    
    const ipPalsu = bikinIPPalsu();
    const fakeHeaders = {
      "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36",
      "X-Forwarded-For": ipPalsu,
      "X-Real-IP": ipPalsu,
      "Client-IP": ipPalsu,
      "Referer": "https://drama.sansekai.my.id/",
      "Accept": "application/json"
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      if (path === '/api/latest') {
        const [pineRes, dramaRes] = await Promise.all([
          fetch('https://api.sansekai.my.id/api/pinedrama/trending', { headers: fakeHeaders }),
          fetch('https://api.sansekai.my.id/api/dramabox/foryou?page=1', { headers: fakeHeaders })
        ]);

        let cleanData = [];

        if (pineRes.ok) {
          const pineResult = await pineRes.json();
          let pineData = null;
          
          if (pineResult.data && typeof pineResult.data === 'string') {
            const pineBytes = CryptoJS.AES.decrypt(pineResult.data, "Sansekai-SekaiDrama");
            pineData = JSON.parse(pineBytes.toString(CryptoJS.enc.Utf8));
          } else {
            pineData = pineResult;
          }

          if (pineData) {
            const pineFormatted = (pineData.collections || []).map((item) => ({
              id: item.collection_id,
              title: item.title,
              cover: item.cover_urls?.[0] || item.cover || '',
              episodes: item.total_episodes,
              desc: item.description || item.categories,
              views: item.views,
              tags: item.categories ? item.categories.split(',').map((t) => t.trim()) : [],
              provider: 'pinedrama'
            }));
            cleanData = [...cleanData, ...pineFormatted];
          }
        }

        if (dramaRes.ok) {
          const dramaResult = await dramaRes.json();
          let dramaData = [];
          
          if (Array.isArray(dramaResult)) {
            dramaData = dramaResult;
          } else if (dramaResult.data && typeof dramaResult.data === 'string') {
            const dramaBytes = CryptoJS.AES.decrypt(dramaResult.data, "Sansekai-SekaiDrama");
            dramaData = JSON.parse(dramaBytes.toString(CryptoJS.enc.Utf8));
          } else if (dramaResult.data) {
            dramaData = dramaResult.data;
          }

          if (dramaData && dramaData.length > 0) {
            const dramaFormatted = dramaData.map((item) => ({
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
        }
        
        return new Response(JSON.stringify({ 
          success: true, 
          data: cleanData.sort(() => Math.random() - 0.5) 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      if (path.startsWith('/api/proxy-video')) {
        const targetUrl = url.searchParams.get('url');
        if (!targetUrl) return new Response('URL is required', { status: 400, headers: corsHeaders });
        
        const fetchHeaders = new Headers(fakeHeaders);
        
        const range = request.headers.get('Range');
        if (range) fetchHeaders.set('Range', range);
        
        const videoResponse = await fetch(targetUrl, { headers: fetchHeaders });
        
        // Return the stream back
        const resHeaders = new Headers(videoResponse.headers);
        resHeaders.set('Access-Control-Allow-Origin', '*');
        
        return new Response(videoResponse.body, {
          status: videoResponse.status,
          headers: resHeaders
        });
      }
      
      if (path.startsWith('/api/details/')) {
        const parts = path.split('/');
        const provider = parts[3];
        const id = parts[4];
        
        const target = provider === "dramabox" ? 
          `https://api.sansekai.my.id/api/dramabox/detail?bookId=${id}` : 
          `https://api.sansekai.my.id/api/pinedrama/detail?collection_id=${id}`;
          
        const response = await fetch(target, {
          headers: fakeHeaders
        });
        
        if (!response.ok) return new Response(JSON.stringify({ success: false }), { status: response.status, headers: corsHeaders });
        const result = await response.json();
        let rawData;
        if (result.data && typeof result.data === 'string') {
          const bytes = CryptoJS.AES.decrypt(result.data, "Sansekai-SekaiDrama");
          rawData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        } else {
          rawData = result;
        }
        
        return new Response(JSON.stringify({
          success: true,
          data: {
            id,
            title: provider === "dramabox" ? rawData.bookName : rawData.title,
            desc: provider === "dramabox" ? rawData.introduction : rawData.description,
            total_episodes: provider === "dramabox" ? rawData.chapterCount : rawData.total_episodes,
            cover: provider === "dramabox" ? rawData.coverWap : (rawData.cover_urls?.[0] || '')
          }
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      
      if (path.startsWith('/api/play/')) {
        const parts = path.split('/');
        const provider = parts[3];
        const id = parts[4];
        const ep = parts[5];
        
        const target = provider === 'dramabox' ? 
          `https://drama.sansekai.my.id/api/dramabox/episode?bookId=${id}&episodeNumber=${ep}` : 
          `https://api.sansekai.my.id/api/pinedrama/episode?collection_id=${id}&episodeNumber=${ep}`;
          
        const response = await fetch(target, {
          headers: fakeHeaders
        });
        
        if (!response.ok) return new Response(JSON.stringify({ success: false }), { status: response.status, headers: corsHeaders });
        const result = await response.json();
        let decryptedData;
        if (result.data && typeof result.data === 'string') {
          const bytes = CryptoJS.AES.decrypt(result.data, "Sansekai-SekaiDrama");
          decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        } else {
          decryptedData = result;
        }
        
        let videoUrl = "";
        if (provider === 'dramabox') {
          videoUrl = decryptedData.videoUrl || decryptedData.url;
        } else {
          videoUrl = decryptedData.best_url || (decryptedData.main && decryptedData.main.indo_hd_cdn_urls && decryptedData.main.indo_hd_cdn_urls[0]) || "";
        }
        
        return new Response(JSON.stringify({
          success: true,
          title: decryptedData.title,
          videoUrl,
          rawUrl: videoUrl,
          quality: decryptedData.quality
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      
      // Fallback API response
      if (path.startsWith('/api')) {
        return new Response("Not found", { status: 404 });
      }

      // If it's not an API request, serve the static assets
      let response = await env.ASSETS.fetch(request);
      if (response.status === 404 || response.status === 403) {
        const indexRequest = new Request(new URL('/', request.url), request);
        response = await env.ASSETS.fetch(indexRequest);
      }
      return response;

    } catch (e) {
      return new Response(JSON.stringify({ success: false, message: e.message }), { status: 500, headers: corsHeaders });
    }
  }
};
