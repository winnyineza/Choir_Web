import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, ExternalLink, FileJson, Layers3, Route, ServerCog } from "lucide-react";

const functionInventory = [
  { path: "/send-email", purpose: "General transactional email delivery." },
  { path: "/send-ticket-email", purpose: "Ticket confirmation emails for paid orders." },
  { path: "/send-push", purpose: "Push notification delivery to subscribed devices." },
  { path: "/google-oauth-start", purpose: "Starts Google Calendar OAuth." },
  { path: "/google-oauth-callback", purpose: "Handles the Google OAuth callback." },
  { path: "/google-meetings", purpose: "Creates, updates, deletes, and checks calendar meetings." },
  { path: "/google-birthday-sync", purpose: "Pushes birthday events to Google Calendar." },
  { path: "/daily-reminders", purpose: "Scheduled automation for reminders and digest jobs." },
];

const workflowCards = [
  {
    title: "Members & Portal",
    description: "Member records, statuses, profiles, invites, and portal access are app workflows backed by Supabase tables and client services.",
  },
  {
    title: "Contributions & Expenses",
    description: "Monthly dues, special contributions, statements, tolerance state, and treasury records are managed through Supabase-backed services rather than custom REST endpoints.",
  },
  {
    title: "Attendance & Leave",
    description: "Attendance tracking, locks, leave requests, approvals, and verification codes are handled in the app layer with selective email and automation support.",
  },
  {
    title: "Orders, Tickets & Content",
    description: "Ticket orders, promo codes, gallery content, releases, announcements, and surveys mostly live in the platform data layer, with email and payment integrations around them.",
  },
];

export default function ApiDocs() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.12),transparent_28%),linear-gradient(180deg,#090909_0%,#121212_100%)] px-4 py-10 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-primary/20 bg-card/95 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
            <CardHeader>
              <div className="mb-2 inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                <ServerCog className="h-3.5 w-3.5" />
                Custom Function Layer
              </div>
              <CardTitle className="font-display text-2xl text-primary">Documented Netlify APIs</CardTitle>
              <CardDescription>
                These are the custom server endpoints currently documented in OpenAPI. They power outbound email, push notifications, Google integrations, and scheduled automation.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {functionInventory.map((item) => (
                <div key={item.path} className="rounded-2xl border border-primary/10 bg-secondary/20 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Route className="h-4 w-4 text-primary" />
                    {item.path}
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.purpose}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-card/95 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
            <CardHeader>
              <div className="mb-2 inline-flex w-fit items-center gap-2 rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300">
                <Layers3 className="h-3.5 w-3.5" />
                Platform Workflow Layer
              </div>
              <CardTitle className="font-display text-2xl text-foreground">Supabase-Backed Workflows</CardTitle>
              <CardDescription>
                A large part of the platform is not exposed as standalone REST endpoints. These flows are handled by the client app and synced data services instead.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {workflowCards.map((item) => (
                <div key={item.title} className="rounded-2xl border border-border/70 bg-background/40 p-4">
                  <div className="text-sm font-semibold text-foreground">{item.title}</div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="border-primary/20 bg-card/95 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <CardTitle className="font-display text-3xl text-primary">API Docs</CardTitle>
              <CardDescription className="max-w-2xl text-sm text-muted-foreground">
                Swagger-style documentation for the Netlify functions and integration endpoints used by the Serenades of Praise platform. This section covers the server/API layer only.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <a href="/openapi.json" target="_blank" rel="noreferrer">
                  <FileJson className="mr-2 h-4 w-4" />
                  View JSON
                </a>
              </Button>
              <Button asChild variant="gold">
                <a href="/openapi.json" download>
                  <Download className="mr-2 h-4 w-4" />
                  Download Spec
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href="/admin" rel="noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Admin
                </a>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-2xl border border-primary/10 bg-white [&_.swagger-ui]:font-sans [&_.swagger-ui_.info]:mb-0 [&_.swagger-ui_.scheme-container]:bg-slate-50 [&_.swagger-ui_.topbar]:hidden [&_.swagger-ui_.wrapper]:px-0">
              <SwaggerUI url="/openapi.json" docExpansion="list" defaultModelsExpandDepth={1} displayRequestDuration />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
