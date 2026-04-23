import { BotType } from "./types";

export const BOT_TYPES: BotType[] = [
  { id: "shopify", name: "Shopify Clerk", role: "Store Operator", authType: "oauth", expertise: "Helps manage inventory, adjusts prices automatically, and handles new orders." },
  { id: "etsy", name: "Etsy Shopkeeper", role: "Shop Assistant", authType: "oauth", expertise: "Works on SEO, finds trending products, and keeps customers happy." },
  { id: "ebay", name: "eBay Master", role: "eBay Specialist", authType: "oauth", expertise: "Handles selling across borders, manages auctions, and improves ad performance." },
  { id: "amazon", name: "Amazon Agent", role: "Amazon Manager", authType: "apikey", expertise: "Keeps your products competitive, tracks reviews, and manages stock levels." },
  { id: "gmail", name: "Gmail Assistant", role: "Inbox Manager", authType: "oauth", expertise: "Filters junk, flags important emails, and drafts quick replies for you." },
  { id: "youtube", name: "YouTube Manager", role: "Channel Growth", authType: "oauth", expertise: "Works on video titles, finds trending topics, and helps grow your audience." },
  { id: "facebook", name: "Meta Ads Scout", role: "Ad Specialist", authType: "oauth", expertise: "Finds the best audiences, flags tired ads, and tracks your ad results." },
  { id: "pinterest", name: "Pinterest Pin Bot", role: "Marketing Assistant", authType: "oauth", expertise: "Finds trending visual topics and creates pins that drive traffic to your store." },
  { id: "kalshi", name: "Kalshi Trader", role: "Market Analyst", authType: "apikey", expertise: "Checks market trends and helps manage your trades based on news events." },
  { id: "polymarket", name: "Polymarket Scout", role: "Event Tracker", authType: "apikey", expertise: "Tracks world events and analyzes how people are betting on them." },
  { id: "alpaca", name: "Alpaca Trader", role: "Stock Helper", authType: "apikey", expertise: "Spots technical stock patterns and manages live buy or sell orders." },
  { id: "coinbase", name: "Coinbase Auto", role: "Crypto Assistant", authType: "apikey", expertise: "Finds crypto opportunities and manages your digital assets safely." },
  { id: "discord", name: "Discord Informant", role: "Community Manager", authType: "oauth", expertise: "Tracks community mood and sends alerts when important things happen." },
  { id: "botboss", name: "Bot Boss", role: "System Manager", authType: "apikey", expertise: "Manages all your bots and steps in to help whenever needed." },
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
