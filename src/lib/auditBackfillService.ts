import { addAuditLog, getAuditLog, type AuditLogEntry } from "./adminService";
import { getAllContributions, getAllContributionTypes, type Contribution, type ContributionType } from "./contributionService";

export interface BackfillActor {
  id: string;
  email: string;
  name: string;
}

export interface BackfillOptions {
  dryRun?: boolean;
  maxRecords?: number;
  sinceIso?: string;
}

export interface BackfillPreviewEntry {
  action: string;
  details: string;
  timestamp: string;
}

export interface BackfillResult {
  scanned: number;
  prepared: number;
  inserted: number;
  skipped: number;
  dryRun: boolean;
  preview: BackfillPreviewEntry[];
}

function toPreviewEntries(contributions: Contribution[], types: ContributionType[], since?: string): BackfillPreviewEntry[] {
  const sinceMs = since ? new Date(since).getTime() : 0;

  const contributionEntries = contributions
    .filter((entry) => new Date(entry.createdAt).getTime() >= sinceMs)
    .map((entry) => ({
      action: "CREATE_CONTRIBUTION",
      details: `Historical contribution: ${entry.memberName} - ${entry.typeName} (${entry.amount} RWF)`,
      timestamp: entry.createdAt,
    }));

  const typeEntries = types
    .filter((entry) => new Date(entry.createdAt).getTime() >= sinceMs)
    .map((entry) => ({
      action: "CREATE_CONTRIBUTION_TYPE",
      details: `Historical contribution type: ${entry.name} (${entry.amount} RWF)`,
      timestamp: entry.createdAt,
    }));

  return [...contributionEntries, ...typeEntries]
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export function buildContributionAuditBackfillPreview(
  contributions: Contribution[],
  types: ContributionType[],
  sinceIso?: string,
): BackfillPreviewEntry[] {
  return toPreviewEntries(contributions, types, sinceIso);
}

export async function backfillContributionAuditLogs(actor: BackfillActor, options: BackfillOptions = {}): Promise<BackfillResult> {
  const dryRun = options.dryRun ?? true;
  const maxRecords = options.maxRecords ?? 500;

  const [contributions, types, existingLogs] = await Promise.all([
    getAllContributions(),
    getAllContributionTypes(),
    getAuditLog(10000),
  ]);

  const preview = toPreviewEntries(contributions, types, options.sinceIso);
  const limitedPreview = preview.slice(0, maxRecords);

  const existingSignatureSet = new Set(
    existingLogs.map((entry: AuditLogEntry) => `${entry.action}::${entry.details}`)
  );

  let inserted = 0;
  let skipped = 0;

  if (!dryRun) {
    for (const entry of limitedPreview) {
      const signature = `${entry.action}::${entry.details}`;
      if (existingSignatureSet.has(signature)) {
        skipped += 1;
        continue;
      }

      await addAuditLog(
        actor,
        entry.action,
        `${entry.details} [BACKFILLED ${new Date(entry.timestamp).toISOString()}]`
      );
      inserted += 1;
    }
  } else {
    skipped = limitedPreview.filter((entry) => existingSignatureSet.has(`${entry.action}::${entry.details}`)).length;
  }

  return {
    scanned: preview.length,
    prepared: limitedPreview.length,
    inserted,
    skipped,
    dryRun,
    preview: limitedPreview,
  };
}
