import AuthForm from "@/components/auth-form";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { getServerTranslator } from "@/lib/i18n/server";

export default async function AuthPage() {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect("/");
  }
  const { t } = getServerTranslator();

  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4 py-8">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.2fr_1fr]">
        <Card className="p-8 lg:p-10 bg-gradient-to-br from-white via-slate-50 to-sky-50">
          <div className="flex h-full flex-col justify-between gap-8">
            <div className="space-y-4">
              <span className="inline-flex rounded-full bg-indigo-50 px-4 py-2 text-xs uppercase tracking-[0.3em] text-indigo-700">
                {t("auth.title")}
              </span>
              <h1 className="text-4xl font-semibold text-slate-900 leading-tight">
                {t("auth.subtitle")}
              </h1>
              <p className="text-base text-slate-600">
                {t("auth.description")} {t("auth.note")}
              </p>
            </div>
            <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-indigo-600">
                  {t("auth.aiRecognition")}
                </p>
                <p className="mt-2">
                  {t("auth.aiDetail")} {t("auth.rate")}
                </p>
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-6 lg:p-8 bg-white/70">
          <AuthForm />
        </Card>
      </div>
    </div>
  );
}
