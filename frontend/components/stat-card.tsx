type Props = {
  label: string;
  value: string;
  hint: string;
};

export function StatCard({ label, value, hint }: Props) {
  return (
    <div className="glass rounded-3xl p-5">
      <div className="text-sm text-slate-400">{label}</div>
      <div className="mt-4 text-3xl font-semibold">{value}</div>
      <div className="mt-2 text-xs text-slate-500">{hint}</div>
    </div>
  );
}
