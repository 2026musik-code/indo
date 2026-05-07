async function check() {
  try {
    const res = await fetch('https://corsproxy.io/?https://drama.sansekai.my.id/api/pinedrama/trending', {
      headers: {
        'Origin': 'https://example.com'
      }
    });
    const text = await res.text();
    console.log(text);
  } catch (e) {
    console.error(e);
  }
}
check();