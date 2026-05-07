import CryptoJS from 'crypto-js';

async function check() {
  let url = `https://drama.sansekai.my.id/api/dramabox/search?keyword=cinta`;
  let res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://drama.sansekai.my.id/" } });
  console.log("DB Search:", res.status);
  if (res.ok) {
     const data = await res.json();
     if (data.data) {
        const bytes = CryptoJS.AES.decrypt(data.data, "Sansekai-SekaiDrama");
        console.log("DB Search:", JSON.parse(bytes.toString(CryptoJS.enc.Utf8)));
     }
  }

  url = `https://drama.sansekai.my.id/api/pinedrama/search?keyword=cinta`;
  res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://drama.sansekai.my.id/" } });
  console.log("PD Search:", res.status);
  
  url = `https://drama.sansekai.my.id/api/pinedrama/category/list`;
  res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://drama.sansekai.my.id/" } });
  console.log("PD Cat:", res.status);
  if (res.ok) {
     const data = await res.json();
     if (data.data) {
        const bytes = CryptoJS.AES.decrypt(data.data, "Sansekai-SekaiDrama");
        console.log("PD Cat:", JSON.parse(bytes.toString(CryptoJS.enc.Utf8)));
     }
  }
}
check();
