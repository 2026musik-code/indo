async function check() {
  try {
    const res = await fetch('https://test1.cors.workers.dev/?https://drama.sansekai.my.id/api/pinedrama/trending', {
      headers: {
        'Origin': 'https://example.com'
      }
    });
    console.log(res.status);
    const text = await res.text();
    console.log("length:", text.length);
  } catch (e) {
    console.error(e);
  }
}
check();