import { useEffect } from "react";

const BASE_TITLE = "Serenades of Praise Choir";

export function useDocumentTitle(title?: string) {
  useEffect(() => {
    const previousTitle = document.title;
    
    if (title) {
      document.title = `${title} | ${BASE_TITLE}`;
    } else {
      document.title = `${BASE_TITLE} | Sacred Music Ministry`;
    }

    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}

