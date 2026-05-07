async function check() {
  const CryptoJS = require('crypto-js');
  const secretKey = "Sansekai-SekaiDrama";
  try {
    const pineRes = await fetch('https://drama.sansekai.my.id/api/pinedrama/trending', {
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36",
        "Referer": "https://drama.sansekai.my.id/",
        "Accept": "application/json"
      }
    });
    const pineResult = await pineRes.json();
    const pineBytes = CryptoJS.AES.decrypt(pineResult.data, secretKey);
    const pineData = JSON.parse(pineBytes.toString(CryptoJS.enc.Utf8));
    const firstId = pineData.collections[0].collection_id;
    console.log("Collection:", firstId);
    
    // get episode
    const epReq = await fetch(`https://drama.sansekai.my.id/api/pinedrama/episode?collection_id=${firstId}&episodeNumber=1`,{
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36",
        "Referer": "https://drama.sansekai.my.id/"
      }
    });
    const epJson = await epReq.json();
    const epBytes = CryptoJS.AES.decrypt(epJson.data, secretKey);
    const epData = JSON.parse(epBytes.toString(CryptoJS.enc.Utf8));
    const url = epData.main.indo_hd_cdn_urls[0];
    console.log("Video:", url);
    const m3u8Req = await fetch(url, { method: 'OPTIONS', headers: { 'Origin': 'https://example.com' } });
    console.log("video cors:", Object.fromEntries(m3u8Req.headers.entries()));
    const m3u8Get = await fetch(url, { headers: { 'Origin': 'https://example.com' } });
    console.log("video get cors:", Object.fromEntries(m3u8Get.headers.entries()));
  } catch (e) {
    console.error(e);
  }
}
check();
