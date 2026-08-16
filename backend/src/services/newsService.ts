import { config } from "../config.js";

export type NewsItem = {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  sentiment: "positive" | "negative" | "neutral";
  impactScore: number;
  entities: string[];
  summary: string;
};

async function generateWithGemini(prompt: string): Promise<string> {
  const key = config.geminiApiKey;
  if (!key) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });
  if (!response.ok) {
    throw new Error(`Gemini API failed with status ${response.status}`);
  }
  const payload = await response.json() as any;
  return payload.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

export async function fetchMarketNews(symbol?: string): Promise<NewsItem[]> {
  try {
    const url = symbol 
      ? `https://feeds.finance.yahoo.com/rss.2.0/headline?s=${encodeURIComponent(symbol)}`
      : `https://finance.yahoo.com/news/rss`;
      
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch RSS");
    const xml = await res.text();
    
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const items: NewsItem[] = [];
    let match;
    
    while ((match = itemRegex.exec(xml)) !== null && items.length < 8) {
      const content = match[1];
      const title = content.match(/<title>([\s\S]*?)<\/title>/)?.[1] || "";
      const link = content.match(/<link>([\s\S]*?)<\/link>/)?.[1] || "";
      const pubDate = content.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || "";
      const description = content.match(/<description>([\s\S]*?)<\/description>/)?.[1] || "";
      
      items.push({
        title: title.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim(),
        link: link.trim(),
        pubDate: pubDate.trim(),
        description: description.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]*>?/gm, "").trim(),
        sentiment: "neutral",
        impactScore: 50,
        entities: symbol ? [symbol] : ["MARKET"],
        summary: ""
      });
    }

    if (items.length > 0 && config.geminiApiKey) {
      try {
        const headlines = items.map((it, idx) => `${idx}: ${it.title} - ${it.description}`).join("\n");
        const prompt = `
        Analyze the sentiment and market impact for the following financial headlines. 
        For each headline index, return a JSON block specifying:
        - sentiment: "positive" | "negative" | "neutral"
        - impactScore: number (0 to 100, where 100 is highly positive/disruptive impact, 0 is highly negative, 50 is neutral/no impact)
        - entities: string[] (e.g. tickers like ["AAPL", "BTC"])
        - summary: string (a one-sentence punchy summary of the news)
        
        Headlines:
        ${headlines}
        
        Return ONLY valid JSON array matching the index order, formatted exactly as:
        [
          {"sentiment": "positive", "impactScore": 75, "entities": ["AAPL"], "summary": "Apple announces new AI initiative"},
          ...
        ]
        Do not output markdown wrap or code blocks.
        `;
        
        const responseText = await generateWithGemini(prompt);
        const jsonText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        const analysis = JSON.parse(jsonText) as any[];
        
        for (let i = 0; i < items.length; i++) {
          if (analysis[i]) {
            items[i].sentiment = analysis[i].sentiment || "neutral";
            items[i].impactScore = Number(analysis[i].impactScore ?? 50);
            items[i].entities = analysis[i].entities || ["MARKET"];
            items[i].summary = analysis[i].summary || items[i].description.substring(0, 100);
          }
        }
      } catch (err) {
        console.error("Gemini news analysis failed:", err);
        items.forEach(it => {
          const lower = it.title.toLowerCase() + " " + it.description.toLowerCase();
          if (lower.includes("grow") || lower.includes("rise") || lower.includes("profit") || lower.includes("bull")) {
            it.sentiment = "positive";
            it.impactScore = 70;
          } else if (lower.includes("drop") || lower.includes("fall") || lower.includes("loss") || lower.includes("bear") || lower.includes("slump")) {
            it.sentiment = "negative";
            it.impactScore = 30;
          }
          it.summary = it.description.substring(0, 120) + "...";
        });
      }
    } else {
      items.forEach(it => {
        const lower = it.title.toLowerCase() + " " + it.description.toLowerCase();
        if (lower.includes("grow") || lower.includes("rise") || lower.includes("profit") || lower.includes("bull")) {
          it.sentiment = "positive";
          it.impactScore = 70;
        } else if (lower.includes("drop") || lower.includes("fall") || lower.includes("loss") || lower.includes("bear") || lower.includes("slump")) {
          it.sentiment = "negative";
          it.impactScore = 30;
        }
        it.summary = it.description.substring(0, 120) + "...";
      });
    }

    return items;
  } catch (err) {
    console.error("News aggregation failed:", err);
    return [];
  }
}
