async function check() {
  const url = `https://drama.sansekai.my.id/api/pinedrama/trending`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://drama.sansekai.my.id/" }
  });
  console.log("pinedrama/trending status:", res.status);
}
check();
