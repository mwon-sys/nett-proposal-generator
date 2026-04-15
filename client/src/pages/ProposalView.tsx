import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Share2, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

// ─── CDN Asset URLs ───────────────────────────────────────────────────────────
const ASSETS = {
  joe:     "https://d2xsxph8kpxj0f.cloudfront.net/310519663383678254/Jb8k7A6LoQLjN5bypJ6s2b/joe_94493229.jpg",
  ally:    "https://d2xsxph8kpxj0f.cloudfront.net/310519663383678254/Jb8k7A6LoQLjN5bypJ6s2b/ally_8510c541.png",
  connor:  "https://d2xsxph8kpxj0f.cloudfront.net/310519663383678254/Jb8k7A6LoQLjN5bypJ6s2b/connor_e1c4ec15.png",
  mike:    "https://d2xsxph8kpxj0f.cloudfront.net/310519663383678254/Jb8k7A6LoQLjN5bypJ6s2b/mike_4d1169c8.jpg",
  brandon: "https://d2xsxph8kpxj0f.cloudfront.net/310519663383678254/Jb8k7A6LoQLjN5bypJ6s2b/brandon_71f190c7.jpg",
  sean:    "https://d2xsxph8kpxj0f.cloudfront.net/310519663383678254/Jb8k7A6LoQLjN5bypJ6s2b/sean_eeb76526.jpg",
  googlePremier: "https://d2xsxph8kpxj0f.cloudfront.net/310519663383678254/Jb8k7A6LoQLjN5bypJ6s2b/badge-google-premier_111cdd40.jpg",
  bing:    "https://d2xsxph8kpxj0f.cloudfront.net/310519663383678254/Jb8k7A6LoQLjN5bypJ6s2b/badge-bing_42c708e1.png",
  bbb:     "https://d2xsxph8kpxj0f.cloudfront.net/310519663383678254/Jb8k7A6LoQLjN5bypJ6s2b/badge-bbb_a453f5dc.png",
  yelp:    "https://d2xsxph8kpxj0f.cloudfront.net/310519663383678254/Jb8k7A6LoQLjN5bypJ6s2b/badge-yelp_a7cdb766.png",
  linkedin:"https://d2xsxph8kpxj0f.cloudfront.net/310519663383678254/Jb8k7A6LoQLjN5bypJ6s2b/badge-linkedin_5e37d58c.png",
  tiktokBadge: "https://d2xsxph8kpxj0f.cloudfront.net/310519663383678254/Jb8k7A6LoQLjN5bypJ6s2b/badge-tiktok_7cf59630.png",
  metaBadge:   "https://d2xsxph8kpxj0f.cloudfront.net/310519663383678254/Jb8k7A6LoQLjN5bypJ6s2b/badge-meta_60f9f5d6.png",
};

const TEAM = [
  { name: "Joe Mounsey",    title: "Founder & CEO",              img: ASSETS.joe },
  { name: "Ally V.",        title: "Director of Client Success", img: ASSETS.ally },
  { name: "Connor",         title: "Senior PPC Strategist",      img: ASSETS.connor },
  { name: "Mike Won",       title: "Director of Sales",          img: ASSETS.mike },
  { name: "Brandon",        title: "Paid Social Specialist",     img: ASSETS.brandon },
  { name: "Sean",           title: "PPC Account Manager",        img: ASSETS.sean },
];

// ─── Channel brand logo SVGs ──────────────────────────────────────────────────
function ChannelLogo({ name }: { name: string }) {
  const n = name.toLowerCase();
  if (n.includes("google")) return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
  if (n.includes("meta") || n.includes("facebook") || n.includes("instagram")) return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
  if (n.includes("tiktok")) return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="white">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.27 8.27 0 004.84 1.55V6.79a4.85 4.85 0 01-1.07-.1z"/>
    </svg>
  );
  if (n.includes("bing") || n.includes("microsoft")) return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="white">
      <path d="M5 3l6.5 2.1v13.5L5 21V3zm7 2.5l7 4-3.5 2-3.5-2.1V5.5z"/>
    </svg>
  );
  if (n.includes("youtube")) return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#FF0000">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
  if (n.includes("linkedin")) return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#0A66C2">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
  // Generic
  return <span className="text-white text-xs font-bold">{name.charAt(0)}</span>;
}

