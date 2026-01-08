import { useState, useEffect } from "react";
import { Bell, BellOff, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  hasReminder,
  addReminder,
  removeReminder,
  requestNotificationPermission,
  formatReminderType,
  type EventReminder,
} from "@/lib/reminderService";

interface EventReminderButtonProps {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  variant?: "default" | "compact";
}

export function EventReminderButton({
  eventId,
  eventTitle,
  eventDate,
  eventTime,
  eventLocation,
  variant = "default",
}: EventReminderButtonProps) {
  const [reminders, setReminders] = useState({
    "1hour": false,
    "1day": false,
    "1week": false,
  });
  const { toast } = useToast();

  // Check existing reminders
  useEffect(() => {
    setReminders({
      "1hour": hasReminder(eventId, "1hour"),
      "1day": hasReminder(eventId, "1day"),
      "1week": hasReminder(eventId, "1week"),
    });
  }, [eventId]);

  const hasAnyReminder = Object.values(reminders).some(Boolean);

  const toggleReminder = async (type: EventReminder["type"]) => {
    const isSet = reminders[type];

    if (isSet) {
      removeReminder(eventId, type);
      setReminders(prev => ({ ...prev, [type]: false }));
      toast({
        title: "Reminder Removed",
        description: `${formatReminderType(type)} reminder removed`,
      });
    } else {
      // Request notification permission first
      const hasPermission = await requestNotificationPermission();
      
      if (!hasPermission) {
        toast({
          title: "Notifications Disabled",
          description: "Please enable browser notifications to receive reminders",
          variant: "destructive",
        });
        return;
      }

      addReminder(eventId, eventTitle, eventDate, eventTime, eventLocation, type);
      setReminders(prev => ({ ...prev, [type]: true }));
      toast({
        title: "Reminder Set! 🔔",
        description: `We'll remind you ${formatReminderType(type)}`,
      });
    }
  };

  if (variant === "compact") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={hasAnyReminder ? "text-primary" : "text-muted-foreground"}
          >
            {hasAnyReminder ? (
              <Bell className="w-4 h-4 fill-current" />
            ) : (
              <BellOff className="w-4 h-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => toggleReminder("1hour")}>
            <span className="flex-1">1 hour before</span>
            {reminders["1hour"] && <Check className="w-4 h-4 text-primary" />}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => toggleReminder("1day")}>
            <span className="flex-1">1 day before</span>
            {reminders["1day"] && <Check className="w-4 h-4 text-primary" />}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => toggleReminder("1week")}>
            <span className="flex-1">1 week before</span>
            {reminders["1week"] && <Check className="w-4 h-4 text-primary" />}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={hasAnyReminder ? "outline" : "ghost"}
          size="sm"
          className={hasAnyReminder ? "border-primary/30 text-primary" : ""}
        >
          {hasAnyReminder ? (
            <Bell className="w-4 h-4 mr-2 fill-current" />
          ) : (
            <Bell className="w-4 h-4 mr-2" />
          )}
          Remind Me
          <ChevronDown className="w-3 h-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => toggleReminder("1hour")}>
          <span className="flex-1">1 hour before</span>
          {reminders["1hour"] && <Check className="w-4 h-4 text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toggleReminder("1day")}>
          <span className="flex-1">1 day before</span>
          {reminders["1day"] && <Check className="w-4 h-4 text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toggleReminder("1week")}>
          <span className="flex-1">1 week before</span>
          {reminders["1week"] && <Check className="w-4 h-4 text-primary" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

