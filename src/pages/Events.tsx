import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Ticket, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const events = []; // 🔴 No events published yet

const categories = ["All", "Concert", "Special Event", "Revival"];

export default function Events() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEvents = events.filter((event) => {
    const matchesCategory =
      selectedCategory === "All" || event.category === selectedCategory;
    const matchesSearch = event.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-charcoal to-background" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <span className="inline-block text-primary text-sm font-semibold tracking-wider uppercase mb-4">
                Upcoming
              </span>
              <h1 className="font-display text-5xl md:text-6xl font-bold mb-6">
                <span className="gold-text">Events</span> & Concerts
              </h1>
              <p className="text-xl text-muted-foreground">
                Join us for worship, celebration, and musical excellence
              </p>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="py-8 border-b border-primary/10">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex gap-2 flex-wrap">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      selectedCategory === category
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-secondary border-primary/20"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Events Grid / Empty State */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            {filteredEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredEvents.map((event) => (
                  <div
                    key={event.id}
                    className="card-glass rounded-2xl overflow-hidden group hover:border-primary/30 transition-all duration-500"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 rounded-full bg-primary/90 text-primary-foreground text-xs font-semibold">
                          {event.category}
                        </span>
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="font-display text-xl font-semibold mb-3">
                        {event.title}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-4">
                        {event.description}
                      </p>

                      <div className="space-y-2 mb-6">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4 text-primary" />
                          {event.date}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4 text-primary" />
                          {event.time}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4 text-primary" />
                          {event.location}
                        </div>
                      </div>

                      <Button variant="gold" className="w-full">
                        <Ticket className="w-4 h-4 mr-2" />
                        Book a Seat
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* ✅ Modern Empty State */
              <div className="flex flex-col items-center justify-center py-24 text-center card-glass rounded-2xl border border-primary/20">
                <div className="mb-6 flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                  <Calendar className="w-8 h-8 text-primary" />
                </div>

                <h3 className="font-display text-2xl font-semibold mb-3">
                  Events Coming Soon
                </h3>

                <p className="max-w-md text-muted-foreground mb-6">
                  We’re currently preparing our platform and are not yet
                  publishing concerts or events. Please check back soon for
                  upcoming worship experiences.
                </p>

                <Button
                  variant="outline"
                  className="border-primary/30 text-primary hover:bg-primary/10"
                >
                  Stay Connected
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
