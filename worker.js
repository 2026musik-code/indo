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
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      if (path === '/api/latest') {
        const fetchHeaders = { "User-Agent": "Mozilla/5.0", "Referer": "https://drama.sansekai.my.id/" };
        
        const [pineRes, dramaRes] = await Promise.all([
          fetch('https://drama.sansekai.my.id/api/pinedrama/trending', { headers: fetchHeaders }),
          fetch('https://drama.sansekai.my.id/api/dramabox/latest', { headers: fetchHeaders })
        ]);

        let cleanData = [];

        if (pineRes.ok) {
          const pineResult = await pineRes.json();
          if (pineResult.data) {
            const pineBytes = CryptoJS.AES.decrypt(pineResult.data, "Sansekai-SekaiDrama");
            const pineData = JSON.parse(pineBytes.toString(CryptoJS.enc.Utf8));
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
          if (dramaResult.data) {
            const dramaBytes = CryptoJS.AES.decrypt(dramaResult.data, "Sansekai-SekaiDrama");
            const dramaData = JSON.parse(dramaBytes.toString(CryptoJS.enc.Utf8));
            const dramaFormatted = (Array.isArray(dramaData) ? dramaData : []).map((item) => ({
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
        
        const fetchHeaders = new Headers({
          "User-Agent": "Mozilla/5.0",
          "Referer": "https://drama.sansekai.my.id/",
          "Accept": "*/*"
        });
        
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
          `https://drama.sansekai.my.id/api/dramabox/detail?bookId=${id}` : 
          `https://drama.sansekai.my.id/api/pinedrama/detail?collection_id=${id}`;
          
        const response = await fetch(target, {
          headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://drama.sansekai.my.id/" }
        });
        
        if (!response.ok) return new Response(JSON.stringify({ success: false }), { status: response.status, headers: corsHeaders });
        const result = await response.json();
        const bytes = CryptoJS.AES.decrypt(result.data, "Sansekai-SekaiDrama");
        const rawData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        
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
          `https://drama.sansekai.my.id/api/pinedrama/episode?collection_id=${id}&episodeNumber=${ep}`;
          
        const response = await fetch(target, {
          headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://drama.sansekai.my.id/" }
        });
        
        if (!response.ok) return new Response(JSON.stringify({ success: false }), { status: response.status, headers: corsHeaders });
        const result = await response.json();
        const bytes = CryptoJS.AES.decrypt(result.data, "Sansekai-SekaiDrama");
        const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        
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
      
      return new Response("Not found", { status: 404 });
    } catch (e) {
      return new Response(JSON.stringify({ success: false, message: e.message }), { status: 500, headers: corsHeaders });
    }
  }
};
