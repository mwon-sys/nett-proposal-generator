import { invokeLLM } from "./_core/llm";
import { scrapeWebsiteImages } from "./scraper";
import { calculateFee, ECOMMERCE_TIERS, NON_ECOMMERCE_TIERS } from "../shared/constants";

export interface Channel {
  name: string;
  budget: number;
}

export interface ProposalInput {
  clientName: string;
  clientWebsite: string;
  industry: string;
  isEcommerce: boolean;
  goals: string;
  channels: Channel[];
  setupFee: number;
  salesRep: string;
  salesRepEmail?: string;
  salesRepPhone?: string;
  uploadedImages?: string[]; // Optional S3 URLs to use instead of scraped images
}

export interface ProposalData {
  clientName: string;
  clientWebsite: string;
  industry: string;
  isEcommerce: boolean;
  goals: string;
  channels: Channel[];
  setupFee: number;
  salesRep: string;
  salesRepEmail: string;
  salesRepPhone: string;
  totalMonthlySpend: number;
  managementFee: number;
  managementFeePercent: string;
  feeSchedule: Array<{ label: string; fee: string; isActive: boolean }>;
  images: {
    hero: string | null;
    campaign: string | null;
    process1: string | null;
    process2: string | null;
    process3: string | null;
    extras: string[];
  };
  copy: {
    coverTagline: string;
    coverSubtitle: string;
    marketHeadline: string;
    marketIntro: string;
    marketStats: Array<{ number: string; label: string }>;
    marketInsights: string[];
    marketSource: string;
    goalsHeadline: string;
    goalsIntro: string;
    goalsList: Array<{ title: string; body: string }>;
    campaignHeadline: string;
    campaignIntro: string;
    campaignDescriptions: Record<string, string>;
    processHeadline: string;
    processIntro: string;
    processSteps: Array<{ number: string; title: string; body: string }>;
    investHeadline: string;
    investIntro: string;
    teamQuote: string;
    whyHeadline: string;
    whyIntro: string;
    whyCredentials: Array<{ title: string; body: string }>;
    ctaHeadline: string;
    ctaBody: string;
    ctaButtonText: string;
  };
}

