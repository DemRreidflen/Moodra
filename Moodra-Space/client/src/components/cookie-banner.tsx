import { useState, useEffect } from "react";
import { useLang } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CONSENT_KEY = "moodra_cookie_consent";

const I18N = {
  en: {
    title: "We use cookies",
    text: "Moodra uses essential cookies to keep you logged in and remember your settings. We do not use tracking or advertising cookies.",
    accept: "Accept all",
    essential: "Essential only",
    learnMore: "Privacy policy",
  },
  ru: {
    title: "Мы используем cookies",
    text: "Moodra использует необходимые файлы cookie для поддержания сеанса и сохранения настроек. Мы не используем рекламные или трекинговые cookies.",
    accept: "Принять все",
    essential: "Только необходимые",
    learnMore: "Политика конфиденциальности",
  },
  uk: {
    title: "Ми використовуємо cookies",
    text: "Moodra використовує необхідні файли cookie для підтримки сесії та збереження налаштувань. Ми не використовуємо рекламні чи трекінгові cookies.",
    accept: "Прийняти всі",
    essential: "Лише необхідні",
    learnMore: "Політика конфіденційності",
  },
  de: {
    title: "Wir verwenden Cookies",
    text: "Moodra verwendet notwendige Cookies, um Sie eingeloggt zu halten und Ihre Einstellungen zu speichern. Wir verwenden keine Tracking- oder Werbe-Cookies.",
    accept: "Alle akzeptieren",
    essential: "Nur notwendige",
    learnMore: "Datenschutzrichtlinie",
  },
};

export function CookieBanner() {
  const { lang } = useLang();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) setVisible(true);
  }, []);

  const t = I18N[lang as keyof typeof I18N] ?? I18N.en;

  function accept() {
    localStorage.setItem(CONSENT_KEY, "all");
    setVisible(false);
  }

  function essential() {
    localStorage.setItem(CONSENT_KEY, "essential");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[9999]",
        "bg-background/95 backdrop-blur-sm border-t border-border shadow-lg",
        "px-4 py-4 sm:px-6"
      )}
      role="dialog"
      aria-label={t.title}
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground mb-1">{t.title}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{t.text}</p>
        </div>
        <div className="flex flex-row gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8 px-3"
            onClick={essential}
          >
            {t.essential}
          </Button>
          <Button
            size="sm"
            className="text-xs h-8 px-4 bg-amber-700 hover:bg-amber-800 text-white"
            onClick={accept}
          >
            {t.accept}
          </Button>
        </div>
      </div>
    </div>
  );
}
