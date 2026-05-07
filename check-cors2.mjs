async function check() {
  try {
    const res = await fetch('https://drama.sansekai.my.id/api/pinedrama/trending', {
      headers: {
        'Origin': 'https://example.com'
      }
    });
    console.log(Object.fromEntries(res.headers.entries()));
    const text = await res.text();
    console.log(text.slice(0, 100));
  } catch (e) {
    console.error(e);
  }
}
check();