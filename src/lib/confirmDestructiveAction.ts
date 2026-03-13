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

  try {
    const response = window.prompt(message, "");
    return response?.trim().toUpperCase() === confirmWord;
  } catch {
    const fallbackMessage = [
      `You are about to ${action} ${subject}.`,
      warning,
      `Your browser/app does not support typed confirmation prompts.`,
      `Press OK to continue.`,
    ]
      .filter(Boolean)
      .join("\n\n");

    return window.confirm(fallbackMessage);
  }
}
