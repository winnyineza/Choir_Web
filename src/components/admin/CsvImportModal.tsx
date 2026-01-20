import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createMember, getAllMembers, type Member } from "@/lib/dataService";
import { cn } from "@/lib/utils";

interface CsvImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface ParsedMember {
  name: string;
  email: string;
  phone: string;
  voice: Member["voice"];
  status: Member["status"];
  dateOfBirth?: string;
  error?: string;
}

interface ImportResult {
  success: number;
  failed: number;
  skipped: number;
  errors: { row: number; error: string }[];
}

export function CsvImportModal({ open, onOpenChange, onSuccess }: CsvImportModalProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedMember[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const resetState = () => {
    setFile(null);
    setParsedData([]);
    setResult(null);
  };

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file.",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    setIsValidating(true);
    setResult(null);

    try {
      const text = await selectedFile.text();
      const lines = text.split("\n").filter((line) => line.trim());
      const existingMembers = getAllMembers();
      const existingEmails = new Set(existingMembers.map((m) => m.email.toLowerCase()));

      // Parse header
      const header = lines[0].toLowerCase().split(",").map((h) => h.trim());
      const nameIdx = header.findIndex((h) => h === "name");
      const emailIdx = header.findIndex((h) => h === "email");
      const phoneIdx = header.findIndex((h) => h === "phone");
      const voiceIdx = header.findIndex((h) => h === "voice" || h === "voice part");
      const statusIdx = header.findIndex((h) => h === "status");
      const dobIdx = header.findIndex((h) => h === "date of birth" || h === "dob" || h === "birthday");

      if (nameIdx === -1 || emailIdx === -1) {
        throw new Error("CSV must have 'name' and 'email' columns");
      }

      // Parse rows
      const parsed: ParsedMember[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
        
        const name = values[nameIdx] || "";
        const email = values[emailIdx] || "";
        const phone = phoneIdx !== -1 ? values[phoneIdx] || "" : "";
        const voiceRaw = voiceIdx !== -1 ? values[voiceIdx] || "Soprano" : "Soprano";
        const statusRaw = statusIdx !== -1 ? values[statusIdx] || "Active" : "Active";
        const dob = dobIdx !== -1 ? values[dobIdx] || "" : "";

        // Validate voice
        const validVoices = ["Soprano", "Alto", "Tenor", "Bass"];
        const voice = validVoices.find((v) => v.toLowerCase() === voiceRaw.toLowerCase()) as Member["voice"] || "Soprano";

        // Validate status
        const validStatuses = ["Active", "Inactive", "Pending"];
        const status = validStatuses.find((s) => s.toLowerCase() === statusRaw.toLowerCase()) as Member["status"] || "Active";

        let error: string | undefined;

        if (!name) {
          error = "Name is required";
        } else if (!email) {
          error = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          error = "Invalid email format";
        } else if (existingEmails.has(email.toLowerCase())) {
          error = "Email already exists";
        }

        parsed.push({
          name,
          email,
          phone,
          voice,
          status,
          dateOfBirth: dob,
          error,
        });
      }

      setParsedData(parsed);
    } catch (err) {
      toast({
        title: "Failed to parse CSV",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  }, [toast]);

  const handleImport = async () => {
    setIsImporting(true);

    const result: ImportResult = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [],
    };

    for (let i = 0; i < parsedData.length; i++) {
      const member = parsedData[i];

      if (member.error) {
        result.skipped++;
        continue;
      }

      try {
        createMember({
          name: member.name,
          email: member.email,
          phone: member.phone,
          voice: member.voice,
          status: member.status,
          dateOfBirth: member.dateOfBirth,
        });
        result.success++;
      } catch (err) {
        result.failed++;
        result.errors.push({
          row: i + 2, // +2 for header and 0-indexing
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    setResult(result);
    setIsImporting(false);

    if (result.success > 0) {
      toast({
        title: "Import completed",
        description: `Successfully imported ${result.success} member(s).`,
      });
      onSuccess?.();
    }
  };

  const downloadTemplate = () => {
    const template = "name,email,phone,voice,status,date of birth\nJohn Doe,john@example.com,+250788123456,Tenor,Active,1990-01-15";
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "members_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const validCount = parsedData.filter((m) => !m.error).length;
  const errorCount = parsedData.filter((m) => m.error).length;

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) resetState(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Import Members from CSV
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file with member data. Required columns: name, email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Download */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-primary/10">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium text-sm">Download Template</p>
                <p className="text-xs text-muted-foreground">Start with our CSV template</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>

          {/* File Upload */}
          <div className="relative">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isImporting}
            />
            <div className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center transition-colors",
              file ? "border-primary bg-primary/5" : "border-primary/20 hover:border-primary/40"
            )}>
              {isValidating ? (
                <Loader2 className="w-8 h-8 mx-auto mb-3 text-primary animate-spin" />
              ) : file ? (
                <CheckCircle className="w-8 h-8 mx-auto mb-3 text-green-500" />
              ) : (
                <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
              )}
              <p className="font-medium">
                {file ? file.name : "Drop CSV file here or click to upload"}
              </p>
              {file && parsedData.length > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  {parsedData.length} row(s) found
                </p>
              )}
            </div>
          </div>

          {/* Preview */}
          {parsedData.length > 0 && !result && (
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 text-green-500 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  {validCount} valid
                </div>
                {errorCount > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 text-red-500 text-sm">
                    <XCircle className="w-4 h-4" />
                    {errorCount} errors
                  </div>
                )}
              </div>

              <div className="max-h-48 overflow-y-auto rounded-lg border border-primary/10">
                <table className="w-full text-sm">
                  <thead className="bg-secondary sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Email</th>
                      <th className="px-3 py-2 text-left">Voice</th>
                      <th className="px-3 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 10).map((member, i) => (
                      <tr key={i} className={cn(
                        "border-t border-primary/5",
                        member.error && "bg-red-500/5"
                      )}>
                        <td className="px-3 py-2">{member.name || "-"}</td>
                        <td className="px-3 py-2">{member.email || "-"}</td>
                        <td className="px-3 py-2">{member.voice}</td>
                        <td className="px-3 py-2">
                          {member.error ? (
                            <span className="text-red-500 text-xs">{member.error}</span>
                          ) : (
                            member.status
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.length > 10 && (
                  <p className="px-3 py-2 text-xs text-muted-foreground text-center border-t">
                    + {parsedData.length - 10} more rows
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className={cn(
              "p-4 rounded-xl",
              result.failed > 0 ? "bg-yellow-500/10 border border-yellow-500/20" : "bg-green-500/10 border border-green-500/20"
            )}>
              <div className="flex items-center gap-3 mb-3">
                {result.failed > 0 ? (
                  <AlertTriangle className="w-6 h-6 text-yellow-500" />
                ) : (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                )}
                <div>
                  <p className="font-semibold">Import Complete</p>
                  <p className="text-sm text-muted-foreground">
                    {result.success} imported, {result.skipped} skipped, {result.failed} failed
                  </p>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="mt-3 text-sm">
                  <p className="font-medium mb-1">Errors:</p>
                  <ul className="list-disc list-inside text-muted-foreground">
                    {result.errors.slice(0, 5).map((err, i) => (
                      <li key={i}>Row {err.row}: {err.error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { onOpenChange(false); resetState(); }}>
              {result ? "Close" : "Cancel"}
            </Button>
            {!result && (
              <Button
                variant="gold"
                onClick={handleImport}
                disabled={validCount === 0 || isImporting}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Import {validCount} Member(s)
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
