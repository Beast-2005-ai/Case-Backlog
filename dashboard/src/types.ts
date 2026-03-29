export interface Case {
  id: string;
  type: string;
  region?: string;
  title?: string;
  priorityScore: number;
  summary: string;
  justification: string;
}

export interface Stats {
  totalCases: number;
  averagePriority: number;
  criticalCases: number;
}
