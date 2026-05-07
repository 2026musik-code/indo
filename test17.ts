import CryptoJS from 'crypto-js';

async function check() {
  const url = `https://drama.sansekai.my.id/api/kalos/latest`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://drama.sansekai.my.id/" }
  });
  console.log(res.status);
  
  const urlTrending = `https://drama.sansekai.my.id/api/dramabox/trending`;
  const resT = await fetch(urlTrending, {
    headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://drama.sansekai.my.id/" }
  });
  console.log(resT.status);
}
check();
