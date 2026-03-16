import { SectionHeader } from "@/components/section-header";

export default function ProfilePage() {
  return (
    <div className="grid-shell py-8">
      <SectionHeader eyebrow="Profile" title="User analytics and account center" description="Review performance, authentication settings, and social identity connections." />
      <div className="grid gap-6 md:grid-cols-3">
        <div className="glass rounded-[2rem] p-6">
          <div className="text-sm text-slate-400">Display Name</div>
          <div className="mt-2 text-2xl font-semibold">Bhaskar Trader</div>
        </div>
        <div className="glass rounded-[2rem] p-6">
          <div className="text-sm text-slate-400">Connected Providers</div>
          <div className="mt-2 text-2xl font-semibold">Email, Google</div>
        </div>
        <div className="glass rounded-[2rem] p-6">
          <div className="text-sm text-slate-400">Lifetime Accuracy</div>
          <div className="mt-2 text-2xl font-semibold">71%</div>
        </div>
      </div>
    </div>
  );
}
