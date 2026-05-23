import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Wand2, Lock, Mail, Eye, EyeOff, ArrowLeft, Flame } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Đăng Nhập — PageForge AI" },
      { name: "description", content: "Đăng nhập vào tài khoản PageForge AI để bắt đầu tạo landing page bán hàng siêu tốc." },
    ],
  }),
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }

    setIsLoading(true);

    // Simulate login - in production this would connect to backend
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsLoading(false);
    // For now show a message - real auth would redirect
    setError("Tính năng đăng nhập đang được kích hoạt. Vui lòng quay lại sau!");
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[600px] bg-radial-glow" />

      <div className="relative z-10 w-full max-w-md">
        {/* Back link */}
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại trang chủ
        </Link>

        {/* Logo */}
        <div className="mb-8 flex items-center justify-center gap-2 font-display text-2xl font-bold">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
            <Wand2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <span>PageForge<span className="text-primary"> AI</span></span>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-surface p-8 shadow-glow">
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold tracking-tight">
              Đăng Nhập Học Viên
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Đăng nhập để truy cập khoá học và tài nguyên của bạn
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-foreground">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hocvien@example.com"
                  className="w-full rounded-xl border border-border bg-background py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-foreground">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-border bg-background py-3 pl-11 pr-11 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" className="h-4 w-4 rounded border-border bg-background text-primary" />
                Ghi nhớ đăng nhập
              </label>
              <a href="#" className="text-sm text-primary hover:underline">
                Quên mật khẩu?
              </a>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="group flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent py-3 text-sm font-bold text-primary-foreground shadow-glow transition-all hover:scale-[1.02] hover:shadow-[0_25px_80px_-15px_oklch(0.78_0.16_75/0.6)] disabled:opacity-60"
            >
              <Flame className="h-4 w-4" />
              {isLoading ? "Đang đăng nhập…" : "Đăng Nhập"}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">hoặc</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Register link */}
          <p className="text-center text-sm text-muted-foreground">
            Chưa có tài khoản?{" "}
            <a href="#" className="font-semibold text-primary hover:underline">
              Đăng ký ngay
            </a>
          </p>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Bằng việc đăng nhập, bạn đồng ý với{" "}
          <a href="#" className="text-primary hover:underline">Điều khoản sử dụng</a>{" "}
          và{" "}
          <a href="#" className="text-primary hover:underline">Chính sách bảo mật</a>.
        </p>
      </div>
    </main>
  );
}