// ─── Proposal Sections ────────────────────────────────────────────────────────
interface ProposalData {
  clientName: string;
  clientWebsite: string;
  industry: string;
  isEcommerce: boolean;
  goals: string;
  channels: { name: string; budget: number }[];
  setupFee: number;
  salesRep: string;
  salesRepEmail?: string;
  salesRepPhone?: string;
  totalMonthlySpend: number;
  managementFee: number;
  managementFeePercent: string | number;
  // AI-generated content
  coverHeadline?: string;
  coverSubheadline?: string;
  marketHeadline?: string;
  marketStat1?: string;
  marketStat2?: string;
  marketStat3?: string;
  marketBody?: string;
  goalsHeadline?: string;
  goalsList?: { title: string; description: string }[];
  campaignHeadline?: string;
  campaignIntro?: string;
  channelDescriptions?: Record<string, string>;
  processHeadline?: string;
  processSteps?: { step: string; title: string; description: string }[];
  whyHeadline?: string;
  whyPoints?: { title: string; description: string }[];
  ctaHeadline?: string;
  ctaBody?: string;
  clientImages?: string[];
  heroImage?: string;
}

function formatCurrency(n: number) {
  return "$" + n.toLocaleString();
}

function getManagementFee(totalSpend: number, isEcommerce: boolean): { percent: string; fee: number } {
  if (isEcommerce) {
    if (totalSpend <= 2999)  return { percent: "$600 flat", fee: 600 };
    if (totalSpend <= 7499)  return { percent: "20%", fee: Math.round(totalSpend * 0.20) };
    if (totalSpend <= 11999) return { percent: "15%", fee: Math.round(totalSpend * 0.15) };
    if (totalSpend <= 19999) return { percent: "14%", fee: Math.round(totalSpend * 0.14) };
    if (totalSpend <= 29999) return { percent: "13%", fee: Math.round(totalSpend * 0.13) };
    if (totalSpend <= 44999) return { percent: "12%", fee: Math.round(totalSpend * 0.12) };
    if (totalSpend <= 59999) return { percent: "11%", fee: Math.round(totalSpend * 0.11) };
    if (totalSpend <= 74999) return { percent: "10%", fee: Math.round(totalSpend * 0.10) };
    if (totalSpend <= 99999) return { percent: "9%",  fee: Math.round(totalSpend * 0.09) };
    return { percent: "Custom", fee: 0 };
  } else {
    if (totalSpend <= 1999)  return { percent: "$400 flat", fee: 400 };
    if (totalSpend <= 5999)  return { percent: "20%", fee: Math.round(totalSpend * 0.20) };
    if (totalSpend <= 9999)  return { percent: "18%", fee: Math.round(totalSpend * 0.18) };
    if (totalSpend <= 19999) return { percent: "16%", fee: Math.round(totalSpend * 0.16) };
    if (totalSpend <= 34999) return { percent: "15%", fee: Math.round(totalSpend * 0.15) };
    return { percent: "Custom", fee: 0 };
  }
}

