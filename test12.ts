import CryptoJS from 'crypto-js';

async function check() {
  const url = `https://drama.sansekai.my.id/api/pinedrama/trending`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://drama.sansekai.my.id/" }
  });
  const result = await res.json();
  const bytes = CryptoJS.AES.decrypt(result.data, "Sansekai-SekaiDrama");
  const rawData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  
  const item = rawData.collections[0];
  const id = item.collection_id;
  
  const url2 = `https://drama.sansekai.my.id/api/pinedrama/episode?collection_id=${id}&episodeNumber=1`;
  const res2 = await fetch(url2, {
    headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://drama.sansekai.my.id/" }
  });
  
  const result2 = await res2.json();
  const bytes2 = CryptoJS.AES.decrypt(result2.data, "Sansekai-SekaiDrama");
  const decryptedData = JSON.parse(bytes2.toString(CryptoJS.enc.Utf8));
  
  console.log(JSON.stringify(decryptedData, null, 2));
}
check();
