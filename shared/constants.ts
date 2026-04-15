// ── Brand Asset CDN URLs ──────────────────────────────────────────────────────
export const ASSETS = {
  team: {
    joe:     "https://d2xsxph8kpxj0f.cloudfront.net/310519663383678254/Jb8k7A6LoQLjN5bypJ6s2b/joe_44cd22af.jpg",
    ally:    "https://d2xsxph8kpxj0f.cloudfront.net/310519663383678254/Jb8k7A6LoQLjN5bypJ6s2b/ally_26bc36d2.png",
    connor:  "https://d2xsxph8kpxj0f.cloudfront.net/310519663383678254/Jb8k7A6LoQLjN5bypJ6s2b/connor_1d2f7df3.png",
    mike:    "https://d2xsxph8kpxj0f.cloudfront.net/310519663383678254/Jb8k7A6LoQLjN5bypJ6s2b/mike_77921465.jpg",
    brandon: "https://d2xsxph8kpxj0f.cloudfront.net/310519663383678254/Jb8k7A6LoQLjN5bypJ6s2b/brandon_7039bf1b.jpg",
    sean:    "https://d2xsxph8kpxj0f.cloudfront.net/310519663383678254/Jb8k7A6LoQLjN5bypJ6s2b/sean_fcc39372.jpg",
  },
  badges: {
    googlePremier: "https://d2xsxph8kpxj0f.cloudfront.net/310519663383678254/Jb8k7A6LoQLjN5bypJ6s2b/badge-google-premier_95705ae6.jpg",
    bing:          "https://d2xsxph8kpxj0f.cloudfront.net/310519663383678254/Jb8k7A6LoQLjN5bypJ6s2b/badge-bing_780e34fb.png",
    bbb:           "https://d2xsxph8kpxj0f.cloudfront.net/310519663383678254/Jb8k7A6LoQLjN5bypJ6s2b/badge-bbb_a03b92d7.png",
    yelp:          "https://d2xsxph8kpxj0f.cloudfront.net/310519663383678254/Jb8k7A6LoQLjN5bypJ6s2b/badge-yelp_44b898d2.png",
    linkedin:      "https://d2xsxph8kpxj0f.cloudfront.net/310519663383678254/Jb8k7A6LoQLjN5bypJ6s2b/badge-linkedin_00dde6ca.png",
    tiktok:        "https://d2xsxph8kpxj0f.cloudfront.net/310519663383678254/Jb8k7A6LoQLjN5bypJ6s2b/badge-tiktok_2938edf0.svg",
    meta:          "https://d2xsxph8kpxj0f.cloudfront.net/310519663383678254/Jb8k7A6LoQLjN5bypJ6s2b/badge-meta_9a210061.svg",
  },
};

// ── Team Members ─────────────────────────────────────────────────────────────
export const TEAM_MEMBERS = [
  { name: "Joe Mounsey",  title: "Founder & CEO",              photo: ASSETS.team.joe,     key: "joe" },
  { name: "Ally V.",      title: "Director of Client Success", photo: ASSETS.team.ally,    key: "ally" },
  { name: "Connor",       title: "Senior PPC Strategist",      photo: ASSETS.team.connor,  key: "connor" },
  { name: "Mike Won",     title: "Director of Sales",          photo: ASSETS.team.mike,    key: "mike" },
  { name: "Brandon",      title: "Paid Social Specialist",     photo: ASSETS.team.brandon, key: "brandon" },
  { name: "Sean",         title: "Google Ads Specialist",      photo: ASSETS.team.sean,    key: "sean" },
];

export const SALES_REPS = TEAM_MEMBERS.map(m => m.name);

// ── Fee Schedules ─────────────────────────────────────────────────────────────
export const ECOMMERCE_TIERS = [
  { min: 1,      max: 2999,   fee: "$600 flat",  percent: "flat",  flatAmount: 600 },
  { min: 3000,   max: 7499,   fee: "20%",        percent: "20%",   flatAmount: null },
  { min: 7500,   max: 11999,  fee: "15%",        percent: "15%",   flatAmount: null },
  { min: 12000,  max: 19999,  fee: "14%",        percent: "14%",   flatAmount: null },
  { min: 20000,  max: 29999,  fee: "13%",        percent: "13%",   flatAmount: null },
  { min: 30000,  max: 44999,  fee: "12%",        percent: "12%",   flatAmount: null },
  { min: 45000,  max: 59999,  fee: "11%",        percent: "11%",   flatAmount: null },
  { min: 60000,  max: 74999,  fee: "10%",        percent: "10%",   flatAmount: null },
  { min: 75000,  max: 99999,  fee: "9%",         percent: "9%",    flatAmount: null },
  { min: 100000, max: Infinity, fee: "Custom",   percent: "Custom", flatAmount: null },
];

