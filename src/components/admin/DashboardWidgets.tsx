import { useMemo } from "react";
import { 
  Cake, 
  AlertTriangle, 
  TrendingUp, 
  Calendar,
  Users,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";
import { getAllMembers, type Member } from "@/lib/dataService";
import { getMemberContributionStatus } from "@/lib/contributionService";
import { getRecentSessions, getOverallAttendanceStats } from "@/lib/attendanceService";
import { cn } from "@/lib/utils";

// Birthday Widget - Shows upcoming birthdays this week
export function BirthdayWidget() {
  const upcomingBirthdays = useMemo(() => {
    const members = getAllMembers().filter(m => m.status === "Active" && m.dateOfBirth);
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    return members
      .map(member => {
        const dob = new Date(member.dateOfBirth!);
        const thisYearBirthday = new Date(
          today.getFullYear(),
          dob.getMonth(),
          dob.getDate()
        );
        
        // If birthday has passed this year, check next year
        if (thisYearBirthday < today) {
          thisYearBirthday.setFullYear(today.getFullYear() + 1);
        }

        const daysUntil = Math.ceil(
          (thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        return { member, daysUntil, date: thisYearBirthday };
      })
      .filter(({ daysUntil }) => daysUntil >= 0 && daysUntil <= 7)
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 5);
  }, []);

  if (upcomingBirthdays.length === 0) {
    return (
      <div className="card-glass rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Cake className="w-5 h-5 text-pink-500" />
          <h3 className="font-semibold text-sm">Upcoming Birthdays</h3>
        </div>
        <p className="text-sm text-muted-foreground">No birthdays this week</p>
      </div>
    );
  }

  return (
    <div className="card-glass rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Cake className="w-5 h-5 text-pink-500" />
        <h3 className="font-semibold text-sm">Upcoming Birthdays</h3>
        <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-500">
          {upcomingBirthdays.length}
        </span>
      </div>
      <div className="space-y-2">
        {upcomingBirthdays.map(({ member, daysUntil, date }) => (
          <div key={member.id} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-500 text-sm font-semibold">
              {member.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{member.name}</p>
              <p className="text-xs text-muted-foreground">
                {daysUntil === 0 ? "🎂 Today!" : 
                 daysUntil === 1 ? "Tomorrow" : 
                 `In ${daysUntil} days`}
              </p>
            </div>
            <span className="text-xs text-muted-foreground">
              {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Overdue Contributions Widget
export function OverdueContributionsWidget() {
  const overdueMembers = useMemo(() => {
    const members = getAllMembers().filter(m => m.status === "Active");
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    return members
      .map(member => {
        const status = getMemberContributionStatus(member.id);
        const unpaidMonths = status.monthlyDues.filter(
          m => m.status === "unpaid" && 
          (m.year < currentYear || (m.year === currentYear && m.month < currentMonth))
        );
        return { member, unpaidMonths: unpaidMonths.length, totalOwed: status.totalOwed };
      })
      .filter(m => m.unpaidMonths > 0)
      .sort((a, b) => b.unpaidMonths - a.unpaidMonths)
      .slice(0, 5);
  }, []);

  if (overdueMembers.length === 0) {
    return (
      <div className="card-glass rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
          <h3 className="font-semibold text-sm">Overdue Dues</h3>
        </div>
        <div className="flex items-center gap-2 text-green-500">
          <CheckCircle className="w-4 h-4" />
          <p className="text-sm">All members up to date!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-glass rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-5 h-5 text-yellow-500" />
        <h3 className="font-semibold text-sm">Overdue Dues</h3>
        <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500">
          {overdueMembers.length}
        </span>
      </div>
      <div className="space-y-2">
        {overdueMembers.map(({ member, unpaidMonths, totalOwed }) => (
          <div key={member.id} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500 text-sm font-semibold">
              {member.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{member.name}</p>
              <p className="text-xs text-muted-foreground">
                {unpaidMonths} month{unpaidMonths > 1 ? "s" : ""} overdue
              </p>
            </div>
            <span className="text-xs font-semibold text-yellow-500">
              {totalOwed.toLocaleString()} RWF
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Attendance Trend Widget
export function AttendanceTrendWidget() {
  const { sessions, trend } = useMemo(() => {
    const recentSessions = getRecentSessions().slice(0, 5);
    const stats = getOverallAttendanceStats();
    
    // Calculate trend (last 3 vs previous 3)
    let trend = 0;
    if (recentSessions.length >= 6) {
      const recent3 = recentSessions.slice(0, 3);
      const previous3 = recentSessions.slice(3, 6);
      
      const recentAvg = recent3.reduce((sum, s) => {
        const total = s.present + s.absent + s.excused + s.late;
        return sum + (total > 0 ? (s.present + s.late) / total * 100 : 0);
      }, 0) / 3;
      
      const previousAvg = previous3.reduce((sum, s) => {
        const total = s.present + s.absent + s.excused + s.late;
        return sum + (total > 0 ? (s.present + s.late) / total * 100 : 0);
      }, 0) / 3;
      
      trend = recentAvg - previousAvg;
    }
    
    return { sessions: recentSessions, trend, avgAttendance: stats.avgAttendance };
  }, []);

  return (
    <div className="card-glass rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-5 h-5 text-green-500" />
        <h3 className="font-semibold text-sm">Attendance Trend</h3>
        {trend !== 0 && (
          <span className={cn(
            "ml-auto text-xs px-2 py-0.5 rounded-full flex items-center gap-1",
            trend > 0 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
          )}>
            {trend > 0 ? "↑" : "↓"} {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
      
      {sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No attendance data yet</p>
      ) : (
        <div className="space-y-2">
          {sessions.slice(0, 4).map(session => {
            const total = session.present + session.absent + session.excused + session.late;
            const rate = total > 0 ? ((session.present + session.late) / total) * 100 : 0;
            
            return (
              <div key={session.date} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {new Date(session.date).toLocaleDateString("en-US", { 
                      month: "short", 
                      day: "numeric" 
                    })}
                  </span>
                  <span className="font-medium">{rate.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all",
                      rate >= 80 ? "bg-green-500" : rate >= 60 ? "bg-yellow-500" : "bg-red-500"
                    )}
                    style={{ width: `${rate}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Quick Stats Widget
export function QuickStatsWidget() {
  const stats = useMemo(() => {
    const members = getAllMembers();
    const activeMembers = members.filter(m => m.status === "Active");
    const pendingMembers = members.filter(m => m.status === "Pending");
    const sessions = getRecentSessions();
    const lastSession = sessions[0];
    
    return {
      totalMembers: members.length,
      activeMembers: activeMembers.length,
      pendingMembers: pendingMembers.length,
      lastSessionDate: lastSession?.date,
      lastSessionAttendance: lastSession 
        ? lastSession.present + lastSession.late 
        : 0,
    };
  }, []);

  return (
    <div className="card-glass rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-5 h-5 text-blue-500" />
        <h3 className="font-semibold text-sm">Quick Stats</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-blue-500/10">
          <p className="text-2xl font-bold text-blue-500">{stats.activeMembers}</p>
          <p className="text-xs text-muted-foreground">Active Members</p>
        </div>
        <div className="p-3 rounded-lg bg-yellow-500/10">
          <p className="text-2xl font-bold text-yellow-500">{stats.pendingMembers}</p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </div>
        {stats.lastSessionDate && (
          <div className="col-span-2 p-3 rounded-lg bg-green-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-green-500">{stats.lastSessionAttendance}</p>
                <p className="text-xs text-muted-foreground">Last Session Attendance</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">
                  {new Date(stats.lastSessionDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Combined Dashboard Widgets Component
export function DashboardWidgets() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <QuickStatsWidget />
      <BirthdayWidget />
      <OverdueContributionsWidget />
      <AttendanceTrendWidget />
    </div>
  );
}
