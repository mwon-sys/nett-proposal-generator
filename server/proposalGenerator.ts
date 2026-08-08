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

  // Use uploaded images first, fall back to scraped images for any missing slots.
  // IMPORTANT: Each URL may only be used once across all slots to prevent replication.
  const uploaded = input.uploadedImages ?? [];
  const usedUrls = new Set<string>();

  const pickUnique = (candidates: (string | null | undefined)[]): string | null => {
    for (const url of candidates) {
      if (url && !usedUrls.has(url)) {
        usedUrls.add(url);
        return url;
      }
    }
    // If all candidates are already used, allow reuse of the best available one
    // (better to show an image than a blank slot)
    for (const url of candidates) {
      if (url) return url;
    }
    return null;
  };

  // Slot order: 0=hero(cover), 1=goals, 2=campaign, 3=process1, 4=process2, 5=process3
  // For each slot: prefer the uploaded image at that index, then try scraped images in priority order
  const images = {
    hero:     pickUnique([uploaded[0], scrapedImgs[0], scrapedImgs[1], scrapedImgs[2]]),
    goals:    pickUnique([uploaded[1], scrapedImgs[1], scrapedImgs[2], scrapedImgs[0], scrapedImgs[3]]),
    campaign: pickUnique([uploaded[2], scrapedImgs[2], scrapedImgs[3], scrapedImgs[1], scrapedImgs[0]]),
    process1: pickUnique([uploaded[3], scrapedImgs[3], scrapedImgs[4], scrapedImgs[0]]),
    process2: pickUnique([uploaded[4], scrapedImgs[4], scrapedImgs[5], scrapedImgs[1]]),
    process3: pickUnique([uploaded[5], scrapedImgs[5], scrapedImgs[3], scrapedImgs[2]]),
    extras:   uploaded.slice(6).length > 0 ? uploaded.slice(6) : scrapedImgs.slice(6),
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

  // Helper: extract JSON from LLM response, stripping any markdown fences
  // Helper: safely extract JSON from LLM response content
  const extractJson = (raw: unknown): ProposalData["copy"] => {
    if (raw === null || raw === undefined) {
      throw new Error("LLM returned null/undefined content");
    }
    // If already an object (structured output), return directly
    if (typeof raw === "object") {
      return raw as ProposalData["copy"];
    }
    let text = String(raw).trim();
    // Strip markdown code fences if present (```json ... ``` or ``` ... ```)
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
    return JSON.parse(text);
  };

  // Attempt LLM call with up to 3 retries on parse failure
  let copy: ProposalData["copy"] | null = null;
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await invokeLLM({
        model: "gpt-5-mini",
        messages: [
          { role: "system", content: "You are a senior digital marketing copywriter. You MUST return only valid JSON matching the exact schema provided. No markdown, no code fences, no explanation — pure JSON only." },
          { role: "user", content: prompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "proposal_copy",
            strict: true,
            schema: {
              type: "object",
              properties: {
                coverTagline: { type: "string" },
                coverSubtitle: { type: "string" },
                marketHeadline: { type: "string" },
                marketIntro: { type: "string" },
                marketStats: { type: "array", items: { type: "object", properties: { number: { type: "string" }, label: { type: "string" } }, required: ["number", "label"], additionalProperties: false } },
                marketInsights: { type: "array", items: { type: "string" } },
                marketSource: { type: "string" },
                goalsHeadline: { type: "string" },
                goalsIntro: { type: "string" },
                goalsList: { type: "array", items: { type: "object", properties: { title: { type: "string" }, body: { type: "string" } }, required: ["title", "body"], additionalProperties: false } },
                campaignHeadline: { type: "string" },
                campaignIntro: { type: "string" },
                campaignDescriptions: { type: "object", additionalProperties: { type: "string" } },
                processHeadline: { type: "string" },
                processIntro: { type: "string" },
                processSteps: { type: "array", items: { type: "object", properties: { number: { type: "string" }, title: { type: "string" }, body: { type: "string" } }, required: ["number", "title", "body"], additionalProperties: false } },
                investHeadline: { type: "string" },
                investIntro: { type: "string" },
                teamQuote: { type: "string" },
                whyHeadline: { type: "string" },
                whyIntro: { type: "string" },
                whyCredentials: { type: "array", items: { type: "object", properties: { title: { type: "string" }, body: { type: "string" } }, required: ["title", "body"], additionalProperties: false } },
                ctaHeadline: { type: "string" },
                ctaBody: { type: "string" },
                ctaButtonText: { type: "string" },
              },
              required: ["coverTagline","coverSubtitle","marketHeadline","marketIntro","marketStats","marketInsights","marketSource","goalsHeadline","goalsIntro","goalsList","campaignHeadline","campaignIntro","campaignDescriptions","processHeadline","processIntro","processSteps","investHeadline","investIntro","teamQuote","whyHeadline","whyIntro","whyCredentials","ctaHeadline","ctaBody","ctaButtonText"],
              additionalProperties: false,
            },
          },
        } as any,
      });
      const rawContent = response.choices[0].message.content;
      console.log(`[Generator] Attempt ${attempt} raw content type: ${typeof rawContent}, null: ${rawContent === null}`);
      copy = extractJson(rawContent);
      break; // success — exit retry loop
    } catch (err) {
      lastError = err;
      console.error(`[Generator] AI parse attempt ${attempt} failed:`, err);
      if (attempt < 3) {
        // Brief pause before retry
        await new Promise(res => setTimeout(res, 1000 * attempt));
      }
    }
  }

  if (!copy) {
    console.error("[Generator] All 3 AI parse attempts failed. Last error:", lastError);
    throw new Error("Failed to generate proposal copy after 3 attempts. Please try again.");
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
