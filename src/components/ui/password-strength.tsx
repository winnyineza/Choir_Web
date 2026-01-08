import { checkPasswordStrength } from "@/lib/adminService";

interface PasswordStrengthProps {
  password: string;
  showSuggestions?: boolean;
}

export function PasswordStrength({ password, showSuggestions = true }: PasswordStrengthProps) {
  if (!password) return null;
  
  const { score, label, color, suggestions } = checkPasswordStrength(password);
  
  return (
    <div className="space-y-2">
      {/* Strength Bar */}
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-full transition-all duration-300"
            style={{
              backgroundColor: i < score ? color : "hsl(var(--muted))",
            }}
          />
        ))}
      </div>
      
      {/* Label */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color }}>
          {label}
        </span>
        <span className="text-xs text-muted-foreground">
          {score}/6
        </span>
      </div>
      
      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <ul className="text-xs text-muted-foreground space-y-0.5">
          {suggestions.map((suggestion, i) => (
            <li key={i} className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-muted-foreground" />
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

