import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-gray-100 p-6">
      <main className="w-full max-w-lg text-center">
        <p className="text-3xl font-semibold text-blue-700">LogiSync</p>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900">
          Freight and digital waybill management
        </h1>
        <p className="mt-3 text-zinc-600">
          Create digital waybills, price Central America routes, and manage your
          driver directory from one place built for freight ops.
        </p>

        <ul className="mt-8 space-y-2 text-left text-sm text-zinc-700">
          <li>Digital waybills with printable PDFs</li>
          <li>Route pricing with real distance and margins</li>
          <li>Driver directory filtered by preferred cities</li>
        </ul>

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
