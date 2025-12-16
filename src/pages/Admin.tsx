import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Music,
  Image,
  Heart,
  Settings,
  LogOut,
  Menu,
  X,
  Plus,
  Pencil,
  Trash2,
  Eye,
  ChevronDown,
  Music2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

type Tab = "dashboard" | "members" | "events" | "releases" | "gallery" | "donations" | "settings";

const sidebarItems = [
  { id: "dashboard" as Tab, label: "Dashboard", icon: LayoutDashboard },
  { id: "members" as Tab, label: "Members", icon: Users },
  { id: "events" as Tab, label: "Events", icon: Calendar },
  { id: "releases" as Tab, label: "Releases", icon: Music },
  { id: "gallery" as Tab, label: "Gallery", icon: Image },
  { id: "donations" as Tab, label: "Donations", icon: Heart },
  { id: "settings" as Tab, label: "Settings", icon: Settings },
];

const mockMembers = [
  { id: 1, name: "Alice Uwimana", email: "alice@email.com", voice: "Soprano", status: "Active" },
  { id: 2, name: "Jean Baptiste", email: "jean@email.com", voice: "Tenor", status: "Active" },
  { id: 3, name: "Marie Claire", email: "marie@email.com", voice: "Alto", status: "Pending" },
];

const mockEvents = [
  { id: 1, title: "Christmas Concert", date: "Dec 24, 2024", location: "Kacyiru SDA Church", bookings: 45 },
  { id: 2, title: "New Year Praise", date: "Dec 31, 2024", location: "Convention Center", bookings: 120 },
];

const mockStats = [
  { label: "Total Members", value: "15", change: "+2 this month" },
  { label: "Upcoming Events", value: "4", change: "Next: Dec 24" },
  { label: "Total Donations", value: "125,000 RWF", change: "+15% vs last month" },
  { label: "Page Views", value: "1,247", change: "+8% this week" },
];

export default function Admin() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-charcoal border-r border-primary/10 transform transition-transform duration-300 lg:relative lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-primary/10">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gold-gradient flex items-center justify-center">
                <Music2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display text-lg font-bold gold-text">Admin Panel</h1>
                <p className="text-xs text-muted-foreground">Serenades of Praise</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200",
                  activeTab === item.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Bottom */}
          <div className="p-4 border-t border-primary/10">
            <Link to="/">
              <Button variant="outline" className="w-full justify-start">
                <Eye className="w-4 h-4 mr-2" />
                View Website
              </Button>
            </Link>
            <Button variant="ghost" className="w-full justify-start mt-2 text-muted-foreground">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-16 border-b border-primary/10 flex items-center justify-between px-4 lg:px-8">
          <button
            className="lg:hidden p-2 text-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="font-display text-xl font-semibold capitalize">{activeTab}</h1>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gold-gradient flex items-center justify-center text-primary-foreground font-semibold">
              A
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          {/* Dashboard */}
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {mockStats.map((stat) => (
                  <div key={stat.label} className="card-glass rounded-2xl p-6">
                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold gold-text">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-2">{stat.change}</p>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div>
                <h2 className="font-display text-lg font-semibold mb-4">Quick Actions</h2>
                <div className="flex flex-wrap gap-4">
                  <Button variant="gold">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Event
                  </Button>
                  <Button variant="gold-outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Member
                  </Button>
                  <Button variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Upload to Gallery
                  </Button>
                </div>
              </div>

              {/* Recent Events */}
              <div>
                <h2 className="font-display text-lg font-semibold mb-4">Upcoming Events</h2>
                <div className="card-glass rounded-2xl overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-secondary/50">
                      <tr>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Event</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Date</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Location</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Bookings</th>
                        <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockEvents.map((event) => (
                        <tr key={event.id} className="border-t border-primary/10">
                          <td className="p-4 font-medium text-foreground">{event.title}</td>
                          <td className="p-4 text-muted-foreground hidden md:table-cell">{event.date}</td>
                          <td className="p-4 text-muted-foreground hidden md:table-cell">{event.location}</td>
                          <td className="p-4 text-primary font-semibold">{event.bookings}</td>
                          <td className="p-4 text-right">
                            <Button variant="ghost" size="sm"><Pencil className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="sm"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Members */}
          {activeTab === "members" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">All Members</h2>
                <Button variant="gold">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Member
                </Button>
              </div>
              <div className="card-glass rounded-2xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-secondary/50">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Name</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Email</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Voice</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockMembers.map((member) => (
                      <tr key={member.id} className="border-t border-primary/10">
                        <td className="p-4 font-medium text-foreground">{member.name}</td>
                        <td className="p-4 text-muted-foreground hidden md:table-cell">{member.email}</td>
                        <td className="p-4 text-muted-foreground">{member.voice}</td>
                        <td className="p-4">
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs font-semibold",
                            member.status === "Active" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                          )}>
                            {member.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <Button variant="ghost" size="sm"><Pencil className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Events */}
          {activeTab === "events" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">Manage Events</h2>
                <Button variant="gold">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Event
                </Button>
              </div>
              <div className="card-glass rounded-2xl p-6">
                <p className="text-muted-foreground text-center py-10">
                  Event management interface. Create, edit, and manage event bookings here.
                </p>
              </div>
            </div>
          )}

          {/* Releases */}
          {activeTab === "releases" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">Manage Releases</h2>
                <Button variant="gold">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Album
                </Button>
              </div>
              <div className="card-glass rounded-2xl p-6">
                <p className="text-muted-foreground text-center py-10">
                  Music release management. Add albums, tracks, and manage sales.
                </p>
              </div>
            </div>
          )}

          {/* Gallery */}
          {activeTab === "gallery" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">Manage Gallery</h2>
                <Button variant="gold">
                  <Plus className="w-4 h-4 mr-2" />
                  Upload Media
                </Button>
              </div>
              <div className="card-glass rounded-2xl p-6">
                <p className="text-muted-foreground text-center py-10">
                  Gallery management. Upload photos and videos, organize by category.
                </p>
              </div>
            </div>
          )}

          {/* Donations */}
          {activeTab === "donations" && (
            <div className="space-y-6">
              <h2 className="font-display text-lg font-semibold">Donation Records</h2>
              <div className="card-glass rounded-2xl p-6">
                <p className="text-muted-foreground text-center py-10">
                  View and manage donation records, supporter messages, and financial reports.
                </p>
              </div>
            </div>
          )}

          {/* Settings */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <h2 className="font-display text-lg font-semibold">Settings</h2>
              <div className="card-glass rounded-2xl p-6 max-w-2xl">
                <h3 className="font-semibold text-foreground mb-4">Choir Information</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="choirName">Choir Name</Label>
                    <Input id="choirName" defaultValue="The Serenades of Praise Choir" className="mt-1 bg-secondary border-primary/20" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" defaultValue="theserenadeschoir@gmail.com" className="mt-1 bg-secondary border-primary/20" />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" defaultValue="+250 780 623 144" className="mt-1 bg-secondary border-primary/20" />
                  </div>
                  <Button variant="gold">Save Changes</Button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
