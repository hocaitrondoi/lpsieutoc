import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Wand2, Lock, Mail, Eye, EyeOff, ArrowLeft, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Đăng Nhập — PageForge AI" },
      { name: "description", content: "Đăng nhập học viên PageForge AI." },
    ],
  }),
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }
    setIsLoading(true);
    const { error: authErr } = await supabase.auth.signInWithPassword({ email, password });
    setIsLoading(false);
    if (authErr) {
      setError("Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.");
      return;
    }
    navigate({ to: "/dashboard" });
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[600px] bg-radial-glow" />
      <div className="relative z-10 w-full max-w-md">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Quay lại trang chủ
        </Link>
        <div className="mb-8 flex items-center justify-center gap-2 font-display text-2xl font-bold">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
            <Wand2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <span>PageForge<span className="text-primary"> AI</span></span>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-8 shadow-glow">
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold tracking-tight">Đăng Nhập Học Viên</h1>
            <p className="mt-2 text-sm text-muted-foreground">Truy cập khoá học và tài nguyên của bạn</p>
          </div>
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="hocvien@example.com"
                  className="w-full rounded-xl border border-border bg-background py-3 pl-11 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" required />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input id="password" type={showPassword ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full rounded-xl border border-border bg-background py-3 pl-11 pr-11 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            {error && <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
            <button type="submit" disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent py-3 text-sm font-bold text-primary-foreground shadow-glow transition-all hover:scale-[1.02] disabled:opacity-60">
              <Flame className="h-4 w-4" />
              {isLoading ? "Đang đăng nhập…" : "Đăng Nhập"}
            </button>
          </form>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Tài khoản học viên do quản trị viên cấp. Liên hệ admin nếu chưa có tài khoản.
          </p>
        </div>
      </div>
    </main>
  );
}
