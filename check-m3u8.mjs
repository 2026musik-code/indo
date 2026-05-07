async function check() {
  try {
    const res = await fetch('https://api.codetabs.com/v1/proxy?quest=https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
    const text = await res.text();
    console.log(text.slice(0, 50));
  } catch (e) {
    console.error(e);
  }
}
check();
