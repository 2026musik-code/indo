async function check() {
  const endpoints = [
    'api/dramabox/detail?bookId=42000010858',
    'api/dramabox/play?bookId=42000010858&chapterNo=1',
    'api/episode?collection_id=42000010858',
    'api/drama/episode?id=42000010858'
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
