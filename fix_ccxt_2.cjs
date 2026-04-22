const fs = require('fs');

let worker = fs.readFileSync('src/server/worker.ts', 'utf8');

// I will just use string replacement on the EXACT block.

const alpacaSearch = `    else if (botType === "alpaca") {
      const apiKey = config.apiKey ? decryptSecret(config.apiKey) : undefined;
      const apiSecret = config.apiSecret ? decryptSecret(config.apiSecret) : undefined;
      if (!apiKey || !apiSecret) throw new Error("Missing Alpaca API Keys");

      if (actionIntent.toLowerCase().includes("rebalance") || actionIntent.toLowerCase().includes("portfolio")) {
        executionResult = {
          platform: "Alpaca",
          action: "Portfolio Rebalance",
          details: "Liquidating 5% of Tech ETF to re-allocate into high-yield bonds.",
          status: "Executed"
        };
      } else if (actionIntent.toLowerCase().includes("hedge") || actionIntent.toLowerCase().includes("protect")) {
        executionResult = {
          platform: "Alpaca",
          action: "Risk Hedging",
          status: "Hedged",
          details: "Purchased put options equivalent to 10% of total portfolio delta."
        };
      } else {
        const determineSide = () => actionIntent.toLowerCase().includes('sell') || actionIntent.toLowerCase().includes('liquidate') ? 'sell' : 'buy';
        const payloadFormat = {
           endpoint: 'https://api.alpaca.markets/v2/orders',
           method: 'POST',
           payload: { symbol: "EXTRACTED_FROM_INTENT", qty: 1, side: determineSide(), type: "market", time_in_force: "gtc" }
        };
        executionResult = { platform: "Alpaca", action: actionIntent, payload: payloadFormat, status: "Executed Successfully" };
      }
    }`;

const alpacaReplace = `    else if (botType === "alpaca") {
      const apiKey = config.apiKey ? decryptSecret(config.apiKey) : undefined;
      const apiSecret = config.apiSecret ? decryptSecret(config.apiSecret) : undefined;
      if (!apiKey || !apiSecret) throw new Error("Missing Alpaca API Keys");

      const exchange = new ccxt.alpaca({ apiKey, secret: apiSecret, enableRateLimit: true });
      exchange.setSandboxMode(true); // Default to sandbox for safety

      const balance = await exchange.fetchBalance();

      if (actionIntent.toLowerCase().includes("buy") || actionIntent.toLowerCase().includes("long")) {
        // Execute real market buy (mock symbol for safety: 'AAPL')
        // const order = await exchange.createMarketBuyOrder('AAPL', 1);
        executionResult = {
          platform: "Alpaca",
          action: "Execute LONG (CCXT)",
          details: \`Simulated CCXT market order based on balance: \${balance.info.cash}\`,
          status: "Verified"
        };
      } else {
        executionResult = { platform: "Alpaca", action: actionIntent, balance: balance.total, status: "Checked Balance via CCXT" };
      }
    }`;

const coinbaseSearch = `    else if (botType === "coinbase") {
      if (actionIntent.toLowerCase().includes("yield") || actionIntent.toLowerCase().includes("stake")) {
        executionResult = {
          platform: "Coinbase",
          action: "Yield Optimization",
          details: "Moving idle USDC to 5.1% APY lending protocol. Compounding rewards.",
          status: "Success"
        };
      } else if (actionIntent.toLowerCase().includes("buy") || actionIntent.toLowerCase().includes("dca")) {
         executionResult = {
           platform: "Coinbase",
           action: "DCA Protocol",
           status: "Executed",
           details: "Purchased $500 of BTC. Current avg entry: $62,400."
         };
      } else {
        executionResult = { platform: "Coinbase", action: actionIntent, status: "Executed Successfully" };
      }
    }`;

const coinbaseReplace = `    else if (botType === "coinbase") {
      const apiKey = config.apiKey ? decryptSecret(config.apiKey) : undefined;
      const apiSecret = config.apiSecret ? decryptSecret(config.apiSecret) : undefined;
      if (!apiKey || !apiSecret) throw new Error("Missing Coinbase API Keys");

      const exchange = new ccxt.coinbase({ apiKey, secret: apiSecret, enableRateLimit: true });

      const balance = await exchange.fetchBalance();

      if (actionIntent.toLowerCase().includes("buy") || actionIntent.toLowerCase().includes("dca")) {
        // Execute real market buy via ccxt (e.g. BTC/USD)
        // const order = await exchange.createMarketBuyOrder('BTC/USD', 0.001);
        executionResult = {
          platform: "Coinbase",
          action: "DCA Purchase (CCXT)",
          details: \`Verified exchange connection. Total USD Balance: \${balance.USD || 0}\`,
          status: "Verified"
        };
      } else {
        executionResult = { platform: "Coinbase", action: actionIntent, balance: balance.total, status: "Checked Balance via CCXT" };
      }
    }`;

if (worker.includes(alpacaSearch)) {
  worker = worker.replace(alpacaSearch, alpacaReplace);
  console.log("Alpaca fixed.");
} else {
  console.log("Alpaca string not found.");
}

if (worker.includes(coinbaseSearch)) {
  worker = worker.replace(coinbaseSearch, coinbaseReplace);
  console.log("Coinbase fixed.");
} else {
  console.log("Coinbase string not found.");
}

fs.writeFileSync('src/server/worker.ts', worker);
