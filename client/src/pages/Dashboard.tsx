import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, ExternalLink, FileText, Clock, CheckCircle, AlertCircle } from "lucide-react";

const SESSION_KEY = "nett_auth";

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function StatusBadge({ status }: { status: string }) {
  if (status === "ready") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
      <CheckCircle className="w-3 h-3" />Ready
    </span>
  );
  if (status === "generating") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
      <Loader2 className="w-3 h-3 animate-spin" />Generating
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
      <AlertCircle className="w-3 h-3" />Error
    </span>
  );
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  const isAuthenticated = sessionStorage.getItem(SESSION_KEY) === "true";

  const { data: proposals, isLoading } = trpc.proposal.list.useQuery(undefined, {
    refetchInterval: (query) => {
      const data = query.state.data;
      if (Array.isArray(data) && data.some((p) => p.status === "generating")) return 3000;
      return false;
    },
  });

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.97 0.01 90)" }}>
      <header className="sticky top-0 z-50 border-b border-black/10 bg-white/95 backdrop-blur">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "oklch(0.42 0.12 145)" }}>
              <span className="text-white text-xs font-bold">N</span>
            </div>
            <span className="font-semibold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>Proposal Dashboard</span>
          </div>
          <Button size="sm" onClick={() => navigate("/")} className="gap-2" style={{ background: "oklch(0.42 0.12 145)" }}>
            <Plus className="w-4 h-4" />New Proposal
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>All Proposals</h1>
          <p className="text-gray-500 text-sm">Click any proposal to view or share it with the prospect.</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : !proposals || proposals.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No proposals yet</h3>
            <p className="text-gray-400 text-sm mb-6">Generate your first proposal to get started.</p>
            <Button onClick={() => navigate("/")} style={{ background: "oklch(0.42 0.12 145)" }}>
              <Plus className="w-4 h-4 mr-2" />Create First Proposal
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sales Rep</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Monthly Spend</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {proposals.map((p, i) => (
                  <tr
                    key={p.slug}
                    className={`border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${i === proposals.length - 1 ? "border-b-0" : ""}`}
                    onClick={() => navigate("/proposal/" + p.slug)}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{p.clientName}</p>
                        <p className="text-gray-400 text-xs mt-0.5 truncate max-w-[180px]">{p.clientWebsite}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{p.salesRep}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      ${(p.totalMonthlySpend || 0).toLocaleString()}/mo
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={p.status} /></td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />{formatDate(p.createdAt)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={e => { e.stopPropagation(); navigate("/proposal/" + p.slug); }}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
