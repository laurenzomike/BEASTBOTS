import { BotType } from "./types";

export const BOT_TYPES: BotType[] = [
  { 
    id: "shopify", 
    name: "Shopify Clerk", 
    role: "Store Operator", 
    authType: "oauth", 
    expertise: "Helps manage inventory, adjusts prices automatically, and handles new orders.",
    scopes: ["read_products", "write_products", "read_orders", "write_orders", "read_inventory", "write_inventory"],
    responsibilities: [
      { id: "inventory", label: "Inventory Watch", description: "Monitors and syncs stock levels across locations.", defaultEnabled: true },
      { id: "pricing", label: "Dynamic Pricing", description: "Adjusts prices based on demand and competitor data (simulated).", defaultEnabled: true },
      { id: "fulfillment", label: "Order Logistics", description: "Drafts reorders and flags fulfillment issues.", defaultEnabled: false }
    ],
    parameters: [
      { id: "min_stock", label: "Reorder Threshold", type: "number", defaultValue: 10, min: 0, max: 100, description: "Low stock alert level." },
      { id: "base_margin", label: "Target Margin %", type: "number", defaultValue: 25, min: 5, max: 80, description: "Minimum profit margin to maintain." }
    ]
  },
  { 
    id: "etsy", 
    name: "Etsy Shopkeeper", 
    role: "Shop Assistant", 
    authType: "oauth", 
    expertise: "Works on SEO, finds trending products, and keeps customers happy.",
    scopes: ["listings_r", "listings_w", "transactions_r", "shops_r"],
    responsibilities: [
      { id: "seo", label: "SEO Optimizer", description: "Updates tags and titles based on trending keywords.", defaultEnabled: true },
      { id: "customer_care", label: "Review Responder", description: "Drafts responses to new customer reviews.", defaultEnabled: true }
    ],
    parameters: [
      { id: "target_keywords", label: "Target Tags", type: "string", defaultValue: "handmade, decor", description: "Keywords to focus SEO efforts on." }
    ]
  },
  { 
    id: "ebay", 
    name: "eBay Master", 
    role: "eBay Specialist", 
    authType: "oauth", 
    expertise: "Handles selling across borders, manages auctions, and improves ad performance.",
    scopes: ["https://api.ebay.com/oauth/api_scope/sell.inventory", "https://api.ebay.com/oauth/api_scope/sell.fulfillment"],
    responsibilities: [
      { id: "auctions", label: "Auction Guard", description: "Monitors auction ends and handles relisting.", defaultEnabled: true },
      { id: "offers", label: "Counteroffer Pro", description: "Automates reasonable counteroffers to buyers.", defaultEnabled: false }
    ],
    parameters: [
      { id: "max_discount", label: "Max Auto-Discount %", type: "number", defaultValue: 15, min: 0, max: 50, description: "Max discount for counteroffers." }
    ]
  },
  { 
    id: "amazon", 
    name: "Amazon Agent", 
    role: "Amazon Manager", 
    authType: "apikey", 
    expertise: "Keeps your products competitive, tracks reviews, and manages stock levels.",
    responsibilities: [
      { id: "buybox", label: "Buybox Sentry", description: "Alerts when Buybox is lost and suggests price tweaks.", defaultEnabled: true },
      { id: "reviews", label: "Review Tracker", description: "Flags negative reviews for immediate attention.", defaultEnabled: true }
    ],
    parameters: [
      { id: "competitive_price", label: "Competitive Price Cap", type: "number", defaultValue: 50, min: 10, max: 200, description: "Max price to stay competitive." }
    ]
  },
  { 
    id: "gmail", 
    name: "Gmail Assistant", 
    role: "Inbox Manager", 
    authType: "oauth", 
    expertise: "Filters junk, flags important emails, and drafts quick replies for you.",
    scopes: ["https://www.googleapis.com/auth/gmail.modify", "https://www.googleapis.com/auth/gmail.compose"],
    responsibilities: [
      { id: "triage", label: "Inbox Triage", description: "Labels and prioritizes incoming mail.", defaultEnabled: true },
      { id: "drafting", label: "Smart Drafting", description: "Drafts context-aware replies for approval.", defaultEnabled: true }
    ],
    parameters: [
      { id: "vip_list", label: "VIP Emails", type: "string", defaultValue: "", description: "Comma-separated list of high-priority senders." }
    ]
  },
  { 
    id: "youtube", 
    name: "YouTube Manager", 
    role: "Channel Growth", 
    authType: "oauth", 
    expertise: "Works on video titles, finds trending topics, and helps grow your audience.",
    scopes: ["https://www.googleapis.com/auth/youtube.force-ssl"],
    responsibilities: [
      { id: "metadata", label: "Metadata Crafter", description: "Optimizes titles, tags, and descriptions.", defaultEnabled: true },
      { id: "engagement", label: "Engagement Bot", description: "Replies to comments to boost community signals.", defaultEnabled: true }
    ],
    parameters: [
      { id: "focus_topic", label: "Channel Focus", type: "string", defaultValue: "technology", description: "Primary niche for trend analysis." }
    ]
  },
  { 
    id: "facebook", 
    name: "Meta Ads Scout", 
    role: "Ad Specialist", 
    authType: "oauth", 
    expertise: "Finds the best audiences, flags tired ads, and tracks your ad results.",
    scopes: ["ads_management", "ads_read"],
    responsibilities: [
      { id: "fatigue", label: "Ad Fatigue Detection", description: "Spots high frequency and declining performance.", defaultEnabled: true },
      { id: "audiences", label: "Audience Rotator", description: "Tests new audience segments automatically.", defaultEnabled: false }
    ],
    parameters: [
      { id: "target_cpa", label: "Target CPA", type: "number", defaultValue: 10, min: 1, max: 100, description: "Maximum cost per acquisition allowed." }
    ]
  },
  { 
    id: "pinterest", 
    name: "Pinterest Pin Bot", 
    role: "Marketing Assistant", 
    authType: "oauth", 
    expertise: "Finds trending visual topics and creates pins that drive traffic to your store.",
    scopes: ["boards:read", "pins:read", "pins:write"],
    responsibilities: [
      { id: "curation", label: "Visual Curation", description: "Pins high-quality content to boards.", defaultEnabled: true },
      { id: "trend_watch", label: "Trend Sensing", description: "Finds visual trends before they peak.", defaultEnabled: true }
    ],
    parameters: [
      { id: "board_name", label: "Main Board", type: "string", defaultValue: "Trends", description: "Board where bot will pin content." }
    ]
  },
  { 
    id: "kalshi", 
    name: "Kalshi Trader", 
    role: "Market Analyst", 
    authType: "apikey", 
    expertise: "Checks market trends and helps manage your trades based on news events.",
    responsibilities: [
      { id: "event_trades", label: "Event Arbitrage", description: "Places trades based on prediction accuracy.", defaultEnabled: true },
      { id: "hedging", label: "Exposure Hedge", description: "Closes positions when risk exceeds bounds.", defaultEnabled: true }
    ],
    parameters: [
      { id: "risk_limit", label: "Risk Limit ($)", type: "number", defaultValue: 100, min: 10, max: 1000, description: "Maximum exposure per event." }
    ]
  },
  { 
    id: "polymarket", 
    name: "Polymarket Scout", 
    role: "Event Tracker", 
    authType: "apikey", 
    expertise: "Tracks world events and analyzes how people are betting on them.",
    responsibilities: [
      { id: "liquidity", label: "Liquidity Mining", description: "Provides liquidity to tight markets.", defaultEnabled: false },
      { id: "sentiment", label: "Sentiment Tracker", description: "Alerts on drastic odds shifts.", defaultEnabled: true }
    ],
    parameters: [
      { id: "min_odds", label: "Min Odds Threshold", type: "number", defaultValue: 0.1, min: 0, max: 1, description: "Ignore events with lower winning probability." }
    ]
  },
  { 
    id: "alpaca", 
    name: "Alpaca Trader", 
    role: "Stock Helper", 
    authType: "apikey", 
    expertise: "Spots technical stock patterns and manages live buy or sell orders.",
    responsibilities: [
      { id: "patterns", label: "Pattern Recognition", description: "Detects RSI, MACD, and SMA crosses.", defaultEnabled: true },
      { id: "execution", label: "Order Execution", description: "Places limit orders based on signals.", defaultEnabled: true }
    ],
    parameters: [
      { id: "watchlist", label: "Watchlist", type: "string", defaultValue: "AAPL, TSLA, BTC", description: "Assets to monitor." }
    ]
  },
  { 
    id: "coinbase", 
    name: "Coinbase Auto", 
    role: "Crypto Assistant", 
    authType: "apikey", 
    expertise: "Finds crypto opportunities and manages your digital assets safely.",
    responsibilities: [
      { id: "staking", label: "Reward Optimizer", description: "Manages asset staking for max yield.", defaultEnabled: false },
      { id: "arbitrage", label: "Volatility Play", description: "Swaps assets during high-volatility spikes.", defaultEnabled: true }
    ],
    parameters: [
      { id: "stop_loss", label: "Stop Loss %", type: "number", defaultValue: 5, min: 2, max: 20, description: "Automatic sell signal at price drop." }
    ]
  },
  { 
    id: "discord", 
    name: "Discord Informant", 
    role: "Community Manager", 
    authType: "oauth", 
    expertise: "Tracks community mood and sends alerts when important things happen.",
    scopes: ["guilds", "messages.read", "webhook.incoming"],
    responsibilities: [
      { id: "mood", label: "Sentiment Sentry", description: "Analyzes chat for toxicity or hype.", defaultEnabled: true },
      { id: "alerts", label: "Instant Alerts", description: "DM's you when major project keywords drop.", defaultEnabled: true }
    ],
    parameters: [
      { id: "keywords", label: "Alert Keywords", type: "string", defaultValue: "bullish, rug, listing", description: "Keywords that trigger DMs." }
    ]
  },
  { 
    id: "botboss", 
    name: "Bot Boss", 
    role: "System Manager", 
    authType: "apikey", 
    expertise: "Manages all your bots and steps in to help whenever needed.",
    responsibilities: [
      { id: "fleet_health", label: "Fleet Diagnostics", description: "Automatically restarts failed bots.", defaultEnabled: true },
      { id: "resource_manager", label: "Budget Rebalance", description: "Shifts capital between trading bots based on wins.", defaultEnabled: false }
    ],
    parameters: [
      { id: "daily_burn", label: "Daily Burn Limit ($)", type: "number", defaultValue: 500, min: 0, max: 5000, description: "Total fleet loss cap." }
    ]
  },
];

