import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import { auth } from "@/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const isAdmin = session?.user.role === "ADMIN";

  return (
    <div className="min-h-screen bg-gray-100 lg:flex">
      <div className="hidden lg:block lg:w-64 lg:shrink-0">
        <Sidebar isAdmin={isAdmin} />
      </div>

      <div className="flex flex-1 flex-col">
        <Navbar isAdmin={isAdmin} />

        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}