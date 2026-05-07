async function check() {
  const url = `https://drama.sansekai.my.id/api/dramabox/latest`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://drama.sansekai.my.id/" }
  });
  console.log("dramabox/latest status:", res.status);
}
check();
