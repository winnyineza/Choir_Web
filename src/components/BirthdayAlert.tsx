import { useState, useEffect } from "react";
import { X, Cake, PartyPopper } from "lucide-react";
import { getTodaysBirthdays, type Member } from "@/lib/dataService";
import { cn } from "@/lib/utils";

interface BirthdayAlertProps {
  currentUserEmail?: string; // To check if it's the logged-in user's birthday
  currentUserName?: string;
}

export function BirthdayAlert({ currentUserEmail, currentUserName }: BirthdayAlertProps) {
  const [birthdayMembers, setBirthdayMembers] = useState<Member[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [isOwnBirthday, setIsOwnBirthday] = useState(false);

  useEffect(() => {
    const todaysBirthdays = getTodaysBirthdays();
    setBirthdayMembers(todaysBirthdays);
    
    // Check if current user has a birthday today
    if (currentUserEmail) {
      const ownBirthday = todaysBirthdays.some(
        m => m.email.toLowerCase() === currentUserEmail.toLowerCase()
      );
      setIsOwnBirthday(ownBirthday);
    }
  }, [currentUserEmail]);

  // Don't show if no birthdays today or dismissed
  if (birthdayMembers.length === 0 || !isVisible) {
    return null;
  }

  // Get names of birthday members (excluding current user if it's their birthday)
  const otherBirthdayMembers = birthdayMembers.filter(
    m => m.email.toLowerCase() !== currentUserEmail?.toLowerCase()
  );

  const getBirthdayMessage = () => {
    if (isOwnBirthday && otherBirthdayMembers.length === 0) {
      // Only the current user has a birthday
      return null; // Will show special "Happy Birthday to YOU!" message
    }
    
    if (otherBirthdayMembers.length === 1) {
      return `It's ${otherBirthdayMembers[0].name.split(' ')[0]}'s Birthday!`;
    }
    
    if (otherBirthdayMembers.length === 2) {
      return `It's ${otherBirthdayMembers[0].name.split(' ')[0]} & ${otherBirthdayMembers[1].name.split(' ')[0]}'s Birthday!`;
    }
    
    if (otherBirthdayMembers.length > 2) {
      return `It's ${otherBirthdayMembers[0].name.split(' ')[0]}, ${otherBirthdayMembers[1].name.split(' ')[0]} & ${otherBirthdayMembers.length - 2} more's Birthday!`;
    }
    
    return null;
  };

  const othersBirthdayMessage = getBirthdayMessage();

  return (
    <div className="relative">
      {/* Own Birthday Banner - Special celebration style */}
      {isOwnBirthday && (
        <div className={cn(
          "bg-gradient-to-r from-primary/20 via-yellow-500/20 to-primary/20 border-b border-primary/30",
          "px-4 py-3 flex items-center justify-center gap-3 animate-pulse"
        )}>
          <PartyPopper className="w-6 h-6 text-yellow-400 animate-bounce" />
          <span className="text-lg font-bold text-yellow-400">
            🎉 Happy Birthday to YOU, {currentUserName?.split(' ')[0] || 'Champion'}! 🎉
          </span>
          <PartyPopper className="w-6 h-6 text-yellow-400 animate-bounce" style={{ animationDelay: '0.5s' }} />
          <button
            onClick={() => setIsVisible(false)}
            className="absolute right-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Others' Birthday Banner */}
      {othersBirthdayMessage && (
        <div className={cn(
          "bg-primary/10 border-b border-primary/20",
          "px-4 py-2 flex items-center justify-center gap-2",
          isOwnBirthday && "border-t border-primary/20"
        )}>
          <Cake className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium text-foreground">
            🎂 {othersBirthdayMessage}
          </span>
          {!isOwnBirthday && (
            <button
              onClick={() => setIsVisible(false)}
              className="absolute right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

