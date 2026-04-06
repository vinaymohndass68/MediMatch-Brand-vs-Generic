import { AnalysisResult } from '../types';

const STORAGE_KEY = 'mediMatch_history';

export const getHistory = (): AnalysisResult[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to parse history", e);
    return [];
  }
};

export const saveToHistory = (result: AnalysisResult): AnalysisResult => {
  const history = getHistory();
  
  // Create a new object with ID and timestamp if they don't exist
  const itemToSave: AnalysisResult = {
    ...result,
    id: result.id || crypto.randomUUID(),
    timestamp: result.timestamp || Date.now(),
  };

  // Check if already exists by ID to update, otherwise unshift (add to top)
  const existingIndex = history.findIndex(h => h.id === itemToSave.id);
  
  if (existingIndex >= 0) {
    history[existingIndex] = itemToSave;
  } else {
    history.unshift(itemToSave);
  }

  // Limit history to last 50 items to prevent storage overflow
  if (history.length > 50) {
    history.pop();
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  return itemToSave;
};

export const deleteFromHistory = (id: string): AnalysisResult[] => {
  const history = getHistory();
  const newHistory = history.filter(item => item.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
  return newHistory;
};

export const clearHistory = () => {
  localStorage.removeItem(STORAGE_KEY);
};