import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, ExternalLink, FileJson } from "lucide-react";

export default function ApiDocs() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.12),transparent_28%),linear-gradient(180deg,#090909_0%,#121212_100%)] px-4 py-10 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <Card className="border-primary/20 bg-card/95 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <CardTitle className="font-display text-3xl text-primary">API Docs</CardTitle>
              <CardDescription className="max-w-2xl text-sm text-muted-foreground">
                Swagger-style documentation for the Netlify functions and integration endpoints used by the Serenades of Praise platform.
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
