async function check() {
  try {
    const res = await fetch('https://corsproxy.io/?https://drama.sansekai.my.id/api/pinedrama/trending', {
      headers: {
        'Origin': 'https://example.com'
      }
    });
    console.log(Object.fromEntries(res.headers.entries()));
    const text = await res.text();
    console.log("length:", text.length);
  } catch (e) {
    console.error(e);
  }
}
check();