export const PLATFORM_WORKFLOWS: Record<string, { triggers: string[], actions: string[] }> = {
  shopify: { triggers: ["Scheduled Sync", "On Inventory Low", "On Order Placed", "On Customer Inquiry"], actions: ["Adjust Price", "Draft Reorder", "Generate Promo Code", "Auto-Response"] },
  etsy: { triggers: ["Scheduled Sync", "On Review Received", "On Trending Tag", "On Message Received"], actions: ["Auto-Response", "Adjust Listing Tags", "Update Title"] },
  ebay: { triggers: ["Scheduled Sync", "On Auction End", "On Outbid", "On Buyer Question"], actions: ["Relist Item", "Adjust Reserve", "Send Counteroffer", "Auto-Response"] },
  amazon: { triggers: ["Scheduled Sync", "On Buybox Lost", "On Bad Review", "On Buyer Message"], actions: ["Adjust Price limit", "Flag for Review", "Pause Listing", "Auto-Response"] },
  gmail: { triggers: ["On New Email", "Scheduled Sweep", "On Primary Inbox"], actions: ["Draft Reply", "Archive/Label", "Extract Invoice", "Auto-Response"] },
  youtube: { triggers: ["Scheduled Sync", "On Video Published", "On Milestone", "On New Comment"], actions: ["Generate Tags & Title", "Reply to Comments", "Update Thumbnail", "Auto-Response"] },
  facebook: { triggers: ["Scheduled Sync", "On Ad Fatigue Detected", "On High CPA", "On Page Comment"], actions: ["Pause Ad", "Generate New Creative Variation", "Rotate Audience", "Auto-Response"] },
  pinterest: { triggers: ["Scheduled Sync", "On Keyword Trend", "On High Repin", "On Message"], actions: ["Create Pin", "Update Board", "Follow Users", "Auto-Response"] },
  kalshi: { triggers: ["Scheduled Sync", "On Market Shift", "On Breaking News"], actions: ["Place Yes/No Order", "Liquidate Position", "Hedge Exposure"] },
  polymarket: { triggers: ["Scheduled Sync", "On Odds Change", "On Liquidity Drop"], actions: ["Buy Shares", "Sell Shares", "Provide Liquidity"] },
  alpaca: { triggers: ["Scheduled Sync", "On Price Alert", "On Technical Cross"], actions: ["Market Order", "Limit Order", "Close Safe"] },
  coinbase: { triggers: ["Scheduled Sync", "On Large Volume Spike", "On Spread Widen"], actions: ["Market Order", "Stake Asset", "Cancel Open Orders"] },
  discord: { triggers: ["On Message in Channel", "Scheduled Sync", "On Keyword Mention", "On DM Received"], actions: ["Send Alert", "Moderate User", "Reply in Thread", "Auto-Response"] },
  botboss: { triggers: ["Scheduled Sync", "On Fleet Error", "On Budget Limit"], actions: ["Reallocate Budget", "Pause Agents", "Send Global Alert"] },
};
