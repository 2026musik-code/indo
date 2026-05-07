async function testAPI() {
  const r = await fetch("http://localhost:3000/api/latest");
  const data = await r.json();
  console.log(data?.data[0]?.id ? "ID OK: " + data.data[0].id : "Failed");

  const pId = data?.data[0]?.id;
  if (pId) {
    const epReq = await fetch(`http://localhost:3000/api/play/pinedrama/${pId}/1`);
    const epData = await epReq.json();
    console.log("Episode response:", epData);
  }
}
testAPI();
