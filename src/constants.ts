import { BotType } from "./types";

export const BOT_TYPES: BotType[] = [
  { 
    id: "shopify", 
    name: "Shopify Merchant", 
    role: "Inventory Admiral", 
    authType: "oauth", 
    expertise: "Controls inventory velocity, pricing spreads, and customer conversion funnels. Actively monitors high-demand SKUs.",
    scopes: ["read_products", "write_products", "read_orders", "write_orders", "read_inventory", "write_inventory"],
    responsibilities: [
      { id: "pricing", label: "Dynamic Spreads", description: "Updates prices every 15 minutes based on competitor scrapers.", defaultEnabled: true },
      { id: "stock", label: "Stock Arbitrage", description: "Orders low-stock items automatically when velocity spikes.", defaultEnabled: true },
      { id: "orders", label: "Fulfillment Logic", description: "Prioritizes high-value customers for immediate shipping.", defaultEnabled: false }
    ],
    parameters: [
      { id: "margin_threshold", label: "Min Margin %", type: "number", defaultValue: 20, min: 5, max: 80, description: "Never price below this profit margin." },
      { id: "velocity_threshold", label: "Velocity Alarm", type: "number", defaultValue: 5, min: 1, max: 20, description: "Units per day to trigger restocking." }
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
    name: "Kalshi Oracle", 
    role: "Binary Specialist", 
    authType: "apikey", 
    expertise: "Deep-dives into event probability and political/economic shifting. Executes binary market strategies with high precision.",
    responsibilities: [
      { id: "event_trades", label: "Predictive Execution", description: "Places trades on Yes/No markets based on news sentiment.", defaultEnabled: true },
      { id: "hedging", label: "Protocol Hedge", description: "Maintains a balanced market-neutral book across correlated events.", defaultEnabled: true },
      { id: "liquidity_watch", label: "Liquidity Guard", description: "Ensures exit liquidity is available before scaling positions.", defaultEnabled: false }
    ],
    parameters: [
      { id: "risk_limit", label: "Max Exposure ($)", type: "number", defaultValue: 100, min: 10, max: 1000, description: "Maximum stake per single event contract." },
      { id: "min_confidence", label: "Logic Gap %", type: "number", defaultValue: 0.7, min: 0.1, max: 1, description: "Minimum probability edge required for execution." }
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
    name: "Alpaca Titan", 
    role: "Equity Executioner", 
    authType: "apikey", 
    expertise: "High-frequency retail equity strategist. Manages long/short portfolios with strict risk-to-reward matrices.",
    responsibilities: [
      { id: "trades", label: "Momentum Capture", description: "Executes trades on high-volume breakout patterns.", defaultEnabled: true },
      { id: "risk", label: "Hard Stop Loss", description: "Liquidates positions instantly if drawdown exceeds threshold.", defaultEnabled: true },
      { id: "rebalance", label: "Sector Rotation", description: "Moves capital to trending sectors during market shifts.", defaultEnabled: false }
    ],
    parameters: [
      { id: "max_position", label: "Max Pos ($)", type: "number", defaultValue: 500, min: 100, max: 5000, description: "Maximum capital allocated per ticker." },
      { id: "stop_loss", label: "Stop Loss %", type: "number", defaultValue: 0.02, min: 0.001, max: 0.1, description: "Percentage drop to trigger exit." }
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
  shopify: { 
    triggers: ["When Signal Detected", "Scheduled Sync", "On Inventory Low", "On Order Placed", "On Customer Inquiry", "On Competitor Price Drop"], 
    actions: ["Adjust Price", "Draft Reorder", "Generate Promo Code", "Auto-Response", "Update Shipping Logic", "Flag High-Risk Order"] 
  },
  etsy: { 
    triggers: ["When Signal Detected", "Scheduled Sync", "On Review Received", "On Trending Tag", "On Message Received", "On Listing Expiry"], 
    actions: ["Auto-Response", "Adjust Listing Tags", "Update Title", "Relist Item", "Generate Gift Guide", "Send Coupon to Favorites"] 
  },
  ebay: { 
    triggers: ["When Signal Detected", "Scheduled Sync", "On Auction End", "On Outbid", "On Buyer Question", "On Case Opened"], 
    actions: ["Relist Item", "Adjust Reserve", "Send Counteroffer", "Auto-Response", "Generate Return Label", "Blacklist Buyer"] 
  },
  amazon: { 
    triggers: ["When Signal Detected", "Scheduled Sync", "On Buybox Lost", "On Bad Review", "On Buyer Message", "On Low Stock Alert"], 
    actions: ["Adjust Price limit", "Flag for Review", "Pause Listing", "Auto-Response", "Sync FBA Shipment", "Analyze Buybox Gap"] 
  },
  gmail: { 
    triggers: ["When Signal Detected", "On New Email", "Scheduled Sweep", "On Primary Inbox", "On Calendar Invite"], 
    actions: ["Draft Reply", "Archive/Label", "Extract Invoice", "Auto-Response", "Create Task", "Forward to DM"] 
  },
  youtube: { 
    triggers: ["When Signal Detected", "Scheduled Sync", "On Video Published", "On Milestone", "On New Comment", "On Search Trend"], 
    actions: ["Generate Tags & Title", "Reply to Comments", "Update Thumbnail", "Auto-Response", "Analyze Retention Drop", "Pin Top Comment"] 
  },
  facebook: { 
    triggers: ["When Signal Detected", "Scheduled Sync", "On Ad Fatigue Detected", "On High CPA", "On Page Comment", "On Audience Shift"], 
    actions: ["Pause Ad", "Generate New Creative Variation", "Rotate Audience", "Auto-Response", "Boost Successful Post", "Export Lead Data"] 
  },
  pinterest: { 
    triggers: ["When Signal Detected", "Scheduled Sync", "On Keyword Trend", "On High Repin", "On Message", "On Board Saturation"], 
    actions: ["Create Pin", "Update Board", "Follow Users", "Auto-Response", "Schedule Story Pin", "Analyze Board Click-Through"] 
  },
  kalshi: { 
    triggers: ["When Signal Detected", "Scheduled Sync", "On Market Shift", "On Breaking News", "On Volume Spike", "On Order Partially Filled"], 
    actions: ["Place Yes/No Order", "Liquidate Position", "Hedge Exposure", "Set Limit Order", "Trailing Stop Exit", "Generate Alpha Note"] 
  },
  polymarket: { 
    triggers: ["When Signal Detected", "Scheduled Sync", "On Odds Change", "On Liquidity Drop", "On Result Resolved", "On Whale Activity"], 
    actions: ["Buy Shares", "Sell Shares", "Provide Liquidity", "Claim Winnings", "Verify Oracle Data", "Sentiment Log"] 
  },
  alpaca: { 
    triggers: ["When Signal Detected", "Scheduled Sync", "On Price Alert", "On Technical Cross", "On Earnings Announcement", "On Halt Detected"], 
    actions: ["Market Order", "Limit Order", "Close Safe", "Trailing Stop", "Rebalance Portfolio", "Volatility Hedge"] 
  },
  coinbase: { 
    triggers: ["When Signal Detected", "Scheduled Sync", "On Large Volume Spike", "On Spread Widen", "On Wallet Inflow", "On Network Congestion"], 
    actions: ["Market Order", "Stake Asset", "Cancel Open Orders", "Move to Cold Wallet", "Bridge Assets", "Analyze Dex Spread"] 
  },
  discord: { 
    triggers: ["When Signal Detected", "On Message in Channel", "Scheduled Sync", "On Keyword Mention", "On DM Received", "On Member Join"], 
    actions: ["Send Alert", "Moderate User", "Reply in Thread", "Auto-Response", "Assign Role", "Generate Channel Summary"] 
  },
  botboss: { 
    triggers: ["When Signal Detected", "Scheduled Sync", "On Fleet Error", "On Budget Limit", "On Collective Success", "On Global Directive Update"], 
    actions: ["Reallocate Budget", "Pause Agents", "Send Global Alert", "Trigger Fleet Maintenance", "Rotate API Keys", "Generate Fleet Situation Report"] 
  },
};
