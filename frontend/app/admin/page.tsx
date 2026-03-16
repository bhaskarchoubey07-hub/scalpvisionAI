import { SectionHeader } from "@/components/section-header";

export default function AdminPage() {
  return (
    <div className="grid-shell py-8">
      <SectionHeader eyebrow="Admin" title="Platform operations panel" description="Review rate limits, moderation queues, model versions, and service health." />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Uploads Today", "1,284"],
          ["Flagged Charts", "7"],
          ["API Error Rate", "0.6%"],
          ["Model Version", "yolov8-cnn-v1"]
        ].map(([label, value]) => (
          <div key={label} className="glass rounded-[2rem] p-6">
            <div className="text-sm text-slate-400">{label}</div>
            <div className="mt-3 text-3xl font-semibold">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
