/** @type {{ url: string; category: string; name: string }[]} */
export const feeds = [
  { url: 'https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/press-releases/rss.xml', category: 'regulatory', name: 'FDA Press Releases' },
  { url: 'https://pubmed.ncbi.nlm.nih.gov/rss/search/1qxVax-m4dLJkvDBFzs_5H-BEKEoN4m5POIJ5XIGXG-eDGRSmR/?limit=20&utm_campaign=pubmed-2&fc=20220923080436', category: 'research', name: 'PubMed Trending' },
  { url: 'http://feeds.nature.com/nrd/rss/current', category: 'research', name: 'Nature Reviews Drug Discovery' },
  { url: 'https://www.statnews.com/feed/', category: 'industry', name: 'STAT News' },
  { url: 'https://feeds.feedburner.com/FiercePharma', category: 'industry', name: 'Fierce Pharma' },
  { url: 'https://www.biopharmadive.com/feeds/news/', category: 'industry', name: 'BioPharma Dive' },
];
