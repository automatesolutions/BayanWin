import { HOME_FAQ } from './faq';

const SITE_URL = 'https://bayanwin.net';
const ORG_ID = `${SITE_URL}/#organization`;
const SITE_ID = `${SITE_URL}/#website`;

const organization = {
  '@type': 'Organization',
  '@id': ORG_ID,
  name: 'BayanWin',
  url: SITE_URL,
  logo: { '@type': 'ImageObject', url: `${SITE_URL}/favicon.png` },
  email: 'sycat0378@gmail.com',
  description:
    'Free statistical analysis of Philippine PCSO lotto draw history (6/42, 6/45, 6/49, 6/55, 6/58) for education and entertainment.',
  areaServed: { '@type': 'Country', name: 'Philippines' },
};

const website = {
  '@type': 'WebSite',
  '@id': SITE_ID,
  name: 'BayanWin',
  url: SITE_URL,
  inLanguage: 'en-PH',
  publisher: { '@id': ORG_ID },
};

/**
 * Per-route metadata. `article` adds Article schema and the visible byline/dates
 * (see components/ArticleMeta). Dates are the last substantive content edit.
 */
const routes = {
  '/': {
    title: 'Algorithmic Lottery Prediction Philippines | BayanWin',
    description:
      'BayanWin provides PCSO historical results, lottery statistics in the Philippines, and algorithmic lottery prediction methods for educational analysis.',
    ogType: 'website',
    name: 'Home',
  },
  '/about': {
    title: 'About BayanWin: PCSO Lottery Analysis Philippines',
    description:
      'Learn how BayanWin analyzes PCSO historical data with Markov, game theory, and AI models for responsible lottery statistics in the Philippines.',
    name: 'About',
    pageType: 'AboutPage',
    article: { headline: 'About BayanWin', published: '2026-04-26', modified: '2026-05-23' },
  },
  '/methodology': {
    title: 'Lottery Methodology & Data Sources Philippines | BayanWin',
    description:
      'Understand BayanWin methodology: PCSO data sources, model assumptions, update cadence, and limits of algorithmic lottery prediction.',
    name: 'Methodology',
    article: { headline: 'BayanWin Methodology', published: '2026-04-30', modified: '2026-05-24', section: 'Methodology' },
  },
  '/responsible-play': {
    title: 'Responsible Play Guidance | BayanWin',
    description:
      'Responsible play reminders for lottery players in the Philippines, including budget limits and no-guarantee outcome guidance.',
    name: 'Responsible Play',
    article: { headline: 'Responsible Play', published: '2026-04-29', modified: '2026-05-23' },
  },
  '/blog': {
    title: 'Lottery Analysis Philippines Blog | BayanWin',
    description:
      'Read BayanWin guides on algorithmic lottery analysis in the Philippines, including Markov chain, game theory, and AI prediction methods.',
    name: 'Blog',
    pageType: 'CollectionPage',
  },
  '/blog/markov-chains-lottery': {
    title: 'Markov Chain Lottery Prediction Philippines | BayanWin',
    description:
      'Understand Markov chain lottery prediction in the Philippines and how transition-based analysis is applied to PCSO historical draw sequences.',
    name: 'Markov chains',
    article: {
      blog: true,
      headline: 'The Fascinating World of Markov Chains: From Drunkard’s Walks to Google’s Algorithms',
      published: '2026-04-29',
      modified: '2026-05-23',
      section: 'Algorithms',
    },
  },
  '/blog/nash-hotfilter': {
    title: 'Game Theory Lottery Analysis Philippines | BayanWin',
    description:
      'Explore game theory lottery analysis in the Philippines through BayanWin NashHotFilter and responsible interpretation of historical PCSO patterns.',
    name: 'NashHotFilter',
    article: {
      blog: true,
      headline: 'NashHotFilter and the spirit of A Beautiful Mind',
      published: '2026-04-26',
      modified: '2026-05-23',
      section: 'Algorithms',
    },
  },
  '/blog/deep-reinforcement-learning': {
    title: 'AI Lottery Prediction Philippines (Deep RL) | BayanWin',
    description:
      'A practical guide to AI lottery prediction in the Philippines using deep reinforcement learning concepts and historical pattern analysis.',
    name: 'Deep reinforcement learning',
    article: {
      blog: true,
      headline: 'Deep Reinforcement Learning: Teaching Machines Through Trial and Triumph',
      published: '2026-04-29',
      modified: '2026-05-23',
      section: 'AI',
    },
  },
  '/blog/pcso-658-results-analysis': {
    title: 'PCSO 6/58 Results Analysis Philippines | BayanWin',
    description:
      'Educational PCSO Ultra Lotto 6/58 results analysis in the Philippines with frequency, gap, and pattern interpretation guidance.',
    name: '6/58 results analysis',
    article: {
      blog: true,
      headline: 'PCSO 6/58 Results Analysis in the Philippines',
      published: '2026-05-09',
      modified: '2026-05-23',
      section: 'Game Analysis',
    },
  },
  '/blog/pcso-649-results-analysis': {
    title: 'PCSO 6/49 Results Analysis Philippines | BayanWin',
    description:
      'Practical PCSO Super Lotto 6/49 results analysis in the Philippines using historical statistics and transparent model limitations.',
    name: '6/49 results analysis',
    article: {
      blog: true,
      headline: 'PCSO 6/49 Results Analysis in the Philippines',
      published: '2026-05-09',
      modified: '2026-05-23',
      section: 'Game Analysis',
    },
  },
  '/blog/miro-prediction': {
    title: 'AI Lottery Prediction Workflow Philippines | BayanWin',
    description:
      'See how BayanWin combines LLM synthesis with numeric models for responsible, algorithmic lottery analysis of Philippine PCSO history.',
    name: 'Miro prediction',
    article: {
      blog: true,
      headline: 'Miro prediction: BayanWin’s Miro and the MiroFish idea',
      published: '2026-04-26',
      modified: '2026-05-23',
      section: 'AI',
    },
  },
  '/privacy': {
    title: 'Privacy Policy | BayanWin',
    description:
      'Read BayanWin privacy practices, cookie usage, and data rights information for Philippine users of our lottery analysis platform.',
    name: 'Privacy Policy',
  },
  '/terms': {
    title: 'Terms of Use | BayanWin',
    description:
      'Review BayanWin terms for using our lottery statistics and algorithmic analysis platform, including disclaimers and legal limitations.',
    name: 'Terms of Use',
  },
  '/contact': {
    title: 'Contact BayanWin',
    description:
      'Contact BayanWin for questions about PCSO analysis pages, privacy requests, and website support.',
    name: 'Contact',
    pageType: 'ContactPage',
  },
};

