import type { WaitReport } from "./estimate";

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

// In-memory mock repository. No live Supabase project exists yet
// (docs/designs/jdwnrh-hospital-booking.md) -- this lets the real UI get
// built and verified in a browser now, swapped for a Supabase-backed
// implementation later without touching any page/component code, since
// both implement the same WaitTimeRepository interface.
class InMemoryWaitTimeRepository implements WaitTimeRepository {
  private departments: Department[] = [
    { id: "general-medicine", name: "General Medicine", nameDz: null, phoneNumber: "+975 2 322496" },
    { id: "pediatrics", name: "Pediatrics", nameDz: null, phoneNumber: "+975 2 322497" },
    { id: "ent", name: "ENT", nameDz: null, phoneNumber: "+975 2 322498" },
  ];

  private reports: Map<string, WaitReport[]> = new Map([
    [
      "general-medicine",
      [
        { waitMinutes: 130, createdAt: minutesAgo(6) },
        { waitMinutes: 120, createdAt: minutesAgo(15) },
        { waitMinutes: 140, createdAt: minutesAgo(25) },
        { waitMinutes: 110, createdAt: minutesAgo(40) },
      ],
    ],
    ["pediatrics", [{ waitMinutes: 60, createdAt: minutesAgo(3 * 60) }]],
    ["ent", []],
  ]);

  async listDepartmentsWithReports(): Promise<DepartmentWithReports[]> {
    return this.departments.map((dept) => ({
      ...dept,
      reports: this.reports.get(dept.id) ?? [],
    }));
  }

  async submitReport(departmentId: string, waitMinutes: number, reporterId: string | null): Promise<void> {
    void reporterId; // tied to account for trust-weighting once auth exists; not used by the mock
    const existing = this.reports.get(departmentId) ?? [];
    existing.unshift({ waitMinutes, createdAt: new Date() });
    this.reports.set(departmentId, existing);
  }
}

function minutesAgo(minutes: number): Date {
  return new Date(Date.now() - minutes * 60 * 1000);
}

// Module-level singleton so submissions persist across requests within a
// single dev-server process (resets on server restart -- expected for a
// mock).
export const waitTimeRepository: WaitTimeRepository = new InMemoryWaitTimeRepository();