export const NON_ECOMMERCE_TIERS = [
  { min: 1,      max: 1999,   fee: "$400 flat",  percent: "flat",   flatAmount: 400 },
  { min: 2000,   max: 5999,   fee: "20%",        percent: "20%",    flatAmount: null },
  { min: 6000,   max: 9999,   fee: "18%",        percent: "18%",    flatAmount: null },
  { min: 10000,  max: 19999,  fee: "16%",        percent: "16%",    flatAmount: null },
  { min: 20000,  max: 34999,  fee: "15%",        percent: "15%",    flatAmount: null },
  { min: 35000,  max: Infinity, fee: "Custom",   percent: "Custom", flatAmount: null },
];

export function calculateFee(totalSpend: number, isEcommerce: boolean): {
  tierLabel: string;
  percent: string;
  monthlyFee: number;
  tierIndex: number;
} {
  const tiers = isEcommerce ? ECOMMERCE_TIERS : NON_ECOMMERCE_TIERS;
  const idx = tiers.findIndex(t => totalSpend >= t.min && totalSpend <= t.max);
  const tier = tiers[idx >= 0 ? idx : tiers.length - 1];

  let monthlyFee = 0;
  if (tier.flatAmount !== null) {
    monthlyFee = tier.flatAmount;
  } else if (tier.percent !== "Custom") {
    monthlyFee = Math.round(totalSpend * parseFloat(tier.percent) / 100);
  }

  return {
    tierLabel: tier.fee,
    percent: tier.percent,
    monthlyFee,
    tierIndex: idx >= 0 ? idx : tiers.length - 1,
  };
}

// ── Ad Channel Brand Logos (inline SVG) ──────────────────────────────────────
export const CHANNEL_LOGOS: Record<string, string> = {
  "google": `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>`,
  "meta": `<svg viewBox="0 0 24 24" width="22" height="22" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0 0 22 12.06C22 6.53 17.5 2.04 12 2.04Z" fill="#1877F2"/></svg>`,
  "tiktok": `<svg viewBox="0 0 24 24" width="22" height="22" xmlns="http://www.w3.org/2000/svg"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" fill="#000000"/></svg>`,
  "bing": `<svg viewBox="0 0 24 24" width="22" height="22" xmlns="http://www.w3.org/2000/svg"><path d="M5 3L7.5 3.9V16.5L12.3 13.9L14.2 14.9L9.5 17.7V20L5 17.5V3Z" fill="#008373"/><path d="M7.5 3.9L14 6.5L16 10.5L12.3 13.9L7.5 16.5V3.9Z" fill="#00B294"/></svg>`,
  "youtube": `<svg viewBox="0 0 24 24" width="22" height="22" xmlns="http://www.w3.org/2000/svg"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#FF0000"/></svg>`,
  "linkedin": `<svg viewBox="0 0 24 24" width="22" height="22" xmlns="http://www.w3.org/2000/svg"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" fill="#0A66C2"/></svg>`,
};

export function getChannelLogo(channelName: string): string {
  const lower = channelName.toLowerCase();
  if (lower.includes("google") || lower.includes("pmax") || lower.includes("search") || lower.includes("maps") || lower.includes("display")) return CHANNEL_LOGOS.google;
  if (lower.includes("meta") || lower.includes("facebook") || lower.includes("instagram")) return CHANNEL_LOGOS.meta;
  if (lower.includes("tiktok")) return CHANNEL_LOGOS.tiktok;
  if (lower.includes("bing") || lower.includes("microsoft")) return CHANNEL_LOGOS.bing;
  if (lower.includes("youtube")) return CHANNEL_LOGOS.youtube;
  if (lower.includes("linkedin")) return CHANNEL_LOGOS.linkedin;
  return CHANNEL_LOGOS.google;
}

export const APP_PASSWORD = "Techspace65";
