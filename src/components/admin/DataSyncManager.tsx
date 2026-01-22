import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { isSupabaseConfigured } from "@/lib/supabase";
import { syncLocalStorageToSupabase } from "@/lib/supabaseDataService";
import { 
  Database, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Server, 
  HardDrive,
  RefreshCw
} from "lucide-react";

export function DataSyncManager() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    members: number;
    events: number;
    contributions: number;
  } | null>(null);
  const { toast } = useToast();

  const isConfigured = isSupabaseConfigured();

  // Count localStorage items
  const localMembers = JSON.parse(localStorage.getItem('serenades_members') || '[]').length;
  const localEvents = JSON.parse(localStorage.getItem('serenades_events') || '[]').length;
  const localContributions = JSON.parse(localStorage.getItem('choir_contributions') || '[]').length;

  const handleSync = async () => {
    if (!isConfigured) {
      toast({
        title: "Supabase Not Configured",
        description: "Please add your Supabase credentials to .env file first.",
        variant: "destructive",
      });
      return;
    }

    setIsSyncing(true);
    setSyncResult(null);

    try {
      const result = await syncLocalStorageToSupabase();
      setSyncResult(result);
      
      toast({
        title: "Sync Complete!",
        description: `Synced ${result.members} members, ${result.events} events, ${result.contributions} contributions to Supabase.`,
      });
    } catch (error: any) {
      toast({
        title: "Sync Failed",
        description: error.message || "An error occurred during sync.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Card className="card-glass">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              Database Migration
            </CardTitle>
            <CardDescription className="mt-1">
              Sync your localStorage data to Supabase cloud database
            </CardDescription>
          </div>
          <Badge variant={isConfigured ? "default" : "secondary"}>
            {isConfigured ? (
              <>
                <CheckCircle className="w-3 h-3 mr-1" />
                Connected
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3 mr-1" />
                Not Configured
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Cards */}
        <div className="grid grid-cols-2 gap-4">
          {/* localStorage Status */}
          <div className="p-4 rounded-lg bg-secondary/50 border border-primary/10">
            <div className="flex items-center gap-2 mb-3">
              <HardDrive className="w-4 h-4 text-orange-500" />
              <span className="font-medium text-sm">Local Storage</span>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>{localMembers} members</p>
              <p>{localEvents} events</p>
              <p>{localContributions} contributions</p>
            </div>
          </div>

          {/* Supabase Status */}
          <div className="p-4 rounded-lg bg-secondary/50 border border-primary/10">
            <div className="flex items-center gap-2 mb-3">
              <Server className="w-4 h-4 text-green-500" />
              <span className="font-medium text-sm">Supabase Cloud</span>
            </div>
            {isConfigured ? (
              <div className="space-y-1 text-sm text-muted-foreground">
                {syncResult ? (
                  <>
                    <p>{syncResult.members} members synced</p>
                    <p>{syncResult.events} events synced</p>
                    <p>{syncResult.contributions} contributions synced</p>
                  </>
                ) : (
                  <p>Ready to sync</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Add credentials to .env
              </p>
            )}
          </div>
        </div>

        {/* Sync Button */}
        <div className="flex flex-col gap-3">
          <Button
            onClick={handleSync}
            disabled={!isConfigured || isSyncing || (localMembers === 0 && localEvents === 0)}
            className="w-full"
          >
            {isSyncing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Syncing Data...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Sync to Supabase
              </>
            )}
          </Button>

          {syncResult && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Successfully synced {syncResult.members + syncResult.events + syncResult.contributions} records!
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm">
          <p className="text-blue-600 font-medium mb-1">How it works:</p>
          <ul className="text-blue-600/80 space-y-1 text-xs">
            <li>• Your localStorage data is uploaded to Supabase</li>
            <li>• Existing records are updated (upsert)</li>
            <li>• localStorage remains as a fallback cache</li>
            <li>• Run this once to migrate your existing data</li>
          </ul>
        </div>

        {!isConfigured && (
          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-sm">
            <p className="text-yellow-600 font-medium mb-1">Setup Required:</p>
            <ol className="text-yellow-600/80 space-y-1 text-xs list-decimal pl-4">
              <li>Create a Supabase project at supabase.com</li>
              <li>Copy Project URL and anon key from Settings → API</li>
              <li>Add them to your .env file</li>
              <li>Run the schema.sql in Supabase SQL Editor</li>
              <li>Restart the dev server</li>
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
