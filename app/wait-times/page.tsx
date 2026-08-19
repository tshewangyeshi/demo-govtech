import { createWaitTimeRepository } from "@/lib/wait-time/repository";
import { DepartmentCard } from "@/components/DepartmentCard";
import { AccountNav } from "@/components/AccountNav";

// Language toggle intentionally not rendered: English-only for now
// (founder decision, 2026-08-19 -- Dzongkha translation deferred, see
// docs/designs/jdwnrh-hospital-booking.md). The i18n scaffolding
// (lib/i18n/, components/LanguageToggle.tsx) is kept in place, just not
// shown -- a visible toggle that doesn't actually translate anything
// would be misleading.

export default async function WaitTimesPage() {
  const repository = await createWaitTimeRepository();
  const departments = await repository.listDepartmentsWithReports();

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col">
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3.5">
        <h1 className="text-[15px] font-bold text-neutral-900">JDWNRH Wait Times</h1>
      </header>

      <div className="flex items-center justify-between px-4 pb-2 pt-3.5">
        <p className="text-[13px] text-neutral-500">
          Reported by people currently at the hospital. Not official hospital data.
        </p>
        <AccountNav />
      </div>

      <ul className="flex flex-col gap-2.5 px-4 pb-24 pt-1">
        {departments.map((department) => (
          <li key={department.id}>
            <DepartmentCard department={department} />
          </li>
        ))}
      </ul>
    </main>
  );
}
