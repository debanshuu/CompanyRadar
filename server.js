const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

//Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

//FETCH NEWS
async function fetchNews(company) {
  try {
    const response = await axios.get(
      'https://newsapi.org/v2/everything',
      {
        params: {
          q: company,
          sortBy: 'publishedAt',
          pageSize: 5,
          apiKey: process.env.NEWS_API_KEY,
        },
      }
    );

    return response.data.articles
      .map(
        article =>
          `${article.title}: ${article.description || 'No description'}`
      )
      .join('\n');
  } catch (error) {
    console.error('News API Error:', error.message);
    return 'No news data available';
  }
}


//FETCH STOCK
async function fetchStockData(ticker) {
  if (!ticker || ticker === 'N/A') return null;

  try {
    const response = await axios.get('https://api.twelvedata.com/time_series', {
      params: {
        symbol: ticker,
        interval: '1day',
        outputsize: 10,
        apikey: process.env.TWELVE_DATA_KEY
      }
    });
    const data = response.data;
    if (data.status === 'error' || !data.values) {
      console.log('Twelve Data response:', JSON.stringify(data));
      return null;
    }
    const values = [...data.values].reverse();
    const dates = values.map(v => v.datetime);
    const prices = values.map(v => parseFloat(v.close));
    return { dates, prices };
  } catch (error) {
    console.error('Stock API Error:', error.message);
    return null;
  }
}


//FETCH SEARCH RESULTS
async function fetchSearch(company) {
  try {
    const response = await axios.get(
      'https://serpapi.com/search',
      {
        params: {
          q: `${company} company overview`,
          api_key: process.env.SERP_API_KEY,
          num: 5,
        },
      }
    );

    const results = response.data.organic_results || [];

    return results
      .map(result => `${result.title}: ${result.snippet}`)
      .join('\n');
  } catch (error) {
    console.error('SerpAPI Error:', error.message);
    return 'No search data available';
  }
}

//GEMINI ANALYSIS
async function analyzeWithGemini(company, news, searchData) {
  const prompt = `
  You are a professional business intelligence analyst.

Analyze the company "${company}" using the data below AND your own training knowledge.
If the provided data lacks specific details, use your general knowledge about the company.
Do NOT return "Not specified" — always provide real, well-known answers.

NEWS:
${news}

WEB DATA:
${searchData}

Return ONLY valid JSON.

{
  "ticker": "Official stock ticker symbol (e.g., AAPL, TSLA). If private or non-profit, return 'N/A'",
  "summary": "2-3 sentence company overview",
  "swot": {
    "strengths": ["point 1", "point 2", "point 3"],
    "weaknesses": ["point 1", "point 2", "point 3"],
    "opportunities": ["point 1", "point 2", "point 3"],
    "threats": ["point 1", "point 2", "point 3"]
  },
  "competitors": [
  "Top direct competitor 1 (use your knowledge if not in data)",
  "Top direct competitor 2",
  "Top direct competitor 3"
  ],
  "growth_opportunities": [
    "opportunity 1",
    "opportunity 2",
    "opportunity 3"
  ],
  "risk_assessment": "2-3 sentence risk summary"
}
`;

  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

  for (const model of models) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`Trying model: ${model}, attempt ${attempt}`);

        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: { responseMimeType: 'application/json' },
        });

        let text = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(text);

      } catch (error) {
        const is503 = error.message?.includes('503') || error.message?.includes('UNAVAILABLE');

        if (is503 && attempt < 3) {
          const wait = 1000 * 2 ** (attempt - 1); // 1s, 2s
          console.warn(`503 on ${model}, retrying in ${wait}ms...`);
          await new Promise(res => setTimeout(res, wait));
        } else if (is503) {
          console.warn(`${model} exhausted, trying next model...`);
          break; //try next model
        } else {
          throw error; //non-503 error, fail fast
        }
      }
    }
  }

  throw new Error('All Gemini models are currently unavailable. Please try again later.');
}

//TEST GEMINI
app.get('/test-gemini', async (req, res) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Say hello',
    });

    res.json({
      success: true,
      response: response.text,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

//ANALYZE ROUTE
app.post('/analyze', async (req, res) => {
  const { company } = req.body;

  if (!company) {
    return res.status(400).json({
      error: 'Company name is required',
    });
  }

  try {
    console.log(`Analyzing ${company}...`);

    const [news, searchData] = await Promise.all([
      fetchNews(company),
      fetchSearch(company),
    ]);

    console.log('Data fetched.');
    console.log('Sending to Gemini...');

    
    const analysis = await analyzeWithGemini(
      company,
      news,
      searchData
    );

    console.log('Analysis complete.');

    let stockData = null;
    if (analysis.ticker && analysis.ticker !== 'N/A') {
      stockData = await fetchStockData(analysis.ticker);
    }

    console.log('Sending complete data payload to frontend.');

    res.json({
      success: true,
      company,
      analysis,
      stockData
    });
  } catch (error) {
    console.error('FULL ERROR:', error);

    const isOverload = error.message?.includes('503') || error.message?.includes('UNAVAILABLE');

    res.status(isOverload ? 503 : 500).json({
      success: false,
      error: isOverload
        ? 'AI is temporarily overloaded. Please try again in a moment.'
        : error.message,
    });
  }
});


//START SERVER
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(
    `Server running at http://localhost:${PORT}`
  );
});
