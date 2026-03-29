import type { Case } from '../types';

export async function loadCasesFromFile(): Promise<Case[]> {
  try {
    const response = await fetch('/master_queue.txt');
    const data = await response.json();
    return data.sort((a: Case, b: Case) => b.priorityScore - a.priorityScore);
  } catch (error) {
    console.error('Error loading cases:', error);
    return [];
  }
}
