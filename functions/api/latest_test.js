const CryptoJS = require("crypto-js");

export async function onRequest(context) {
  try {
    const secretKey = "Sansekai-SekaiDrama";
    const headers = {
      "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36",
      "Referer": "https://drama.sansekai.my.id/",
      "Accept": "application/json"
    };

    const [pineRes, dramaRes] = await Promise.all([
      fetch('https://drama.sansekai.my.id/api/pinedrama/trending', { headers }),
      fetch('https://drama.sansekai.my.id/api/dramabox/latest', { headers })
    ]);

    let cleanData = [];

    // Polyfill for NodeJS crypto-js in CF workers
    // Actually, CryptoJS is purely JS, it works in CF Workers if it's imported correctly.
    // Wait, CF Pages Functions doesn't bundle node_modules by default!!
    // If they rely on unbundled functions, require("crypto-js") will FAIL with "No such module".
  } catch (err) {}
}
