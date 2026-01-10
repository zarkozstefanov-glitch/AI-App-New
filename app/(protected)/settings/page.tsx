import ProfileForm from "@/components/settings/profile-form";
import PageHeader from "@/components/page-header";
import LanguageToggle from "@/components/settings/language-toggle";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerTranslator } from "@/lib/i18n/server";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth");
const { t } = await getServerTranslator(); // Добавяме await тук
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) redirect("/auth");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="mb-6 rounded-[2rem] border border-white/40 bg-white/20 p-6 shadow-glow backdrop-blur-3xl">
        <PageHeader
          label={t("settings.label")}
          title={t("settings.title")}
          subtitle={t("settings.subtitle")}
        />
      </div>
      <LanguageToggle />
      <ProfileForm
        firstName={user.firstName}
        lastName={user.lastName}
        phone={user.phone ?? ""}
        email={user.email}
        monthlyBudgetGoal={user.monthlyBudgetGoal}
      />
    </div>
  );
}
