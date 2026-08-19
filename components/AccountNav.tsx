import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export async function AccountNav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return (
      <Link
        href="/account"
        className="min-h-[44px] flex items-center text-xs font-medium text-neutral-600 underline underline-offset-2 hover:text-neutral-900"
      >
        My account
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      className="min-h-[44px] flex items-center text-xs font-medium text-neutral-600 underline underline-offset-2 hover:text-neutral-900"
    >
      Sign in
    </Link>
  );
}
