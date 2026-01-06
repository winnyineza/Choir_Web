import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useToast } from "@/hooks/use-toast";
import { Calendar, MapPin, Clock, Users, Loader2, CheckCircle, Ticket } from "lucide-react";

interface Event {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  spotsLeft: number;
}

interface EventBookingModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EventBookingModal({ event, isOpen, onClose }: EventBookingModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [seats, setSeats] = useState("1");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSuccess(true);

    toast({
      title: "Booking Confirmed! 🎉",
      description: `Your ${seats} seat(s) for "${event?.title}" have been reserved. Check your email for confirmation.`,
    });

    // Reset and close after delay
    setTimeout(() => {
      setIsSuccess(false);
      setSeats("1");
      onClose();
    }, 2000);
  };

  if (!event) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {isSuccess ? "Booking Confirmed!" : "Book Your Seat"}
          </DialogTitle>
          <DialogDescription>
            {isSuccess 
              ? "Thank you for your reservation. See you at the event!"
              : `Reserve your spot for ${event.title}`
            }
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-8 text-center">
            <div className="w-20 h-20 rounded-full bg-green-500/20 mx-auto mb-4 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="font-display text-xl font-semibold text-foreground mb-2">
              You're All Set!
            </h3>
            <p className="text-muted-foreground">
              {seats} seat(s) reserved for {event.title}
            </p>
          </div>
        ) : (
          <>
            {/* Event Summary */}
            <div className="p-4 rounded-xl bg-secondary/50 border border-primary/10 mb-4">
              <h4 className="font-semibold text-foreground mb-3">{event.title}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4 text-primary" />
                  {event.date}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4 text-primary" />
                  {event.time}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4 text-primary" />
                  {event.location}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4 text-primary" />
                  {event.spotsLeft} spots remaining
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    required
                    className="bg-secondary border-primary/20"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    required
                    className="bg-secondary border-primary/20"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  required
                  className="bg-secondary border-primary/20"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+250 7XX XXX XXX"
                  required
                  className="bg-secondary border-primary/20"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="seats">Number of Seats</Label>
                <Select value={seats} onValueChange={setSeats} disabled={isSubmitting}>
                  <SelectTrigger className="bg-secondary border-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <SelectItem 
                        key={num} 
                        value={num.toString()}
                        disabled={num > event.spotsLeft}
                      >
                        {num} {num === 1 ? "seat" : "seats"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Special Requests (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any special requirements..."
                  className="bg-secondary border-primary/20 resize-none"
                  rows={2}
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gold"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    <>
                      <Ticket className="w-4 h-4 mr-2" />
                      Confirm Booking
                    </>
                  )}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Free admission. A confirmation email will be sent to you.
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

