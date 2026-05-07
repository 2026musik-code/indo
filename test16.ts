import CryptoJS from 'crypto-js';

async function check() {
  const url = `https://drama.sansekai.my.id/api/pinedrama/latest`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://drama.sansekai.my.id/" }
  });
  if(res.ok) {
    const data = await res.json();
    const bytes = CryptoJS.AES.decrypt(data.data, "Sansekai-SekaiDrama");
    const str = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    console.log("Pinedrama:", Object.keys(str));
    console.log(str.collections?.[0]);
  }
}
check();
