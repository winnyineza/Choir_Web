import { useState, useEffect, useMemo } from "react";
import { getAllMembers, type Member } from "@/lib/dataService";
import { getAllAuditions, type Audition } from "@/lib/auditionService";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import {
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Music,
  Target,
  Info,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type VoicePart = "Soprano" | "Alto" | "Tenor" | "Bass";

interface VoiceStats {
  name: VoicePart;
  count: number;
  percentage: number;
  target: number;
  difference: number;
  color: string;
}

interface BalanceRecommendation {
  type: "warning" | "success" | "info";
  message: string;
  voicePart?: VoicePart;
}

// Ideal voice ratios for a balanced SATB choir
const IDEAL_RATIOS: Record<VoicePart, number> = {
  Soprano: 30, // 30%
  Alto: 25,    // 25%
  Tenor: 20,   // 20%
  Bass: 25,    // 25%
};

const VOICE_COLORS: Record<VoicePart, string> = {
  Soprano: "#F59E0B", // Amber
  Alto: "#10B981",    // Emerald
  Tenor: "#3B82F6",   // Blue
  Bass: "#8B5CF6",    // Purple
};

export function VoiceBalanceTracker() {
  const [members, setMembers] = useState<Member[]>([]);
  const [auditions, setAuditions] = useState<Audition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    const [activeMembers, allAuditions] = await Promise.all([
      Promise.resolve(getAllMembers().filter((m) => m.status === "Active")),
      getAllAuditions(),
    ]);
    setMembers(activeMembers);
    setAuditions(allAuditions);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const voiceStats = useMemo((): VoiceStats[] => {
    const total = members.length;
    if (total === 0) return [];

    const counts: Record<VoicePart, number> = {
      Soprano: 0,
      Alto: 0,
      Tenor: 0,
      Bass: 0,
    };

    members.forEach(m => {
      if (counts[m.voice] !== undefined) {
        counts[m.voice]++;
      }
    });

    return (Object.keys(counts) as VoicePart[]).map(voice => {
      const count = counts[voice];
      const percentage = Math.round((count / total) * 100);
      const target = IDEAL_RATIOS[voice];
      const difference = percentage - target;

      return {
        name: voice,
        count,
        percentage,
        target,
        difference,
        color: VOICE_COLORS[voice],
      };
    });
  }, [members]);

  const recommendations = useMemo((): BalanceRecommendation[] => {
    const recs: BalanceRecommendation[] = [];
    const total = members.length;

    if (total === 0) {
      recs.push({
        type: "info",
        message: "No active members to analyze. Add members to see voice balance recommendations.",
      });
      return recs;
    }

    voiceStats.forEach(stat => {
      if (stat.difference < -10) {
        recs.push({
          type: "warning",
          message: `${stat.name} section is significantly understaffed (${stat.percentage}% vs ${stat.target}% ideal). Consider recruiting ${Math.ceil((stat.target - stat.percentage) * total / 100)} more singers.`,
          voicePart: stat.name,
        });
      } else if (stat.difference > 10) {
        recs.push({
          type: "info",
          message: `${stat.name} section is overstaffed (${stat.percentage}% vs ${stat.target}% ideal). May need to limit new ${stat.name} auditions.`,
          voicePart: stat.name,
        });
      }
    });

    // Check pending auditions
    const pendingAuditions = auditions.filter(a => a.status === "scheduled" || a.status === "completed");
    if (pendingAuditions.length > 0) {
      const voiceNeeds = voiceStats.filter(s => s.difference < -5).map(s => s.name);
      const matchingAuditions = pendingAuditions.filter(a => 
        a.recommendedVoice && voiceNeeds.includes(a.recommendedVoice)
      );
      if (matchingAuditions.length > 0) {
        recs.push({
          type: "success",
          message: `${matchingAuditions.length} pending audition(s) could help fill needed voice parts.`,
        });
      }
    }

    if (recs.length === 0) {
      recs.push({
        type: "success",
        message: "Voice distribution is well-balanced! All sections are within acceptable ranges.",
      });
    }

    return recs;
  }, [voiceStats, auditions, members.length]);

  const balanceScore = useMemo(() => {
    if (voiceStats.length === 0) return 0;
    // Calculate how close we are to ideal (100 = perfect, 0 = completely off)
    const totalDeviation = voiceStats.reduce((sum, stat) => sum + Math.abs(stat.difference), 0);
    // Max possible deviation is 200 (if all in one section)
    return Math.max(0, Math.round(100 - (totalDeviation / 2)));
  }, [voiceStats]);

  const chartData = voiceStats.map(stat => ({
    name: stat.name,
    current: stat.count,
    ideal: Math.round((stat.target / 100) * members.length),
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Music className="w-6 h-6 text-primary" />
            Voice Balance Tracker
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Monitor and optimize your choir's voice part distribution
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Balance Score Card */}
      <div className="card-glass rounded-xl p-6 border border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Overall Balance Score</p>
            <div className="flex items-center gap-3 mt-1">
              <span className={cn(
                "text-4xl font-bold",
                balanceScore >= 80 ? "text-green-500" :
                balanceScore >= 60 ? "text-yellow-500" : "text-red-500"
              )}>
                {balanceScore}%
              </span>
              <div className="flex items-center gap-1">
                {balanceScore >= 80 ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : balanceScore >= 60 ? (
                  <Info className="w-5 h-5 text-yellow-500" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                )}
                <span className="text-sm text-muted-foreground">
                  {balanceScore >= 80 ? "Excellent" :
                   balanceScore >= 60 ? "Good" : "Needs Attention"}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Active Members</p>
            <p className="text-3xl font-bold">{members.length}</p>
          </div>
        </div>
      </div>

      {/* Voice Distribution Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {voiceStats.map(stat => (
          <div
            key={stat.name}
            className="card-glass rounded-xl p-4 border"
            style={{ borderColor: `${stat.color}40` }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold" style={{ color: stat.color }}>
                {stat.name}
              </span>
              <div className="flex items-center gap-1">
                {stat.difference > 5 ? (
                  <TrendingUp className="w-4 h-4 text-yellow-500" />
                ) : stat.difference < -5 ? (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{stat.count}</span>
              <span className="text-sm text-muted-foreground">
                ({stat.percentage}%)
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Target className="w-3 h-3" />
              <span>Target: {stat.target}%</span>
              <span className={cn(
                "ml-auto font-medium",
                stat.difference > 5 ? "text-yellow-500" :
                stat.difference < -5 ? "text-red-500" : "text-green-500"
              )}>
                {stat.difference > 0 ? "+" : ""}{stat.difference}%
              </span>
            </div>
            {/* Progress bar */}
            <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (stat.percentage / stat.target) * 100)}%`,
                  backgroundColor: stat.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Pie Chart */}
        <div className="card-glass rounded-xl p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Current Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={voiceStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="count"
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                >
                  {voiceStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${value} members`,
                    name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart - Current vs Ideal */}
        <div className="card-glass rounded-xl p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Current vs Ideal
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={8}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="current"
                  name="Current"
                  fill="#3B82F6"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="ideal"
                  name="Ideal"
                  fill="#94A3B8"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="card-glass rounded-xl p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-primary" />
          Recommendations
        </h3>
        <div className="space-y-3">
          {recommendations.map((rec, index) => (
            <div
              key={index}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg",
                rec.type === "warning" && "bg-red-500/10 border border-red-500/20",
                rec.type === "success" && "bg-green-500/10 border border-green-500/20",
                rec.type === "info" && "bg-blue-500/10 border border-blue-500/20"
              )}
            >
              {rec.type === "warning" ? (
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              ) : rec.type === "success" ? (
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              )}
              <p className="text-sm">{rec.message}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Voice Part Details Table */}
      <div className="card-glass rounded-xl p-6">
        <h3 className="font-semibold mb-4">Detailed Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3">Voice Part</th>
                <th className="text-center py-2 px-3">Members</th>
                <th className="text-center py-2 px-3">Current %</th>
                <th className="text-center py-2 px-3">Target %</th>
                <th className="text-center py-2 px-3">Variance</th>
                <th className="text-center py-2 px-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {voiceStats.map(stat => (
                <tr key={stat.name} className="border-b border-border/50">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: stat.color }}
                      />
                      <span className="font-medium">{stat.name}</span>
                    </div>
                  </td>
                  <td className="text-center py-3 px-3">{stat.count}</td>
                  <td className="text-center py-3 px-3">{stat.percentage}%</td>
                  <td className="text-center py-3 px-3">{stat.target}%</td>
                  <td className="text-center py-3 px-3">
                    <span className={cn(
                      "font-medium",
                      stat.difference > 5 ? "text-yellow-500" :
                      stat.difference < -5 ? "text-red-500" : "text-green-500"
                    )}>
                      {stat.difference > 0 ? "+" : ""}{stat.difference}%
                    </span>
                  </td>
                  <td className="text-center py-3 px-3">
                    {Math.abs(stat.difference) <= 5 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 text-green-500 text-xs">
                        <CheckCircle className="w-3 h-3" />
                        Balanced
                      </span>
                    ) : stat.difference > 5 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-xs">
                        <TrendingUp className="w-3 h-3" />
                        Over
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/10 text-red-500 text-xs">
                        <TrendingDown className="w-3 h-3" />
                        Under
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
