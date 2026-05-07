import CryptoJS from 'crypto-js';

async function check() {
  const endpoints = ['detail', 'info', 'episodes', 'episodeList', 'book', 'chapter/list', 'chapter_list'];
  const id = '7633641297059976208';
  for (const ep of endpoints) {
    const url = `https://drama.sansekai.my.id/api/pinedrama/${ep}?collection_id=${id}&bookId=${id}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://drama.sansekai.my.id/" }
    });
    console.log(ep, res.status);
    if (res.status === 200) {
      if (res.headers.get("content-type")?.includes("application/json")) {
        const data = await res.json();
        try {
          const bytes = CryptoJS.AES.decrypt(data.data, "Sansekai-SekaiDrama");
          const str = bytes.toString(CryptoJS.enc.Utf8);
          console.log(ep, str.substring(0, 200));
        } catch (e) {}
      }
    }
  }
}
check();