function breadcrumb(path) {
  const items = [{ name: 'Home', url: `${SITE_URL}/` }];
  if (path.startsWith('/blog/')) items.push({ name: 'Blog', url: `${SITE_URL}/blog` });
  if (path !== '/') items.push({ name: routes[path].name, url: `${SITE_URL}${path}` });
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.url })),
  };
}

function buildJsonLd(path, meta, canonical) {
  const graph = [organization, website];
  const page = {
    '@type': meta.pageType || 'WebPage',
    '@id': `${canonical}#webpage`,
    url: canonical,
    name: meta.title,
    description: meta.description,
    isPartOf: { '@id': SITE_ID },
    inLanguage: 'en-PH',
  };
  graph.push(page);

  if (meta.article) {
    const a = meta.article;
    graph.push({
      '@type': a.blog ? 'BlogPosting' : 'Article',
      headline: a.headline,
      description: meta.description,
      datePublished: a.published,
      dateModified: a.modified,
      author: { '@id': ORG_ID },
      publisher: { '@id': ORG_ID },
      mainEntityOfPage: { '@id': page['@id'] },
      image: `${SITE_URL}/favicon.png`,
      inLanguage: 'en-PH',
      ...(a.section ? { articleSection: a.section } : {}),
    });
  }

  if (path === '/') {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: HOME_FAQ.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    });
  } else {
    graph.push(breadcrumb(path));
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}

export function getSeoForPath(rawPath) {
  // "/blog/" and "/blog" are the same page.
  const pathname = rawPath.length > 1 ? rawPath.replace(/\/+$/, '') : rawPath;
  const meta = routes[pathname];
  if (!meta) {
    // Unknown paths render the 404 page: keep it out of the index.
    return { ...routes['/'], canonical: `${SITE_URL}/`, robots: 'noindex, follow' };
  }
  const canonical = pathname === '/' ? `${SITE_URL}/` : `${SITE_URL}${pathname}`;
  return {
    title: meta.title,
    description: meta.description,
    canonical,
    ogType: meta.article ? 'article' : 'website',
    article: meta.article || null,
    jsonLd: buildJsonLd(pathname, meta, canonical),
  };
}
