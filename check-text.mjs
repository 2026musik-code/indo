async function check() {
  try {
    const res = await fetch('https://api.codetabs.com/v1/proxy?quest=https://drama.sansekai.my.id/api/dramabox/episode?bookId=64860&episodeNumber=1');
    const text = await res.text();
    console.log(text.slice(0, 200));
  } catch (e) {
    console.error(e);
  }
}
check();
