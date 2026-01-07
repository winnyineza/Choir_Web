import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Ticket, Search, Users, ShoppingCart, CalendarPlus, Plus, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { NewsletterForm } from "@/components/NewsletterForm";
import { TicketPurchaseModal, type TicketEvent } from "@/components/tickets";
import { formatCurrency } from "@/lib/flutterwave";
import { addToCalendar } from "@/lib/exportUtils";
import { ShareButtons } from "@/components/ShareButtons";
import { useToast } from "@/hooks/use-toast";
import { getBookableEvents, type Event as DataEvent, type EventTicket } from "@/lib/dataService";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import choirImage from "@/assets/choir-group.jpg";

// Transform EventTicket to TicketTier format for the modal
interface DisplayEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: string;
  image: string;
  isFree: boolean;
  tickets: {
    id: string;
    name: string;
    price: number;
    description: string;
    perks: string[];
    available: number;
    sold: number;
    maxPerPerson: number;
  }[];
}

const categories = ["All", "Concert", "Revival", "Workshop", "Fellowship", "Other"];

export default function Events() {
  useDocumentTitle("Events & Concerts");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<TicketEvent | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [events, setEvents] = useState<DisplayEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useLanguage();

  // Fetch events from dataService
  useEffect(() => {
    const loadEvents = () => {
      setIsLoading(true);
      const bookableEvents = getBookableEvents();
      
      // Transform to display format
      const displayEvents: DisplayEvent[] = bookableEvents.map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        date: new Date(event.date).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
        time: event.time,
        location: event.location,
        category: event.category,
        image: event.image || choirImage,
        isFree: event.isFree,
        tickets: event.tickets.map((t) => ({
          id: t.id,
          name: t.name,
          price: t.price,
          description: t.description,
          perks: t.perks || [],
          available: t.available,
          sold: t.sold || 0,
          maxPerPerson: t.maxPerPerson,
        })),
      }));
      
      setEvents(displayEvents);
      setIsLoading(false);
    };
    
    loadEvents();
    
    // Listen for storage changes (when admin adds events)
    const handleStorageChange = () => loadEvents();
    window.addEventListener("storage", handleStorageChange);
    
    // Also listen for custom event when data changes locally
    window.addEventListener("eventsUpdated", handleStorageChange);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("eventsUpdated", handleStorageChange);
    };
  }, []);

  const handleAddToCalendar = (event: DisplayEvent) => {
    addToCalendar(
      event.title,
      event.description,
      event.location,
      event.date,
      undefined,
      "google"
    );
    toast({
      title: "Opening Calendar",
      description: "Add this event to your Google Calendar.",
    });
  };

  const filteredEvents = events.filter((event) => {
    const matchesCategory =
      selectedCategory === "All" || event.category === selectedCategory;
    const matchesSearch = event.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleGetTickets = (event: DisplayEvent) => {
    // Check if any tickets are available
    const totalRemaining = getTotalRemaining(event);
    if (totalRemaining === 0) {
      toast({
        title: "Sold Out",
        description: "Sorry, all tickets for this event have been sold.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedEvent({
      id: event.id,
      title: event.title,
      date: event.date,
      time: event.time,
      location: event.location,
      image: event.image,
      tickets: event.tickets.map((t) => ({
        ...t,
        available: t.available - t.sold, // Show remaining tickets
        perks: t.perks,
      })),
    });
    setIsTicketModalOpen(true);
  };

  const getLowestPrice = (event: DisplayEvent) => {
    const prices = event.tickets.map((t) => t.price);
    return Math.min(...prices);
  };

  const getTotalRemaining = (event: DisplayEvent) => {
    return event.tickets.reduce((sum, t) => sum + (t.available - t.sold), 0);
  };

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
                {t("events.upcoming")}
              </span>
              <h1 className="font-display text-5xl md:text-6xl font-bold mb-6">
                <span className="gold-text">{t("events.title")}</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                {t("home.hero.subtitle")}
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

        {/* Events Grid */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-24">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredEvents.map((event) => {
                  const remaining = getTotalRemaining(event);
                  const isSoldOut = remaining === 0;
                  const isLowStock = remaining > 0 && remaining <= 10;
                  
                  return (
                    <div
                      key={event.id}
                      id={`event-${event.id}`}
                      className={`card-glass rounded-2xl overflow-hidden group transition-all duration-500 ${
                        isSoldOut ? "opacity-75" : "hover:border-primary/30"
                      }`}
                    >
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={event.image}
                          alt={event.title}
                          className={`w-full h-full object-cover transition-transform duration-700 ${
                            isSoldOut ? "grayscale" : "group-hover:scale-110"
                          }`}
                          loading="lazy"
                        />
                        <div className="absolute top-4 left-4 flex gap-2">
                          <span className="px-3 py-1 rounded-full bg-primary/90 text-primary-foreground text-xs font-semibold">
                            {event.category}
                          </span>
                          {event.isFree && (
                            <span className="px-3 py-1 rounded-full bg-green-500/90 text-white text-xs font-semibold">
                              Free
                            </span>
                          )}
                        </div>
                        <div className="absolute top-4 right-4">
                          {isSoldOut ? (
                            <span className="px-3 py-1 rounded-full bg-red-500/90 text-white text-xs font-semibold">
                              Sold Out
                            </span>
                          ) : isLowStock ? (
                            <span className="px-3 py-1 rounded-full bg-yellow-500/90 text-black text-xs font-semibold flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Only {remaining} left!
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full bg-background/80 backdrop-blur-sm text-foreground text-xs font-medium flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {remaining} spots
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-6">
                        <h3 className="font-display text-xl font-semibold mb-3">
                          {event.title}
                        </h3>
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                          {event.description}
                        </p>

                        <div className="space-y-2 mb-4">
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

                        {/* Price Display */}
                        <div className="flex items-center justify-between mb-4 py-3 px-4 rounded-lg bg-secondary/50">
                          <span className="text-sm text-muted-foreground">
                            {event.isFree ? "Admission" : "Starting from"}
                          </span>
                          <span className="font-bold text-lg gold-text">
                            {event.isFree ? "Free" : formatCurrency(getLowestPrice(event))}
                          </span>
                        </div>

                        {/* Ticket Tiers Preview */}
                        <div className="flex gap-1 mb-4">
                          {event.tickets.map((tier) => {
                            const tierRemaining = tier.available - tier.sold;
                            return (
                              <div
                                key={tier.id}
                                className={`flex-1 text-center py-1 px-2 rounded text-xs ${
                                  tierRemaining === 0 
                                    ? "bg-muted text-muted-foreground line-through" 
                                    : "bg-primary/10"
                                }`}
                                title={`${tier.name}: ${tierRemaining} available`}
                              >
                                <span className={tierRemaining > 0 ? "text-primary font-medium" : ""}>
                                  {tier.name}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        <Button
                          variant={isSoldOut ? "outline" : "gold"}
                          className="w-full"
                          onClick={() => handleGetTickets(event)}
                          disabled={isSoldOut}
                        >
                          {isSoldOut ? (
                            "Sold Out"
                          ) : event.isFree ? (
                            <>
                              <Ticket className="w-4 h-4 mr-2" />
                              Reserve Spot
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              Get Tickets
                            </>
                          )}
                        </Button>

                        {/* Share & Calendar */}
                        <div className="flex gap-2 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleAddToCalendar(event)}
                          >
                            <CalendarPlus className="w-4 h-4 mr-2" />
                            Add to Calendar
                          </Button>
                          <ShareButtons
                            title={event.title}
                            description={`${event.date} at ${event.location}`}
                            url={`${window.location.origin}/events#event-${event.id}`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Empty State */
              <div className="flex flex-col items-center justify-center py-24 text-center card-glass rounded-2xl border border-primary/20">
                <div className="mb-6 flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                  <Calendar className="w-8 h-8 text-primary" />
                </div>

                <h3 className="font-display text-2xl font-semibold mb-3">
                  {searchQuery ? "No Events Found" : "No Upcoming Events"}
                </h3>

                <p className="max-w-md text-muted-foreground mb-6">
                  {searchQuery
                    ? `No events matching "${searchQuery}" found. Try a different search term.`
                    : "There are no upcoming events scheduled yet. Check back soon for worship experiences and concerts!"}
                </p>

                {searchQuery || selectedCategory !== "All" ? (
                  <Button
                    variant="outline"
                    className="border-primary/30 text-primary hover:bg-primary/10"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("All");
                    }}
                  >
                    View All Events
                  </Button>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Subscribe to our newsletter below to be notified of new events!
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="py-16 bg-charcoal">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="font-display text-3xl font-bold mb-4">
                Never Miss an <span className="gold-text">Event</span>
              </h2>
              <p className="text-muted-foreground mb-6">
                Subscribe to our newsletter and be the first to know about upcoming concerts, revivals, and special events.
              </p>
              <div className="max-w-md mx-auto">
                <NewsletterForm variant="inline" />
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />

      {/* Ticket Purchase Modal */}
      <TicketPurchaseModal
        event={selectedEvent}
        isOpen={isTicketModalOpen}
        onClose={() => {
          setIsTicketModalOpen(false);
          setSelectedEvent(null);
        }}
      />
    </div>
  );
}
