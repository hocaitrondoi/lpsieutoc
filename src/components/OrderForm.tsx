import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Flame, ArrowRight, CheckCircle2, Loader2, Copy, RefreshCw } from "lucide-react";
import { createOrder } from "@/lib/order.functions";

const QR_BASE = "https://api.vietqr.io/image/970422-0913579509-3MbCFys.jpg?accountName=PHU%20QUOC%20NAM&amount=1490000";

export function OrderForm() {
  const createOrderFn = useServerFn(createOrder);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<{ note: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const res = await createOrderFn({ data: form });
      setDone({ note: res.note ?? `${form.phone} ${form.full_name}` });
    } catch (e: any) {
      setErr(e?.message ?? "Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  };

  const handleReset = () => {
    setDone(null);
    setForm({ full_name: "", email: "", phone: "" });
  };

  const copyNote = () => {
    if (!done) return;
    navigator.clipboard.writeText(done.note);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  if (done) {
    const qrUrl = `${QR_BASE}&addInfo=${encodeURIComponent(done.note)}`;
    return (
      <div className="mx-auto mt-10 max-w-lg rounded-2xl border-2 border-primary/60 bg-background p-6 text-center shadow-glow">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" /> Đã nhận thông tin
        </div>
        <h3 className="font-display text-2xl font-bold">Quét mã QR để thanh toán</h3>
        <p className="mt-1 text-sm text-muted-foreground">Số tiền: <strong className="text-foreground">1.490.000đ</strong></p>

        <div className="mx-auto mt-5 w-full max-w-[320px] overflow-hidden rounded-2xl bg-white p-3">
          <img src={qrUrl} alt="QR thanh toán PageForge AI" className="block h-auto w-full" />
        </div>

        <div className="mt-5 rounded-xl border border-border bg-surface p-4 text-left">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nội dung chuyển khoản</div>
          <div className="mt-1 flex items-center justify-between gap-3">
            <code className="text-sm font-bold text-foreground">{done.note}</code>
            <button onClick={copyNote} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs hover:bg-muted">
              <Copy className="h-3.5 w-3.5" /> {copied ? "Đã copy" : "Copy"}
            </button>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            ⚠️ <strong>Ghi đúng nội dung chuyển khoản</strong> để hệ thống kích hoạt tài khoản tự động.
            Sau khi thanh toán, bạn sẽ nhận email kích hoạt trong vòng 5 phút.
          </p>
        </div>

        <button onClick={handleReset} className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <RefreshCw className="h-3.5 w-3.5" /> Đặt đơn khác
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-10 max-w-lg space-y-3 rounded-2xl border border-border bg-background/60 p-6 text-left">
      <div className="text-center">
        <div className="text-xs font-bold uppercase tracking-widest text-primary">Bước 1/2 — Nhập thông tin</div>
        <p className="mt-1 text-xs text-muted-foreground">Mã QR thanh toán sẽ hiện ngay sau khi bạn điền</p>
      </div>
      <input required maxLength={120} placeholder="Họ và tên" value={form.full_name}
        onChange={(e) => setForm({ ...form, full_name: e.target.value })}
        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
      <input required type="email" maxLength={255} placeholder="Email nhận tài khoản" value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
      <input required type="tel" maxLength={20} placeholder="Số điện thoại (Zalo)" value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />

      {err && <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</div>}

      <button type="submit" disabled={busy}
        className="group flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-8 py-4 text-base font-bold text-primary-foreground shadow-glow transition-all hover:scale-[1.02] disabled:opacity-60">
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Flame className="h-5 w-5" />}
        {busy ? "Đang xử lý…" : "ĐẶT MUA NGAY — Giảm 95%"}
        {!busy && <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />}
      </button>
      <p className="text-center text-xs text-muted-foreground">
        🔒 Thông tin được mã hoá — chỉ dùng để kích hoạt tài khoản học viên
      </p>
    </form>
  );
}
