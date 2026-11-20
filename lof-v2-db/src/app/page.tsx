// This app only holds the InstantDB schema and permissions (pushed with instant-cli).
// The page is static on purpose: it must not connect to the database.
export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 font-[family-name:var(--font-geist-sans)]">
      <div className="max-w-md space-y-3 text-center">
        <h1 className="text-2xl font-semibold">BayanWin database tools</h1>
        <p className="text-gray-500">
          This is an internal service with no public features. For PCSO results and analysis, go to{" "}
          <a href="https://bayanwin.net" className="underline">
            bayanwin.net
          </a>
          .
        </p>
      </div>
    </main>
  );
}
