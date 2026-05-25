import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Wand2, LogOut, PlayCircle, CheckCircle2, Users, UserPlus, BookOpen, Shield, Plus, Pencil, Trash2, Save, X, RefreshCw, Video, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { createStudent, listStudents, createLesson, updateLesson, deleteLesson, createCourse, updateCourse, deleteCourse, updateStudentCourses } from "@/lib/admin.functions";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [
      { title: "Dashboard Học Viên — SADOMA AI" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

type Lesson = { id: string; title: string; description: string | null; video_url: string | null; order_index: number };
type Course = { id: string; title: string; description: string | null };
type Student = { id: string; full_name: string | null; email: string | null; created_at: string; course_ids?: string[] };

function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [profileName, setProfileName] = useState("");

  // Server functions
  const createStudentFn = useServerFn(createStudent);
  const listStudentsFn = useServerFn(listStudents);
  const createLessonFn = useServerFn(createLesson);
  const updateLessonFn = useServerFn(updateLesson);
  const deleteLessonFn = useServerFn(deleteLesson);
  const createCourseFn = useServerFn(createCourse);
  const updateCourseFn = useServerFn(updateCourse);
  const deleteCourseFn = useServerFn(deleteCourse);
  const updateStudentCoursesFn = useServerFn(updateStudentCourses);

  // Student state
  const [students, setStudents] = useState<Student[]>([]);
  const [newStudent, setNewStudent] = useState({ full_name: "", email: "", password: "" });
  const [adminMsg, setAdminMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [adminBusy, setAdminBusy] = useState(false);
  const [studentListError, setStudentListError] = useState<string | null>(null);

  // Course management state
  const [newCourse, setNewCourse] = useState({ title: "", description: "" });
  const [courseBusy, setCourseBusy] = useState(false);
  const [courseMsg, setCourseMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [editCourseData, setEditCourseData] = useState({ title: "", description: "" });
  const [deleteCourseConfirmId, setDeleteCourseConfirmId] = useState<string | null>(null);

  // Lesson management state
  const [newLesson, setNewLesson] = useState({ title: "", description: "", video_url: "" });
  const [lessonBusy, setLessonBusy] = useState(false);
  const [lessonMsg, setLessonMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editLessonData, setEditLessonData] = useState({ title: "", description: "", video_url: "" });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Refresh courses from Supabase
  const refreshCourses = async () => {
    const { data: courseRows } = await supabase
      .from("courses").select("id,title,description").order("created_at");
    setCourses(courseRows ?? []);
    return courseRows ?? [];
  };

  // Refresh lessons from Supabase
  const refreshLessons = async (courseId: string) => {
    const { data: lessonRows } = await supabase
      .from("lessons").select("*").eq("course_id", courseId).order("order_index");
    setLessons(lessonRows ?? []);
    return lessonRows ?? [];
  };

  // Refresh students from server
  const refreshStudents = async () => {
    setStudentListError(null);
    try {
      const res = await listStudentsFn();
      setStudents(res.students);
    } catch (e: any) {
      console.error("listStudents error:", e);
      setStudentListError(e?.message ?? "Không thể tải danh sách học viên");
    }
  };

  useEffect(() => {
    let mounted = true;
    let sessionCheckInterval: NodeJS.Timeout;
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        navigate({ to: "/login" });
        return;
      }
      const userId = sess.session.user.id;
      const [{ data: roles }, { data: prof }, { data: courseRows }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", userId),
        supabase.from("profiles").select("full_name,email,current_session_id").eq("id", userId).maybeSingle(),
        supabase.from("courses").select("id,title,description").order("created_at"),
      ]);
      if (!mounted) return;
      const admin = !!roles?.some((r) => r.role === "admin");
      setIsAdmin(admin);

      // Single Session Token check for students
      if (!admin && prof) {
        const localToken = localStorage.getItem("device_session_token");
        if (prof.current_session_id && prof.current_session_id !== localToken) {
          alert("Tài khoản của bạn đã được đăng nhập từ một thiết bị khác. Bạn sẽ bị đăng xuất.");
          await supabase.auth.signOut();
          localStorage.removeItem("device_session_token");
          navigate({ to: "/login" });
          return;
        }
      }

      setProfileName(prof?.full_name || prof?.email || sess.session.user.email || "Học viên");
      
      const loadedCourses = courseRows ?? [];
      setCourses(loadedCourses);

      if (loadedCourses.length > 0) {
        const defaultCourse = loadedCourses[0];
        setCourse(defaultCourse);
        const lessonRows = await refreshLessons(defaultCourse.id);
        setActiveLesson(lessonRows[0] ?? null);
      }

      if (admin) {
        await refreshStudents();
      }
      setLoading(false);

      // Set up periodic check every 10 seconds for students
      if (!admin) {
        sessionCheckInterval = setInterval(async () => {
          const { data: currentProf } = await supabase
            .from("profiles")
            .select("current_session_id")
            .eq("id", userId)
            .maybeSingle();
          
          if (!mounted) return;
          const latestLocalToken = localStorage.getItem("device_session_token");
          if (currentProf && currentProf.current_session_id && currentProf.current_session_id !== latestLocalToken) {
            clearInterval(sessionCheckInterval);
            alert("Tài khoản của bạn đã đăng nhập từ thiết bị khác. Hệ thống sẽ tự động đăng xuất.");
            await supabase.auth.signOut();
            localStorage.removeItem("device_session_token");
            navigate({ to: "/login" });
          }
        }, 10000);
      }
    })();
    return () => { 
      mounted = false; 
      if (sessionCheckInterval) clearInterval(sessionCheckInterval);
    };
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  // ====== STUDENT HANDLERS ======
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminMsg(null);
    setAdminBusy(true);
    try {
      await createStudentFn({ data: newStudent });
      setAdminMsg({ type: "ok", text: `✅ Đã cấp tài khoản cho ${newStudent.full_name}` });
      setNewStudent({ full_name: "", email: "", password: "" });
      await refreshStudents();
    } catch (err: any) {
      setAdminMsg({ type: "err", text: err?.message ?? "Có lỗi xảy ra" });
    } finally {
      setAdminBusy(false);
    }
  };

  const handleToggleStudentCourse = async (studentId: string, courseId: string, currentChecked: boolean) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    const currentCourseIds = student.course_ids ?? [];
    let nextCourseIds: string[];
    if (currentChecked) {
      nextCourseIds = [...currentCourseIds, courseId];
    } else {
      nextCourseIds = currentCourseIds.filter((id) => id !== courseId);
    }

    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, course_ids: nextCourseIds } : s))
    );

    try {
      await updateStudentCoursesFn({ data: { student_id: studentId, course_ids: nextCourseIds } });
    } catch (err: any) {
      alert("Không thể cập nhật quyền khóa học: " + (err?.message ?? "Có lỗi xảy ra"));
      setStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, course_ids: currentCourseIds } : s))
      );
    }
  };

  // ====== COURSE HANDLERS ======
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setCourseMsg(null);
    setCourseBusy(true);
    try {
      const res = await createCourseFn({ data: newCourse });
      setCourseMsg({ type: "ok", text: `✅ Đã tạo khóa học "${newCourse.title}"` });
      setNewCourse({ title: "", description: "" });
      const updated = await refreshCourses();
      if (!course && updated.length > 0) {
        setCourse(updated[0]);
        const lessonRows = await refreshLessons(updated[0].id);
        setActiveLesson(lessonRows[0] ?? null);
      }
    } catch (err: any) {
      setCourseMsg({ type: "err", text: err?.message ?? "Có lỗi xảy ra" });
    } finally {
      setCourseBusy(false);
    }
  };

  const handleStartEditCourse = (c: Course) => {
    setEditingCourseId(c.id);
    setEditCourseData({
      title: c.title,
      description: c.description ?? "",
    });
  };

  const handleSaveEditCourse = async () => {
    if (!editingCourseId) return;
    setCourseBusy(true);
    setCourseMsg(null);
    try {
      await updateCourseFn({ data: { id: editingCourseId, ...editCourseData } });
      setCourseMsg({ type: "ok", text: `✅ Đã cập nhật khóa học` });
      setEditingCourseId(null);
      const updated = await refreshCourses();
      // Update selected course if it was edited
      if (course?.id === editingCourseId) {
        const found = updated.find(c => c.id === editingCourseId);
        if (found) setCourse(found);
      }
    } catch (err: any) {
      setCourseMsg({ type: "err", text: err?.message ?? "Có lỗi khi cập nhật" });
    } finally {
      setCourseBusy(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    setCourseBusy(true);
    setCourseMsg(null);
    try {
      await deleteCourseFn({ data: { id: courseId } });
      setCourseMsg({ type: "ok", text: `✅ Đã xóa khóa học` });
      setDeleteCourseConfirmId(null);
      const updated = await refreshCourses();
      if (course?.id === courseId) {
        const nextCourse = updated[0] ?? null;
        setCourse(nextCourse);
        if (nextCourse) {
          const lessonRows = await refreshLessons(nextCourse.id);
          setActiveLesson(lessonRows[0] ?? null);
        } else {
          setLessons([]);
          setActiveLesson(null);
        }
      }
    } catch (err: any) {
      setCourseMsg({ type: "err", text: err?.message ?? "Có lỗi khi xóa" });
    } finally {
      setCourseBusy(false);
    }
  };

  // ====== LESSON HANDLERS ======
  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course) return;
    setLessonMsg(null);
    setLessonBusy(true);
    try {
      await createLessonFn({ data: { ...newLesson, course_id: course.id } });
      setLessonMsg({ type: "ok", text: `✅ Đã thêm bài giảng "${newLesson.title}"` });
      setNewLesson({ title: "", description: "", video_url: "" });
      const updated = await refreshLessons(course.id);
      if (!activeLesson && updated.length > 0) setActiveLesson(updated[0]);
    } catch (err: any) {
      setLessonMsg({ type: "err", text: err?.message ?? "Có lỗi xảy ra" });
    } finally {
      setLessonBusy(false);
    }
  };

  const handleStartEdit = (lesson: Lesson) => {
    setEditingLessonId(lesson.id);
    setEditLessonData({
      title: lesson.title,
      description: lesson.description ?? "",
      video_url: lesson.video_url ?? "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingLessonId || !course) return;
    setLessonBusy(true);
    setLessonMsg(null);
    try {
      await updateLessonFn({ data: { id: editingLessonId, ...editLessonData } });
      setLessonMsg({ type: "ok", text: `✅ Đã cập nhật bài giảng` });
      setEditingLessonId(null);
      const updated = await refreshLessons(course.id);
      // Update active lesson if it was edited
      if (activeLesson?.id === editingLessonId) {
        const found = updated.find(l => l.id === editingLessonId);
        if (found) setActiveLesson(found);
      }
    } catch (err: any) {
      setLessonMsg({ type: "err", text: err?.message ?? "Có lỗi khi cập nhật" });
    } finally {
      setLessonBusy(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!course) return;
    setLessonBusy(true);
    setLessonMsg(null);
    try {
      await deleteLessonFn({ data: { id: lessonId } });
      setLessonMsg({ type: "ok", text: `✅ Đã xóa bài giảng` });
      setDeleteConfirmId(null);
      const updated = await refreshLessons(course.id);
      if (activeLesson?.id === lessonId) {
        setActiveLesson(updated[0] ?? null);
      }
    } catch (err: any) {
      setLessonMsg({ type: "err", text: err?.message ?? "Có lỗi khi xóa" });
    } finally {
      setLessonBusy(false);
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
            SADOMA<span className="text-primary"> AI</span>
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
              <BookOpen className="h-4 w-4" /> Chọn khoá học
            </div>
            {courses.length > 1 ? (
              <select
                value={course?.id ?? ""}
                onChange={async (e) => {
                  const selectedId = e.target.value;
                  const found = courses.find((c) => c.id === selectedId);
                  if (found) {
                    setCourse(found);
                    const lessonRows = await refreshLessons(found.id);
                    setActiveLesson(lessonRows[0] ?? null);
                  }
                }}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            ) : (
              <h2 className="font-display text-lg font-bold leading-tight">{course?.title ?? "Chưa có khóa học"}</h2>
            )}
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
              {lessons.length === 0 && (
                <li className="px-3 py-4 text-center text-sm text-muted-foreground">Chưa có bài học nào</li>
              )}
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
            <h1 className="font-display text-2xl font-bold">{activeLesson?.title ?? "Chưa chọn bài học"}</h1>
            {activeLesson?.description && (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{activeLesson.description}</p>
            )}
          </div>

          {/* ====== ADMIN AREA ====== */}
          {isAdmin && (
            <div className="space-y-6">

              {/* ===== QUẢN LÝ KHÓA HỌC ===== */}
              <div className="rounded-2xl border border-primary/30 bg-surface p-6">
                <div className="mb-5 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  <h2 className="font-display text-xl font-bold">Quản lý Khóa Học (Admin)</h2>
                </div>

                {/* Form thêm khóa học */}
                <form onSubmit={handleCreateCourse} className="space-y-3 rounded-xl border border-border bg-background/40 p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-primary">Tạo khóa học mới</p>
                  <input
                    required
                    placeholder="📝 Tên khóa học *"
                    value={newCourse.title}
                    onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
                  />
                  <input
                    placeholder="📄 Mô tả ngắn"
                    value={newCourse.description}
                    onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
                  />
                  <button
                    disabled={courseBusy}
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-glow hover:scale-[1.02] disabled:opacity-60"
                  >
                    <Plus className="h-4 w-4" /> {courseBusy ? "Đang tạo…" : "Tạo khóa học"}
                  </button>
                </form>

                {/* Thông báo */}
                {courseMsg && (
                  <div className={`mt-3 rounded-lg px-3 py-2 text-sm ${
                    courseMsg.type === "ok" ? "bg-emerald-500/10 text-emerald-400" : "bg-destructive/10 text-destructive"
                  }`}>{courseMsg.text}</div>
                )}

                {/* Bảng danh sách khóa học */}
                <div className="mt-5">
                  <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                    Danh sách khóa học ({courses.length})
                  </h3>
                  <div className="overflow-hidden rounded-xl border border-border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <tr>
                          <th className="px-4 py-2.5 w-12">STT</th>
                          <th className="px-4 py-2.5">Tên khóa học</th>
                          <th className="px-4 py-2.5 text-right">Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courses.length === 0 ? (
                          <tr><td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">Chưa có khóa học nào — hãy thêm khóa học đầu tiên ở trên!</td></tr>
                        ) : courses.map((c, idx) => (
                          <tr key={c.id} className="border-t border-border">
                            {editingCourseId === c.id ? (
                              /* ===== EDIT MODE ===== */
                              <>
                                <td className="px-4 py-2.5 text-muted-foreground">{idx + 1}</td>
                                <td className="px-4 py-2">
                                  <input
                                    value={editCourseData.title}
                                    onChange={(e) => setEditCourseData({ ...editCourseData, title: e.target.value })}
                                    className="w-full rounded-lg border border-primary/40 bg-background px-2 py-1.5 text-sm focus:outline-none"
                                  />
                                  <input
                                    value={editCourseData.description}
                                    onChange={(e) => setEditCourseData({ ...editCourseData, description: e.target.value })}
                                    placeholder="Mô tả"
                                    className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs focus:outline-none"
                                  />
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button onClick={handleSaveEditCourse} disabled={courseBusy}
                                      className="rounded-lg bg-emerald-500/20 p-1.5 text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-50" title="Lưu">
                                      <Save className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => setEditingCourseId(null)}
                                      className="rounded-lg bg-muted p-1.5 text-muted-foreground hover:bg-muted/80" title="Hủy">
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </>
                            ) : deleteCourseConfirmId === c.id ? (
                              /* ===== DELETE CONFIRM ===== */
                              <>
                                <td className="px-4 py-2.5 text-muted-foreground">{idx + 1}</td>
                                <td className="px-4 py-2.5">
                                  <span className="text-destructive font-semibold">Xác nhận xóa khóa "{c.title}" và tất cả bài giảng liên quan?</span>
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button onClick={() => handleDeleteCourse(c.id)} disabled={courseBusy}
                                      className="rounded-lg bg-destructive/20 px-3 py-1.5 text-xs font-bold text-destructive hover:bg-destructive/30 disabled:opacity-50">
                                      Xóa luôn
                                    </button>
                                    <button onClick={() => setDeleteCourseConfirmId(null)}
                                      className="rounded-lg bg-muted px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/80">
                                      Hủy
                                    </button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              /* ===== NORMAL VIEW ===== */
                              <>
                                <td className="px-4 py-2.5 text-muted-foreground">{idx + 1}</td>
                                <td className="px-4 py-2.5">
                                  <div className="font-medium">{c.title}</div>
                                  {c.description && <div className="text-xs text-muted-foreground mt-0.5">{c.description}</div>}
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button onClick={() => handleStartEditCourse(c)}
                                      className="rounded-lg bg-primary/10 p-1.5 text-primary hover:bg-primary/20" title="Sửa">
                                      <Pencil className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => setDeleteCourseConfirmId(c.id)}
                                      className="rounded-lg bg-destructive/10 p-1.5 text-destructive hover:bg-destructive/20" title="Xóa">
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* ===== QUẢN LÝ BÀI GIẢNG ===== */}
              <div className="rounded-2xl border border-primary/30 bg-surface p-6">
                <div className="mb-5 flex items-center gap-2">
                  <Video className="h-5 w-5 text-primary" />
                  <h2 className="font-display text-xl font-bold">Quản lý Bài Giảng (Admin)</h2>
                </div>

                {/* Form thêm bài giảng */}
                <form onSubmit={handleCreateLesson} className="space-y-3 rounded-xl border border-border bg-background/40 p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-primary">Thêm bài giảng mới</p>
                  <input
                    required
                    placeholder="📝 Tên bài giảng *"
                    value={newLesson.title}
                    onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
                  />
                  <input
                    placeholder="📄 Mô tả ngắn (không bắt buộc)"
                    value={newLesson.description}
                    onChange={(e) => setNewLesson({ ...newLesson, description: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
                  />
                  <input
                    placeholder="🎬 Link video / Embed URL (YouTube, Vimeo, Drive...)"
                    value={newLesson.video_url}
                    onChange={(e) => setNewLesson({ ...newLesson, video_url: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
                  />
                  <button
                    disabled={lessonBusy}
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-glow hover:scale-[1.02] disabled:opacity-60"
                  >
                    <Plus className="h-4 w-4" /> {lessonBusy ? "Đang thêm…" : "Thêm bài giảng"}
                  </button>
                </form>

                {/* Thông báo */}
                {lessonMsg && (
                  <div className={`mt-3 rounded-lg px-3 py-2 text-sm ${
                    lessonMsg.type === "ok" ? "bg-emerald-500/10 text-emerald-400" : "bg-destructive/10 text-destructive"
                  }`}>{lessonMsg.text}</div>
                )}

                {/* Bảng danh sách bài giảng */}
                <div className="mt-5">
                  <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                    Danh sách bài giảng ({lessons.length})
                  </h3>
                  <div className="overflow-hidden rounded-xl border border-border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <tr>
                          <th className="px-4 py-2.5 w-12">STT</th>
                          <th className="px-4 py-2.5">Tên bài giảng</th>
                          <th className="px-4 py-2.5 hidden md:table-cell">Link video</th>
                          <th className="px-4 py-2.5 text-right">Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lessons.length === 0 ? (
                          <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">Chưa có bài giảng nào — hãy thêm bài đầu tiên ở trên!</td></tr>
                        ) : lessons.map((l, idx) => (
                          <tr key={l.id} className="border-t border-border">
                            {editingLessonId === l.id ? (
                              /* ===== EDIT MODE ===== */
                              <>
                                <td className="px-4 py-2.5 text-muted-foreground">{idx + 1}</td>
                                <td className="px-4 py-2">
                                  <input
                                    value={editLessonData.title}
                                    onChange={(e) => setEditLessonData({ ...editLessonData, title: e.target.value })}
                                    className="w-full rounded-lg border border-primary/40 bg-background px-2 py-1.5 text-sm focus:outline-none"
                                  />
                                  <input
                                    value={editLessonData.description}
                                    onChange={(e) => setEditLessonData({ ...editLessonData, description: e.target.value })}
                                    placeholder="Mô tả"
                                    className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs focus:outline-none"
                                  />
                                </td>
                                <td className="px-4 py-2 hidden md:table-cell">
                                  <input
                                    value={editLessonData.video_url}
                                    onChange={(e) => setEditLessonData({ ...editLessonData, video_url: e.target.value })}
                                    placeholder="Link video"
                                    className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs focus:outline-none"
                                  />
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button onClick={handleSaveEdit} disabled={lessonBusy}
                                      className="rounded-lg bg-emerald-500/20 p-1.5 text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-50" title="Lưu">
                                      <Save className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => setEditingLessonId(null)}
                                      className="rounded-lg bg-muted p-1.5 text-muted-foreground hover:bg-muted/80" title="Hủy">
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </>
                            ) : deleteConfirmId === l.id ? (
                              /* ===== DELETE CONFIRM ===== */
                              <>
                                <td className="px-4 py-2.5 text-muted-foreground">{idx + 1}</td>
                                <td colSpan={2} className="px-4 py-2.5">
                                  <span className="text-destructive font-semibold">Xác nhận xóa bài "{l.title}"?</span>
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button onClick={() => handleDeleteLesson(l.id)} disabled={lessonBusy}
                                      className="rounded-lg bg-destructive/20 px-3 py-1.5 text-xs font-bold text-destructive hover:bg-destructive/30 disabled:opacity-50">
                                      Xóa luôn
                                    </button>
                                    <button onClick={() => setDeleteConfirmId(null)}
                                      className="rounded-lg bg-muted px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/80">
                                      Hủy
                                    </button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              /* ===== NORMAL VIEW ===== */
                              <>
                                <td className="px-4 py-2.5 text-muted-foreground">{idx + 1}</td>
                                <td className="px-4 py-2.5">
                                  <div className="font-medium">{l.title}</div>
                                  {l.description && <div className="text-xs text-muted-foreground mt-0.5">{l.description}</div>}
                                </td>
                                <td className="px-4 py-2.5 hidden md:table-cell">
                                  {l.video_url ? (
                                    <span className="text-xs text-primary truncate block max-w-[200px]">{l.video_url}</span>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">—</span>
                                  )}
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button onClick={() => handleStartEdit(l)}
                                      className="rounded-lg bg-primary/10 p-1.5 text-primary hover:bg-primary/20" title="Sửa">
                                      <Pencil className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => setDeleteConfirmId(l.id)}
                                      className="rounded-lg bg-destructive/10 p-1.5 text-destructive hover:bg-destructive/20" title="Xóa">
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* ===== QUẢN LÝ HỌC VIÊN ===== */}
              <div className="rounded-2xl border border-primary/30 bg-surface p-6">
                <div className="mb-5 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <h2 className="font-display text-xl font-bold">Quản lý Học Viên (Admin)</h2>
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
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-muted-foreground">
                      Danh sách học viên ({students.length})
                    </h3>
                    <button onClick={refreshStudents}
                      className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/20">
                      <RefreshCw className="h-3 w-3" /> Tải lại
                    </button>
                  </div>

                  {studentListError && (
                    <div className="mb-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{studentListError}</div>
                  )}

                  <div className="overflow-hidden rounded-xl border border-border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <tr>
                          <th className="px-4 py-2.5">Họ tên</th>
                          <th className="px-4 py-2.5">Email</th>
                          <th className="px-4 py-2.5">Khóa học được học</th>
                          <th className="px-4 py-2.5">Ngày tạo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.length === 0 ? (
                          <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">Chưa có học viên</td></tr>
                        ) : students.map((s) => (
                          <tr key={s.id} className="border-t border-border">
                            <td className="px-4 py-2.5 font-medium">{s.full_name || "—"}</td>
                            <td className="px-4 py-2.5 text-muted-foreground">{s.email}</td>
                            <td className="px-4 py-2.5">
                              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                                {courses.map((c) => {
                                  const isEnrolled = s.course_ids?.includes(c.id) ?? false;
                                  return (
                                    <label key={c.id} className="inline-flex items-center gap-1.5 text-xs text-foreground cursor-pointer select-none">
                                      <input
                                        type="checkbox"
                                        checked={isEnrolled}
                                        onChange={(e) => handleToggleStudentCourse(s.id, c.id, e.target.checked)}
                                        className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                                      />
                                      <span>{c.title}</span>
                                    </label>
                                  );
                                })}
                                {courses.length === 0 && <span className="text-xs text-muted-foreground">Chưa có khóa học để phân quyền</span>}
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-muted-foreground">{new Date(s.created_at).toLocaleDateString("vi-VN")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>
          )}
        </section>
      </div>
    </main>
  );
}
