import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Wand2, LogOut, PlayCircle, CheckCircle2, Users, UserPlus, BookOpen, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { createStudent, listStudents } from "@/lib/admin.functions";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [
      { title: "Dashboard Học Viên — PageForge AI" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

type Lesson = { id: string; title: string; description: string | null; video_url: string | null; order_index: number };
type Course = { id: string; title: string; description: string | null };
type Student = { id: string; full_name: string | null; email: string | null; created_at: string };

function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [profileName, setProfileName] = useState("");

  const createStudentFn = useServerFn(createStudent);
  const listStudentsFn = useServerFn(listStudents);

  const [students, setStudents] = useState<Student[]>([]);
  const [newStudent, setNewStudent] = useState({ full_name: "", email: "", password: "" });
  const [adminMsg, setAdminMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [adminBusy, setAdminBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        navigate({ to: "/login" });
        return;
      }
      const userId = sess.session.user.id;
      const [{ data: roles }, { data: prof }, { data: courseRow }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", userId),
        supabase.from("profiles").select("full_name,email").eq("id", userId).maybeSingle(),
        supabase.from("courses").select("id,title,description").limit(1).maybeSingle(),
      ]);
      if (!mounted) return;
      const admin = !!roles?.some((r) => r.role === "admin");
      setIsAdmin(admin);
      setProfileName(prof?.full_name || prof?.email || sess.session.user.email || "Học viên");
      if (courseRow) {
        setCourse(courseRow);
        const { data: lessonRows } = await supabase
          .from("lessons").select("*").eq("course_id", courseRow.id).order("order_index");
        setLessons(lessonRows ?? []);
        setActiveLesson((lessonRows ?? [])[0] ?? null);
      }
      if (admin) {
        try {
          const res = await listStudentsFn();
          setStudents(res.students);
        } catch (e) {
          console.error(e);
        }
      }
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [navigate, listStudentsFn]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminMsg(null);
    setAdminBusy(true);
    try {
      await createStudentFn({ data: newStudent });
      setAdminMsg({ type: "ok", text: `Đã cấp tài khoản cho ${newStudent.full_name}` });
      setNewStudent({ full_name: "", email: "", password: "" });
      const res = await listStudentsFn();
      setStudents(res.students);
    } catch (err: any) {
      setAdminMsg({ type: "err", text: err?.message ?? "Có lỗi xảy ra" });
    } finally {
      setAdminBusy(false);
    }
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">Đang tải…</div>;
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
              <Wand2 className="h-4 w-4 text-primary-foreground" />
            </div>
            PageForge<span className="text-primary"> AI</span>
          </Link>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Shield className="h-3 w-3" /> ADMIN
              </span>
            )}
            <span className="hidden text-sm text-muted-foreground sm:inline">Xin chào, <b className="text-foreground">{profileName}</b></span>
            <button onClick={handleSignOut} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">
              <LogOut className="h-3.5 w-3.5" /> Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[320px_1fr]">
        {/* Sidebar - Course outline */}
        <aside className="space-y-3">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
              <BookOpen className="h-4 w-4" /> Khoá học
            </div>
            <h2 className="font-display text-lg font-bold leading-tight">{course?.title}</h2>
            {course?.description && <p className="mt-2 text-sm text-muted-foreground">{course.description}</p>}
          </div>
          <nav className="rounded-2xl border border-border bg-surface p-3">
            <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Outline bài học</p>
            <ul className="space-y-1">
              {lessons.map((l) => {
                const active = activeLesson?.id === l.id;
                return (
                  <li key={l.id}>
                    <button onClick={() => setActiveLesson(l)}
                      className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                        active ? "bg-primary/15 text-foreground" : "hover:bg-muted/50 text-muted-foreground"
                      }`}>
                      {active
                        ? <PlayCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 opacity-40" />}
                      <span className="leading-snug">{l.title}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* Main - Video + content */}
        <section className="space-y-6">
          <div className="overflow-hidden rounded-2xl border border-border bg-black shadow-glow">
            <div className="relative aspect-video w-full">
              {activeLesson?.video_url ? (
                <iframe
                  src={activeLesson.video_url}
                  className="absolute inset-0 h-full w-full"
                  title={activeLesson.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">Không có video</div>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-6">
            <h1 className="font-display text-2xl font-bold">{activeLesson?.title}</h1>
            {activeLesson?.description && (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{activeLesson.description}</p>
            )}
          </div>

          {/* Admin area */}
          {isAdmin && (
            <div className="rounded-2xl border border-primary/30 bg-surface p-6">
              <div className="mb-5 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h2 className="font-display text-xl font-bold">Khu vực Học Viên (Admin)</h2>
              </div>

              <form onSubmit={handleCreateStudent} className="grid gap-3 sm:grid-cols-4">
                <input required placeholder="Họ và tên" value={newStudent.full_name}
                  onChange={(e) => setNewStudent({ ...newStudent, full_name: e.target.value })}
                  className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none" />
                <input required type="email" placeholder="Email" value={newStudent.email}
                  onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                  className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none" />
                <input required minLength={6} placeholder="Mật khẩu (tối thiểu 6)" value={newStudent.password}
                  onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                  className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none" />
                <button disabled={adminBusy} type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-glow hover:scale-[1.02] disabled:opacity-60">
                  <UserPlus className="h-4 w-4" /> {adminBusy ? "Đang tạo…" : "Cấp tài khoản"}
                </button>
              </form>
              {adminMsg && (
                <div className={`mt-3 rounded-lg px-3 py-2 text-sm ${
                  adminMsg.type === "ok" ? "bg-emerald-500/10 text-emerald-400" : "bg-destructive/10 text-destructive"
                }`}>{adminMsg.text}</div>
              )}

              <div className="mt-6">
                <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                  Danh sách học viên ({students.length})
                </h3>
                <div className="overflow-hidden rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-4 py-2.5">Họ tên</th>
                        <th className="px-4 py-2.5">Email</th>
                        <th className="px-4 py-2.5">Ngày tạo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.length === 0 ? (
                        <tr><td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">Chưa có học viên</td></tr>
                      ) : students.map((s) => (
                        <tr key={s.id} className="border-t border-border">
                          <td className="px-4 py-2.5">{s.full_name || "—"}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{s.email}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{new Date(s.created_at).toLocaleDateString("vi-VN")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
