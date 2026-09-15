import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

async function test() {
  const url = 'https://portal.fpa.pt/associado/259061/';
  const res = await fetch(url);
  const html = await res.text();
  const match = html.match(/<title>(.*?)<\/title>/);
  if (match) {
    const title = match[1];
    // Example: "Giovana Clara Caraciolo Paiva Tavares - Federação de Andebol de Portugal"
    const name = title.split('-')[0].trim();
    console.log(name);
  }
}
test();