export async function generateProposal(input: ProposalInput): Promise<ProposalData> {
  const totalMonthlySpend = input.channels.reduce((sum, c) => sum + c.budget, 0);
  const { tierLabel, percent, monthlyFee } = calculateFee(totalMonthlySpend, input.isEcommerce);
  
  const tiers = input.isEcommerce ? ECOMMERCE_TIERS : NON_ECOMMERCE_TIERS;
  const feeSchedule = tiers.map(t => {
    const isActive = totalMonthlySpend >= t.min && totalMonthlySpend <= t.max;
    const rangeLabel = t.max === Infinity
      ? `$${t.min.toLocaleString()}+`
      : `$${t.min.toLocaleString()} – $${t.max.toLocaleString()}`;
    return { label: rangeLabel, fee: t.fee, isActive };
  });

  // Scrape website images (used as fallback if no uploaded images)
  const scraped = await scrapeWebsiteImages(input.clientWebsite);
  const scrapedImgs = scraped.images;

  // Use uploaded images first, fall back to scraped images for any missing slots
  const uploaded = input.uploadedImages ?? [];
  const get = (uploadedIdx: number, ...scrapedFallbacks: number[]) => {
    if (uploaded[uploadedIdx]) return uploaded[uploadedIdx];
    for (const fi of scrapedFallbacks) {
      if (scrapedImgs[fi]) return scrapedImgs[fi];
    }
    return null;
  };

  const images = {
    hero:      get(0, 0),
    campaign:  get(1, 1, 0),
    process1:  get(2, 2, 0),
    process2:  get(3, 3, 1),
    process3:  get(4, 4, 2),
    extras:    uploaded.slice(5).length > 0 ? uploaded.slice(5) : scrapedImgs.slice(5),
  };

  // Generate AI copy
  const channelList = input.channels.map(c => `${c.name} ($${c.budget.toLocaleString()}/mo)`).join(", ");
  const prompt = `You are a senior digital marketing copywriter for Nett Solutions, a Google Premier Partner PPC agency. Write compelling, personalized proposal copy for a prospect.

PROSPECT DETAILS:
- Company: ${input.clientName}
- Website: ${input.clientWebsite}
- Industry: ${input.industry}
- Business Type: ${input.isEcommerce ? "Ecommerce" : "Local/Lead Generation"}
- Goals: ${input.goals}
- Ad Channels: ${channelList}
- Total Monthly Ad Spend: $${totalMonthlySpend.toLocaleString()}
- Management Fee: ${percent === "flat" ? `$${monthlyFee}/mo flat` : `${percent} ($${monthlyFee.toLocaleString()}/mo)`}

Write the following sections. Be specific to their industry and business. Use their actual company name. Be persuasive but not salesy. Use a confident, professional tone.

Return ONLY valid JSON with this exact structure:
{
  "coverTagline": "A compelling 8-12 word tagline specific to their business and goals",
  "coverSubtitle": "A 20-30 word subtitle expanding on the tagline",
  "marketHeadline": "A specific, data-driven headline about their market opportunity (mention their industry)",
  "marketIntro": "2-3 sentences about the market opportunity specific to their industry and business type",
  "marketStats": [
    {"number": "stat like $4.2B", "label": "short description"},
    {"number": "stat", "label": "short description"},
    {"number": "stat", "label": "short description"},
    {"number": "stat", "label": "short description"}
  ],
  "marketInsights": ["insight 1 specific to their industry", "insight 2", "insight 3"],
  "marketSource": "Source: [relevant industry report/year]",
  "goalsHeadline": "A creative, client-specific headline for the goals section (not generic)",
  "goalsIntro": "2 sentences introducing the goals specific to their business",
  "goalsList": [
    {"title": "Goal title", "body": "2-3 sentence explanation specific to their business"},
    {"title": "Goal title", "body": "2-3 sentence explanation"},
    {"title": "Goal title", "body": "2-3 sentence explanation"},
    {"title": "Goal title", "body": "2-3 sentence explanation"}
  ],
  "campaignHeadline": "Creative headline for campaign strategy section",
  "campaignIntro": "2 sentences about the multi-channel strategy specific to their business",
  "campaignDescriptions": {
    ${input.channels.map(c => `"${c.name}": "3-4 sentence description of how this channel will be used for ${input.clientName} specifically"`).join(",\n    ")}
  },
  "processHeadline": "Creative headline for the Our Process section",
  "processIntro": "2 sentences about the process specific to their situation",
  "processSteps": [
    {"number": "01", "title": "Discovery & Strategy", "body": "2-3 sentences specific to their business"},
    {"number": "02", "title": "Campaign Build & Launch", "body": "2-3 sentences"},
    {"number": "03", "title": "Optimize & Scale", "body": "2-3 sentences"},
    {"number": "04", "title": "Report & Refine", "body": "2-3 sentences"}
  ],
  "investHeadline": "Creative headline for investment section",
  "investIntro": "2 sentences about the investment being transparent and results-driven",
  "teamQuote": "As we begin this journey to help ${input.clientName} grow, don't be surprised if we end up learning about each other's pets, families and share a lot of laughs along the way.",
  "whyHeadline": "Why Nett Solutions Is the Right Partner for ${input.clientName}",
  "whyIntro": "2 sentences about why Nett Solutions is uniquely positioned to help this specific client",
  "whyCredentials": [
    {"title": "Google Premier Partner", "body": "Top 3% of agencies worldwide. Better support, earlier beta access, and deeper platform insights."},
    {"title": "Proven Track Record", "body": "2 sentences about results specific to their industry"},
    {"title": "Transparent Reporting", "body": "2 sentences about reporting and accountability"},
    {"title": "Dedicated Team", "body": "2 sentences about the team approach"}
  ],
  "ctaHeadline": "A compelling CTA headline specific to their business goals",
  "ctaBody": "2-3 sentences inviting them to take the next step",
  "ctaButtonText": "Schedule Your Strategy Call"
}`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "You are a senior digital marketing copywriter. Return only valid JSON, no markdown, no explanation." },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" } as any,
  });

  let copy: ProposalData["copy"];
  try {
    const content = response.choices[0].message.content;
    copy = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
  } catch {
    throw new Error("Failed to parse AI response");
  }

  return {
    clientName: input.clientName,
    clientWebsite: input.clientWebsite,
    industry: input.industry,
    isEcommerce: input.isEcommerce,
    goals: input.goals,
    channels: input.channels,
    setupFee: input.setupFee,
    salesRep: input.salesRep,
    salesRepEmail: input.salesRepEmail || "",
    salesRepPhone: input.salesRepPhone || "",
    totalMonthlySpend,
    managementFee: monthlyFee,
    managementFeePercent: percent,
    feeSchedule,
    images,
    copy,
  };
}
