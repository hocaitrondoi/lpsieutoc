import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Zap, Clock, TrendingUp, Shield, Sparkles, Rocket, Target, Award,
  CheckCircle2, XCircle, ArrowRight, Star, Gift, Lock, Flame, Quote,
  ChevronDown, Bot, Layers, BarChart3, Globe, Wand2, X, Copy, Check,
} from "lucide-react";
import { CountdownTimer } from "@/components/CountdownTimer";
import { useServerFn } from "@tanstack/react-start";
import { createOrder } from "@/lib/order.functions";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "SADOMA AI — Tạo Landing Page Bán Hàng Trong 60 Giây" },
      {
        name: "description",
        content:
          "Ứng dụng AI tạo landing page siêu tốc cho dân kinh doanh online. Không cần code, không cần designer. Tăng tỷ lệ chuyển đổi lên 3x trong 30 ngày.",
      },
      { property: "og:title", content: "SADOMA AI — Tạo Landing Page Bán Hàng Trong 60 Giây" },
      { property: "og:description", content: "Biến ý tưởng thành landing page chuyển đổi cao chỉ trong 60 giây." },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700;800&family=Manrope:wght@400;500;600;700&display=swap",
      },
    ],
  }),
});

const PrimaryCTA = ({ children = "Sở Hữu SADOMA AI Ngay", small = false }) => (
  <a
    href="#order"
    className={`group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent font-bold text-primary-foreground shadow-glow transition-all hover:scale-[1.03] hover:shadow-[0_25px_80px_-15px_oklch(0.78_0.16_75/0.6)] ${
      small ? "px-6 py-3 text-sm" : "px-8 py-5 text-base sm:text-lg"
    }`}
  >
    <Flame className="h-5 w-5" />
    {children}
    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
  </a>
);

