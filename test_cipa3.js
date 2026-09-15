import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

async function test() {
  const url = 'https://portal.fpa.pt/associado/259061/';
  const res = await fetch(url);
  const html = await res.text();
  const $ = cheerio.load(html);
  
  // Find where the name is, probably in a specific header or container
  console.log($('.container h1').parent().html());
}
test();
