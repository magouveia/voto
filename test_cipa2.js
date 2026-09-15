import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

async function test() {
  const url = 'https://portal.fpa.pt/associado/259061/';
  const res = await fetch(url);
  const html = await res.text();
  const $ = cheerio.load(html);
  
  console.log("Full text sample:", $('body').text().substring(0, 1000).replace(/\s+/g, ' '));
}
test();
