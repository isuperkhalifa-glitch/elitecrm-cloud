export type SourcePoint = { name: string; value: number };
export type DistributionPoint = {
  id: string;
  name: string;
  fresh: number;
  retargeted: number;
  redirected: number;
  total: number;
};
export type TaskPoint = { id: string; name: string; count: number };

export type ReportsPayload = {
  status: string;
  message?: string;
  summary: {
    customers: number;
    sources: number;
    distributed: number;
    completedTasks: number;
  };
  sources: SourcePoint[];
  distribution: DistributionPoint[];
  completedTasks: TaskPoint[];
};

export type ReportTab = "sources" | "distribution" | "tasks";
