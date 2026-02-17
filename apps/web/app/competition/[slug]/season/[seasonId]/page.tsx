const API = process.env.API_URL || 'http://localhost:3001';

async function getData(slug: string, seasonId: string) {
  const season = await fetch(`${API}/public/competitions/${slug}/seasons/${seasonId}`, { cache: 'no-store' }).then((r) => r.json());
  const phaseId = season?.phases?.[0]?.id ?? season?.phaseId;
  const standings = phaseId ? await fetch(`${API}/public/phases/${phaseId}/standings`, { cache: 'no-store' }).then((r) => r.json()) : [];
  const matches = phaseId ? await fetch(`${API}/public/phases/${phaseId}/matches`, { cache: 'no-store' }).then((r) => r.json()) : [];
  return { season, standings, matches };
}

export default async function CompetitionPage({
  params,
  searchParams
}: {
  params: { slug: string; seasonId: string };
  searchParams?: { tab?: string };
}) {
  const tab = searchParams?.tab === 'matches' ? 'matches' : 'standings';
  const { season, standings, matches } = await getData(params.slug, params.seasonId);

  return (
    <main>
      <h1>{season?.competition?.name} - {season?.name}</h1>
      <nav style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <a href={`?tab=standings`} style={{ fontWeight: tab === 'standings' ? 700 : 400 }}>Clasificación</a>
        <a href={`?tab=matches`} style={{ fontWeight: tab === 'matches' ? 700 : 400 }}>Calendario</a>
      </nav>

      {tab === 'standings' ? (
        <section>
          <h2>Clasificación</h2>
          <ul>{standings.map((s: any) => <li key={s.id}>#{s.rank} {s.teamId} {s.points} pts</li>)}</ul>
        </section>
      ) : (
        <section>
          <h2>Calendario</h2>
          <ul>{matches.map((m: any) => <li key={m.id}>R{m.round}: {m.homeTeamId} vs {m.awayTeamId}</li>)}</ul>
        </section>
      )}
    </main>
  );
}
