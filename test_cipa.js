import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

async function test() {
  const url = 'https://portal.fpa.pt/associado/259061/';
  const res = await fetch(url);
  const html = await res.text();
  const $ = cheerio.load(html);
  
  console.log("Title:", $('title').text());
  console.log("H1:", $('h1').text().trim());
  
  // Look for name or numbers
  const name = $('h1, .nome, h3').first().text().trim();
  console.log("Name found:", name);
}
test();
