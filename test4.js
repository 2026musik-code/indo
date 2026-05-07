async function check() {
  const endpoints = ['episodes', 'getEpisode', 'getChapter', 'video/list', 'episodeList', 'playlist'];
  for (const ep of endpoints) {
    const url = `https://drama.sansekai.my.id/api/dramabox/${ep}?collection_id=42000010858&episodeNumber=1&bookId=42000010858&chapterNo=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://drama.sansekai.my.id/" }
    });
    console.log(ep, res.status);
  }
}
check();
