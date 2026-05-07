async function check() {
  try {
    const res = await fetch('https://api.codetabs.com/v1/proxy?quest=https://drama.sansekai.my.id/api/pinedrama/trending');
    const text = await res.text();
    console.log(text.slice(0, 100));
  } catch (e) {
    console.error(e);
  }
}
check();