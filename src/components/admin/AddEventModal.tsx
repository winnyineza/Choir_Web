import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { addEvent, updateEvent, type Event, type EventTicket } from "@/lib/dataService";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editEvent?: Event | null;
}

export function AddEventModal({ isOpen, onClose, onSuccess, editEvent }: AddEventModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState<Event["category"]>("Concert");
  const [isFree, setIsFree] = useState(false);
  const [tickets, setTickets] = useState<EventTicket[]>([]);
  const [livestreamUrl, setLivestreamUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Populate form when editing
  useEffect(() => {
    if (editEvent) {
      setTitle(editEvent.title);
      setDescription(editEvent.description);
      setDate(editEvent.date);
      setTime(editEvent.time);
      setLocation(editEvent.location);
      setCategory(editEvent.category);
      setIsFree(editEvent.isFree);
      setTickets(editEvent.tickets);
      setLivestreamUrl(editEvent.livestreamUrl || "");
    } else {
      resetForm();
    }
  }, [editEvent, isOpen]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDate("");
    setTime("");
    setLocation("");
    setCategory("Concert");
    setIsFree(false);
    setTickets([]);
    setLivestreamUrl("");
  };

  const addTicketTier = () => {
    const newTier: EventTicket = {
      id: `tier-${Date.now()}`,
      name: "",
      price: 0,
      description: "",
      available: 100,
      sold: 0,
      maxPerPerson: 10,
      perks: [],
    };
    setTickets([...tickets, newTier]);
  };

  const updateTicketTier = (index: number, updates: Partial<EventTicket>) => {
    const updated = [...tickets];
    updated[index] = { ...updated[index], ...updates };
    setTickets(updated);
  };

  const removeTicketTier = (index: number) => {
    setTickets(tickets.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !date || !location.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!isFree && tickets.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one ticket tier for paid events.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const eventData = {
        title,
        description,
        date,
        time,
        location,
        category,
        isFree,
        tickets: isFree ? [] : tickets,
        livestreamUrl: livestreamUrl || undefined,
      };

      if (editEvent) {
        updateEvent(editEvent.id, eventData);
        toast({
          title: "Event Updated",
          description: `"${title}" has been updated successfully.`,
        });
      } else {
        addEvent(eventData);
        toast({
          title: "Event Created",
          description: `"${title}" has been created successfully.`,
        });
      }
      
      // Dispatch event to update Events page
      window.dispatchEvent(new Event("eventsUpdated"));
      
      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl bg-charcoal border-primary/20 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl gold-text">
            {editEvent ? "Edit Event" : "Create New Event"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Easter Praise Concert 2025"
                className="mt-1 bg-secondary border-primary/20"
                required
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the event..."
                className="mt-1 bg-secondary border-primary/20"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 bg-secondary border-primary/20"
                required
              />
            </div>

            <div>
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="mt-1 bg-secondary border-primary/20"
              />
            </div>

            <div>
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Kacyiru SDA Church"
                className="mt-1 bg-secondary border-primary/20"
                required
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as Event["category"])}>
                <SelectTrigger className="mt-1 bg-secondary border-primary/20">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Concert">Concert</SelectItem>
                  <SelectItem value="Revival">Revival</SelectItem>
                  <SelectItem value="Workshop">Workshop</SelectItem>
                  <SelectItem value="Fellowship">Fellowship</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Livestream URL */}
          <div>
            <Label htmlFor="livestreamUrl">YouTube Livestream URL (Optional)</Label>
            <Input
              id="livestreamUrl"
              value={livestreamUrl}
              onChange={(e) => setLivestreamUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="mt-1 bg-secondary border-primary/20"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Add a YouTube live stream URL for virtual attendance
            </p>
          </div>

          {/* Free Event Toggle */}
          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
            <div>
              <Label htmlFor="isFree" className="font-medium">Free Event</Label>
              <p className="text-sm text-muted-foreground">
                Toggle on for free events (no tickets required)
              </p>
            </div>
            <Switch
              id="isFree"
              checked={isFree}
              onCheckedChange={setIsFree}
            />
          </div>

          {/* Ticket Tiers */}
          {!isFree && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Ticket Tiers</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTicketTier}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Tier
                </Button>
              </div>

              {tickets.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4 bg-secondary/30 rounded-lg">
                  No ticket tiers added. Click "Add Tier" to create one.
                </p>
              ) : (
                <div className="space-y-3">
                  {tickets.map((tier, index) => (
                    <div
                      key={tier.id}
                      className="p-4 bg-secondary/30 rounded-lg space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-primary">
                          Tier {index + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTicketTier(index)}
                          className="text-destructive h-8 w-8 p-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Tier Name</Label>
                          <Input
                            value={tier.name}
                            onChange={(e) =>
                              updateTicketTier(index, { name: e.target.value })
                            }
                            placeholder="e.g., VIP"
                            className="mt-1 bg-secondary border-primary/20 h-9"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Price (RWF)</Label>
                          <Input
                            type="number"
                            value={tier.price || ""}
                            onChange={(e) =>
                              updateTicketTier(index, {
                                price: parseInt(e.target.value) || 0,
                              })
                            }
                            placeholder="10000"
                            className="mt-1 bg-secondary border-primary/20 h-9"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Available Tickets</Label>
                          <Input
                            type="number"
                            value={tier.available || ""}
                            onChange={(e) =>
                              updateTicketTier(index, {
                                available: parseInt(e.target.value) || 0,
                              })
                            }
                            placeholder="100"
                            className="mt-1 bg-secondary border-primary/20 h-9"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Max Per Person</Label>
                          <Input
                            type="number"
                            value={tier.maxPerPerson || ""}
                            onChange={(e) =>
                              updateTicketTier(index, {
                                maxPerPerson: parseInt(e.target.value) || 10,
                              })
                            }
                            placeholder="10"
                            className="mt-1 bg-secondary border-primary/20 h-9"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">Description</Label>
                          <Input
                            value={tier.description}
                            onChange={(e) =>
                              updateTicketTier(index, { description: e.target.value })
                            }
                            placeholder="e.g., Front row seating"
                            className="mt-1 bg-secondary border-primary/20 h-9"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gold"
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editEvent ? (
                "Update Event"
              ) : (
                "Create Event"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

