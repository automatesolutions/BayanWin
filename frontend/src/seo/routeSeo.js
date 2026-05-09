const SITE_URL = 'https://bayanwin.net';

const defaultSeo = {
  title: 'Algorithmic Lottery Prediction Philippines | BayanWin',
  description:
    'BayanWin provides PCSO historical results, lottery statistics in the Philippines, and algorithmic lottery prediction methods for educational analysis.',
  canonical: `${SITE_URL}/`,
  ogType: 'website',
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'BayanWin',
    url: SITE_URL,
  },
};

const routeSeo = {
  '/': defaultSeo,
  '/about': {
    title: 'PCSO Lottery Analysis Methodology Philippines | BayanWin',
    description:
      'Learn how BayanWin analyzes PCSO historical data with Markov, game theory, and AI models for responsible lottery statistics in the Philippines.',
    canonical: `${SITE_URL}/about`,
    ogType: 'article',
  },
  '/blog': {
    title: 'Lottery Analysis Philippines Blog | BayanWin',
    description:
      'Read BayanWin guides on algorithmic lottery analysis in the Philippines, including Markov chain, game theory, and AI prediction methods.',
    canonical: `${SITE_URL}/blog`,
    ogType: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'BayanWin Blog',
      url: `${SITE_URL}/blog`,
    },
  },
  '/blog/markov-chains-lottery': {
    title: 'Markov Chain Lottery Prediction Philippines | BayanWin',
    description:
      'Understand Markov chain lottery prediction in the Philippines and how transition-based analysis is applied to PCSO historical draw sequences.',
    canonical: `${SITE_URL}/blog/markov-chains-lottery`,
    ogType: 'article',
  },
  '/blog/nash-hotfilter': {
    title: 'Game Theory Lottery Analysis Philippines | BayanWin',
    description:
      'Explore game theory lottery analysis in the Philippines through BayanWin NashHotFilter and responsible interpretation of historical PCSO patterns.',
    canonical: `${SITE_URL}/blog/nash-hotfilter`,
    ogType: 'article',
  },
  '/blog/deep-reinforcement-learning': {
    title: 'AI Lottery Prediction Philippines (Deep RL) | BayanWin',
    description:
      'A practical guide to AI lottery prediction in the Philippines using deep reinforcement learning concepts and historical pattern analysis.',
    canonical: `${SITE_URL}/blog/deep-reinforcement-learning`,
    ogType: 'article',
  },
  '/blog/pcso-658-results-analysis': {
    title: '6/58 Results Analysis Philippines | BayanWin',
    description:
      'Educational PCSO 6/58 results analysis in the Philippines with frequency, gap, and pattern interpretation guidance.',
    canonical: `${SITE_URL}/blog/pcso-658-results-analysis`,
    ogType: 'article',
  },
  '/blog/pcso-649-results-analysis': {
    title: '6/49 Results Analysis Philippines | BayanWin',
    description:
      'Practical PCSO 6/49 results analysis in the Philippines using historical statistics and transparent model limitations.',
    canonical: `${SITE_URL}/blog/pcso-649-results-analysis`,
    ogType: 'article',
  },
  '/blog/miro-prediction': {
    title: 'AI Lottery Prediction Workflow Philippines | BayanWin',
    description:
      'See how BayanWin combines LLM synthesis with numeric models for responsible, algorithmic lottery analysis of Philippine PCSO history.',
    canonical: `${SITE_URL}/blog/miro-prediction`,
    ogType: 'article',
  },
  '/privacy': {
    title: 'Privacy Policy | BayanWin',
    description:
      'Read BayanWin privacy practices, cookie usage, and data rights information for Philippine users of our lottery analysis platform.',
    canonical: `${SITE_URL}/privacy`,
  },
  '/terms': {
    title: 'Terms of Use | BayanWin',
    description:
      'Review BayanWin terms for using our lottery statistics and algorithmic analysis platform, including disclaimers and legal limitations.',
    canonical: `${SITE_URL}/terms`,
  },
  '/responsible-play': {
    title: 'Responsible Play Guidance | BayanWin',
    description:
      'Responsible play reminders for lottery users in the Philippines, including budget limits and no-guarantee outcome guidance.',
    canonical: `${SITE_URL}/responsible-play`,
  },
  '/methodology': {
    title: 'Lottery Methodology & Data Sources Philippines | BayanWin',
    description:
      'Understand BayanWin methodology: PCSO data sources, model assumptions, update cadence, and limits of algorithmic lottery prediction.',
    canonical: `${SITE_URL}/methodology`,
    ogType: 'article',
  },
  '/contact': {
    title: 'Contact BayanWin',
    description:
      'Contact BayanWin for questions about PCSO analysis pages, privacy requests, and website support.',
    canonical: `${SITE_URL}/contact`,
  },
};

export function getSeoForPath(pathname) {
  return routeSeo[pathname] || defaultSeo;
}

