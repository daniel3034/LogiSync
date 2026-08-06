import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-gray-100 p-6">
      <main className="w-full max-w-lg text-center">
        <p className="text-3xl font-semibold text-blue-700">LogiSync</p>
        <p className="mt-3 text-zinc-600">Freight and digital waybill management.</p>
        <Link
          href="/login"
          className="mt-8 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-white transition hover:bg-blue-700"
        >
          Sign in
        </Link>
      </main>
    </div>
  );
}
