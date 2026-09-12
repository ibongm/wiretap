export interface SmartTopicDefinition {
  name: string;
  keywords: string[];
}

export const SMART_TOPIC_DEFINITIONS: SmartTopicDefinition[] = [
  {
    name: 'AI',
    keywords: [
      'ai', 'openai', 'anthropic', 'chatgpt', 'claude', 'gemini',
      'deepseek', 'copilot', 'llm', 'machine learning', 'artificial intelligence'
    ]
  },
  {
    name: 'Space',
    keywords: [
      'space', 'nasa', 'spacex', 'satellite', 'rocket', 'orbit',
      'astronaut', 'iss', 'artemis', 'telescope', 'jaxa', 'esa', 'mars', 'moon'
    ]
  },
  {
    name: 'Sports',
    keywords: [
      'fpl', 'premier league', 'arsenal', 'chelsea', 'liverpool',
      'man united', 'man city', 'tottenham', 'gameweek', 'football',
      'soccer', 'nba', 'ufc', 'fnc', 'nokaut', 'real madrid', 'barcelona', 'dinamo'
    ]
  },
  {
    name: 'Politics',
    keywords: [
      'trump', 'biden', 'harris', 'election', 'parliament', 'senate',
      'congress', 'white house', 'government', 'zelensky', 'putin', 'ukraine'
    ]
  },
  {
    name: 'Cybersecurity',
    keywords: [
      'hack', 'hacker', 'breach', 'malware', 'ransomware', 'vulnerability',
      'cve', 'cyberattack', 'infosec', 'zero-day', 'phishing'
    ]
  },
  {
    name: 'Tech & Gadgets',
    keywords: [
      'apple', 'iphone', 'macbook', 'google', 'android', 'microsoft',
      'nvidia', 'amd', 'intel', 'semiconductor', 'earbuds', 'qualcomm', 'hardware'
    ]
  },
  {
    name: 'Economy & Biz',
    keywords: [
      'inflation', 'federal reserve', 'interest rate', 'wall street',
      'stocks', 'ipo', 'crypto', 'bitcoin', 'ethereum', 'revenue', 'market'
    ]
  },
  {
    name: 'Science',
    keywords: [
      'quantum', 'physics', 'genome', 'biology', 'astronomy', 'crispr',
      'climate', 'fusion', 'discovery'
    ]
  },
  {
    name: 'Entertainment',
    keywords: [
      'movie', 'trailer', 'box office', 'streaming', 'netflix', 'hbo',
      'disney', 'marvel', 'emmy', 'oscar', 'series'
    ]
  }
];

export const ALL_SMART_TAGS = SMART_TOPIC_DEFINITIONS.map((t) => t.name);

export function getSmartTagsForArticle(title: string, snippet?: string): string[] {
  const text = `${title} ${snippet || ''}`.toLowerCase();
  const matchedTags: string[] = [];

  for (const topic of SMART_TOPIC_DEFINITIONS) {
    const isMatch = topic.keywords.some((kw) => {
      if (kw.length <= 3) {
        const regex = new RegExp(`\\b${kw}\\b`, 'i');
        return regex.test(text);
      }
      return text.includes(kw);
    });

    if (isMatch) {
      matchedTags.push(topic.name);
    }
  }

  return matchedTags;
}
