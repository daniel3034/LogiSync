import LoginForm from "./LoginForm";

/** Only allow same-origin relative paths, so `?callbackUrl=` can't send users off-site. */
function safeCallbackUrl(raw: string | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center bg-gray-100 p-6">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow">
        <h1 className="text-2xl font-semibold text-zinc-900">LogiSync</h1>
        <p className="mt-1 mb-6 text-sm text-zinc-600">
          Sign in to continue.
        </p>

        <LoginForm callbackUrl={safeCallbackUrl(callbackUrl)} />
      </div>
    </div>
  );
}
