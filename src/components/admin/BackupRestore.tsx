import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  downloadBackup,
  restoreFromFile,
  getBackupStats,
  recordBackupTimestamp,
  type BackupMetadata,
} from "@/lib/backupService";
import {
  Download,
  Upload,
  Database,
  HardDrive,
  Server,
  CheckCircle,
  AlertCircle,
  Loader2,
  Clock,
  FileArchive,
  RefreshCw,
  Shield,
  Info,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function BackupRestore() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [stats, setStats] = useState<ReturnType<typeof getBackupStats> | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [lastImportResult, setLastImportResult] = useState<{
    success: boolean;
    restored: number;
    errors: string[];
    metadata: BackupMetadata | null;
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const isConnected = isSupabaseConfigured();

  // Load stats on mount
  useEffect(() => {
    setStats(getBackupStats());
  }, []);

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const result = await downloadBackup('auto');
      
      if (result.success) {
        recordBackupTimestamp();
        setStats(getBackupStats());
        
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.zip')) {
        toast({
          title: "Invalid File",
          description: "Please select a valid backup ZIP file.",
          variant: "destructive",
        });
        return;
      }
      setPendingFile(file);
      setShowRestoreConfirm(true);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRestore = async () => {
    if (!pendingFile) return;
    
    setShowRestoreConfirm(false);
    setIsImporting(true);
    setImportProgress(10);
    setLastImportResult(null);

    try {
      setImportProgress(30);
      
      const result = await restoreFromFile(pendingFile, 'both');
      
      setImportProgress(90);
      setLastImportResult(result);
      
      if (result.success) {
        toast({
          title: "Restore Complete!",
          description: `Successfully restored ${result.restored} records.`,
        });
        setStats(getBackupStats());
      } else {
        toast({
          title: "Restore Completed with Errors",
          description: `Restored ${result.restored} records. ${result.errors.length} errors occurred.`,
          variant: "destructive",
        });
      }
      
      setImportProgress(100);
    } catch (error) {
      toast({
        title: "Restore Failed",
        description: "An error occurred while restoring the backup.",
        variant: "destructive",
      });
      setLastImportResult({
        success: false,
        restored: 0,
        errors: ['Failed to process backup file'],
        metadata: null,
      });
    } finally {
      setIsImporting(false);
      setPendingFile(null);
      setTimeout(() => setImportProgress(0), 2000);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  return (
    <>
      <Card className="card-glass">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                Backup & Restore
              </CardTitle>
              <CardDescription className="mt-1">
                Export your data as a ZIP file or restore from a backup
              </CardDescription>
            </div>
            <Badge variant={isConnected ? "default" : "secondary"}>
              {isConnected ? (
                <>
                  <Server className="w-3 h-3 mr-1" />
                  Supabase Connected
                </>
              ) : (
                <>
                  <HardDrive className="w-3 h-3 mr-1" />
                  Local Only
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-secondary/50 text-center">
              <div className="text-2xl font-bold text-primary">
                {stats?.localStorage.tables || 0}
              </div>
              <div className="text-xs text-muted-foreground">Data Tables</div>
            </div>
            <div className="p-3 rounded-lg bg-secondary/50 text-center">
              <div className="text-2xl font-bold text-primary">
                {stats?.localStorage.records || 0}
              </div>
              <div className="text-xs text-muted-foreground">Total Records</div>
            </div>
            <div className="p-3 rounded-lg bg-secondary/50 text-center col-span-2">
              <div className="flex items-center justify-center gap-1 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Last Backup:</span>
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
                <h3 className="font-semibold text-foreground">Export Backup</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Download all your data as a ZIP file. Store it safely on Google Drive, 
                  Dropbox, or any cloud storage.
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

          {/* Import Section */}
          <div className="p-4 rounded-lg border border-orange-500/20 bg-orange-500/5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                <Upload className="w-5 h-5 text-orange-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Restore from Backup</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload a previously exported ZIP file to restore your data.
                  This will merge with existing data.
                </p>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".zip"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                  className="mt-3"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Restoring...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Select Backup File
                    </>
                  )}
                </Button>

                {/* Progress bar */}
                {importProgress > 0 && (
                  <div className="mt-3">
                    <Progress value={importProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {importProgress < 100 ? 'Restoring data...' : 'Complete!'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Last Import Result */}
          {lastImportResult && (
            <div className={`p-4 rounded-lg border ${
              lastImportResult.success 
                ? 'border-green-500/20 bg-green-500/5' 
                : 'border-red-500/20 bg-red-500/5'
            }`}>
              <div className="flex items-start gap-3">
                {lastImportResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                )}
                <div>
                  <h4 className={`font-medium ${
                    lastImportResult.success ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {lastImportResult.success ? 'Restore Successful' : 'Restore Completed with Errors'}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Restored {lastImportResult.restored} records
                    {lastImportResult.metadata && (
                      <> from backup created on {formatDate(lastImportResult.metadata.createdAt)}</>
                    )}
                  </p>
                  {lastImportResult.errors.length > 0 && (
                    <div className="mt-2 p-2 rounded bg-red-500/10 text-xs text-red-600">
                      <p className="font-medium">Errors:</p>
                      <ul className="list-disc pl-4 mt-1">
                        {lastImportResult.errors.slice(0, 5).map((error, i) => (
                          <li key={i}>{error}</li>
                        ))}
                        {lastImportResult.errors.length > 5 && (
                          <li>...and {lastImportResult.errors.length - 5} more</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-600 space-y-1">
                <p><strong>What's included in backups:</strong></p>
                <p>Members, Events, Contributions, Attendance, Leave Requests, Expenses, 
                   Announcements, Documents, Meeting Minutes, Inventory, Gallery, 
                   Admin Users, Audit Logs, and more.</p>
                <p className="mt-2"><strong>Tip:</strong> Schedule regular backups and store them 
                   on Google Drive or another cloud service for safety.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Restore Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showRestoreConfirm}
        onConfirm={handleRestore}
        onCancel={() => {
          setShowRestoreConfirm(false);
          setPendingFile(null);
        }}
        title="Restore from Backup?"
        description={`This will restore data from "${pendingFile?.name}". Existing records with the same IDs will be updated. This action cannot be undone.`}
        confirmText="Restore"
        cancelText="Cancel"
        variant="default"
      />
    </>
  );
}