function FeeTable({ totalSpend, isEcommerce }: { totalSpend: number; isEcommerce: boolean }) {
  const ecomTiers = [
    { range: "$1 – $2,999",       percent: "$600 flat", min: 1,      max: 2999 },
    { range: "$3,000 – $7,499",   percent: "20%",       min: 3000,   max: 7499 },
    { range: "$7,500 – $11,999",  percent: "15%",       min: 7500,   max: 11999 },
    { range: "$12,000 – $19,999", percent: "14%",       min: 12000,  max: 19999 },
    { range: "$20,000 – $29,999", percent: "13%",       min: 20000,  max: 29999 },
    { range: "$30,000 – $44,999", percent: "12%",       min: 30000,  max: 44999 },
    { range: "$45,000 – $59,999", percent: "11%",       min: 45000,  max: 59999 },
    { range: "$60,000 – $74,999", percent: "10%",       min: 60000,  max: 74999 },
    { range: "$75,000 – $99,999", percent: "9%",        min: 75000,  max: 99999 },
    { range: "$100,000+",          percent: "Custom",    min: 100000, max: Infinity },
  ];
  const nonEcomTiers = [
    { range: "$1 – $1,999",       percent: "$400 flat", min: 1,     max: 1999 },
    { range: "$2,000 – $5,999",   percent: "20%",       min: 2000,  max: 5999 },
    { range: "$6,000 – $9,999",   percent: "18%",       min: 6000,  max: 9999 },
    { range: "$10,000 – $19,999", percent: "16%",       min: 10000, max: 19999 },
    { range: "$20,000 – $34,999", percent: "15%",       min: 20000, max: 34999 },
    { range: "$35,000+",           percent: "Custom",    min: 35000, max: Infinity },
  ];
  const tiers = isEcommerce ? ecomTiers : nonEcomTiers;
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: "oklch(0.12 0.02 240)" }}>
            <th className="text-left px-4 py-3 text-white font-medium">Monthly Ad Spend</th>
            <th className="text-left px-4 py-3 text-white font-medium">Management Fee</th>
            <th className="w-20"></th>
          </tr>
        </thead>
        <tbody>
          {tiers.map((t, i) => {
            const isActive = totalSpend >= t.min && totalSpend <= t.max;
            return (
              <tr key={i} className={isActive ? "font-semibold" : ""} style={{ background: isActive ? "oklch(0.95 0.04 145)" : i % 2 === 0 ? "white" : "oklch(0.98 0.005 120)" }}>
                <td className="px-4 py-3 text-gray-800">{t.range}</td>
                <td className="px-4 py-3" style={{ color: isActive ? "oklch(0.35 0.12 145)" : "oklch(0.4 0.01 120)" }}>{t.percent}</td>
                <td className="px-4 py-3 text-center">
                  {isActive && (
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ background: "oklch(0.42 0.12 145)" }}>YOU</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main ProposalView ────────────────────────────────────────────────────────
export default function ProposalView() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const proposalRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const { data, isLoading, error } = trpc.proposal.getBySlug.useQuery(
    { slug: slug! },
    { refetchInterval: (q) => q.state.data?.status === "generating" ? 3000 : false }
  );

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "oklch(0.97 0.01 90)" }}>
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" style={{ color: "oklch(0.42 0.12 145)" }} />
          <p className="text-gray-600 font-medium">Loading proposal...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "oklch(0.97 0.01 90)" }}>
        <div className="text-center">
          <AlertCircle className="w-10 h-10 mx-auto mb-4 text-red-500" />
          <p className="text-gray-800 font-semibold mb-2">Proposal not found</p>
          <Button variant="ghost" onClick={() => navigate("/")}>Go back</Button>
        </div>
      </div>
    );
  }

  if (data.status === "generating") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "oklch(0.97 0.01 90)" }}>
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "oklch(0.42 0.12 145)" }}>
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
            Building Your Proposal
          </h2>
          <p className="text-gray-500 mb-2">Researching <strong>{data.clientName}</strong>'s website, gathering industry data, and writing custom copy...</p>
          <p className="text-gray-400 text-sm">This usually takes 30–60 seconds. The page will update automatically.</p>
          <div className="mt-8 flex gap-2 justify-center">
            {[0,1,2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ background: "oklch(0.42 0.12 145)", animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (data.status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "oklch(0.97 0.01 90)" }}>
        <div className="text-center max-w-md px-6">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Generation Failed</h2>
          <p className="text-gray-500 mb-6">There was an error generating this proposal. Please go back and try again.</p>
          <Button onClick={() => navigate("/")} style={{ background: "oklch(0.42 0.12 145)" }}>Try Again</Button>
        </div>
      </div>
    );
  }

  const pd = data.proposalData as ProposalData;
  if (!pd) return null;

  const mgmtFee = getManagementFee(pd.totalMonthlySpend, pd.isEcommerce);
  // Images are stored in pd.images object from the generator
  const imgs = (pd as any).images || {};
  const heroImg = imgs.hero || imgs.campaign || "";
  const clientImgs = [imgs.hero, imgs.campaign, imgs.process1, imgs.process2, imgs.process3].filter(Boolean) as string[];
  // Copy fields from pd.copy object
  const copy = (pd as any).copy || {};

  return (
    <div className="min-h-screen bg-white">
      {/* Toolbar */}
      <div className="no-print sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-2 text-gray-600">
              <ArrowLeft className="w-4 h-4" />Back
            </Button>
            <div className="h-5 w-px bg-gray-200" />
            <span className="text-sm font-medium text-gray-700">{pd.clientName} — Proposal</span>
            {data.status === "ready" && <CheckCircle className="w-4 h-4 text-green-500" />}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
              <Share2 className="w-4 h-4" />{copied ? "Copied!" : "Share Link"}
            </Button>
            <Button size="sm" onClick={handlePrint} className="gap-2" style={{ background: "oklch(0.12 0.02 240)" }}>
              <Download className="w-4 h-4" />Download PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Proposal Content */}
      <div ref={proposalRef} className="proposal-content">

        {/* ── Section 1: Cover ─────────────────────────────────────────── */}
        <section className="proposal-avoid-break relative min-h-screen flex" style={{ background: "oklch(0.12 0.02 240)" }}>
          {heroImg && (
            <div className="absolute inset-0 opacity-30">
              <img src={heroImg} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to right, oklch(0.12 0.02 240) 40%, transparent)" }} />
            </div>
          )}
          <div className="relative z-10 flex flex-col justify-between w-full max-w-6xl mx-auto px-12 py-16">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "oklch(0.42 0.12 145)" }}>
                  <span className="text-white font-bold text-sm">N</span>
                </div>
                <span className="text-white font-semibold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>Nett Solutions</span>
              </div>
              <img src={ASSETS.googlePremier} alt="Google Premier Partner" className="h-16 object-contain" />
            </div>
            <div className="max-w-2xl">
              <p className="text-green-400 text-sm font-medium tracking-widest uppercase mb-4">Digital Advertising Proposal</p>
              <h1 className="text-5xl font-bold text-white leading-tight mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
                {pd.coverHeadline || `Growing ${pd.clientName} Through Strategic Digital Advertising`}
              </h1>
              <p className="text-white/70 text-xl leading-relaxed mb-10">
                {pd.coverSubheadline || `A customized paid media strategy designed to help ${pd.clientName} reach more customers, increase revenue, and outperform the competition.`}
              </p>
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-white/20" />
                <div className="text-right">
                  <p className="text-white font-semibold">{pd.salesRep}</p>
                  {pd.salesRepEmail && <p className="text-white/60 text-sm">{pd.salesRepEmail}</p>}
                  {pd.salesRepPhone && <p className="text-white/60 text-sm">{pd.salesRepPhone}</p>}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 2: Market Opportunity ────────────────────────────── */}
        <section className="proposal-avoid-break py-20 px-12 max-w-6xl mx-auto">
          <p className="text-green-600 text-xs font-semibold tracking-widest uppercase mb-3">Market Opportunity</p>
          <h2 className="text-4xl font-bold text-gray-900 mb-6 max-w-2xl" style={{ fontFamily: "'Playfair Display', serif" }}>
            {copy.marketHeadline || `The ${pd.industry} Market Is Growing — and the Timing Is Right`}
          </h2>
          {/* Stats grid from AI-generated marketStats array */}
          {copy.marketStats && copy.marketStats.length > 0 ? (
            <div className="grid grid-cols-4 gap-6 mb-10">
              {copy.marketStats.map((stat: { number: string; label: string }, i: number) => (
                <div key={i} className="p-6 rounded-2xl border border-gray-100 bg-gray-50 text-center">
                  <p className="text-3xl font-bold mb-2" style={{ color: "oklch(0.42 0.12 145)", fontFamily: "'Playfair Display', serif" }}>{stat.number}</p>
                  <p className="text-gray-600 text-sm leading-relaxed">{stat.label}</p>
                </div>
              ))}
            </div>
          ) : null}
          {/* Insights list */}
          {copy.marketInsights && copy.marketInsights.length > 0 ? (
            <div className="space-y-2 mb-8">
              {copy.marketInsights.map((insight: string, i: number) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="mt-1.5 w-2 h-2 rounded-full shrink-0" style={{ background: "oklch(0.42 0.12 145)" }} />
                  <p className="text-gray-700 text-base leading-relaxed">{insight}</p>
                </div>
              ))}
            </div>
          ) : null}
          <p className="text-gray-600 text-lg leading-relaxed max-w-3xl">
            {copy.marketIntro || `The digital advertising landscape presents a significant opportunity for ${pd.clientName}. With the right strategy and the right partner, the path to growth is clear.`}
          </p>
          {copy.marketSource && <p className="text-gray-400 text-xs mt-4">{copy.marketSource}</p>}
        </section>

        {/* ── Section 3: Goals ─────────────────────────────────────────── */}
        <section className="proposal-avoid-break py-20" style={{ background: "oklch(0.97 0.01 90)" }}>
          <div className="max-w-6xl mx-auto px-12">
            <p className="text-green-600 text-xs font-semibold tracking-widest uppercase mb-3">Our Goals Together</p>
            <h2 className="text-4xl font-bold text-gray-900 mb-10 max-w-2xl" style={{ fontFamily: "'Playfair Display', serif" }}>
            {copy.goalsHeadline || `What We're Here to Accomplish for ${pd.clientName}`}
          </h2>
          <div className="grid grid-cols-2 gap-6">
            {(copy.goalsList || [{ title: "Increase Revenue", body: pd.goals }]).map((g: { title: string; body?: string; description?: string }, i: number) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center mb-4 text-white text-sm font-bold" style={{ background: "oklch(0.42 0.12 145)" }}>
                    {i + 1}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>{g.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{g.body || g.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Section 4: Campaign Strategy ─────────────────────────────── */}
        <section className="proposal-avoid-break py-20">
          <div className="max-w-6xl mx-auto px-12">
            <p className="text-green-600 text-xs font-semibold tracking-widest uppercase mb-3">Campaign Strategy</p>
            <h2 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              {copy.campaignHeadline || "The Right Channels, The Right Message"}
            </h2>
            <p className="text-gray-500 mb-10 max-w-2xl">{copy.campaignIntro || `Here's how we'll reach ${pd.clientName}'s ideal customers across the channels that matter most.`}</p>

            {/* Layout B: Side image + card list */}
            <div className="grid grid-cols-5 gap-8 items-start">
              <div className="col-span-2 rounded-2xl overflow-hidden" style={{ minHeight: "400px" }}>
                {imgs.campaign ? (
                  <img src={imgs.campaign} alt={pd.clientName} className="w-full h-full object-cover" style={{ minHeight: "400px" }}
                    onError={(e) => { const el = e.target as HTMLImageElement; el.style.display='none'; }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: "oklch(0.12 0.02 240)", minHeight: "400px" }}>
                    <span className="text-white/30 text-lg font-medium">{pd.clientName}</span>
                  </div>
                )}
              </div>
              <div className="col-span-3 space-y-4">
                {pd.channels.map((ch, i) => (
                  <div key={i} className="flex gap-4 p-5 rounded-xl border border-gray-100 bg-white shadow-sm">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "oklch(0.42 0.12 145)" }}>
                      <ChannelLogo name={ch.name} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 text-sm">{ch.name}</h3>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "oklch(0.95 0.04 145)", color: "oklch(0.35 0.12 145)" }}>
                          {formatCurrency(ch.budget)}/mo
                        </span>
                      </div>
                      <p className="text-gray-500 text-xs leading-relaxed">
                        {copy.campaignDescriptions?.[ch.name] || pd.channelDescriptions?.[ch.name] || `Strategic ${ch.name} campaigns targeting ${pd.clientName}'s ideal customers with compelling ads and optimized bidding.`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 5: Our Process ────────────────────────────────────── */}
        <section className="proposal-avoid-break py-20" style={{ background: "oklch(0.97 0.01 90)" }}>
          <div className="max-w-6xl mx-auto px-12">
            <p className="text-green-600 text-xs font-semibold tracking-widest uppercase mb-3">Our Process</p>
            <h2 className="text-4xl font-bold text-gray-900 mb-10 max-w-2xl" style={{ fontFamily: "'Playfair Display', serif" }}>
              {copy.processHeadline || "How We Turn Ad Spend Into Real Results"}
            </h2>
            <div className="grid grid-cols-3 gap-6 mb-10">
              {(copy.processSteps || [
                { number: "01", title: "Discovery & Strategy", body: "We deep-dive into your business, competitors, and target audience to build a data-backed strategy from day one." },
                { number: "02", title: "Build & Launch", body: "Our team builds every campaign with precision — from keyword research and ad copy to audience targeting and bid strategy." },
                { number: "03", title: "Optimize & Scale", body: "We monitor performance daily, make data-driven adjustments, and scale what's working to maximize your return." },
              ]).slice(0, 3).map((s: { number?: string; step?: string; title: string; body?: string; description?: string }, i: number) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <span className="text-4xl font-bold" style={{ color: "oklch(0.9 0.04 145)", fontFamily: "'Playfair Display', serif" }}>{s.number || s.step}</span>
                  <h3 className="font-semibold text-gray-900 mt-3 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>{s.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{s.body || s.description}</p>
                </div>
              ))}
            </div>
            {/* Image strip */}
            <div className="grid grid-cols-3 gap-4 rounded-2xl overflow-hidden">
              {[imgs.process1 || imgs.hero, imgs.process2 || imgs.campaign, imgs.process3 || imgs.hero].map((img, i) => (
                img ? (
                  <div key={i} className="aspect-video overflow-hidden rounded-xl">
                    <img src={img} alt="" className="w-full h-full object-cover"
                      onError={(e) => { const el = e.target as HTMLImageElement; el.parentElement!.style.background='oklch(0.85 0.04 145)'; el.style.display='none'; }} />
                  </div>
                ) : (
                  <div key={i} className="aspect-video rounded-xl" style={{ background: "oklch(0.85 0.04 145)" }} />
                )
              ))}
            </div>
          </div>
        </section>

        {/* ── Section 6: Investment ─────────────────────────────────────── */}
        <section className="proposal-avoid-break py-20">
          <div className="max-w-6xl mx-auto px-12">
            <p className="text-green-600 text-xs font-semibold tracking-widest uppercase mb-3">Your Investment</p>
            <h2 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              Transparent Pricing, No Surprises
            </h2>
            <p className="text-gray-500 mb-10 max-w-2xl">Here's a complete breakdown of your monthly investment and how our management fee is calculated based on your total ad spend.</p>

            <div className="grid grid-cols-2 gap-10">
              <div>
                <h3 className="font-semibold text-gray-900 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Monthly Ad Spend Breakdown</h3>
                <div className="space-y-3 mb-6">
                  {pd.channels.map((ch, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "oklch(0.42 0.12 145)" }}>
                          <ChannelLogo name={ch.name} />
                        </div>
                        <span className="text-gray-700 text-sm">{ch.name}</span>
                      </div>
                      <span className="font-medium text-gray-900 text-sm">{formatCurrency(ch.budget)}/mo</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between py-2 pt-3">
                    <span className="font-semibold text-gray-900">Total Monthly Ad Spend</span>
                    <span className="font-bold text-gray-900 text-lg">{formatCurrency(pd.totalMonthlySpend)}/mo</span>
                  </div>
                </div>
                <div className="p-5 rounded-xl border-2 mb-4" style={{ borderColor: "oklch(0.42 0.12 145)", background: "oklch(0.97 0.03 145)" }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-900">Management Fee ({mgmtFee.percent})</span>
                    <span className="font-bold text-xl" style={{ color: "oklch(0.35 0.12 145)" }}>{formatCurrency(mgmtFee.fee)}/mo</span>
                  </div>
                  <p className="text-gray-500 text-xs">Based on total monthly ad spend of {formatCurrency(pd.totalMonthlySpend)}</p>
                </div>
                {pd.setupFee > 0 && (
                  <div className="flex items-center justify-between py-3 border-t border-gray-200">
                    <span className="text-gray-700">One-Time Setup Fee</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(pd.setupFee)}</span>
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {pd.isEcommerce ? "Ecommerce" : "Standard"} Fee Schedule
                </h3>
                <FeeTable totalSpend={pd.totalMonthlySpend} isEcommerce={pd.isEcommerce} />
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 7: Meet the Team ──────────────────────────────────── */}
        <section className="proposal-avoid-break py-20" style={{ background: "oklch(0.97 0.01 90)" }}>
          <div className="max-w-6xl mx-auto px-12">
            <p className="text-green-600 text-xs font-semibold tracking-widest uppercase mb-3">Meet the Team</p>
            <h2 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              The People Behind Your Results
            </h2>
            <p className="text-gray-500 mb-10 max-w-2xl italic" style={{ fontFamily: "'Playfair Display', serif" }}>
              "As we begin this journey to help {pd.clientName} grow, don't be surprised if we end up learning about each other's pets, families and share a lot of laughs along the way."
            </p>
            <div className="grid grid-cols-3 gap-6">
              {TEAM.map((member, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
                  <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 border-2" style={{ borderColor: "oklch(0.42 0.12 145)" }}>
                    <img src={member.img} alt={member.name} className="w-full h-full object-cover" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>{member.name}</h3>
                  <p className="text-gray-500 text-xs">{member.title}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Section 8: Why Nett Solutions ────────────────────────────── */}
        <section className="proposal-avoid-break py-20" style={{ background: "oklch(0.12 0.02 240)" }}>
          <div className="max-w-6xl mx-auto px-12">
            <div className="grid grid-cols-2 gap-16 items-start">
              <div>
                <p className="text-green-400 text-xs font-semibold tracking-widest uppercase mb-4">Why Nett Solutions</p>
                <h2 className="text-4xl font-bold text-white leading-tight mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {copy.whyHeadline || "We Don't Just Run Ads. We Build Growth Engines."}
                </h2>
                <p className="text-white/60 leading-relaxed">
                  {copy.whyIntro || "We're a Google Premier Partner — a designation earned by fewer than 3% of agencies worldwide. But credentials are only part of the story. What sets us apart is how we work: transparent, relentless, and always focused on your bottom line."}
                </p>
              </div>
              <div className="space-y-4">
                {(copy.whyCredentials || [
                  { title: "Google Premier Partner", body: "Top 3% of Google Partners globally — we have direct access to Google's tools, betas, and support." },
                  { title: "Full Transparency", body: "You own your accounts. You see every dollar spent. No black boxes, no hidden fees." },
                  { title: "Dedicated Team", body: "You get a real team, not a rotating cast of account managers. We know your business." },
                  { title: "Performance-Focused", body: "We're obsessed with ROI. Every decision we make is driven by data, not guesswork." },
                ]).map((p: { title: string; body?: string; description?: string }, i: number) => (
                  <div key={i} className="border-l-2 pl-5 py-1" style={{ borderColor: "oklch(0.42 0.12 145)" }}>
                    <h3 className="text-white font-semibold mb-1 text-sm">{p.title}</h3>
                    <p className="text-white/50 text-sm leading-relaxed">{p.body || p.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 9: CTA ────────────────────────────────────────────── */}
        <section className="proposal-avoid-break py-20" style={{ background: "oklch(0.18 0.04 240)" }}>
          <div className="max-w-6xl mx-auto px-12 text-center">
            <p className="text-green-400 text-xs font-semibold tracking-widest uppercase mb-4">Ready to Grow?</p>
            <h2 className="text-4xl font-bold text-white mb-6 max-w-2xl mx-auto" style={{ fontFamily: "'Playfair Display', serif" }}>
              {copy.ctaHeadline || `Let's Build Something Great Together, ${pd.clientName}`}
            </h2>
            <p className="text-white/60 mb-10 max-w-xl mx-auto leading-relaxed">
              {copy.ctaBody || `We're ready to put our expertise to work for you. Reach out to ${pd.salesRep} to schedule your strategy call and take the first step toward measurable growth.`}
            </p>
            <div className="inline-flex flex-col items-center gap-1 mb-14">
              <p className="text-white font-semibold text-lg">{pd.salesRep}</p>
              {pd.salesRepEmail && <p className="text-green-400">{pd.salesRepEmail}</p>}
              {pd.salesRepPhone && <p className="text-white/60">{pd.salesRepPhone}</p>}
            </div>

            {/* Accreditation Badges */}
            <div className="border-t border-white/10 pt-10">
              <p className="text-white/30 text-xs uppercase tracking-widest mb-6">Our Credentials & Partnerships</p>
              <div className="flex items-center justify-center gap-8 flex-wrap">
                <img src={ASSETS.googlePremier} alt="Google Premier Partner" className="h-12 object-contain" />
                <div className="bg-white rounded-lg p-2 flex items-center justify-center h-12">
                  <img src={ASSETS.metaBadge} alt="Meta Business Partner" className="h-8 object-contain" />
                </div>
                <div className="bg-white rounded-lg p-2 flex items-center justify-center h-12">
                  <img src={ASSETS.tiktokBadge} alt="TikTok for Business" className="h-8 object-contain" />
                </div>
                <img src={ASSETS.bing} alt="Bing Partner" className="h-12 object-contain" />
                <img src={ASSETS.bbb} alt="BBB Accredited" className="h-12 object-contain" />
                <img src={ASSETS.yelp} alt="Yelp Advertising Partner" className="h-12 object-contain" />
                <img src={ASSETS.linkedin} alt="LinkedIn Partner" className="h-12 object-contain" />
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
