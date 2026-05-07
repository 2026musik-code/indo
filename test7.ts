async function check() {
  const endpoints = [
    'api/pinedrama/list',
    'api/pinedrama/home',
    'api/pinedrama/search',
    'api/kalosv/latest', // other common names
  ];
  for (const ep of endpoints) {
    const url = `https://drama.sansekai.my.id/${ep}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://drama.sansekai.my.id/" }
    });
    console.log(ep, res.status);
  }
}
check();
