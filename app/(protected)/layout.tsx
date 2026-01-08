import Nav from "@/components/nav";
import Footer from "@/components/footer";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth");
  }

  return (
    <div className="lg:min-h-screen lg:flex lg:flex-col">
      <Nav session={session} />
      <main className="overflow-y-auto overflow-x-hidden px-4 pt-6 pb-24 sm:px-6 lg:px-12 lg:pb-0">
        {children}
        <div className="lg:hidden">
          <Footer variant="content" />
        </div>
      </main>
      <Footer className="hidden lg:block lg:mt-auto lg:pt-20" />
    </div>
  );
}
