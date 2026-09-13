export interface CatalogFeed {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  feedUrl: string;
  siteUrl: string;
  faviconUrl: string;
  featured?: boolean;
}

export const CATALOG_CATEGORIES = [
  'All',
  'Tech & AI',
  'World News',
  'Sports & MMA',
  'Finance & Crypto',
  'Gaming & Esports',
  'Science & Space',
  'Entertainment & Movies',
  'Culture & Longform'
] as const;

export const POPULAR_FEEDS: CatalogFeed[] = [
  // ================= Tech & AI =================
  {
    id: 'verge',
    title: 'The Verge',
    description: 'Covering the intersection of technology, science, art, and culture.',
    category: 'Tech & Dev',
    tags: ['tech', 'gadgets', 'ai', 'hardware'],
    feedUrl: 'https://www.theverge.com/rss/index.xml',
    siteUrl: 'https://www.theverge.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=theverge.com&sz=128',
    featured: true
  },
  {
    id: 'arstechnica',
    title: 'Ars Technica',
    description: 'Deep-dive technology news, policy analysis, hardware, and security.',
    category: 'Tech & Dev',
    tags: ['tech', 'hardware', 'security', 'linux'],
    feedUrl: 'https://feeds.arstechnica.com/arstechnica/index',
    siteUrl: 'https://arstechnica.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=arstechnica.com&sz=128',
    featured: true
  },
  {
    id: 'techcrunch',
    title: 'TechCrunch',
    description: 'Startup and technology news, funding rounds, and venture capital.',
    category: 'Tech & Dev',
    tags: ['startups', 'tech', 'venture', 'ai'],
    feedUrl: 'https://techcrunch.com/feed/',
    siteUrl: 'https://techcrunch.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=techcrunch.com&sz=128',
    featured: true
  },
  {
    id: 'wired',
    title: 'WIRED',
    description: 'How emerging technology affects culture, the economy, and politics.',
    category: 'Tech & Dev',
    tags: ['tech', 'culture', 'cybersecurity', 'science'],
    feedUrl: 'https://www.wired.com/feed/rss',
    siteUrl: 'https://www.wired.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=wired.com&sz=128',
    featured: true
  },
  {
    id: 'hackernews',
    title: 'Hacker News (Best)',
    description: 'Top-voted engineering, developer, and startup articles from Y Combinator.',
    category: 'Tech & Dev',
    tags: ['dev', 'engineering', 'startups', 'code'],
    feedUrl: 'https://hnrss.org/best',
    siteUrl: 'https://news.ycombinator.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=news.ycombinator.com&sz=128',
    featured: true
  },
  {
    id: 'nine_to_five_mac',
    title: '9to5Mac',
    description: 'Apple breaking news, iPhone rumors, Mac reviews, and iOS updates.',
    category: 'Tech & Dev',
    tags: ['apple', 'iphone', 'mac', 'tech'],
    feedUrl: 'https://9to5mac.com/feed/',
    siteUrl: 'https://9to5mac.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=9to5mac.com&sz=128'
  },
  {
    id: 'engadget',
    title: 'Engadget',
    description: 'Consumer technology reviews, gadget launches, and gear guides.',
    category: 'Tech & Dev',
    tags: ['gadgets', 'reviews', 'gear', 'tech'],
    feedUrl: 'https://www.engadget.com/rss.xml',
    siteUrl: 'https://www.engadget.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=engadget.com&sz=128'
  },
  {
    id: 'mit_tech_review',
    title: 'MIT Technology Review',
    description: 'Authoritative journalism on breakthroughs in AI, biotech, and computing.',
    category: 'Tech & Dev',
    tags: ['ai', 'research', 'biotech', 'computing'],
    feedUrl: 'https://www.technologyreview.com/feed/',
    siteUrl: 'https://www.technologyreview.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=technologyreview.com&sz=128'
  },
  {
    id: 'bleepingcomputer',
    title: 'BleepingComputer',
    description: 'Premier cybersecurity news, ransomware alerts, and zero-day vulnerabilities.',
    category: 'Tech & Dev',
    tags: ['security', 'malware', 'cybersecurity', 'infosec'],
    feedUrl: 'https://www.bleepingcomputer.com/feed/',
    siteUrl: 'https://www.bleepingcomputer.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=bleepingcomputer.com&sz=128'
  },
  {
    id: 'krebsonsecurity',
    title: 'Krebs on Security',
    description: 'In-depth investigative security research by Brian Krebs.',
    category: 'Tech & Dev',
    tags: ['security', 'investigative', 'cybercrime'],
    feedUrl: 'https://krebsonsecurity.com/feed/',
    siteUrl: 'https://krebsonsecurity.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=krebsonsecurity.com&sz=128'
  },
  {
    id: 'tomshardware',
    title: "Tom's Hardware",
    description: 'PC building guides, GPU benchmarks, CPUs, and motherboard reviews.',
    category: 'Tech & Dev',
    tags: ['hardware', 'pc', 'gpu', 'cpu'],
    feedUrl: 'https://www.tomshardware.com/feeds/all',
    siteUrl: 'https://www.tomshardware.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=tomshardware.com&sz=128'
  },
  {
    id: 'openai_news',
    title: 'OpenAI News',
    description: 'Official announcements, model releases, and research from OpenAI.',
    category: 'Tech & Dev',
    tags: ['ai', 'chatgpt', 'openai', 'llm'],
    feedUrl: 'https://openai.com/news/rss.xml',
    siteUrl: 'https://openai.com/news',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=openai.com&sz=128'
  },
  {
    id: 'github_blog',
    title: 'GitHub Blog',
    description: 'Updates, developer tools, and engineering stories from GitHub.',
    category: 'Tech & Dev',
    tags: ['dev', 'git', 'coding', 'open-source'],
    feedUrl: 'https://github.blog/feed/',
    siteUrl: 'https://github.blog',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=github.blog&sz=128'
  },

  // ================= World News =================
  {
    id: 'bbc_world',
    title: 'BBC World',
    description: 'Global breaking news and international analysis from the BBC.',
    category: 'World News',
    tags: ['world', 'news', 'geopolitics'],
    feedUrl: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    siteUrl: 'https://www.bbc.com/news/world',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=bbc.com&sz=128',
    featured: true
  },
  {
    id: 'guardian_world',
    title: 'The Guardian (World)',
    description: 'Independent international investigative reporting and commentary.',
    category: 'World News',
    tags: ['world', 'investigative', 'europe'],
    feedUrl: 'https://www.theguardian.com/world/rss',
    siteUrl: 'https://www.theguardian.com/world',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=theguardian.com&sz=128',
    featured: true
  },
  {
    id: 'aljazeera',
    title: 'Al Jazeera English',
    description: 'International news and in-depth reporting from the Middle East and Global South.',
    category: 'World News',
    tags: ['world', 'mideast', 'asia'],
    feedUrl: 'https://www.aljazeera.com/xml/rss/all.xml',
    siteUrl: 'https://www.aljazeera.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=aljazeera.com&sz=128',
    featured: true
  },
  {
    id: 'reuters_world',
    title: 'Reuters World',
    description: 'Unbiased global breaking news coverage from trusted correspondents.',
    category: 'World News',
    tags: ['world', 'diplomacy', 'breaking'],
    feedUrl: 'https://news.google.com/rss/search?q=when:24h+allinurl:reuters.com&hl=en-US&gl=US&ceid=US:en',
    siteUrl: 'https://www.reuters.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=reuters.com&sz=128',
    featured: true
  },
  {
    id: 'ap_news',
    title: 'Associated Press (AP)',
    description: 'Factual, nonpartisan reporting from around the globe.',
    category: 'World News',
    tags: ['world', 'breaking', 'investigative'],
    feedUrl: 'https://news.google.com/rss/search?q=when:24h+allinurl:apnews.com&hl=en-US&gl=US&ceid=US:en',
    siteUrl: 'https://apnews.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=apnews.com&sz=128'
  },
  {
    id: 'npr_news',
    title: 'NPR News',
    description: 'National Public Radio breaking news, politics, and investigative reports.',
    category: 'World News',
    tags: ['politics', 'us', 'investigative'],
    feedUrl: 'https://feeds.npr.org/1001/rss.xml',
    siteUrl: 'https://www.npr.org',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=npr.org&sz=128'
  },
  {
    id: 'politico',
    title: 'POLITICO',
    description: 'Political reporting, election analysis, policy, and legislative dispatch.',
    category: 'World News',
    tags: ['politics', 'policy', 'elections', 'government'],
    feedUrl: 'https://rss.politico.com/politics-news.xml',
    siteUrl: 'https://www.politico.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=politico.com&sz=128'
  },
  {
    id: 'axios',
    title: 'Axios',
    description: 'Smart brevity news covering politics, technology, and business.',
    category: 'World News',
    tags: ['politics', 'tech', 'brevity'],
    feedUrl: 'https://api.axios.com/feed/',
    siteUrl: 'https://www.axios.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=axios.com&sz=128'
  },
  {
    id: 'propublica',
    title: 'ProPublica',
    description: 'Pulitzer Prize-winning investigative journalism in the public interest.',
    category: 'World News',
    tags: ['investigative', 'justice', 'politics'],
    feedUrl: 'https://feeds.propublica.org/propublica/main',
    siteUrl: 'https://www.propublica.org',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=propublica.org&sz=128'
  },
  {
    id: 'dw_news',
    title: 'Deutsche Welle (DW)',
    description: 'Germany and Europe international news, politics, and analysis.',
    category: 'World News',
    tags: ['europe', 'germany', 'world'],
    feedUrl: 'https://rss.dw.com/rdf/rss-en-all',
    siteUrl: 'https://www.dw.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=dw.com&sz=128'
  },

  // ================= Sports & MMA =================
  {
    id: 'mma_fighting',
    title: 'MMA Fighting',
    description: 'UFC news, fight breakdowns, interviews, and combat sports coverage.',
    category: 'Sports',
    tags: ['mma', 'ufc', 'fights', 'combat'],
    feedUrl: 'https://www.mmafighting.com/rss/index.xml',
    siteUrl: 'https://www.mmafighting.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=mmafighting.com&sz=128',
    featured: true
  },
  {
    id: 'mma_junkie',
    title: 'MMA Junkie',
    description: 'USA Today combat sports portal covering UFC, Bellator, PFL, and boxing.',
    category: 'Sports',
    tags: ['mma', 'ufc', 'boxing'],
    feedUrl: 'https://mmajunkie.usatoday.com/feed',
    siteUrl: 'https://mmajunkie.usatoday.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=mmajunkie.usatoday.com&sz=128'
  },
  {
    id: 'sherdog',
    title: 'Sherdog',
    description: 'The global authority on Mixed Martial Arts fight cards, stats, and rankings.',
    category: 'Sports',
    tags: ['mma', 'fighter-stats', 'ufc'],
    feedUrl: 'https://www.sherdog.com/rss/news.xml',
    siteUrl: 'https://www.sherdog.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=sherdog.com&sz=128'
  },
  {
    id: 'formula1',
    title: 'Formula 1',
    description: 'Official F1 race reports, qualifying results, and paddock telemetry.',
    category: 'Sports',
    tags: ['f1', 'racing', 'motorsport'],
    feedUrl: 'https://www.formula1.com/content/fom-website/en/latest/all.xml',
    siteUrl: 'https://www.formula1.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=formula1.com&sz=128',
    featured: true
  },
  {
    id: 'bbc_sport',
    title: 'BBC Sport',
    description: 'Scores, fixtures, and news across global football, tennis, and athletics.',
    category: 'Sports',
    tags: ['football', 'premier-league', 'tennis', 'sports'],
    feedUrl: 'https://feeds.bbci.co.uk/sport/rss.xml',
    siteUrl: 'https://www.bbc.com/sport',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=bbc.com&sz=128',
    featured: true
  },
  {
    id: 'espn',
    title: 'ESPN Top News',
    description: 'Live scores, transfer rumors, NBA, NFL, and global sports coverage.',
    category: 'Sports',
    tags: ['nba', 'nfl', 'soccer', 'sports'],
    feedUrl: 'https://www.espn.com/espn/rss/news',
    siteUrl: 'https://www.espn.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=espn.com&sz=128'
  },
  {
    id: 'guardian_football',
    title: 'The Guardian (Football)',
    description: 'In-depth tactical analysis, Premier League, Champions League, and commentary.',
    category: 'Sports',
    tags: ['football', 'tactics', 'premier-league'],
    feedUrl: 'https://www.theguardian.com/football/rss',
    siteUrl: 'https://www.theguardian.com/football',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=theguardian.com&sz=128'
  },
  {
    id: 'fpl_scout',
    title: 'Fantasy Football Scout',
    description: 'The definitive guide to Fantasy Premier League (FPL) captaincy and stats.',
    category: 'Sports',
    tags: ['fpl', 'fantasy', 'premier-league'],
    feedUrl: 'https://www.fantasyfootballscout.co.uk/feed/',
    siteUrl: 'https://www.fantasyfootballscout.co.uk',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=fantasyfootballscout.co.uk&sz=128'
  },

  // ================= Finance & Crypto =================
  {
    id: 'bloomberg',
    title: 'Bloomberg Markets',
    description: 'Macroeconomics, interest rates, equities, and market movement.',
    category: 'Finance & Biz',
    tags: ['finance', 'markets', 'stocks', 'economy'],
    feedUrl: 'https://news.google.com/rss/search?q=when:24h+allinurl:bloomberg.com&hl=en-US&gl=US&ceid=US:en',
    siteUrl: 'https://www.bloomberg.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=bloomberg.com&sz=128',
    featured: true
  },
  {
    id: 'wsj_markets',
    title: 'Wall Street Journal',
    description: 'Business news, corporate deals, market insights, and financial analysis.',
    category: 'Finance & Biz',
    tags: ['business', 'wall-street', 'deals'],
    feedUrl: 'https://feeds.a.dj.com/rss/RSSWorldNews.xml',
    siteUrl: 'https://www.wsj.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=wsj.com&sz=128',
    featured: true
  },
  {
    id: 'coindesk',
    title: 'CoinDesk',
    description: 'Bitcoin, Ethereum, cryptocurrency regulation, DeFi, and blockchain trends.',
    category: 'Finance & Biz',
    tags: ['crypto', 'bitcoin', 'ethereum', 'defi'],
    feedUrl: 'https://www.coindesk.com/arc/outboundfeeds/rss/',
    siteUrl: 'https://www.coindesk.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=coindesk.com&sz=128',
    featured: true
  },
  {
    id: 'cointelegraph',
    title: 'Cointelegraph',
    description: 'Fintech, digital assets, cryptocurrency markets, and altcoin intelligence.',
    category: 'Finance & Biz',
    tags: ['crypto', 'altcoins', 'blockchain'],
    feedUrl: 'https://cointelegraph.com/rss',
    siteUrl: 'https://cointelegraph.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=cointelegraph.com&sz=128'
  },
  {
    id: 'cnbc',
    title: 'CNBC Top News',
    description: 'Real-time financial market data, earnings calls, and investing insights.',
    category: 'Finance & Biz',
    tags: ['investing', 'earnings', 'stocks'],
    feedUrl: 'https://search.cnbc.com/rs/search/combinedhazard/false?partnerId=wrss01&id=100003114',
    siteUrl: 'https://www.cnbc.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=cnbc.com&sz=128'
  },
  {
    id: 'marketwatch',
    title: 'MarketWatch',
    description: 'Stock market quotes, personal finance, economic indicators, and real-time feeds.',
    category: 'Finance & Biz',
    tags: ['stocks', 'macro', 'personal-finance'],
    feedUrl: 'https://feeds.content.dowjones.io/public/rss/mw_topstories',
    siteUrl: 'https://www.marketwatch.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=marketwatch.com&sz=128'
  },

  // ================= Gaming & Esports =================
  {
    id: 'ign',
    title: 'IGN',
    description: 'Game reviews, movie trailers, walkthroughs, and entertainment news.',
    category: 'Gaming',
    tags: ['gaming', 'playstation', 'xbox', 'nintendo'],
    feedUrl: 'https://feeds.feedburner.com/ign/all',
    siteUrl: 'https://www.ign.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=ign.com&sz=128',
    featured: true
  },
  {
    id: 'pcgamer',
    title: 'PC Gamer',
    description: 'The global authority on PC gaming, hardware specs, mods, and Steam releases.',
    category: 'Gaming',
    tags: ['pc-gaming', 'steam', 'mods', 'hardware'],
    feedUrl: 'https://www.pcgamer.com/rss/',
    siteUrl: 'https://www.pcgamer.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=pcgamer.com&sz=128',
    featured: true
  },
  {
    id: 'polygon',
    title: 'Polygon',
    description: 'Thoughtful gaming criticism, culture, anime, and entertainment guides.',
    category: 'Gaming',
    tags: ['gaming', 'anime', 'reviews'],
    feedUrl: 'https://www.polygon.com/rss/index.xml',
    siteUrl: 'https://www.polygon.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=polygon.com&sz=128'
  },
  {
    id: 'gamespot',
    title: 'GameSpot',
    description: 'Gaming video reviews, cheat codes, gameplay reveals, and gaming news.',
    category: 'Gaming',
    tags: ['gaming', 'reviews', 'esports'],
    feedUrl: 'https://www.gamespot.com/feeds/mashup/',
    siteUrl: 'https://www.gamespot.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=gamespot.com&sz=128'
  },
  {
    id: 'kotaku',
    title: 'Kotaku',
    description: 'Gaming culture, cosplay, industry gossip, tips, and opinion.',
    category: 'Gaming',
    tags: ['gaming', 'culture', 'opinion'],
    feedUrl: 'https://kotaku.com/rss',
    siteUrl: 'https://kotaku.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=kotaku.com&sz=128'
  },
  {
    id: 'nintendolife',
    title: 'Nintendo Life',
    description: 'Nintendo Switch games, Mario, Zelda, Pokemon, and indie spotlights.',
    category: 'Gaming',
    tags: ['nintendo', 'switch', 'zelda', 'pokemon'],
    feedUrl: 'https://www.nintendolife.com/feeds/latest',
    siteUrl: 'https://www.nintendolife.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=nintendolife.com&sz=128'
  },

  // ================= Science & Space =================
  {
    id: 'nasa_news',
    title: 'NASA Breaking News',
    description: 'Space exploration, James Webb Telescope imagery, Artemis missions, and Mars rovers.',
    category: 'Curiosity & Longform',
    tags: ['space', 'astronomy', 'nasa', 'science'],
    feedUrl: 'https://www.nasa.gov/news-release/feed/',
    siteUrl: 'https://www.nasa.gov',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=nasa.gov&sz=128',
    featured: true
  },
  {
    id: 'space_dot_com',
    title: 'Space.com',
    description: 'Rocket launches, skywatching, solar eclipses, and astrophysics.',
    category: 'Curiosity & Longform',
    tags: ['space', 'rockets', 'spacex', 'astronomy'],
    feedUrl: 'https://www.space.com/feeds/all',
    siteUrl: 'https://www.space.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=space.com&sz=128',
    featured: true
  },
  {
    id: 'quanta',
    title: 'Quanta Magazine',
    description: 'Illuminating basic science and math research through public interest journalism.',
    category: 'Curiosity & Longform',
    tags: ['science', 'physics', 'math', 'biology'],
    feedUrl: 'https://www.quantamagazine.org/feed/',
    siteUrl: 'https://www.quantamagazine.org',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=quantamagazine.org&sz=128',
    featured: true
  },
  {
    id: 'nature_news',
    title: 'Nature',
    description: 'Leading international peer-reviewed scientific journal dispatches.',
    category: 'Curiosity & Longform',
    tags: ['science', 'biology', 'medicine', 'research'],
    feedUrl: 'https://www.nature.com/nature.rss',
    siteUrl: 'https://www.nature.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=nature.com&sz=128'
  },
  {
    id: 'scientific_american',
    title: 'Scientific American',
    description: 'Expert perspectives on the advances in science, health, and environment.',
    category: 'Curiosity & Longform',
    tags: ['science', 'health', 'climate', 'neuroscience'],
    feedUrl: 'http://rss.sciam.com/ScientificAmerican-Global',
    siteUrl: 'https://www.scientificamerican.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=scientificamerican.com&sz=128'
  },
  {
    id: 'phys_org',
    title: 'Phys.org',
    description: 'Daily spotlight on physics, nanotechnology, quantum sciences, and materials.',
    category: 'Curiosity & Longform',
    tags: ['physics', 'nanotech', 'quantum'],
    feedUrl: 'https://phys.org/rss-feed/',
    siteUrl: 'https://phys.org',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=phys.org&sz=128'
  },

  // ================= Entertainment & Movies =================
  {
    id: 'deadline',
    title: 'Deadline Hollywood',
    description: 'Breaking news on Hollywood box office, film casting, and TV productions.',
    category: 'Movies & TV',
    tags: ['film', 'industry', 'hollywood', 'streaming'],
    feedUrl: 'https://deadline.com/feed/',
    siteUrl: 'https://deadline.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=deadline.com&sz=128',
    featured: true
  },
  {
    id: 'av_club',
    title: 'The A.V. Club',
    description: 'Pop culture discussions, film retrospectives, and television episodic reviews.',
    category: 'Movies & TV',
    tags: ['entertainment', 'reviews', 'television'],
    feedUrl: 'https://www.avclub.com/feed',
    siteUrl: 'https://www.avclub.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=avclub.com&sz=128',
    featured: true
  },
  {
    id: 'collider',
    title: 'Collider',
    description: 'Exclusive interviews, movie trailers, superhero cinema, and streaming series.',
    category: 'Movies & TV',
    tags: ['trailers', 'streaming', 'cinema'],
    feedUrl: 'https://collider.com/feed/',
    siteUrl: 'https://collider.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=collider.com&sz=128'
  },
  {
    id: 'variety',
    title: 'Variety',
    description: 'The business of entertainment, awards season coverage, and film festivals.',
    category: 'Movies & TV',
    tags: ['film', 'awards', 'variety', 'hollywood'],
    feedUrl: 'https://variety.com/feed/',
    siteUrl: 'https://variety.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=variety.com&sz=128'
  },
  {
    id: 'pitchfork',
    title: 'Pitchfork',
    description: 'Album reviews, indie music, festival lineups, and underground audio culture.',
    category: 'Movies & TV',
    tags: ['music', 'indie', 'reviews', 'audio'],
    feedUrl: 'https://pitchfork.com/feed/feed-news/rss',
    siteUrl: 'https://pitchfork.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=pitchfork.com&sz=128'
  },
  {
    id: 'rollingstone',
    title: 'Rolling Stone',
    description: 'Music reviews, pop culture commentary, and political investigations.',
    category: 'Movies & TV',
    tags: ['music', 'culture', 'rock'],
    feedUrl: 'https://www.rollingstone.com/feed/',
    siteUrl: 'https://www.rollingstone.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=rollingstone.com&sz=128'
  },

  // ================= Culture & Longform =================
  {
    id: 'aeon',
    title: 'Aeon Essays',
    description: 'Profound philosophical essays, history of thought, and human questions.',
    category: 'Curiosity & Longform',
    tags: ['essays', 'philosophy', 'ideas', 'history'],
    feedUrl: 'https://aeon.co/feed.rss',
    siteUrl: 'https://aeon.co',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=aeon.co&sz=128',
    featured: true
  },
  {
    id: 'the_atlantic',
    title: 'The Atlantic',
    description: 'Longform analysis, political commentary, international affairs, and culture.',
    category: 'Curiosity & Longform',
    tags: ['longform', 'culture', 'politics', 'ideas'],
    feedUrl: 'https://www.theatlantic.com/feed/all/',
    siteUrl: 'https://www.theatlantic.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=theatlantic.com&sz=128',
    featured: true
  },
  {
    id: 'new_yorker',
    title: 'The New Yorker',
    description: 'Renowned cultural criticism, essays, investigative reporting, and humor.',
    category: 'Curiosity & Longform',
    tags: ['essays', 'criticism', 'literature'],
    feedUrl: 'https://www.newyorker.com/feed/everything',
    siteUrl: 'https://www.newyorker.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=newyorker.com&sz=128'
  },
  {
    id: 'nautilus',
    title: 'Nautilus',
    description: 'Science connected to philosophy, culture, and high-literary storytelling.',
    category: 'Curiosity & Longform',
    tags: ['science', 'philosophy', 'narrative'],
    feedUrl: 'https://nautil.us/feed/',
    siteUrl: 'https://nautil.us',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=nautil.us&sz=128'
  }
];
