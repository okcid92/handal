export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-100 px-6 py-16 text-zinc-900">
      <main className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight">Next.js + MySQL</h1>
        <p className="mt-3 text-zinc-700">
          Le projet est initialise et pret a se connecter a votre serveur MySQL
          local.
        </p>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">Etapes rapides</h2>
          <ol className="list-decimal space-y-2 pl-5 text-zinc-700">
            <li>Copiez .env.example vers .env.local.</li>
            <li>Renseignez vos identifiants MySQL.</li>
            <li>Lancez npm run dev.</li>
            <li>Ouvrez l endpoint de test pour verifier la connexion.</li>
          </ol>
        </section>

        <div className="mt-8">
          <a
            className="inline-flex items-center rounded-full bg-zinc-900 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-700"
            href="/api/db-test"
          >
            Tester la connexion MySQL
          </a>
        </div>
      </main>
    </div>
  );
}
