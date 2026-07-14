import { create } from 'zustand';
import type { Report, ReportMode, ReportStatus } from '../types/report';

interface ReportState {
  reports: Report[];
  currentReport: Report | null;
  isLoading: boolean;
  error: string | null;

  setReports: (reports: Report[]) => void;
  addReport: (report: Report) => void;
  updateReport: (id: string, updates: Partial<Report>) => void;
  removeReport: (id: string) => void;
  setCurrentReport: (report: Report | null) => void;
  updateCurrentReport: (updates: Partial<Report>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useReportStore = create<ReportState>((set) => ({
  reports: [],
  currentReport: null,
  isLoading: false,
  error: null,

  setReports: (reports) => set({ reports }),
  addReport: (report) => set((s) => ({ reports: [...s.reports, report] })),
  updateReport: (id, updates) =>
    set((s) => ({
      reports: s.reports.map((r) => (r.id === id ? { ...r, ...updates } : r)),
      currentReport: s.currentReport?.id === id ? { ...s.currentReport, ...updates } : s.currentReport,
    })),
  removeReport: (id) =>
    set((s) => ({
      reports: s.reports.filter((r) => r.id !== id),
      currentReport: s.currentReport?.id === id ? null : s.currentReport,
    })),
  setCurrentReport: (report) => set({ currentReport: report }),
  updateCurrentReport: (updates) =>
    set((s) => ({
      currentReport: s.currentReport ? { ...s.currentReport, ...updates } : null,
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
