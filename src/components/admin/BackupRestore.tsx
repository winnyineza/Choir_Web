import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  downloadBackup,
  getBackupStats,
  recordBackupTimestamp,
} from "@/lib/backupService";
import {
  Download,
  Database,
  Loader2,
  Clock,
  FileArchive,
  Info,
} from "lucide-react";

export function BackupRestore() {
  const [isExporting, setIsExporting] = useState(false);
  const [stats, setStats] = useState<ReturnType<typeof getBackupStats> | null>(null);
  const { toast } = useToast();

  // Load stats on mount
  useEffect(() => {
    const load = async () => {
      const s = await getBackupStats();
      setStats(s);
    };
    void load();
  }, []);

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const result = await downloadBackup('auto');
      
      if (result.success) {
        await recordBackupTimestamp();
        setStats(await getBackupStats());
        
        toast({
          title: "Backup Created!",
          description: `Downloaded ${result.fileName} with ${result.recordCount} records.`,
        });
      } else {
        toast({
          title: "Backup Failed",
          description: "Could not create backup. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Backup Failed",
        description: "An error occurred while creating the backup.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  return (
    <Card className="card-glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" />
          Data Backup
        </CardTitle>
        <CardDescription className="mt-1">
          Export your choir data for safekeeping
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-secondary/50 text-center">
            <div className="text-2xl font-bold text-primary">
              {stats?.supabase?.tables ?? stats?.localStorage.tables ?? 0}
            </div>
            <div className="text-xs text-muted-foreground">Data Tables</div>
          </div>
          <div className="p-3 rounded-lg bg-secondary/50 text-center">
            <div className="text-2xl font-bold text-primary">
              {stats?.supabase?.records ?? stats?.localStorage.records ?? 0}
            </div>
            <div className="text-xs text-muted-foreground">Total Records</div>
          </div>
          <div className="p-3 rounded-lg bg-secondary/50 text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              Last Backup
            </div>
            <div className="text-sm font-medium mt-1">
              {formatDate(stats?.lastBackup)}
            </div>
          </div>
        </div>

        {/* Export Section */}
        <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Download className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Download Backup</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Download all your data as a ZIP file. Store it safely on Google Drive, 
                Dropbox, or any cloud storage for disaster recovery.
              </p>
              <Button
                onClick={handleExport}
                disabled={isExporting}
                className="mt-3"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Backup...
                  </>
                ) : (
                  <>
                    <FileArchive className="w-4 h-4 mr-2" />
                    Download Backup
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
              <p><strong>What's included:</strong> Members, Events, Contributions, Attendance, 
                 Leave Requests, Expenses, Announcements, Documents, Meeting Minutes, 
                 Inventory, Gallery, and more.</p>
              <p className="mt-1"><strong>Tip:</strong> Download a backup regularly and store 
                 it on cloud storage for safety.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
