#!/usr/bin/env node

import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import Parser from 'rss-parser';
import { feeds } from './feeds.config.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, '..', 'src', 'data', 'feeds.json');
const MAX_ENTRIES = 200;
const MAX_AGE_DAYS = 7;

const parser = new Parser({
  timeout: 15_000,
  headers: {
    'User-Agent': 'DrugPipeline/1.0 (RSS aggregator; +https://drugpipeline.github.io)',
  },
});

/**
 * Strip HTML tags and collapse whitespace.
 * @param {string} html
 * @returns {string}
 */
function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Truncate text to a max length at a word boundary.
 * @param {string} text
 * @param {number} max
 * @returns {string}
 */
function truncate(text, max = 200) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut) + '…';
}

/**
 * Fetch a single feed and return normalized entries.
 * @param {{ url: string; category: string; name: string }} feedConfig
 * @returns {Promise<import('./types').FeedEntry[]>}
 */
async function fetchFeed({ url, category, name }) {
  try {
    const feed = await parser.parseURL(url);
    return (feed.items ?? []).map((item) => ({
      title: (item.title ?? '').trim(),
      link: item.link ?? '',
      source: name,
      category,
      date: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
      summary: truncate(stripHtml(item.contentSnippet ?? item.content ?? item.summary ?? '')),
    }));
  } catch (err) {
    console.warn(`⚠ Failed to fetch "${name}" (${url}): ${err.message}`);
    return [];
  }
}

async function main() {
  console.log(`Fetching ${feeds.length} feeds…`);

  const results = await Promise.allSettled(feeds.map(fetchFeed));
  const entries = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));

  // Filter to last N days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - MAX_AGE_DAYS);

  const filtered = entries
    .filter((e) => e.title && e.link)
    .filter((e) => new Date(e.date) >= cutoff)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, MAX_ENTRIES);

  // Deduplicate by link
  const seen = new Set();
  const deduped = filtered.filter((e) => {
    if (seen.has(e.link)) return false;
    seen.add(e.link);
    return true;
  });

  // Read existing to check if anything changed
  let existing = '[]';
  try {
    existing = readFileSync(OUTPUT_PATH, 'utf-8');
  } catch {
    // File doesn't exist yet, that's fine
  }

  const output = JSON.stringify(deduped, null, 2);
  if (output === existing) {
    console.log(`No changes — ${deduped.length} entries unchanged.`);
  } else {
    writeFileSync(OUTPUT_PATH, output + '\n');
    console.log(`✓ Wrote ${deduped.length} entries to feeds.json`);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
