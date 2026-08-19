import type { SupabaseClient } from "@supabase/supabase-js";
import type { WaitReport } from "./estimate";
import { createClient } from "@/lib/supabase/server";

export interface Department {
  id: string;
  name: string;
  nameDz: string | null;
  phoneNumber: string | null;
}

export interface DepartmentWithReports extends Department {
  reports: WaitReport[];
}

export interface WaitTimeRepository {
  listDepartmentsWithReports(): Promise<DepartmentWithReports[]>;
  submitReport(departmentId: string, waitMinutes: number, reporterId: string | null): Promise<void>;
}

interface DepartmentRow {
  id: string;
  name: string;
  name_dz: string | null;
  phone_number: string | null;
}

interface WaitReportRow {
  wait_minutes: number;
  created_at: string;
  department_id: string;
}

// Only fetch reports within the estimate's own max-age window (6h) -- no
// point pulling older rows across the network just to filter them out in
// lib/wait-time/estimate.ts.
const REPORT_LOOKBACK_HOURS = 6;

class SupabaseWaitTimeRepository implements WaitTimeRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async listDepartmentsWithReports(): Promise<DepartmentWithReports[]> {
    const since = new Date(Date.now() - REPORT_LOOKBACK_HOURS * 60 * 60 * 1000).toISOString();

    const [{ data: departments, error: deptError }, { data: reports, error: reportError }] =
      await Promise.all([
        this.supabase
          .from("departments")
          .select("id, name, name_dz, phone_number")
          .order("name"),
        this.supabase
          .from("wait_reports")
          .select("wait_minutes, created_at, department_id")
          .gte("created_at", since)
          .order("created_at", { ascending: false }),
      ]);

    if (deptError) throw new Error(`Failed to load departments: ${deptError.message}`);
    if (reportError) throw new Error(`Failed to load wait reports: ${reportError.message}`);

    const reportsByDepartment = new Map<string, WaitReport[]>();
    for (const row of (reports ?? []) as WaitReportRow[]) {
      const list = reportsByDepartment.get(row.department_id) ?? [];
      list.push({ waitMinutes: row.wait_minutes, createdAt: new Date(row.created_at) });
      reportsByDepartment.set(row.department_id, list);
    }

    return ((departments ?? []) as DepartmentRow[]).map((dept) => ({
      id: dept.id,
      name: dept.name,
      nameDz: dept.name_dz,
      phoneNumber: dept.phone_number,
      reports: reportsByDepartment.get(dept.id) ?? [],
    }));
  }

  async submitReport(departmentId: string, waitMinutes: number, reporterId: string | null): Promise<void> {
    const { error } = await this.supabase.from("wait_reports").insert({
      department_id: departmentId,
      wait_minutes: waitMinutes,
      reporter_id: reporterId,
    });
    if (error) throw new Error(`Failed to submit report: ${error.message}`);
  }
}

// Fresh Supabase client per call -- the server client reads request
// cookies (see lib/supabase/server.ts), so it can't be a module-level
// singleton the way the earlier mock repository was.
export async function createWaitTimeRepository(): Promise<WaitTimeRepository> {
  const supabase = await createClient();
  return new SupabaseWaitTimeRepository(supabase);
}
