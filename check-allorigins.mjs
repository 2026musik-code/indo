async function check() {
  try {
    const res = await fetch('https://api.allorigins.win/raw?url=https://drama.sansekai.my.id/api/pinedrama/trending');
    const text = await res.text();
    console.log(text.slice(0, 50));
  } catch (e) {
    console.error(e);
  }
}
check();