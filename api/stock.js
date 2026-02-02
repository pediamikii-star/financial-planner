export default async function handler(req, res) {
  const { symbol } = req.query;

  if (!symbol) {
    return res.status(400).json({ error: "Stock symbol is required" });
  }

  try {
    // Yahoo Finance endpoint (non-CORS karena ini server)
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}.JK`;

    const response = await fetch(url);
    const data = await response.json();

    const quote = data?.quoteResponse?.result?.[0];

    if (!quote || !quote.regularMarketPrice) {
      return res.status(404).json({ error: "Stock not found" });
    }

    res.status(200).json({
      symbol,
      price: quote.regularMarketPrice,
      currency: "IDR",
      source: "Yahoo Finance"
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch stock price",
      details: error.message
    });
  }
}
