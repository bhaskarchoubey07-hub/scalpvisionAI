import { SectionHeader } from "@/components/section-header";
import { leaderboard } from "@/lib/mock-data";

export default function LeaderboardPage() {
  return (
    <div className="grid-shell py-8">
      <SectionHeader eyebrow="Leaderboard" title="Top strategy performers" description="Rank users by score, win rate, and sustained execution quality." />
      <div className="glass overflow-hidden rounded-[2rem]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-white/10 text-slate-400">
            <tr>
              <th className="px-6 py-4">Trader</th>
              <th className="px-6 py-4">Score</th>
              <th className="px-6 py-4">Win Rate</th>
              <th className="px-6 py-4">Trades</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry) => (
              <tr key={entry.name} className="border-b border-white/5">
                <td className="px-6 py-4">{entry.name}</td>
                <td className="px-6 py-4">{entry.score}</td>
                <td className="px-6 py-4 text-accent">{entry.winRate}</td>
                <td className="px-6 py-4">{entry.trades}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
