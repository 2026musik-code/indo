async function check() {
  try {
    const res = await fetch('https://drama.sansekai.my.id/api/pinedrama/trending', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost.com'
      }
    });
    console.log(Object.fromEntries(res.headers.entries()));
  } catch (e) {
    console.error(e);
  }
}
check();