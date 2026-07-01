import { AdminPanel } from "@/components/admin/AdminPanel";
import { getProfiles } from "@/features/admin/actions";
import { getCurrentProfile, isAdmin } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!isAdmin(profile)) redirect("/");

  const profiles = await getProfiles();

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <AdminPanel profiles={profiles} />
    </div>
  );
}
