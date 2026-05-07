import CryptoJS from 'crypto-js';

const secretKey = "Sansekai-SekaiDrama";

async function test() {
  const urls = [
      `https://drama.sansekai.my.id/api/pinedrama/home`,
      `https://drama.sansekai.my.id/api/pinedrama/list`,
      `https://drama.sansekai.my.id/api/pinedrama/latest`,
      `https://drama.sansekai.my.id/api/pinedrama/popular`,
      `https://drama.sansekai.my.id/api/pinedrama/trending`,
      `https://drama.sansekai.my.id/api/dramabox/home`,
      `https://drama.sansekai.my.id/api/dramabox/list`,
      `https://drama.sansekai.my.id/api/dramabox/details`,
      `https://drama.sansekai.my.id/api/dramabox/videos`,
      `https://drama.sansekai.my.id/api/dramabox/play_url`
  ];
  for (const u of urls) {
      const resp = await fetch(u, {
        headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36",
        "Referer": "https://drama.sansekai.my.id/",
        "Accept": "application/json"
        }
      });
      console.log("Route:", u.split('/api/')[1], "->", resp.status, resp.headers.get('content-type'));
      if (resp.status === 200) {
          if (resp.headers.get('content-type')?.includes('application/json')) {
              const txt = await resp.json();
              if (txt.data) {
                  try {
                      const bytes1 = CryptoJS.AES.decrypt(txt.data, secretKey);
                      const items = JSON.parse(bytes1.toString(CryptoJS.enc.Utf8));
                      console.log("Decrypted inside:", Array.isArray(items) ? `Array[${items.length}]` : items);
                  } catch(e) {}
              }
          }
      }
  }
}

test();