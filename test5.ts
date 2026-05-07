import CryptoJS from 'crypto-js';

async function check() {
  const url = `https://drama.sansekai.my.id/api/pinedrama/latest`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://drama.sansekai.my.id/" }
  });
  console.log("pinedrama/latest status:", res.status);
  
  if (res.status === 200) {
    const data = await res.json();
    const bytes = CryptoJS.AES.decrypt(data.data, "Sansekai-SekaiDrama");
    const str = bytes.toString(CryptoJS.enc.Utf8);
    const items = JSON.parse(str);
    console.log("Got items count:", items.length);
    console.log("First item:", items[0].title || items[0].bookName, items[0].collection_id || items[0].bookId);
  }
}
check();