function LandingPage() {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // ➡️ Dán URL Google Apps Script của anh vào đây sau khi tạo xong
  const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxQSiSlD0RqYIGXU2L591-m4KhDHHGAz6YsMkKSCovnPJIJpdZML0UUgWMH4-lTcyl_/exec";

  const createOrderFn = useServerFn(createOrder);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // 1) Lưu backup vào database (admin xem được trong Lovable Cloud)
    try {
      await createOrderFn({ data: formData });
    } catch (err) {
      console.error("DB save failed:", err);
    }
    // 2) Gửi sang Google Sheet qua Apps Script (để thông báo + lưu sheet)
    try {
      await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          timestamp: new Date().toLocaleString("vi-VN"),
          status: "Chờ thanh toán",
        }),
      });
    } catch (_) {
      // silent — vẫn hiện QR cho khách
    }
    setIsSubmitting(false);
    setShowModal(true);
  };

  const transferNote = `PAGEF ${formData.name} ${formData.phone}`;

  const copyNote = () => {
    navigator.clipboard.writeText(transferNote);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="relative overflow-hidden bg-background text-foreground">

      {/* ===== PAYMENT MODAL ===== */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="relative w-full max-w-md overflow-y-auto max-h-[90vh] rounded-3xl border-2 border-primary/40 bg-surface p-8 shadow-2xl">
            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-primary/10 hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
                <Flame className="h-3.5 w-3.5" /> Bước cuối cùng
              </div>
              <h3 className="mt-2 font-display text-2xl font-bold">Quét QR để thanh toán</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Chuyển khoản để hoàn tất đặt mua — nhận tài khoản ngay trong 15 phút
              </p>
            </div>

            {/* QR Code */}
            <div className="mt-6 flex justify-center">
              <div className="overflow-hidden rounded-2xl border-2 border-primary/30 bg-white p-3">
                <img
                  src={`https://api.vietqr.io/image/970422-0913579509-3MbCFys.jpg?accountName=PHU%20QUOC%20NAM&amount=1490000&addInfo=${encodeURIComponent(transferNote)}`}
                  alt="QR Code thanh toán SADOMA AI"
                  className="h-56 w-56 object-contain"
                />
              </div>
            </div>

            {/* Bank Info */}
            <div className="mt-5 space-y-3 rounded-2xl border border-border bg-background/40 p-5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Ngân hàng</span>
                <span className="font-bold">MB Bank</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Số tài khoản</span>
                <span className="font-mono font-bold tracking-wider">0913 579 509</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Chủ tài khoản</span>
                <span className="font-bold uppercase">PHU QUOC NAM</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Số tiền</span>
                <span className="font-display text-xl font-extrabold text-gradient-gold">1.490.000đ</span>
              </div>
              <div className="flex items-start justify-between gap-3 border-t border-border pt-3">
                <div>
                  <div className="text-muted-foreground">Nội dung chuyển khoản</div>
                  <div className="mt-0.5 font-bold text-primary">{transferNote}</div>
                </div>
                <button
                  onClick={copyNote}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/20"
                >
                  {copied ? (
                    <><Check className="h-3.5 w-3.5" /> Đã copy!</>
                  ) : (
                    <><Copy className="h-3.5 w-3.5" /> Copy</>
                  )}
                </button>
              </div>
            </div>

            {/* Customer info reminder */}
            <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
              <p className="font-semibold text-foreground">Thông tin đăng ký của bạn:</p>
              <p className="mt-1 text-muted-foreground">👤 {formData.name}</p>
              <p className="text-muted-foreground">📧 {formData.email}</p>
              <p className="text-muted-foreground">📱 {formData.phone}</p>
            </div>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              🔒 Sau khi chuyển khoản thành công, chúng tôi sẽ gửi tài khoản qua email{" "}
              <strong className="text-foreground">{formData.email}</strong> trong vòng 15 phút.
            </p>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 h-[800px] bg-radial-glow" />

      {/* NAV */}
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2 font-display text-xl font-bold">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
            <Wand2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <span>SADOMA<span className="text-primary"> AI</span></span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/50 hover:bg-primary/10"
          >
            <Lock className="h-4 w-4" />
            Đăng Nhập
          </Link>
          <PrimaryCTA small>Dùng Thử Ngay</PrimaryCTA>
        </div>
      </header>

      {/* HERO */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-24 pt-12 text-center">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          Cảnh báo: 87% landing page bạn đang dùng đang "đốt tiền quảng cáo"
        </div>

        <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
          Tạo Landing Page Bán Hàng <br />
          <span className="text-gradient-gold">Chuyển Đổi Cao</span> Trong <span className="text-gradient-gold">60 Giây</span>
        </h1>

        <p className="mx-auto mt-8 max-w-3xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
          SADOMA AI là vũ khí bí mật của hơn <strong className="text-foreground">12.847 chủ shop, marketer và freelancer</strong> Việt Nam —
          giúp bạn biến một ý tưởng sản phẩm thành landing page bán hàng đẳng cấp agency,
          <strong className="text-foreground"> không cần code, không cần designer, không cần copywriter</strong>.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4">
          <PrimaryCTA />
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-primary" /> Bảo hành hoàn tiền 30 ngày</span>
            <span className="flex items-center gap-1.5"><Lock className="h-4 w-4 text-primary" /> Thanh toán an toàn</span>
            <span className="flex items-center gap-1.5"><Zap className="h-4 w-4 text-primary" /> Kích hoạt tức thì</span>
          </div>
        </div>

        {/* Hero mockup */}
        <div className="mx-auto mt-16 max-w-4xl">
          <div className="relative rounded-2xl border border-border bg-surface p-2 ring-gold">
            <div className="flex items-center gap-1.5 border-b border-border px-3 py-2">
              <div className="h-3 w-3 rounded-full bg-destructive/70" />
              <div className="h-3 w-3 rounded-full bg-gold/70" />
              <div className="h-3 w-3 rounded-full bg-primary/70" />
              <div className="ml-3 rounded bg-background/60 px-3 py-0.5 text-xs text-muted-foreground">pageforge.ai/studio</div>
            </div>
            <div className="grid grid-cols-12 gap-3 p-4">
              <div className="col-span-4 space-y-2">
                {[Bot, Layers, BarChart3, Globe].map((Icon, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-background/50 p-3 text-sm">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">Module {i + 1}</span>
                  </div>
                ))}
              </div>
              <div className="col-span-8 space-y-3 rounded-lg bg-background/40 p-4">
                <div className="h-6 w-3/4 rounded bg-gradient-to-r from-primary/40 to-accent/40" />
                <div className="h-4 w-full rounded bg-muted" />
                <div className="h-4 w-5/6 rounded bg-muted" />
                <div className="grid grid-cols-3 gap-2 pt-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="aspect-video rounded bg-gradient-to-br from-surface to-muted" />
                  ))}
                </div>
                <div className="mt-3 inline-block rounded-full bg-gradient-to-r from-primary to-accent px-4 py-1.5 text-xs font-bold text-primary-foreground">
                  ĐẶT MUA NGAY
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { v: "12.847+", l: "Khách hàng" },
              { v: "3.2x", l: "Tỷ lệ chuyển đổi" },
              { v: "60s", l: "Thời gian tạo trang" },
              { v: "4.9/5", l: "Đánh giá" },
            ].map((s) => (
              <div key={s.l} className="rounded-xl border border-border bg-surface/60 p-5 backdrop-blur">
                <div className="text-2xl font-bold text-gradient-gold sm:text-3xl">{s.v}</div>
                <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <Section>
        <Eyebrow>Sự thật phũ phàng</Eyebrow>
        <H2>
          Bạn đổ hàng <span className="text-gradient-gold">chục triệu vào quảng cáo</span><br />
          Nhưng landing page của bạn đang "giết chết" mọi cú click
        </H2>
        <Prose>
          <p>
            Hãy thành thật trả lời câu hỏi này: Lần cuối cùng bạn thấy một landing page khiến mình
            <em> phải dừng lại, đọc đến dòng cuối cùng và bấm mua</em> là khi nào?
          </p>
          <p>
            Khách hàng của bạn cũng vậy. Mỗi ngày họ lướt qua hàng trăm quảng cáo trên Facebook, TikTok, Google.
            Họ click vào trang bạn — và <strong className="text-foreground">thoát ra trong vòng 7 giây</strong> nếu
            trang không đủ hấp dẫn. Bạn vừa mất <strong className="text-foreground">15.000 đến 80.000đ</strong> cho
            mỗi cú thoát đó. Tính ra một tháng, đó là cả một chiếc xe máy bị đốt cháy.
          </p>
          <p>Vấn đề của bạn không phải là quảng cáo. Vấn đề là:</p>
        </Prose>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            { icon: Clock, t: "Quá chậm", d: "Mất 2-4 tuần để có một landing page tử tế. Trend đã qua, đối thủ đã chiếm thị phần." },
            { icon: TrendingUp, t: "Quá đắt", d: "Thuê designer + copywriter + dev: 15-50 triệu/trang. Chưa biết có chuyển đổi không." },
            { icon: Target, t: "Quá tệ", d: "Tự làm bằng các tool kéo thả: xấu, chậm, không bán được. Khách thoát ngay từ màn hình đầu." },
          ].map((p) => (
            <div key={p.t} className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
              <p.icon className="mb-3 h-6 w-6 text-destructive" />
              <h3 className="font-display text-lg font-bold">{p.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{p.d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* CONSEQUENCES */}
      <Section dark>
        <Eyebrow>Nếu bạn không thay đổi…</Eyebrow>
        <H2>Đây là những gì sẽ xảy ra trong <span className="text-gradient-gold">90 ngày tới</span></H2>
        <Prose>
          <p>
            Trong khi bạn còn loay hoay với một landing page "tạm ổn", đối thủ của bạn đang tung ra
            <strong className="text-foreground"> 5-10 trang mới mỗi tuần</strong> để test, tối ưu và chiếm sạch khách hàng tiềm năng trong ngành.
          </p>
          <p>
            Họ chạy quảng cáo rẻ hơn bạn 40% vì điểm chất lượng cao. Họ thu lead với chi phí bằng một nửa.
            Họ remarketing cho đúng những người vừa thoát khỏi trang của <em>bạn</em>. Càng để lâu, khoảng cách càng lớn.
          </p>
          <p>Hậu quả thật sự — không phải dọa, mà là những con số đang diễn ra mỗi ngày:</p>
          <ul>
            <li><strong className="text-foreground">Mỗi tháng bạn đốt thêm 8-30 triệu</strong> tiền quảng cáo cho một trang không bán được.</li>
            <li>Đội ngũ sale phải gồng mình tư vấn vì lead chất lượng quá thấp.</li>
            <li>Bạn mất tự tin với sản phẩm của chính mình — "có lẽ sản phẩm mình chưa đủ tốt"…</li>
            <li>Cuối cùng bạn từ bỏ ý tưởng kinh doanh đẹp đẽ ban đầu, quay lại làm thuê.</li>
          </ul>
          <p>
            Sự thật là <strong className="text-foreground">sản phẩm của bạn không có vấn đề</strong>. Bạn chỉ thiếu một thứ:
            một cỗ máy tạo landing page bán hàng đủ nhanh và đủ tốt để theo kịp tốc độ của thị trường.
          </p>
        </Prose>
      </Section>

      {/* STORY */}
      <Section>
        <Eyebrow>Câu chuyện thật</Eyebrow>
        <H2>Từ <span className="text-gradient-gold">87 triệu nợ quảng cáo</span> đến 6.2 tỷ doanh thu trong 9 tháng</H2>
        <Prose>
          <p>
            Năm 2022, tôi — đồng sáng lập của SADOMA AI — đang đứng bên bờ vực phá sản. Tôi bán khoá học online,
            đổ <strong className="text-foreground">87 triệu</strong> vào Facebook Ads trong 4 tháng. Kết quả?
            Doanh thu chưa được 30 triệu. Tỷ lệ chuyển đổi của landing page: <strong className="text-foreground">0.7%</strong>.
          </p>
          <p>
            Tôi thuê 3 freelancer khác nhau làm lại landing page. Mỗi người mất 3 tuần, lấy 12-18 triệu. Kết quả vẫn vậy.
            Tôi học copywriting suốt 6 tháng, đọc hết sách của Dan Kennedy, Eugene Schwartz, Russell Brunson. Vẫn không bứt phá được.
          </p>
          <p>
            Đến một đêm tháng 11, tôi quyết định <em>kết hợp toàn bộ công thức copywriting đỉnh cao</em> với GPT-4 vừa ra mắt.
            Tôi viết một con bot biết hỏi đúng câu hỏi, biết tự nghiên cứu khách hàng mục tiêu, biết áp dụng AIDA, PAS, BAB,
            và biết viết theo giọng văn người Việt.
          </p>
          <p>
            Landing page đầu tiên do AI tạo ra trong 4 phút. Tôi test với <strong className="text-foreground">800.000đ</strong> quảng cáo.
            Tỷ lệ chuyển đổi: <strong className="text-foreground">4.3%</strong>. Gấp 6 lần trang cũ.
          </p>
          <p>
            9 tháng sau, doanh thu khoá học của tôi cán mốc <strong className="text-foreground">6.2 tỷ đồng</strong>.
            Bạn bè làm marketing thấy vậy bắt đầu xin "con bot" của tôi. Rồi học viên xin. Rồi cộng đồng xin.
          </p>
          <p>
            Tôi nhận ra: <strong className="text-foreground">đây không nên là vũ khí riêng của tôi</strong>.
            Tôi gom đội ngũ 9 kỹ sư AI, copywriter và designer top đầu Việt Nam, dành 14 tháng để biến con bot
            cá nhân thành một sản phẩm mà <em>bất kỳ ai</em> cũng dùng được. Đó là cách SADOMA AI ra đời.
          </p>
        </Prose>
      </Section>

      {/* SOLUTION */}
      <Section dark>
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary">
          <Rocket className="h-4 w-4" /> Giải pháp đột phá
        </div>
        <H2>
          SADOMA AI — Cỗ máy tạo landing page <span className="text-gradient-gold">bán hàng tự động</span>
        </H2>
        <Prose>
          <p>
            SADOMA AI là một ứng dụng web sử dụng <strong className="text-foreground">AI thế hệ mới</strong> được huấn luyện
            riêng trên <strong className="text-foreground">hơn 18.000 landing page</strong> có tỷ lệ chuyển đổi cao nhất tại
            thị trường Việt Nam, Đông Nam Á và Mỹ.
          </p>
          <p>
            Bạn chỉ cần trả lời <strong className="text-foreground">7 câu hỏi đơn giản</strong> về sản phẩm, khách hàng và
            mục tiêu. SADOMA AI sẽ tự động viết toàn bộ nội dung, thiết kế giao diện, tối ưu chuyển đổi và xuất bản
            landing page chỉ trong <strong className="text-foreground">60 giây</strong>. Tất cả đều có thể tinh chỉnh bằng giọng nói hoặc kéo thả.
          </p>
        </Prose>

        {/* How it works */}
        <h3 className="mt-16 text-center font-display text-2xl font-bold sm:text-3xl">3 bước. 60 giây. Trang bán hàng đẳng cấp.</h3>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            { n: "01", t: "Mô tả sản phẩm", d: "Trả lời 7 câu hỏi do AI hỏi: bạn bán gì, cho ai, giá bao nhiêu, USP là gì." },
            { n: "02", t: "AI viết & thiết kế", d: "SADOMA AI nghiên cứu thị trường, viết copy theo công thức chuyển đổi cao, chọn ảnh và bố cục tối ưu." },
            { n: "03", t: "Xuất bản & bán", d: "Bấm Publish. Trang lên sóng với domain riêng, tích hợp Pixel, GA4, Pancake, Haravan. Bắt đầu chạy ads ngay." },
          ].map((s) => (
            <div key={s.n} className="relative rounded-2xl border border-border bg-surface p-7">
              <div className="font-display text-5xl font-extrabold text-gradient-gold">{s.n}</div>
              <h4 className="mt-3 text-xl font-bold">{s.t}</h4>
              <p className="mt-2 text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* BENEFITS */}
      <Section>
        <Eyebrow>Những gì bạn nhận được</Eyebrow>
        <H2>Không chỉ là một công cụ — đây là <span className="text-gradient-gold">đội ngũ marketing 24/7</span> của bạn</H2>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {[
            { i: Zap, t: "Giảm 95% thời gian tạo trang", d: "Từ 3 tuần xuống 60 giây. Bạn ra mắt sản phẩm trước đối thủ, chiếm trọn cơ hội thị trường khi trend còn nóng." },
            { i: TrendingUp, t: "Tăng 2-3x tỷ lệ chuyển đổi", d: "Mỗi đoạn copy đều dựa trên 18.000 case study có thật. Quảng cáo cùng ngân sách nhưng đơn về gấp đôi." },
            { i: Award, t: "Tiết kiệm 80-95% chi phí", d: "Thay vì 15-50 triệu/trang, bạn chi từ 4.700đ/trang. Tạo bao nhiêu trang tuỳ thích để A/B test." },
            { i: Sparkles, t: "Không cần biết code hay design", d: "Giao diện tiếng Việt. AI làm hết phần khó. Bạn chỉ tập trung vào việc bạn giỏi nhất: bán hàng." },
            { i: Target, t: "Tối ưu cho từng ngành nghề", d: "30+ template chuyên biệt cho khoá học, mỹ phẩm, BĐS, F&B, tài chính, dịch vụ B2B…" },
            { i: BarChart3, t: "Tăng trưởng doanh thu bền vững", d: "Heatmap, A/B test, AI gợi ý tối ưu liên tục. Trang của bạn càng dùng càng bán giỏi." },
          ].map((b) => (
            <div key={b.t} className="group flex gap-4 rounded-2xl border border-border bg-surface p-6 transition-all hover:border-primary/50 hover:shadow-glow">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
                <b.i className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold">{b.t}</h3>
                <p className="mt-1 text-muted-foreground">{b.d}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* FEATURES → BENEFITS */}
      <Section dark>
        <Eyebrow>Tính năng × Lợi ích</Eyebrow>
        <H2>Mỗi tính năng đều được thiết kế để <span className="text-gradient-gold">làm bạn ra tiền nhanh hơn</span></H2>

        <div className="mt-12 space-y-4">
          {[
            {
              f: "AI Copywriter huấn luyện trên 18.000 LP chuyển đổi cao",
              b: "Bạn không cần học copywriting 5 năm — AI viết theo công thức AIDA, PAS, 4U, BAB cho từng đoạn, tự động chèn yếu tố tâm lý FOMO, social proof, scarcity đúng vị trí.",
            },
            {
              f: "30+ template chuyên ngành",
              b: "Khoá học, mỹ phẩm, thực phẩm chức năng, BĐS, F&B, tài chính, B2B, SaaS, sự kiện… mỗi template được tối ưu riêng cho hành vi mua hàng của ngành đó.",
            },
            {
              f: "Trình kéo thả thông minh",
              b: "Chỉnh sửa từng chi tiết bằng kéo thả hoặc nói chuyện với AI bằng tiếng Việt: \"đổi màu nút sang đỏ cam\", \"thêm phần đếm ngược 24h\"…",
            },
            {
              f: "AI Hình ảnh & Video tích hợp",
              b: "Tự sinh ảnh sản phẩm, ảnh hero, mockup, video giới thiệu — không cần Photoshop, không cần stock site.",
            },
            {
              f: "Tích hợp 1-click: Pixel, GA4, GTM, Pancake, Haravan, Sapo, Hubspot, Zalo OA",
              b: "Lên đơn về thẳng phần mềm bạn đang dùng. Không lập trình, không Zapier, không phí ẩn.",
            },
            {
              f: "Tốc độ tải <1.2s — đạt 95+ điểm PageSpeed",
              b: "Trang nhanh = điểm chất lượng quảng cáo cao = CPM rẻ hơn 30-50%. Bạn tiết kiệm tiền ads ngay từ ngày đầu.",
            },
            {
              f: "A/B testing tự động + Heatmap",
              b: "AI tự chạy 4 phiên bản trang song song, chọn ra phiên bản chiến thắng. Mỗi tuần trang của bạn lại bán giỏi hơn tuần trước.",
            },
            {
              f: "Hosting & domain miễn phí trọn đời",
              b: "Không lo SSL, không lo server sập. Bạn ngủ ngon, trang vẫn bán hàng 24/7." ,
            },
          ].map((row, i) => (
            <div key={i} className="grid gap-4 rounded-2xl border border-border bg-surface p-6 md:grid-cols-5">
              <div className="md:col-span-2">
                <div className="text-xs font-bold uppercase tracking-widest text-primary">Tính năng</div>
                <div className="mt-1 font-display text-lg font-bold">{row.f}</div>
              </div>
              <div className="md:col-span-3">
                <div className="text-xs font-bold uppercase tracking-widest text-accent">Bạn được gì</div>
                <p className="mt-1 text-muted-foreground">{row.b}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* CASE STUDY */}
      <Section>
        <Eyebrow>Case study thực tế</Eyebrow>
        <H2>Chị Lan — chủ thương hiệu mỹ phẩm handmade, <span className="text-gradient-gold">tăng doanh thu 412%</span> trong 60 ngày</H2>

        <div className="mt-10 grid gap-8 rounded-3xl border border-border bg-surface p-8 md:grid-cols-2 md:p-12">
          <div>
            <Quote className="h-10 w-10 text-primary" />
            <p className="mt-4 text-lg leading-relaxed">
              "Trước đây mình bán mỹ phẩm thủ công, chạy ads tốn 22 triệu/tháng, chốt được khoảng 70 đơn.
              Sau khi dùng SADOMA AI làm lại trang đặt hàng và 4 trang phụ cho từng dòng sản phẩm, mình test trong 2 tuần
              rồi giữ lại phiên bản tốt nhất. Đến nay chi phí ads còn <strong className="text-foreground">14 triệu</strong>,
              nhưng đơn lên <strong className="text-foreground">358 đơn/tháng</strong>. Cái mình bất ngờ nhất là phần copy —
              đọc cứ như có người hiểu khách hàng của mình hơn cả mình."
            </p>
            <p className="mt-6 text-sm text-muted-foreground">— Chị Nguyễn Thị Lan, Founder LaBella Skincare</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { l: "Chi phí ads", b: "22tr", a: "14tr", down: true },
              { l: "Đơn / tháng", b: "70", a: "358" },
              { l: "Doanh thu", b: "98tr", a: "501tr" },
              { l: "ROAS", b: "1.8x", a: "6.4x" },
            ].map((m) => (
              <div key={m.l} className="rounded-xl bg-background/40 p-5">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{m.l}</div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-sm text-muted-foreground line-through">{m.b}</span>
                  <span className="text-2xl font-bold text-gradient-gold">{m.a}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* SOCIAL PROOF */}
      <Section dark>
        <Eyebrow>12.847 khách hàng đã tin dùng</Eyebrow>
        <H2>Họ nói gì về <span className="text-gradient-gold">SADOMA AI</span>?</H2>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {[
            { n: "Trần Minh Đức", r: "Coach kinh doanh online", q: "Tôi từng trả 45 triệu cho một agency làm landing page cho khoá học. Bây giờ tôi làm 12 trang trong 1 tuần với SADOMA, chuyển đổi còn cao hơn bản agency. Quá đỉnh." },
            { n: "Phạm Thuỳ Linh", r: "Chủ shop thời trang", q: "Cái hay nhất là tiếng Việt rất tự nhiên, không kiểu \"AI dịch\". Khách inbox khen trang đẹp suốt." },
            { n: "Lê Hoàng Nam", r: "Marketer Agency", q: "Trước mỗi pitch khách hàng tôi đều tạo 3 phương án trang khác nhau bằng SADOMA để demo. Tỷ lệ chốt deal của agency tôi tăng từ 22% lên 61%." },
            { n: "Đỗ Quỳnh Anh", r: "Founder ed-tech startup", q: "Chúng tôi tiết kiệm được vị trí 1 designer full-time. ROI của tool này tính ra gấp 18 lần chi phí." },
            { n: "Nguyễn Văn Phú", r: "Môi giới BĐS", q: "Mỗi dự án tôi làm 1 trang riêng trong 5 phút. Khách tin tưởng hơn hẳn so với gửi PDF brochure. Tháng vừa rồi tôi chốt 7 căn nhờ landing page do SADOMA tạo." },
            { n: "Vũ Khánh Hoà", r: "Chủ tiệm bánh online", q: "Mình không biết gì về web, chỉ trả lời mấy câu hỏi của AI là có trang đẹp. Mẹ mình còn dùng được, thật sự rất dễ." },
          ].map((t) => (
            <div key={t.n} className="rounded-2xl border border-border bg-surface p-6">
              <div className="flex gap-0.5 text-gold">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
              </div>
              <p className="mt-3 text-muted-foreground">"{t.q}"</p>
              <div className="mt-4 border-t border-border pt-4">
                <div className="font-bold">{t.n}</div>
                <div className="text-xs text-muted-foreground">{t.r}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { v: "12.847+", l: "Người dùng trả phí" },
            { v: "284.000+", l: "Landing page đã tạo" },
            { v: "3.2x", l: "Conversion trung bình" },
            { v: "92%", l: "Khách hàng renew" },
          ].map((s) => (
            <div key={s.l} className="rounded-xl border border-primary/30 bg-primary/5 p-5 text-center">
              <div className="text-3xl font-bold text-gradient-gold">{s.v}</div>
              <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* COMPARISON */}
      <Section>
        <Eyebrow>So sánh thẳng thắn</Eyebrow>
        <H2>SADOMA AI vs <span className="text-gradient-gold">cách làm truyền thống</span></H2>

        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[640px] overflow-hidden rounded-2xl border border-border">
            <thead>
              <tr className="bg-surface">
                <th className="p-5 text-left font-display">Tiêu chí</th>
                <th className="p-5 text-left font-display text-muted-foreground">Thuê agency / freelancer</th>
                <th className="p-5 text-left font-display text-muted-foreground">Tool kéo thả thông thường</th>
                <th className="p-5 text-left font-display text-primary">SADOMA AI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                ["Thời gian tạo trang", "2 - 4 tuần", "1 - 3 ngày", "60 giây"],
                ["Chi phí / trang", "15 - 50 triệu", "500k - 2tr + công sức", "Từ 4.700đ"],
                ["Copy chuyển đổi cao", "Tuỳ người viết", "Tự viết → thường yếu", "AI viết theo 18.000 LP mẫu"],
                ["Thiết kế đẹp", "Tuỳ designer", "Template cứng", "AI tự tối ưu bố cục"],
                ["A/B test tự động", "Không", "Phải tự chạy", "Có sẵn"],
                ["Tích hợp Pixel, GA, CRM", "Mất thêm phí", "Khó", "1-click"],
                ["Tốc độ tải <1.2s", "Hên xui", "Thường chậm", "Đảm bảo"],
                ["Hỗ trợ tiếng Việt", "Có", "Hạn chế", "Native tiếng Việt"],
              ].map((row, i) => (
                <tr key={i} className="bg-background/40">
                  <td className="p-5 font-semibold">{row[0]}</td>
                  <td className="p-5 text-muted-foreground">{row[1]}</td>
                  <td className="p-5 text-muted-foreground">{row[2]}</td>
                  <td className="p-5 font-semibold text-primary">{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* WHO IT'S FOR / NOT FOR */}
      <Section dark>
        <H2>SADOMA AI dành cho ai — và <span className="text-gradient-gold">không dành cho ai</span>?</H2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-primary/40 bg-primary/5 p-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
              <CheckCircle2 className="h-4 w-4" /> Dành cho bạn nếu…
            </div>
            <ul className="space-y-3">
              {[
                "Bạn là chủ shop online, đang chạy ads Facebook/TikTok/Google và muốn tăng conversion",
                "Bạn là coach, mentor, người bán khoá học, dịch vụ tư vấn",
                "Bạn làm marketer / agency cần tạo nhiều landing page cho khách hàng",
                "Bạn là freelancer muốn nhận thêm dịch vụ tạo landing page mà không phải học code",
                "Bạn vận hành startup, cần ra mắt sản phẩm nhanh để test thị trường",
                "Bạn là môi giới BĐS, bảo hiểm, tài chính cần trang riêng cho từng dự án/sản phẩm",
              ].map((x) => (
                <li key={x} className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><span>{x}</span></li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-destructive/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-destructive">
              <XCircle className="h-4 w-4" /> KHÔNG phù hợp nếu…
            </div>
            <ul className="space-y-3">
              {[
                "Bạn không có sản phẩm/dịch vụ thật sự để bán",
                "Bạn tin rằng chỉ cần tool đẹp là tự động ra tiền — không chịu test, đo, tối ưu",
                "Bạn cần một website doanh nghiệp 50+ trang với hệ thống phức tạp (chúng tôi làm landing page)",
                "Bạn không sẵn sàng dành 30 phút học cách dùng (dù rất dễ)",
                "Bạn đang tìm \"thần dược\" — không có công cụ nào thay được tư duy bán hàng của bạn",
              ].map((x) => (
                <li key={x} className="flex gap-3"><XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" /><span className="text-muted-foreground">{x}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* BONUSES */}
      <Section>
        <Eyebrow>Quà tặng đi kèm hôm nay</Eyebrow>
        <H2>Đặt mua trong 24h tới — bạn nhận thêm <span className="text-gradient-gold">5 gói quà tặng trị giá 23.700.000đ</span></H2>

        <div className="mt-12 space-y-5">
          {[
            { t: "BONUS #1 — Thư viện 250 mẫu copy bán hàng VIP", v: "4.900.000đ", d: "250 mẫu headline, CTA, email follow-up đã được kiểm chứng chuyển đổi cao tại thị trường Việt Nam. Bạn copy, chỉnh tên sản phẩm, dán vào — dùng luôn." },
            { t: "BONUS #2 — Khoá học \"Tâm lý học khách hàng Việt 2026\"", v: "5.800.000đ", d: "12 video độc quyền do giảng viên Đại học RMIT chia sẻ về 7 nhóm hành vi mua hàng đặc trưng của người Việt." },
            { t: "BONUS #3 — Bộ 50 ảnh hero AI premium", v: "2.400.000đ", d: "50 ảnh hero đẳng cấp do AI Midjourney + Photoshop chuyên nghiệp xử lý, free dùng thương mại trọn đời." },
            { t: "BONUS #4 — Phiên audit landing page 1-1 với chuyên gia", v: "4.500.000đ", d: "Buổi 45 phút online, chuyên gia của chúng tôi sẽ soi trang của bạn và đưa ra 10 đề xuất tối ưu cụ thể." },
            { t: "BONUS #5 — Cộng đồng VIP SADOMA Insider", v: "6.100.000đ/năm", d: "Tham gia nhóm Zalo + Discord độc quyền, nơi 1.200+ chủ shop & marketer chia sẻ trang chuyển đổi cao của họ mỗi tuần." },
          ].map((b, i) => (
            <div key={i} className="flex flex-col gap-4 rounded-2xl border border-gold/30 bg-gradient-to-r from-surface to-primary/5 p-6 md:flex-row md:items-center">
              <Gift className="h-10 w-10 shrink-0 text-gold" />
              <div className="flex-1">
                <h3 className="font-display text-lg font-bold">{b.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{b.d}</p>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Giá trị thực</div>
                <div className="text-xl font-bold text-gradient-gold">{b.v}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* VALUE STACK */}
      <Section dark>
        <Eyebrow>Tổng giá trị bạn nhận hôm nay</Eyebrow>
        <H2>Hãy nhìn vào con số thật — bạn sẽ thấy đây là <span className="text-gradient-gold">offer điên rồ</span></H2>

        <div className="mx-auto mt-10 max-w-2xl rounded-3xl border border-border bg-surface p-8">
          <ul className="divide-y divide-border">
            {[
              ["Phần mềm SADOMA AI (12 tháng, không giới hạn trang)", "11.880.000đ"],
              ["Bonus #1 — 250 mẫu copy bán hàng VIP", "4.900.000đ"],
              ["Bonus #2 — Khoá học Tâm lý khách hàng Việt 2026", "5.800.000đ"],
              ["Bonus #3 — Bộ 50 ảnh hero AI premium", "2.400.000đ"],
              ["Bonus #4 — Phiên audit 1-1 với chuyên gia", "4.500.000đ"],
              ["Bonus #5 — Cộng đồng VIP SADOMA Insider", "6.100.000đ"],
            ].map((row, i) => (
              <li key={i} className="flex items-center justify-between py-4">
                <span>{row[0]}</span>
                <span className="font-bold tabular-nums">{row[1]}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex items-center justify-between rounded-xl border border-primary/40 bg-primary/10 p-5">
            <span className="font-display text-lg font-bold">Tổng giá trị thật</span>
            <span className="font-display text-2xl font-bold text-gradient-gold">35.580.000đ</span>
          </div>
        </div>
      </Section>

      {/* PRICE + ORDER */}
      <Section id="order">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-destructive/15 px-4 py-2 text-xs font-bold uppercase tracking-widest text-destructive">
            <Flame className="h-4 w-4" /> Ưu đãi ra mắt — kết thúc trong:
          </div>
          <CountdownTimer />
        </div>

        <div className="mx-auto mt-12 max-w-2xl overflow-hidden rounded-3xl border-2 border-primary/60 bg-gradient-to-br from-surface via-surface to-primary/10 p-10 shadow-glow">
          <div className="text-center">
            <div className="text-xs font-bold uppercase tracking-widest text-primary">SADOMA AI — Gói Pro Lifetime</div>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row sm:items-baseline sm:gap-4">
              <span className="text-2xl text-muted-foreground line-through">35.580.000đ</span>
              <span className="font-display text-6xl font-extrabold text-gradient-gold sm:text-7xl">1.490.000đ</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Thanh toán một lần — sở hữu trọn đời. Chỉ <strong className="text-foreground">4.700đ / ngày</strong> trong năm đầu.
            </p>

            <div className="mx-auto mt-8 max-w-md space-y-3 text-left">
              {[
                "Truy cập trọn đời tất cả tính năng SADOMA AI",
                "Tạo không giới hạn landing page",
                "Tất cả 5 gói quà tặng trị giá 23.700.000đ",
                "Hỗ trợ ưu tiên 24/7 qua Zalo & email",
                "Cập nhật mọi tính năng mới miễn phí",
              ].map((x) => (
                <div key={x} className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 shrink-0 text-primary" /><span>{x}</span></div>
              ))}
            </div>

            {/* ORDER FORM */}
            <div className="mt-10">
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  id="order-name"
                  type="text"
                  placeholder="👤 Họ và tên đầy đủ *"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background/70 px-4 py-4 text-foreground placeholder:text-muted-foreground/60 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <input
                  id="order-email"
                  type="email"
                  placeholder="📧 Địa chỉ email nhận tài khoản *"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background/70 px-4 py-4 text-foreground placeholder:text-muted-foreground/60 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <input
                  id="order-phone"
                  type="tel"
                  placeholder="📱 Số điện thoại liên hệ *"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background/70 px-4 py-4 text-foreground placeholder:text-muted-foreground/60 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <button
                  id="order-submit"
                  type="submit"
                  disabled={isSubmitting}
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent font-bold text-primary-foreground shadow-glow transition-all hover:scale-[1.03] hover:shadow-[0_25px_80px_-15px_oklch(0.78_0.16_75/0.6)] px-8 py-5 text-base sm:text-lg disabled:opacity-70 disabled:cursor-not-allowed mt-1"
                >
                  <Flame className="h-5 w-5" />
                  {isSubmitting ? "Đang xử lý..." : "ĐẶT MUA NGAY — Giảm 95%"}
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </button>
              </form>
            </div>
            <div className="mt-4 text-xs text-muted-foreground">
              🔒 Điền thông tin → Nhận QR chuyển khoản → Nhận tài khoản qua email trong 15 phút.
            </div>
          </div>
        </div>

        {/* Guarantee */}
        <div className="mx-auto mt-12 flex max-w-3xl flex-col items-center gap-6 rounded-3xl border border-gold/40 bg-gradient-to-br from-surface to-gold/5 p-10 text-center md:flex-row md:text-left">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold to-primary">
            <Shield className="h-12 w-12 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-display text-2xl font-bold">Cam kết hoàn tiền 100% trong 30 ngày</h3>
            <p className="mt-3 text-muted-foreground">
              Dùng SADOMA AI 30 ngày. Nếu bạn không tạo ra ít nhất một landing page khiến bạn tự hào,
              hoặc không thấy <strong className="text-foreground">tỷ lệ chuyển đổi tăng rõ ràng</strong>, gửi cho chúng tôi một email.
              Chúng tôi hoàn lại <strong className="text-foreground">100% số tiền</strong>, không hỏi lý do.
              Bạn vẫn được giữ toàn bộ 5 gói quà tặng. Rủi ro hoàn toàn thuộc về chúng tôi.
            </p>
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <Section dark>
        <Eyebrow>Câu hỏi thường gặp</Eyebrow>
        <H2>Bạn còn băn khoăn? <span className="text-gradient-gold">Chúng tôi đã trả lời ở đây</span></H2>
        <div className="mx-auto mt-10 max-w-3xl space-y-3">
          {[
            { q: "Tôi không biết gì về công nghệ, có dùng được không?", a: "Hoàn toàn được. SADOMA AI được thiết kế cho người không chuyên. Bạn chỉ cần trả lời các câu hỏi bằng tiếng Việt, AI làm phần còn lại. 78% khách hàng của chúng tôi chưa từng dùng tool tạo trang nào trước đó." },
            { q: "Landing page do AI tạo có giống nhau không?", a: "Không. Mỗi trang được sinh dựa trên thông tin sản phẩm và nhóm khách hàng riêng của bạn. Hai trang về cùng một sản phẩm vẫn có thể khác nhau hoàn toàn về copy và layout." },
            { q: "Tôi có dùng được domain riêng của mình không?", a: "Có. Bạn có thể trỏ domain riêng (ví dụ shopcuaban.com) chỉ trong 2 phút. Chúng tôi cấp SSL miễn phí." },
            { q: "Có giới hạn số trang tạo không?", a: "Không giới hạn. Bạn có thể tạo 1 hoặc 1000 trang, tuỳ ý." },
            { q: "SADOMA AI có hỗ trợ chạy quảng cáo không?", a: "Chúng tôi tích hợp sẵn Facebook Pixel, GA4, GTM, TikTok Pixel với 1 click. Phần chạy ads vẫn là việc của bạn — nhưng trang của bạn sẽ giúp ads chạy hiệu quả hơn nhiều." },
            { q: "Tôi có thể tích hợp với Pancake, Haravan, Sapo không?", a: "Có. SADOMA AI tích hợp native với 12 nền tảng phổ biến tại Việt Nam, bao gồm Pancake, Haravan, Sapo, Kiotviet, Nhanh.vn, Hubspot, Zalo OA…" },
            { q: "Tôi đã có website cũ, có cần bỏ không?", a: "Không. SADOMA AI dùng để tạo các landing page chuyên dùng cho campaign quảng cáo. Bạn vẫn giữ website chính thức của mình bình thường." },
            { q: "Sau 12 tháng tôi có phải trả thêm tiền không?", a: "Gói Pro Lifetime trong ưu đãi này là TRỌN ĐỜI cho phần mềm. Bạn chỉ trả 1 lần, dùng mãi mãi — không có phí ẩn." },
            { q: "Tôi có được cập nhật tính năng mới không?", a: "Có. Mọi tính năng mới đều được cập nhật miễn phí cho khách hàng Lifetime, ngay cả khi giá bán cho khách mới tăng gấp đôi." },
            { q: "Nếu tôi không hài lòng thì sao?", a: "Bạn được hoàn 100% tiền trong vòng 30 ngày, không hỏi lý do. Bạn vẫn giữ toàn bộ 5 gói quà tặng. Đây là cam kết bằng văn bản." },
            { q: "Hỗ trợ kỹ thuật như thế nào?", a: "Hỗ trợ 24/7 qua Zalo, email và chat trong app. Khách hàng Pro Lifetime có hàng đợi ưu tiên — thời gian phản hồi trung bình dưới 15 phút." },
            { q: "Tôi có thể nâng cấp / bàn giao tài khoản cho đội của mình không?", a: "Tài khoản Pro Lifetime cho phép thêm tối đa 5 thành viên team với phân quyền chi tiết, miễn phí trọn đời." },
          ].map((f, i) => (
            <FAQItem key={i} q={f.q} a={f.a} />
          ))}
        </div>
      </Section>

      {/* FINAL SUMMARY + CTA */}
      <Section>
        <div className="mx-auto max-w-3xl text-center">
          <H2>Tóm lại — hôm nay bạn đang đứng trước <span className="text-gradient-gold">2 lựa chọn</span></H2>
          <div className="mt-10 grid gap-6 text-left md:grid-cols-2">
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
              <h3 className="font-display text-lg font-bold text-destructive">Lựa chọn 1: Không làm gì cả</h3>
              <p className="mt-3 text-muted-foreground">
                Đóng tab này. Tiếp tục đốt tiền quảng cáo cho landing page hiện tại. 90 ngày nữa quay lại,
                doanh thu vẫn vậy — hoặc tệ hơn vì đối thủ đã chạy trước bạn.
              </p>
            </div>
            <div className="rounded-2xl border-2 border-primary/60 bg-primary/10 p-6">
              <h3 className="font-display text-lg font-bold text-primary">Lựa chọn 2: Đầu tư 1.490.000đ hôm nay</h3>
              <p className="mt-3 text-muted-foreground">
                Sở hữu trọn đời cỗ máy tạo landing page chuyển đổi cao. Tạo trang đầu tiên trong tối nay.
                Bắt đầu thấy đơn về nhiều hơn ngay tuần đầu. Hoặc lấy lại toàn bộ tiền.
              </p>
            </div>
          </div>

          <div className="mx-auto mt-12 max-w-2xl rounded-3xl border border-border bg-surface p-8 text-left">
            <h3 className="font-display text-xl font-bold">Bạn nhận được trọn bộ:</h3>
            <ul className="mt-4 space-y-2">
              {[
                "✓ Phần mềm SADOMA AI Pro — trọn đời, không giới hạn trang",
                "✓ 250 mẫu copy bán hàng VIP (4.900.000đ)",
                "✓ Khoá học Tâm lý khách hàng Việt 2026 (5.800.000đ)",
                "✓ Bộ 50 ảnh hero AI premium (2.400.000đ)",
                "✓ Phiên audit 1-1 với chuyên gia (4.500.000đ)",
                "✓ Cộng đồng VIP SADOMA Insider (6.100.000đ/năm)",
                "✓ Hỗ trợ 24/7 ưu tiên + cập nhật trọn đời",
                "✓ Bảo hành hoàn tiền 100% trong 30 ngày",
              ].map((x) => <li key={x} className="text-muted-foreground">{x}</li>)}
            </ul>
            <div className="mt-6 flex items-baseline justify-between border-t border-border pt-6">
              <span className="text-sm text-muted-foreground">Tổng giá trị thật: <span className="line-through">35.580.000đ</span></span>
              <span className="font-display text-3xl font-bold text-gradient-gold">1.490.000đ</span>
            </div>
          </div>

          <div className="mt-10">
            <PrimaryCTA>YES! Tôi Sở Hữu SADOMA AI Ngay</PrimaryCTA>
            <p className="mt-4 text-sm text-muted-foreground">
              Bạn không mất gì cả — được bảo hành 30 ngày. Nhấn nút trên, vào ngay studio trong 60 giây nữa.
            </p>
          </div>

          <div className="mt-16 border-t border-border pt-10 text-left">
            <p className="text-muted-foreground">Cuối cùng, một lời chân thành từ đội ngũ SADOMA AI:</p>
            <p className="mt-4 text-lg leading-relaxed">
              Chúng tôi đã từng ở đúng vị trí của bạn — đốt tiền, mất ngủ, hoài nghi bản thân.
              Chúng tôi xây SADOMA AI vì chúng tôi tin rằng <strong className="text-foreground">không có chủ doanh nghiệp tử tế nào đáng bị giết bởi một landing page tệ</strong>.
              Hôm nay, công cụ mà ngày xưa chúng tôi ước có, đang nằm trong tầm tay bạn. Đừng để 12 tháng nữa
              bạn vẫn ngồi đây tự hỏi: <em>"Giá mà mình đã thử…"</em>
            </p>
            <p className="mt-4 text-right text-sm text-muted-foreground">— Đội ngũ SADOMA AI</p>
          </div>
        </div>
      </Section>

      <footer className="border-t border-border py-10 text-center text-sm text-muted-foreground">
        © 2026 SADOMA AI · Tạo bằng chính SADOMA AI · contact@pageforge.ai
      </footer>
    </main>
  );
}

/* ---------- helpers ---------- */
function Section({ children, dark = false, id }: { children: React.ReactNode; dark?: boolean; id?: string }) {
  return (
    <section id={id} className={`relative py-24 sm:py-32 ${dark ? "bg-surface/40" : ""}`}>
      <div className="mx-auto max-w-6xl px-6">{children}</div>
    </section>
  );
}
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
      {children}
    </div>
  );
}
function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">{children}</h2>;
}
function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-6 max-w-3xl space-y-4 text-lg leading-relaxed text-muted-foreground [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
      {children}
    </div>
  );
}
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-4 p-5 text-left font-semibold transition hover:bg-primary/5">
        <span>{q}</span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-primary transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="border-t border-border p-5 text-muted-foreground">{a}</div>}
    </div>
  );
}
