import CryptoJS from 'crypto-js';

async function check() {
  const id = '7633641297059976208';
  const url = `https://drama.sansekai.my.id/api/pinedrama/detail?collection_id=${id}&bookId=${id}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://drama.sansekai.my.id/" }
  });
  const data = await res.json();
  const bytes = CryptoJS.AES.decrypt(data.data, "Sansekai-SekaiDrama");
  const str = bytes.toString(CryptoJS.enc.Utf8);
  console.log(str.substring(0, 1000));
}
check();
