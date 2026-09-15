import * as cheerio from 'cheerio';
import fetch from 'node-fetch';

async function test() {
  const url = 'https://portal.fpa.pt/clube/id/2588/';
  const res = await fetch(url);
  const html = await res.text();
  
  const regex = /var\s+TABLE_CONTENT_2\s*=\s*(\{.*?\});/s;
  const match = html.match(regex);
  if (match) {
    const data = JSON.parse(match[1]);
    console.log(`Found ${data.rows.length} rows.`);
    data.rows.forEach(r => {
        console.log(`- ${r.CIP_NUMERO}: ${r.CIP_NOME} (Atleta: ${r.ATLETA})`);
    });
  } else {
    console.log("Not found.");
  }
}
test();
