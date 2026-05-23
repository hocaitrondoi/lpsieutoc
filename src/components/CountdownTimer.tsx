import { useEffect, useState } from "react";

export function CountdownTimer() {
  const [target] = useState(() => Date.now() + 1000 * 60 * 60 * 23 + 1000 * 60 * 47);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = Math.max(0, target - now);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");

  const Box = ({ v, label }: { v: string; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="min-w-[72px] rounded-xl bg-surface px-4 py-3 text-3xl font-bold text-gradient-gold tabular-nums ring-gold sm:text-4xl">
        {v}
      </div>
      <span className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
    </div>
  );

  return (
    <div className="flex items-center justify-center gap-3 sm:gap-4">
      <Box v={pad(h)} label="Giờ" />
      <span className="text-3xl text-primary">:</span>
      <Box v={pad(m)} label="Phút" />
      <span className="text-3xl text-primary">:</span>
      <Box v={pad(s)} label="Giây" />
    </div>
  );
}
