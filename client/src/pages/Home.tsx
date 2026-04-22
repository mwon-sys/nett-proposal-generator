import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, Lock, Loader2, ChevronRight, LayoutDashboard, Upload, X, ImageIcon } from "lucide-react";

const SALES_REPS = ["Joe Mounsey", "Ally V.", "Connor", "Mike Won", "Brandon", "Sean"];
const AD_CHANNELS = ["Google Search","Google Performance Max","Google Maps","Google Display","YouTube","Meta Ads","TikTok Ads","Bing/Microsoft Ads","LinkedIn Ads","Pinterest Ads"];
interface Channel { name: string; budget: number; }
const SESSION_KEY = "nett_auth";

export default function Home() {
  const [, navigate] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientWebsite, setClientWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [isEcommerce, setIsEcommerce] = useState(false);
  const [goals, setGoals] = useState("");
  const [channels, setChannels] = useState<Channel[]>([{ name: "Google Search", budget: 0 }]);
  const [setupFee, setSetupFee] = useState(0);
  const [salesRep, setSalesRep] = useState("");
  const [salesRepEmail, setSalesRepEmail] = useState("");
  const [salesRepPhone, setSalesRepPhone] = useState("");

  const [uploadedImages, setUploadedImages] = useState<{ url: string; preview: string; name: string }[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const verifyMutation = trpc.proposal.verifyPassword.useMutation();
  const createMutation = trpc.proposal.create.useMutation();
  const uploadImageMutation = trpc.proposal.uploadImage.useMutation();

  const handleImageFiles = async (files: FileList | null) => {
    if (!files) return;
    const remaining = 6 - uploadedImages.length;
    const toProcess = Array.from(files).slice(0, remaining);
    if (toProcess.length === 0) { toast.error("Maximum 6 images allowed"); return; }
    setUploadingCount(prev => prev + toProcess.length);
    for (const file of toProcess) {
      if (!file.type.startsWith("image/")) { toast.error(`${file.name} is not an image`); setUploadingCount(prev => prev - 1); continue; }
      if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} exceeds 10MB limit`); setUploadingCount(prev => prev - 1); continue; }
      const preview = URL.createObjectURL(file);
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64 = e.target?.result as string;
          const { url } = await uploadImageMutation.mutateAsync({ base64, filename: file.name });
          setUploadedImages(prev => [...prev, { url, preview, name: file.name }]);
        } catch { toast.error(`Failed to upload ${file.name}`); }
        finally { setUploadingCount(prev => prev - 1); }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (idx: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== idx));
  };

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored === "true") setIsAuthenticated(true);
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    const result = await verifyMutation.mutateAsync({ password });
    if (result.valid) { sessionStorage.setItem(SESSION_KEY, "true"); setIsAuthenticated(true); }
    else setPasswordError("Incorrect password. Please try again.");
  };

  const addChannel = () => setChannels(prev => [...prev, { name: "Google Search", budget: 0 }]);
  const removeChannel = (idx: number) => setChannels(prev => prev.filter((_, i) => i !== idx));
  const updateChannel = (idx: number, field: keyof Channel, value: string | number) =>
    setChannels(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  const totalSpend = channels.reduce((s, c) => s + (c.budget || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salesRep) { toast.error("Please select a sales rep"); return; }
    if (channels.some(c => !c.name || c.budget <= 0)) { toast.error("All ad channels need a name and budget > $0"); return; }
    try {
      const result = await createMutation.mutateAsync({ clientName, clientWebsite, industry, isEcommerce, goals, channels, setupFee, salesRep, salesRepEmail, salesRepPhone, uploadedImages: uploadedImages.map(i => i.url) });
      navigate("/proposal/" + result.slug);
    } catch { toast.error("Failed to start proposal generation. Please try again."); }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "oklch(0.12 0.02 240)" }}>
        <div className="w-full max-w-md px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "oklch(0.42 0.12 145)" }}>
                <Lock className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-semibold text-xl" style={{ fontFamily: "'Playfair Display', serif" }}>Nett Solutions</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Proposal Generator</h1>
            <p className="text-white/50 text-sm">Internal use only — team access required</p>
          </div>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <Input type="password" placeholder="Enter team password" value={password} onChange={e => setPassword(e.target.value)}
                className="h-12 text-center text-lg bg-white/10 border-white/20 text-white placeholder:text-white/40" autoFocus />
              {passwordError && <p className="text-red-400 text-sm text-center mt-2">{passwordError}</p>}
            </div>
            <Button type="submit" className="w-full h-12 text-base font-semibold" style={{ background: "oklch(0.42 0.12 145)" }} disabled={verifyMutation.isPending}>
              {verifyMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Access Tool"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.97 0.01 90)" }}>
      <header className="sticky top-0 z-50 border-b border-black/10 bg-white/95 backdrop-blur">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "oklch(0.42 0.12 145)" }}>
              <span className="text-white text-xs font-bold">N</span>
            </div>
            <span className="font-semibold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>Proposal Generator</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="gap-2 text-gray-600">
            <LayoutDashboard className="w-4 h-4" />Dashboard
          </Button>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>New Proposal</h1>
          <p className="text-gray-500">Fill in the prospect details below. The AI will research their website, write custom copy, and build a complete branded proposal.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>Client Information</h2>
            <div className="grid grid-cols-2 gap-5">
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Client / Company Name *</Label>
                <Input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="e.g. Cali Dumpling" required />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Website URL *</Label>
                <Input value={clientWebsite} onChange={e => setClientWebsite(e.target.value)} placeholder="https://example.com" required />
              </div>
              <div className="col-span-2">
                <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Industry / Business Type *</Label>
                <Input value={industry} onChange={e => setIndustry(e.target.value)} placeholder="e.g. Online dumpling ecommerce" required />
              </div>
              <div className="col-span-2">
                <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Campaign Goals *</Label>
                <textarea value={goals} onChange={e => setGoals(e.target.value)} placeholder="e.g. Increase online sales, increase foot traffic from people within 15 miles" required rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none" />
              </div>
              <div className="col-span-2 flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200">
                <div>
                  <p className="font-medium text-gray-900 text-sm">Ecommerce Business</p>
                  <p className="text-gray-500 text-xs mt-0.5">Toggle on for online stores; off for local/lead gen businesses</p>
                </div>
                <Switch checked={isEcommerce} onCheckedChange={setIsEcommerce} />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>Ad Channels & Budgets</h2>
              <div className="text-right">
                <p className="text-xs text-gray-500">Total Monthly Spend</p>
                <p className="text-lg font-bold" style={{ color: "oklch(0.42 0.12 145)" }}>${totalSpend.toLocaleString()}</p>
              </div>
            </div>
            <div className="space-y-3">
              {channels.map((ch, idx) => (
                <div key={idx} className="flex gap-3 items-center">
                  <div className="flex-1">
                    <Select value={ch.name} onValueChange={val => updateChannel(idx, "name", val)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{AD_CHANNELS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="w-36 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                    <Input type="number" min="0" value={ch.budget || ""} onChange={e => updateChannel(idx, "budget", parseInt(e.target.value) || 0)} placeholder="0" className="pl-7" />
                  </div>
                  <span className="text-xs text-gray-400 w-8 shrink-0">/mo</span>
                  {channels.length > 1 && (
                    <button type="button" onClick={() => removeChannel(idx)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={addChannel} className="mt-4 flex items-center gap-2 text-sm font-medium" style={{ color: "oklch(0.42 0.12 145)" }}>
              <Plus className="w-4 h-4" />Add Channel
            </button>
            <div className="mt-6 pt-6 border-t border-gray-100">
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">One-Time Setup Fee ($)</Label>
              <div className="relative w-48">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                <Input type="number" min="0" value={setupFee || ""} onChange={e => setSetupFee(parseInt(e.target.value) || 0)} placeholder="0" className="pl-7" />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>Sales Representative</h2>
            <div className="grid grid-cols-2 gap-5">
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Sales Rep *</Label>
                <Select value={salesRep} onValueChange={setSalesRep}>
                  <SelectTrigger><SelectValue placeholder="Select rep..." /></SelectTrigger>
                  <SelectContent>{SALES_REPS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Email</Label>
                <Input type="email" value={salesRepEmail} onChange={e => setSalesRepEmail(e.target.value)} placeholder="rep@nettsolutions.com" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Phone</Label>
                <Input value={salesRepPhone} onChange={e => setSalesRepPhone(e.target.value)} placeholder="(949) 000-0000" />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>Photos <span className="text-gray-400 font-normal text-sm">(Optional)</span></h2>
              <p className="text-gray-500 text-sm mt-1">Upload up to 6 photos to use in the proposal. If left blank, images will be pulled automatically from the client's website.</p>
              <p className="text-gray-400 text-xs mt-1">Slots: Cover · Goals · Campaign · Process 1 · Process 2 · Process 3</p>
            </div>

            {/* Upload drop zone */}
            {uploadedImages.length < 6 && (
              <label
                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors mb-4 ${
                  isDragging ? "border-green-400 bg-green-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={e => { e.preventDefault(); setIsDragging(false); handleImageFiles(e.dataTransfer.files); }}
              >
                <input type="file" accept="image/*" multiple className="hidden" onChange={e => handleImageFiles(e.target.files)} />
                {uploadingCount > 0 ? (
                  <><Loader2 className="w-6 h-6 animate-spin mb-2" style={{ color: "oklch(0.42 0.12 145)" }} /><span className="text-sm text-gray-500">Uploading {uploadingCount} image{uploadingCount > 1 ? 's' : ''}...</span></>
                ) : (
                  <><Upload className="w-6 h-6 mb-2 text-gray-400" /><span className="text-sm text-gray-500">Click to upload or drag & drop</span><span className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP up to 10MB each · {6 - uploadedImages.length} slot{6 - uploadedImages.length !== 1 ? 's' : ''} remaining</span></>
                )}
              </label>
            )}

            {/* Thumbnails */}
            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {uploadedImages.map((img, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                    <img src={img.preview} alt={img.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <button type="button" onClick={() => removeImage(idx)} className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-full bg-white flex items-center justify-center shadow">
                        <X className="w-4 h-4 text-gray-700" />
                      </button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1.5 py-0.5">
                      <p className="text-white text-[9px] truncate">{["Cover","Goals","Campaign","Process 1","Process 2","Process 3"][idx]}</p>
                    </div>
                  </div>
                ))}
                {/* Empty slots */}
                {Array.from({ length: 6 - uploadedImages.length }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="aspect-square rounded-lg border border-dashed border-gray-200 flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-gray-300" />
                  </div>
                ))}
              </div>
            )}
          </section>

          <Button type="submit" size="lg" className="w-full h-14 text-base font-semibold gap-2" style={{ background: "oklch(0.12 0.02 240)" }} disabled={createMutation.isPending || uploadingCount > 0}>
            {createMutation.isPending
              ? <><Loader2 className="w-5 h-5 animate-spin" /> Starting generation...</>
              : <><ChevronRight className="w-5 h-5" /> Generate Proposal</>
            }
          </Button>
        </form>
      </main>
    </div>
  );
}
