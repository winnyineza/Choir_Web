import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Copy, Eye, ExternalLink, FileCode2, Mail, Sparkles } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { getSettings, type Member, type Settings } from "@/lib/dataService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { buildEmailPreviewCatalog, type EmailPreview, type EmailPreviewCategory } from "@/lib/emailPreviewCatalog";

const defaultSettings: Settings = {
  choirName: "Serenades of Praise Choir",
  email: "theserenadeschoir@gmail.com",
  phone: "+250 780 623 144",
  address: "Kacyiru SDA Church, Kigali, Rwanda",
  momoNumber: "",
  bankAccount: "",
  bankName: "",
  memberPortalPin: "2024",
  scannerPin: "2024",
  contributionLockDay: 5,
};

const previewMember: Partial<Member> = {
  id: "preview-member",
  name: "Pacifique Mutegarugori",
  email: "pacifique@example.com",
  voice: "Tenor",
  phone: "+250 788 000 111",
};

const CATEGORY_LABELS: Record<EmailPreviewCategory, string> = {
  access: "Access & Onboarding",
  requests: "Requests & Approvals",
  contributions: "Contributions & Tickets",
  communication: "Communication",
  discipline: "Member Status & Discipline",
  automation: "Automated Reminders",
};

export default function EmailPreviews() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [selectedId, setSelectedId] = useState("verification");

  useEffect(() => {
    void getSettings()
      .then((next) => setSettings({ ...defaultSettings, ...next }))
      .catch(() => setSettings(defaultSettings));
  }, []);

  const previews = useMemo<EmailPreview[]>(() => {
    const portalUrl = `${window.location.origin}/member-portal`;
    const adminUrl = `${window.location.origin}/admin`;

    return buildEmailPreviewCatalog(settings, previewMember, portalUrl, adminUrl);
  }, [settings]);

  const selectedPreview = previews.find((item) => item.id === selectedId) ?? previews[0];
  const groupedPreviews = useMemo(() => {
    return previews.reduce<Record<EmailPreviewCategory, EmailPreview[]>>((acc, preview) => {
      acc[preview.category] = [...(acc[preview.category] || []), preview];
      return acc;
    }, {} as Record<EmailPreviewCategory, EmailPreview[]>);
  }, [previews]);

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.1),transparent_24%),linear-gradient(180deg,#080808_0%,#121212_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <Card className="border-primary/20 bg-card/95 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Internal Tool
              </div>
              <CardTitle className="font-display text-3xl text-primary">Email Preview Lab</CardTitle>
              <CardDescription className="max-w-2xl text-sm text-muted-foreground">
                Preview the real email families used across onboarding, approvals, finance, automation, and choir communication before triggering them in production.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link to="/api-docs">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  API Docs
                </Link>
              </Button>
              <Button
                variant="gold"
                onClick={async () => {
                  await navigator.clipboard.writeText(selectedPreview.html);
                  toast({ title: "Copied", description: `${selectedPreview.title} HTML copied to clipboard.` });
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy HTML
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div className="max-h-[72vh] space-y-4 overflow-y-auto pr-1">
              {Object.entries(groupedPreviews).map(([category, items]) => (
                <div key={category} className="space-y-2">
                  <div className="sticky top-0 z-10 rounded-lg bg-background/90 px-1 py-2 backdrop-blur-sm">
                    <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                      <span>{CATEGORY_LABELS[category as EmailPreviewCategory]}</span>
                      <span className="text-muted-foreground">{items.length}</span>
                    </div>
                  </div>
                  {items.map((preview) => (
                    <button
                      key={preview.id}
                      type="button"
                      onClick={() => setSelectedId(preview.id)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        preview.id === selectedPreview.id
                          ? "border-primary/30 bg-primary/10 shadow-[0_12px_32px_rgba(212,175,55,0.12)]"
                          : "border-primary/10 bg-secondary/20 hover:border-primary/20 hover:bg-secondary/30"
                      }`}
                    >
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Mail className={`h-4 w-4 ${preview.id === selectedPreview.id ? "text-primary" : "text-muted-foreground"}`} />
                        {preview.title}
                      </div>
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">{preview.description}</p>
                    </button>
                  ))}
                </div>
              ))}
            </div>

            <Tabs defaultValue="preview" className="space-y-4">
              <TabsList className="bg-secondary/30">
                <TabsTrigger value="preview">
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="html">
                  <FileCode2 className="mr-2 h-4 w-4" />
                  HTML
                </TabsTrigger>
              </TabsList>

              <TabsContent value="preview" className="mt-0">
                <Card className="overflow-hidden border-primary/15 bg-card/90">
                  <CardHeader className="border-b border-primary/10 bg-secondary/20">
                    <CardTitle className="text-lg">{selectedPreview.title}</CardTitle>
                    <CardDescription>{selectedPreview.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <iframe
                      title={`${selectedPreview.title} preview`}
                      srcDoc={selectedPreview.html}
                      sandbox="allow-same-origin"
                      className="h-[72vh] w-full bg-white"
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="html" className="mt-0">
                <Card className="border-primary/15 bg-card/90">
                  <CardHeader className="border-b border-primary/10 bg-secondary/20">
                    <CardTitle className="text-lg">Raw HTML</CardTitle>
                    <CardDescription>Useful for quick QA or pasting into external email testers.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <pre className="max-h-[72vh] overflow-auto whitespace-pre-wrap break-words bg-[#0f172a] p-5 text-xs leading-6 text-slate-100">
                      {selectedPreview.html}
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
