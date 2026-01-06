import { useState, useEffect } from 'react';

interface VisitorData {
  count: number;
  lastVisit: string;
}

export function useVisitorCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const STORAGE_KEY = 'sop_visitor_data';
    const BASE_COUNT = 4847; // Starting point for realism
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const today = new Date().toDateString();
      
      if (stored) {
        const data: VisitorData = JSON.parse(stored);
        
        // Increment if this is a new day or first visit of session
        if (data.lastVisit !== today) {
          const newCount = data.count + 1;
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            count: newCount,
            lastVisit: today,
          }));
          setCount(newCount);
        } else {
          setCount(data.count);
        }
      } else {
        // First time visitor
        const initialCount = BASE_COUNT + Math.floor(Math.random() * 100);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          count: initialCount,
          lastVisit: today,
        }));
        setCount(initialCount);
      }
    } catch {
      // Fallback if localStorage fails
      setCount(BASE_COUNT);
    }
  }, []);

  return count;
}

