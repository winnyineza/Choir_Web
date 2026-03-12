interface ConfirmDestructiveActionOptions {
  action: string;
  subject: string;
  warning?: string;
  confirmWord?: string;
}

export function confirmDestructiveAction({
  action,
  subject,
  warning,
  confirmWord = "DELETE",
}: ConfirmDestructiveActionOptions): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const message = [
    `You are about to ${action} ${subject}.`,
    warning,
    `Type ${confirmWord} to confirm.`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const response = window.prompt(message, "");
  return response?.trim().toUpperCase() === confirmWord;
}
