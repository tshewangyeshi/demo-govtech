import { createWaitTimeRepository } from "@/lib/wait-time/repository";
import { DepartmentCard } from "@/components/DepartmentCard";
import { LanguageToggle } from "@/components/LanguageToggle";
import { AccountNav } from "@/components/AccountNav";

export default async function WaitTimesPage() {
  const repository = await createWaitTimeRepository();
  const departments = await repository.listDepartmentsWithReports();

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col">
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3.5">
        <h1 className="text-[15px] font-bold text-neutral-900">JDWNRH Wait Times</h1>
        <LanguageToggle />
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
