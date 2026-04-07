
async function testYahoo() {
  const symbol = 'RELIANCE.NS';
  const range = '1mo';
  const interval = '1d';
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${encodeURIComponent(
    range
  )}&interval=${encodeURIComponent(interval)}&includePrePost=false`;

  console.log(`[TEST 1] Testing WITHOUT headers: ${url}`);
  try {
    const res = await fetch(url);
    console.log(`[TEST 1] Status: ${res.status}`);
    if (res.ok) {
        console.log(`[TEST 1] Success!`);
    } else {
        console.log(`[TEST 1] Failed with status ${res.status}`);
    }
  } catch (e) {
    console.error(`[TEST 1] Error: ${e.message}`);
  }

  console.log(`\n[TEST 2] Testing WITH headers: ${url}`);
  try {
    const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; ScalpVision/1.0; +https://scalpvision.io)" }
    });
    console.log(`[TEST 2] Status: ${res.status}`);
    if (res.ok) {
        console.log(`[TEST 2] Success!`);
    } else {
        console.log(`[TEST 2] Failed with status ${res.status}`);
    }
  } catch (e) {
    console.error(`[TEST 2] Error: ${e.message}`);
  }
}

testYahoo();
