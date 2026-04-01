import { useState } from "react";
import { Link } from "wouter";
import { useLang } from "@/contexts/language-context";
import { SiteFooter } from "@/components/site-footer";
import { MArrowLeft, MBookOpen } from "@/components/icons";
import { LanguagePicker } from "@/components/language-picker";

export default function FaqPage() {
  const { t } = useLang();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "hsl(30, 58%, 97%)" }}
    >
      {/* Header */}
      <header className="sticky top-0 z-10 border-b" style={{
        background: "rgba(250,242,234,0.85)",
        backdropFilter: "blur(12px)",
        borderColor: "rgba(249,109,28,0.12)",
      }}>
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center gap-3">
          <Link href="/">
            <button
              className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
              style={{ color: "#8a7a70" }}
              data-testid="back-home"
            >
              <MArrowLeft size={16} />
              {t.common.back}
            </button>
          </Link>
          <div className="flex-1" />
          <LanguagePicker size="sm" />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
        {/* Hero */}
        <div className="mb-10">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4"
            style={{ background: "rgba(249,109,28,0.1)", color: "#F96D1C" }}
          >
            FAQ
          </div>
          <h1 className="text-3xl font-bold mb-3" style={{ color: "#2d2520", letterSpacing: "-0.02em" }}>
            {t.faq.title}
          </h1>
          <p className="text-base" style={{ color: "#8a7a70" }}>
            {t.faq.subtitle}
          </p>
        </div>

        {/* Accordion */}
        <div className="flex flex-col gap-2">
          {t.faq.items.map((item, i) => (
            <div
              key={i}
              className="rounded-2xl border overflow-hidden transition-all"
              style={{
                borderColor: open === i ? "rgba(249,109,28,0.3)" : "rgba(249,109,28,0.12)",
                background: open === i ? "rgba(249,109,28,0.04)" : "#fff",
              }}
              data-testid={`faq-item-${i}`}
            >
              <button
                className="w-full text-left px-5 py-4 flex items-center justify-between gap-3"
                onClick={() => setOpen(open === i ? null : i)}
                data-testid={`faq-toggle-${i}`}
              >
                <span className="font-medium text-sm" style={{ color: "#2d2520" }}>
                  {item.q}
                </span>
                <div
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all"
                  style={{
                    background: open === i ? "rgba(249,109,28,0.15)" : "rgba(249,109,28,0.08)",
                    color: "#F96D1C",
                    transform: open === i ? "rotate(45deg)" : "rotate(0deg)",
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <line x1="5" y1="1" x2="5" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="1" y1="5" x2="9" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
              </button>
              {open === i && (
                <div className="px-5 pb-4">
                  <p className="text-sm leading-relaxed" style={{ color: "#5a4a40" }}>
                    {item.a}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div
          className="mt-10 rounded-2xl p-6 text-center"
          style={{ background: "rgba(249,109,28,0.07)", border: "1px solid rgba(249,109,28,0.15)" }}
        >
          <p className="text-sm mb-3" style={{ color: "#5a4a40" }}>
            Still have questions?
          </p>
          <Link href="/api-key-guide">
            <button
              className="text-sm font-medium underline underline-offset-2"
              style={{ color: "#F96D1C" }}
              data-testid="faq-api-guide-link"
            >
              {t.footer.apiGuide} →
            </button>
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
