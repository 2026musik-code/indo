async function check() {
  const endpoints = ['episode', 'play', 'detail', 'video', 'watch', 'chapter', 'chapters', 'info', 'book', 'latest', 'dramabox'];
  for (const ep of endpoints) {
    const url = `https://drama.sansekai.my.id/api/dramabox/${ep}?collection_id=42000010858&episodeNumber=1&bookId=42000010858&chapterNo=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://drama.sansekai.my.id/" }
    });
    const text = await res.text();
    console.log(ep, res.status, text.startsWith('<') ? "HTML" : "JSON");
  }
}
check();
