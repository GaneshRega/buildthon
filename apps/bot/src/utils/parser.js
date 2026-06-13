import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import axios from 'axios';
import * as cheerio from 'cheerio';

const SUPPORTED_TYPES = new Set(['pdf', 'docx', 'txt', 'plain_text']);

export async function parseFile(filePath) {
  const ext = path.extname(filePath).toLowerCase().replace('.', '');

  if (!ext) throw new Error('File has no extension — cannot determine type');
  if (!SUPPORTED_TYPES.has(ext)) throw new Error(`Unsupported file type: .${ext}`);

  if (ext === 'pdf') {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (ext === 'docx') {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  // txt and plain_text
  return fs.readFileSync(filePath, 'utf-8');
}

export async function parseURL(url) {
  let response;
  try {
    response = await axios.get(url, { timeout: 10000 });
  } catch (err) {
    throw new Error(`Failed to fetch URL: ${err.message}`);
  }

  if (response.status !== 200) {
    throw new Error(`URL returned HTTP ${response.status}`);
  }

  const contentType = response.headers['content-type'] || '';
  if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
    throw new Error(`URL content-type "${contentType}" is not supported. Only HTML and plain text pages can be imported.`);
  }

  const $ = cheerio.load(response.data);
  $('script, style, nav, footer, header').remove();
  const text = $('body').text().replace(/\s+/g, ' ').trim();

  if (!text) throw new Error('No readable text found at that URL');
  return text;
}
