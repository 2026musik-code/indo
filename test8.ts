import CryptoJS from 'crypto-js';

async function check() {
  const url = `https://drama.sansekai.my.id/api/pinedrama/search?keyword=cinta`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://drama.sansekai.my.id/" }
  });
  console.log("status:", res.status);
  
  if (res.status === 200) {
    const data = await res.json();
    const bytes = CryptoJS.AES.decrypt(data.data, "Sansekai-SekaiDrama");
    const str = bytes.toString(CryptoJS.enc.Utf8);
    const items = JSON.parse(str);
    console.log(JSON.stringify(items).substring(0, 300));
  }
}
check();
