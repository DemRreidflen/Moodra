import { useLocation } from "wouter";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Zap, Brain, Star, FlaskConical, Check, ExternalLink, Cpu, Rocket, Layers, Lock, Clock, AlertTriangle, Wifi, FileText, Infinity, Shield, Gauge } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLang } from "@/contexts/language-context";
import { LanguagePicker } from "@/components/language-picker";
import { useFreeMode } from "@/hooks/use-free-mode";
import { SiteFooter } from "@/components/site-footer";

const MODEL_IDS = ["gpt-4o-mini", "gpt-4.1-mini", "gpt-3.5-turbo", "gpt-4o", "gpt-4.1", "gpt-4-turbo", "o4-mini"] as const;
const MODEL_ICONS = [Zap, Cpu, Rocket, Star, Brain, Layers, FlaskConical];
const MODEL_ICON_COLORS = ["#F96D1C", "#3B82F6", "#64748B", "#8B5CF6", "#10B981", "#F59E0B", "#EC4899"];
const MODEL_BADGE_COLORS = ["#F96D1C", "#3B82F6", "#64748B", "#8B5CF6", "#10B981", "#F59E0B", "#EC4899"];
const MODEL_PRICES = [
  { input: 0.150, output: 0.600, speed: 5, quality: 3, cost: 1 },
  { input: 0.40,  output: 1.60,  speed: 5, quality: 4, cost: 2 },
  { input: 0.50,  output: 1.50,  speed: 5, quality: 2, cost: 1 },
  { input: 2.50,  output: 10.00, speed: 4, quality: 5, cost: 4 },
  { input: 2.00,  output: 8.00,  speed: 4, quality: 5, cost: 4 },
  { input: 10.00, output: 30.00, speed: 3, quality: 4, cost: 5 },
  { input: 1.10,  output: 4.40,  speed: 2, quality: 5, cost: 3 },
];

const MODEL_CONTENT = {
  en: [
    { name: "GPT-4o mini",   badge: "Recommended", tagline: "Fast, affordable, smart", desc: "The ideal model for daily writing. Excellent at continuing text, generating ideas, editing, and research. Used by 95% of writers on Moodra.", dollar: "$5 ≈ 33,000 requests", tags: ["Texts", "Ideas", "Editing", "Research"] },
    { name: "GPT-4.1 mini",  badge: "Balanced",    tagline: "Smarter, barely more expensive", desc: "OpenAI's latest compact model with improved instruction following. Great for complex requests where precision and structure matter. Speed nearly identical to gpt-4o-mini.", dollar: "$5 ≈ 12,500 requests", tags: ["Structure", "Precision", "Instructions", "Texts"] },
    { name: "GPT-3.5 Turbo", badge: "Ultra-cheap", tagline: "The most affordable model", desc: "The legendary model that revolutionized 2022–2023. Very cheap and fast. Suitable for simple tasks: continuing text, rephrasing, quick ideas. For complex arguments, choose something more powerful.", dollar: "$5 ≈ 10,000 requests", tags: ["Drafts", "Rephrase", "Fast"] },
    { name: "GPT-4o",        badge: "Top quality", tagline: "Best for complex tasks", desc: "OpenAI's flagship model. Understands nuance, produces more vivid and precise text. Perfect for final chapter polishing, complex hypotheses, and situations where maximum quality matters.", dollar: "$5 ≈ 2,000 requests", tags: ["Polish", "Hypotheses", "Dialogue", "Atmosphere"] },
    { name: "GPT-4.1",       badge: "New",         tagline: "Smarter than gpt-4o, slightly cheaper", desc: "OpenAI's latest flagship. Outperforms gpt-4o on many benchmarks: better instruction following, more precise in details, deeper long-context work. A great choice for serious authors.", dollar: "$5 ≈ 2,500 requests", tags: ["Long texts", "Details", "Precision", "Context"] },
    { name: "GPT-4 Turbo",   badge: "Classic",     tagline: "The reliable power of gpt-4", desc: "Earlier GPT-4 with improved speed and 128K context. Works great with long texts and deep editing. Good for authors who value proven model stability.", dollar: "$5 ≈ 500 requests", tags: ["Long context", "Stability", "Editing"] },
    { name: "o4-mini",       badge: "Reasoning",   tagline: "Thinks before answering", desc: "A reasoning model: it builds a chain of thought before every response. Slower, but delivers deep, logically sound answers. Ideal for scientific hypotheses, argumentation, and complex analysis. Also used by Moodra as the dedicated model for book adaptation thanks to its 200K context and 100K output tokens.", dollar: "$5 ≈ 4,500 requests", tags: ["Hypotheses", "Arguments", "Analysis", "Logic", "Adaptation"] },
  ],
  ru: [
    { name: "GPT-4o mini",   badge: "Рекомендуем",   tagline: "Быстро, дёшево, умно", desc: "Идеальная модель для ежедневного писательства. Отлично справляется с продолжением текста, генерацией идей, редактурой и исследованиями. Именно её используют 95% писателей в Moodra.", dollar: "$5 ≈ 33 000 запросов", tags: ["Тексты", "Идеи", "Редактура", "Исследования"] },
    { name: "GPT-4.1 mini",  badge: "Баланс",        tagline: "Чуть умнее, ненамного дороже", desc: "Новейшая компактная модель от OpenAI с улучшенным следованием инструкциям. Хороша для сложных запросов, где нужна точность формата и структуры.", dollar: "$5 ≈ 12 500 запросов", tags: ["Структура", "Точность", "Инструкции", "Тексты"] },
    { name: "GPT-3.5 Turbo", badge: "Ультрадешёво",  tagline: "Самая доступная модель", desc: "Легендарная модель, которая произвела революцию в 2022–2023 годах. Очень дешёвая и быстрая. Подходит для простых задач: продолжение текста, перефразирование, быстрые идеи.", dollar: "$5 ≈ 10 000 запросов", tags: ["Черновики", "Перефраз", "Быстро"] },
    { name: "GPT-4o",        badge: "Топ качество",  tagline: "Лучший для сложных задач", desc: "Флагманская модель OpenAI. Понимает нюансы, выдаёт более живой и точный текст. Отлично подходит для финальной полировки глав, сложных гипотез и ситуаций, где важно максимальное качество.", dollar: "$5 ≈ 2 000 запросов", tags: ["Полировка", "Гипотезы", "Диалоги", "Атмосфера"] },
    { name: "GPT-4.1",       badge: "Новинка",       tagline: "Умнее gpt-4o, чуть дешевле", desc: "Новейшая флагманская модель от OpenAI. По многим показателям превосходит gpt-4o: лучше следует инструкциям, точнее в деталях, глубже работает с длинным контекстом.", dollar: "$5 ≈ 2 500 запросов", tags: ["Длинные тексты", "Детали", "Точность", "Контекст"] },
    { name: "GPT-4 Turbo",   badge: "Классика",      tagline: "Надёжная мощь gpt-4", desc: "Более ранняя версия GPT-4 с улучшенной скоростью и 128K контекстом. Отлично работает с длинными текстами и глубоким редактированием.", dollar: "$5 ≈ 500 запросов", tags: ["Длинный контекст", "Стабильность", "Редактура"] },
    { name: "o4-mini",       badge: "Рассуждения",   tagline: "Думает перед ответом", desc: "Модель-рассуждалка: перед каждым ответом строит цепочку мысли. Медленнее, но выдаёт глубокие, логически выверенные ответы. Идеальна для научных гипотез, аргументации и сложного анализа. Также используется Moodra как выделенная модель для адаптации книг благодаря 200K контексту и 100K выходных токенов.", dollar: "$5 ≈ 4 500 запросов", tags: ["Гипотезы", "Аргументы", "Анализ", "Логика", "Адаптация"] },
  ],
  ua: [
    { name: "GPT-4o mini",   badge: "Рекомендуємо",  tagline: "Швидко, дешево, розумно", desc: "Ідеальна модель для щоденного письма. Відмінно справляється з продовженням тексту, генерацією ідей, редактурою та дослідженнями. Саме її використовують 95% письменників у Moodra.", dollar: "$5 ≈ 33 000 запитів", tags: ["Тексти", "Ідеї", "Редактура", "Дослідження"] },
    { name: "GPT-4.1 mini",  badge: "Баланс",        tagline: "Трохи розумніша, ненабагато дорожча", desc: "Найновіша компактна модель від OpenAI з покращеним дотриманням інструкцій. Чудова для складних запитів, де важлива точність формату та структури.", dollar: "$5 ≈ 12 500 запитів", tags: ["Структура", "Точність", "Інструкції", "Тексти"] },
    { name: "GPT-3.5 Turbo", badge: "Ультрадешево", tagline: "Найдоступніша модель", desc: "Легендарна модель, що здійснила революцію у 2022–2023 роках. Дуже дешева і швидка. Підходить для простих завдань: продовження тексту, перефразування, швидкі ідеї.", dollar: "$5 ≈ 10 000 запитів", tags: ["Чернетки", "Перефраз", "Швидко"] },
    { name: "GPT-4o",        badge: "Топ якість",    tagline: "Найкраща для складних завдань", desc: "Флагманська модель OpenAI. Розуміє нюанси, видає більш живий і точний текст. Відмінно підходить для фінального шліфування розділів, складних гіпотез і ситуацій, де важлива максимальна якість.", dollar: "$5 ≈ 2 000 запитів", tags: ["Шліфування", "Гіпотези", "Діалоги", "Атмосфера"] },
    { name: "GPT-4.1",       badge: "Новинка",       tagline: "Розумніша за gpt-4o, трохи дешевша", desc: "Найновіша флагманська модель від OpenAI. За багатьма показниками перевершує gpt-4o: краще дотримується інструкцій, точніша в деталях, глибше працює з довгим контекстом.", dollar: "$5 ≈ 2 500 запитів", tags: ["Довгі тексти", "Деталі", "Точність", "Контекст"] },
    { name: "GPT-4 Turbo",   badge: "Класика",       tagline: "Надійна потужність gpt-4", desc: "Більш рання версія GPT-4 з покращеною швидкістю та 128K контекстом. Відмінно працює з довгими текстами та глибоким редагуванням.", dollar: "$5 ≈ 500 запитів", tags: ["Довгий контекст", "Стабільність", "Редактура"] },
    { name: "o4-mini",       badge: "Міркування",    tagline: "Думає перед відповіддю", desc: "Модель-міркувальник: перед кожною відповіддю будує ланцюг думок. Повільніша, але видає глибокі, логічно вивірені відповіді. Ідеальна для наукових гіпотез, аргументації та складного аналізу. Також використовується Moodra як виділена модель для адаптації книг завдяки 200K контексту та 100K вихідних токенів.", dollar: "$5 ≈ 4 500 запитів", tags: ["Гіпотези", "Аргументи", "Аналіз", "Логіка", "Адаптація"] },
  ],
  de: [
    { name: "GPT-4o mini",   badge: "Empfohlen",    tagline: "Schnell, günstig, clever", desc: "Das ideale Modell für das tägliche Schreiben. Hervorragend bei Textfortsetzungen, Ideengenerierung, Bearbeitung und Recherche. Von 95% der Schriftsteller auf Moodra genutzt.", dollar: "$5 ≈ 33.000 Anfragen", tags: ["Texte", "Ideen", "Bearbeitung", "Recherche"] },
    { name: "GPT-4.1 mini",  badge: "Ausgewogen",   tagline: "Cleverer, kaum teurer", desc: "OpenAIs neuestes kompaktes Modell mit verbesserter Instruktionsbefolgung. Gut für komplexe Anfragen, bei denen Format- und Strukturgenauigkeit wichtig ist.", dollar: "$5 ≈ 12.500 Anfragen", tags: ["Struktur", "Präzision", "Instruktionen", "Texte"] },
    { name: "GPT-3.5 Turbo", badge: "Ultra-günstig", tagline: "Das günstigste Modell", desc: "Das legendäre Modell, das 2022–2023 eine Revolution auslöste. Sehr günstig und schnell. Geeignet für einfache Aufgaben: Textfortsetzung, Umformulierung, schnelle Ideen.", dollar: "$5 ≈ 10.000 Anfragen", tags: ["Entwürfe", "Umformulieren", "Schnell"] },
    { name: "GPT-4o",        badge: "Top-Qualität", tagline: "Bestes für komplexe Aufgaben", desc: "OpenAIs Flaggschiff-Modell. Versteht Nuancen, produziert lebendigere und präzisere Texte. Perfekt für die finale Kapitelüberarbeitung, komplexe Hypothesen und Situationen, wo maximale Qualität zählt.", dollar: "$5 ≈ 2.000 Anfragen", tags: ["Politur", "Hypothesen", "Dialog", "Atmosphäre"] },
    { name: "GPT-4.1",       badge: "Neu",          tagline: "Cleverer als gpt-4o, etwas günstiger", desc: "OpenAIs neuestes Flaggschiff. Übertrifft gpt-4o in vielen Bereichen: bessere Instruktionsbefolgung, präziser in Details, tiefere Arbeit mit langem Kontext.", dollar: "$5 ≈ 2.500 Anfragen", tags: ["Lange Texte", "Details", "Präzision", "Kontext"] },
    { name: "GPT-4 Turbo",   badge: "Klassiker",    tagline: "Die zuverlässige Kraft von gpt-4", desc: "Frühere GPT-4-Version mit verbesserter Geschwindigkeit und 128K-Kontext. Ideal für lange Texte und tiefes Bearbeiten. Gut für Autoren, denen bewährte Modellstabilität wichtig ist.", dollar: "$5 ≈ 500 Anfragen", tags: ["Langer Kontext", "Stabilität", "Bearbeitung"] },
    { name: "o4-mini",       badge: "Denken",       tagline: "Denkt vor der Antwort", desc: "Ein Denkmodell: Es baut vor jeder Antwort eine Gedankenkette auf. Langsamer, aber liefert tiefe, logisch fundierte Antworten. Ideal für wissenschaftliche Hypothesen, Argumentation und komplexe Analyse. Wird von Moodra auch als dediziertes Modell für die Buchadaption verwendet, dank 200K Kontext und 100K Ausgabe-Tokens.", dollar: "$5 ≈ 4.500 Anfragen", tags: ["Hypothesen", "Argumente", "Analyse", "Logik", "Adaption"] },
  ],
};

function Dots({ value, max = 5, color }: { value: number; max?: number; color: string }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full transition-all"
          style={{ background: i < value ? color : "rgba(0,0,0,0.10)" }}
        />
      ))}
    </div>
  );
}

export default function ModelsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { lang, t } = useLang();
  const ml = t.models;
  const { isFreeMode } = useFreeMode();

  const models = MODEL_CONTENT[lang as keyof typeof MODEL_CONTENT] ?? MODEL_CONTENT.en;

  const { data: user } = useQuery<any>({ queryKey: ["/api/auth/user"] });
  const currentModel = user?.openaiModel || "gpt-4o-mini";

  const { data: pricingData } = useQuery<{
    pricing: Record<string, { input: number; output: number; cachedInput?: number }>;
    updatedAt: string;
  }>({ queryKey: ["/api/models/pricing"], staleTime: 1000 * 60 * 60 });

  // Compute "$5 ≈ N requests" dynamically: $5 / (inputPrice/1M) / 1000 tokens per avg request
  const getDollarEstimate = (modelId: string) => {
    const price = pricingData?.pricing?.[modelId];
    if (!price) return null;
    const count = Math.round(5000 / price.input);
    return count.toLocaleString("en");
  };

  const selectModel = useMutation({
    mutationFn: async (model: string) => {
      const res = await fetch("/api/user/model", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: (_, model) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      const m = models[MODEL_IDS.indexOf(model as any)];
      toast({ title: `${ml.modelChanged} ${m?.name || model}`, description: ml.modelChangedDesc });
      setTimeout(() => setLocation("/"), 900);
    },
    onError: () => {
      toast({ title: ml.errorTitle, description: ml.errorDesc, variant: "destructive" });
    },
  });

  return (
    <div style={{ fontFamily: "var(--font-sans)", minHeight: "100vh", background: "#07050f" }}>
      {/* ── LIGHT TOP SECTION ── */}
      <div style={{ background: "hsl(30, 58%, 97%)" }}>
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: "#8a7a70" }}
          >
            <ArrowLeft className="w-4 h-4" />
            {ml.back}
          </button>
          <LanguagePicker />
        </div>

        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2" style={{ color: "#2d1a0e" }}>{ml.title}</h1>
          <p className="text-base" style={{ color: "#8a7a70" }}>
            {ml.subtitle}{" "}
            <a
              href="https://platform.openai.com/docs/pricing"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 hover:underline"
              style={{ color: "#F96D1C" }}
            >
              platform.openai.com
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </a>
            {ml.subtitleSuffix}
          </p>
        </div>

        {isFreeMode && (
          <div
            className="mb-6 rounded-2xl px-5 py-4 flex items-start gap-3"
            style={{ background: "rgba(249,109,28,0.06)", border: "1.5px solid rgba(249,109,28,0.20)" }}
          >
            <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#F96D1C" }} />
            <div>
              <p className="text-sm font-semibold mb-0.5" style={{ color: "#c45a10" }}>
                {lang === "ru" ? "Выбор модели недоступен" : lang === "ua" ? "Вибір моделі недоступний" : lang === "de" ? "Modellauswahl gesperrt" : "Model selection locked"}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "#8a7a70" }}>
                {lang === "ru" ? "Вы используете бесплатный GPT-OSS. Чтобы выбрать другую модель, добавьте API-ключ OpenAI в настройках аккаунта." : lang === "ua" ? "Ви використовуєте безплатний GPT-OSS. Щоб обрати іншу модель, додайте API-ключ OpenAI у налаштуваннях акаунта." : lang === "de" ? "Du verwendest das kostenlose GPT-OSS. Um ein anderes Modell zu wählen, füge deinen OpenAI API-Schlüssel in den Kontoeinstellungen hinzu." : "You're using free GPT-OSS. To switch models, add your OpenAI API key in account settings."}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {MODEL_IDS.map((id, idx) => {
            const m = models[idx];
            // Use server pricing if available, fallback to hardcoded
            const serverPrice = pricingData?.pricing?.[id];
            const prices = serverPrice
              ? { ...MODEL_PRICES[idx], input: serverPrice.input, output: serverPrice.output }
              : MODEL_PRICES[idx];
            const Icon = MODEL_ICONS[idx];
            const iconColor = MODEL_ICON_COLORS[idx];
            const badgeColor = MODEL_BADGE_COLORS[idx];
            const iconBg = `${iconColor}1A`;
            const isActive = currentModel === id;
            const isPending = selectModel.isPending && selectModel.variables === id;

            return (
              <div
                key={id}
                className="rounded-2xl overflow-hidden transition-all"
                style={{
                  background: isActive ? "hsl(30,65%,98.5%)" : "#fff",
                  border: isActive ? `2px solid ${iconColor}` : "1.5px solid rgba(0,0,0,0.08)",
                  boxShadow: isActive ? `0 4px 24px ${iconColor}18` : "0 1px 6px rgba(0,0,0,0.04)",
                }}
              >
                {/* Top row */}
                <div className="px-6 pt-5 pb-4">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: iconBg }}
                    >
                      <Icon className="w-5 h-5" style={{ color: iconColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-lg font-bold" style={{ color: "#2d1a0e" }}>{m.name}</span>
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: `${badgeColor}15`, color: badgeColor }}
                        >
                          {m.badge}
                        </span>
                        {isActive && (
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
                            style={{ background: "#dcfce7", color: "#16a34a" }}
                          >
                            <Check className="w-2.5 h-2.5" />
                            {ml.active}
                          </span>
                        )}
                        {id === "o4-mini" && (
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
                            style={{ background: "#dbeafe", color: "#2563eb" }}
                          >
                            <FileText className="w-2.5 h-2.5" />
                            {lang === "ru" ? "Адаптация книг" : lang === "ua" ? "Адаптація книг" : lang === "de" ? "Buchadaption" : "Book Adaptation"}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium mb-1.5" style={{ color: "#6b5a50" }}>{m.tagline}</p>
                      <p className="text-sm leading-relaxed" style={{ color: "#8a7a70" }}>{m.desc}</p>
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div
                  className="px-6 py-4 grid grid-cols-2 gap-4 border-t"
                  style={{ borderColor: "rgba(0,0,0,0.06)", background: "rgba(0,0,0,0.015)" }}
                >
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide mb-2.5" style={{ color: "#8a7a70" }}>{ml.cost}</p>
                    <div className="space-y-1 mb-2">
                      <div className="flex justify-between text-xs">
                        <span style={{ color: "#8a7a70" }}>{ml.inputTokens}</span>
                        <span className="font-mono font-medium" style={{ color: "#2d1a0e" }}>${prices.input.toFixed(3)}/1M</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span style={{ color: "#8a7a70" }}>{ml.outputTokens}</span>
                        <span className="font-mono font-medium" style={{ color: "#2d1a0e" }}>${prices.output.toFixed(3)}/1M</span>
                      </div>
                    </div>
                    <div
                      className="text-xs px-3 py-1.5 rounded-lg font-medium"
                      style={{ background: "rgba(249,109,28,0.07)", color: "#c45a10" }}
                    >
                      {getDollarEstimate(id) !== null
                        ? `$5 ≈ ${getDollarEstimate(id)} ${lang === "ru" ? "запросов" : lang === "ua" ? "запитів" : lang === "de" ? "Anfragen" : "requests"}`
                        : m.dollar}
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide mb-2.5" style={{ color: "#8a7a70" }}>{ml.specs}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: "#8a7a70" }}>{ml.speed}</span>
                      <Dots value={prices.speed} color={iconColor} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: "#8a7a70" }}>{ml.quality}</span>
                      <Dots value={prices.quality} color={iconColor} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: "#8a7a70" }}>{ml.economy}</span>
                      <Dots value={6 - prices.cost} color={iconColor} />
                    </div>
                  </div>
                </div>

                {/* Tags + button */}
                <div className="px-6 py-4 flex items-center justify-between gap-4 border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                  <div className="flex flex-wrap gap-1.5">
                    {m.tags.map(tag => (
                      <span
                        key={tag}
                        className="text-[11px] px-2 py-0.5 rounded-full"
                        style={{ background: `${iconColor}12`, color: iconColor }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <button
                    disabled={isActive || isPending || isFreeMode}
                    onClick={() => !isFreeMode && selectModel.mutate(id)}
                    className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 flex items-center gap-1.5"
                    style={
                      isFreeMode
                        ? { background: "rgba(0,0,0,0.05)", color: "#9a8a80", cursor: "not-allowed" }
                        : isActive
                          ? { background: `${iconColor}15`, color: iconColor, cursor: "default" }
                          : { background: iconColor, color: "#fff" }
                    }
                  >
                    {isFreeMode && !isActive && <Lock className="w-3 h-3 flex-shrink-0" />}
                    {isPending ? ml.saving : isActive ? ml.selected : isFreeMode ? (lang === "ru" ? "API ключ" : lang === "ua" ? "API ключ" : lang === "de" ? "API-Key" : "API key") : ml.select}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {pricingData?.updatedAt && (
          <p className="text-center text-xs mt-6 pb-2" style={{ color: "#c0a890" }}>
            {lang === "ru" ? "Цены обновлены" : lang === "ua" ? "Ціни оновлено" : lang === "de" ? "Preise aktualisiert" : "Prices updated"}{" "}
            {pricingData.updatedAt} ·{" "}
            <a
              href="https://platform.openai.com/docs/models"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:opacity-80"
              style={{ color: "#F96D1C" }}
            >
              {lang === "ru" ? "Официальный прайс-лист OpenAI" : lang === "ua" ? "Офіційний прайс-лист OpenAI" : lang === "de" ? "Offizielle OpenAI-Preisliste" : "Official OpenAI pricing"}
            </a>
          </p>
        )}

      </div>{/* end max-w-3xl light */}
      </div>{/* end light section */}

      {/* ══════════════════════════════════════════
          DARK VIOLET SECTION — full-width, to page bottom
      ══════════════════════════════════════════ */}
      <div
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #07050f 0%, #0e0b22 35%, #120d2e 65%, #0b0919 100%)" }}
      >
        {/* Notebook torn-edge divider — cream-coloured tear over the dark bg */}
        <svg
          viewBox="0 0 1440 36"
          preserveAspectRatio="none"
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 36, zIndex: 10, display: "block" }}
          aria-hidden="true"
        >
          <path
            d="M0,0 L1440,0 L1440,20 C1380,28 1320,12 1260,22 C1200,32 1140,14 1080,24 C1020,34 960,16 900,26 C840,36 780,14 720,22 C660,30 600,12 540,20 C480,28 420,16 360,26 C300,36 240,14 180,22 C120,30 60,16 0,26 Z"
            fill="hsl(30,58%,97%)"
          />
        </svg>
        {/* Background atmosphere */}
        <div className="absolute -top-40 right-0 w-[600px] h-[600px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(99,102,241,0.13) 0%, transparent 65%)" }} />
        <div className="absolute top-1/3 -left-20 w-[400px] h-[400px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(129,140,248,0.07) 0%, transparent 65%)" }} />
        <div className="absolute bottom-0 right-1/3 w-[500px] h-[400px] rounded-full pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(59,130,246,0.05) 0%, transparent 70%)" }} />
        {/* Grid texture */}
        <div className="absolute inset-0 opacity-[0.022] pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(0deg, #818CF8 0, #818CF8 1px, transparent 0, transparent 48px), repeating-linear-gradient(90deg, #818CF8 0, #818CF8 1px, transparent 0, transparent 48px)", backgroundSize: "48px 48px" }} />

        {/* Inner constrained content */}
        <div className="max-w-3xl mx-auto px-6 pt-20 pb-12 relative z-10">

          {/* ── Zone eyebrow ── */}
          <div className="relative z-10 flex items-center gap-3 mb-8">
            <div className="h-px flex-1 max-w-[40px]" style={{ background: "rgba(129,140,248,0.4)" }} />
            <span className="text-[10px] font-bold tracking-[0.18em] uppercase" style={{ color: "#818CF8" }}>
              {lang === "ru" ? "Свободный ИИ — без ключа" : lang === "ua" ? "Вільний ШІ — без ключа" : lang === "de" ? "Freie KI — ohne Schlüssel" : "Free AI — no key required"}
            </span>
            <div className="h-px flex-1" style={{ background: "rgba(129,140,248,0.15)" }} />
          </div>

          {/* ── COMPARISON TABLE with visual bar infographic ── */}
          <div className="relative z-10 rounded-2xl overflow-hidden mb-6" style={{ border: "1px solid rgba(129,140,248,0.18)", background: "rgba(255,255,255,0.02)" }}>
            {/* Header */}
            <div className="px-6 pt-5 pb-4 border-b" style={{ borderColor: "rgba(129,140,248,0.12)" }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-px w-5" style={{ background: "#818CF8" }} />
                    <span className="text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: "#818CF8" }}>
                      {lang === "ru" ? "Сравнение" : lang === "ua" ? "Порівняння" : lang === "de" ? "Vergleich" : "Comparison"}
                    </span>
                  </div>
                  <h3 className="text-base font-bold" style={{ color: "#E2E8F0" }}>
                    {lang === "ru" ? "Бесплатно vs. OpenAI ключ" : lang === "ua" ? "Безплатно vs. Ключ OpenAI" : lang === "de" ? "Kostenlos vs. OpenAI-Schlüssel" : "Free vs. Your OpenAI Key"}
                  </h3>
                </div>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(129,140,248,0.12)", border: "1px solid rgba(129,140,248,0.18)" }}>
                  <Gauge className="w-4 h-4" style={{ color: "#818CF8" }} />
                </div>
              </div>
            </div>

            {/* Column labels */}
            <div className="grid grid-cols-[180px_1fr_1fr] border-b" style={{ borderColor: "rgba(129,140,248,0.08)" }}>
              <div className="px-5 py-2.5" />
              <div className="px-4 py-2.5 border-l flex items-center gap-2" style={{ borderColor: "rgba(129,140,248,0.08)" }}>
                <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: "rgba(129,140,248,0.15)" }}>
                  <Cpu className="w-2.5 h-2.5" style={{ color: "#818CF8" }} />
                </div>
                <span className="text-[11px] font-bold" style={{ color: "#818CF8" }}>GPT-OSS 20B</span>
                <span className="text-[10px] ml-1" style={{ color: "rgba(129,140,248,0.5)" }}>
                  {lang === "ru" ? "· бесплатно" : lang === "ua" ? "· безплатно" : lang === "de" ? "· kostenlos" : "· free"}
                </span>
              </div>
              <div className="px-4 py-2.5 border-l flex items-center gap-2" style={{ borderColor: "rgba(129,140,248,0.08)" }}>
                <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: "rgba(129,140,248,0.15)" }}>
                  <Zap className="w-2.5 h-2.5" style={{ color: "#818CF8" }} />
                </div>
                <span className="text-[11px] font-bold" style={{ color: "#A5B4FC" }}>GPT-4o mini</span>
                <span className="text-[10px] ml-1" style={{ color: "rgba(129,140,248,0.55)" }}>
                  {lang === "ru" ? "· ключ" : lang === "ua" ? "· ключ" : lang === "de" ? "· API-Key" : "· API key"}
                </span>
              </div>
            </div>

            {/* Visual bar rows */}
            {[
              {
                label: lang === "ru" ? "Стоимость" : lang === "ua" ? "Вартість" : lang === "de" ? "Kosten" : "Cost",
                freeVal: lang === "ru" ? "Бесплатно" : lang === "ua" ? "Безплатно" : lang === "de" ? "Kostenlos" : "Free",
                paidVal: "$0.15 / 1M tok",
                freeBar: 100, paidBar: 10,
                freeGreen: true,
                freeBarColor: "#A5B4FC", paidBarColor: "#818CF8",
              },
              {
                label: lang === "ru" ? "Скорость" : lang === "ua" ? "Швидкість" : lang === "de" ? "Geschwindigkeit" : "Speed",
                freeVal: "8–15 sec",
                paidVal: "1–3 sec",
                freeBar: 28, paidBar: 92,
                freeGreen: false,
                freeBarColor: "rgba(129,140,248,0.28)", paidBarColor: "#818CF8",
              },
              {
                label: lang === "ru" ? "Качество текста" : lang === "ua" ? "Якість тексту" : lang === "de" ? "Textqualität" : "Text quality",
                freeVal: lang === "ru" ? "Среднее" : lang === "ua" ? "Середнє" : lang === "de" ? "Mittel" : "Average",
                paidVal: lang === "ru" ? "Высокое" : lang === "ua" ? "Висока" : lang === "de" ? "Hoch" : "High",
                freeBar: 45, paidBar: 90,
                freeGreen: false,
                freeBarColor: "rgba(129,140,248,0.28)", paidBarColor: "#818CF8",
              },
              {
                label: lang === "ru" ? "Точность инструкций" : lang === "ua" ? "Точність інструкцій" : lang === "de" ? "Instruktionsgenauigkeit" : "Instruction accuracy",
                freeVal: lang === "ru" ? "Нестабильно" : lang === "ua" ? "Нестабільно" : lang === "de" ? "Instabil" : "Unstable",
                paidVal: lang === "ru" ? "Высокая" : lang === "ua" ? "Висока" : lang === "de" ? "Hoch" : "High",
                freeBar: 40, paidBar: 95,
                freeGreen: false,
                freeBarColor: "rgba(129,140,248,0.28)", paidBarColor: "#818CF8",
              },
              {
                label: lang === "ru" ? "Длинный контекст" : lang === "ua" ? "Довгий контекст" : lang === "de" ? "Langer Kontext" : "Long context",
                freeVal: lang === "ru" ? "Слабо" : lang === "ua" ? "Слабо" : lang === "de" ? "Schwach" : "Weak",
                paidVal: lang === "ru" ? "Отлично" : lang === "ua" ? "Відмінно" : lang === "de" ? "Ausgezeichnet" : "Excellent",
                freeBar: 22, paidBar: 94,
                freeGreen: false,
                freeBarColor: "rgba(129,140,248,0.28)", paidBarColor: "#818CF8",
              },
              {
                label: lang === "ru" ? "API ключ нужен?" : lang === "ua" ? "API ключ потрібен?" : lang === "de" ? "API-Schlüssel nötig?" : "API key required?",
                freeVal: lang === "ru" ? "Нет" : lang === "ua" ? "Ні" : lang === "de" ? "Nein" : "No",
                paidVal: lang === "ru" ? "Да" : lang === "ua" ? "Так" : lang === "de" ? "Ja" : "Yes",
                freeBar: 100, paidBar: 0,
                freeGreen: true,
                freeBarColor: "#A5B4FC", paidBarColor: "rgba(99,102,241,0.22)",
              },
              {
                label: lang === "ru" ? "Надёжность" : lang === "ua" ? "Надійність" : lang === "de" ? "Zuverlässigkeit" : "Reliability",
                freeVal: lang === "ru" ? "Зависит от Pollinations" : lang === "ua" ? "Від Pollinations" : lang === "de" ? "Pollinations-abhängig" : "Pollinations uptime",
                paidVal: "OpenAI · 99.9%",
                freeBar: 55, paidBar: 99,
                freeGreen: false,
                freeBarColor: "rgba(129,140,248,0.28)", paidBarColor: "#818CF8",
              },
            ].map((row, i) => (
              <div key={i} className="grid grid-cols-[180px_1fr_1fr] border-b last:border-b-0" style={{ borderColor: "rgba(129,140,248,0.06)" }}>
                <div className="px-5 py-3 flex items-center">
                  <span className="text-[11px] font-medium" style={{ color: "#94A3B8" }}>{row.label}</span>
                </div>
                {/* Free col */}
                <div className="px-4 py-3 border-l" style={{ borderColor: "rgba(129,140,248,0.06)" }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold" style={{ color: row.freeGreen ? "#A5B4FC" : "rgba(165,180,252,0.45)" }}>{row.freeVal}</span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${row.freeBar}%`, background: row.freeBarColor, opacity: 0.7 }} />
                  </div>
                </div>
                {/* Paid col */}
                <div className="px-4 py-3 border-l" style={{ borderColor: "rgba(129,140,248,0.06)" }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold" style={{ color: row.freeGreen ? "rgba(99,102,241,0.45)" : "#818CF8" }}>{row.paidVal}</span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${row.paidBar}%`, background: row.paidBarColor, opacity: 0.8 }} />
                  </div>
                </div>
              </div>
            ))}

            {/* Key note */}
            <div className="px-5 py-3 flex items-center gap-2" style={{ borderTop: "1px solid rgba(129,140,248,0.10)", background: "rgba(129,140,248,0.04)" }}>
              <Shield className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#818CF8" }} />
              <p className="text-[10px] leading-relaxed" style={{ color: "rgba(148,163,184,0.7)" }}>
                {lang === "ru"
                  ? "Ключ хранится зашифрованным. Вы платите OpenAI напрямую — Moodra не берёт наценку."
                  : lang === "ua"
                    ? "Ключ зберігається зашифрованим. Ви платите OpenAI напряму — Moodra не бере надбавку."
                    : lang === "de"
                      ? "Schlüssel verschlüsselt gespeichert. Direkte Zahlung an OpenAI — kein Aufschlag."
                      : "Key stored encrypted. You pay OpenAI directly — Moodra takes no cut."}
              </p>
            </div>
          </div>

          {/* ── HONEST ABOUT FREE AI — dark violet tiles ── */}
          <div className="relative z-10 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px w-5" style={{ background: "rgba(129,140,248,0.6)" }} />
              <span className="text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: "rgba(129,140,248,0.85)" }}>
                {lang === "ru" ? "Честно о бесплатном ИИ" : lang === "ua" ? "Чесно про безплатний ШІ" : lang === "de" ? "Ehrlich über Gratis-KI" : "Honest about free AI"}
              </span>
            </div>

            {/* Intro */}
            <p className="text-[12px] leading-relaxed mb-4" style={{ color: "rgba(148,163,184,0.75)" }}>
              {lang === "ru"
                ? "Бесплатный GPT-OSS работает через Pollinations — сторонний сервис с открытыми LLM. Честный компромисс, но с реальными ограничениями."
                : lang === "ua"
                  ? "Безплатний GPT-OSS працює через Pollinations — сторонній сервіс з відкритими LLM. Чесний компроміс, але з реальними обмеженнями."
                  : lang === "de"
                    ? "Kostenloses GPT-OSS läuft über Pollinations mit Open-Source-LLMs. Fair, aber mit echten Einschränkungen."
                    : "Free GPT-OSS runs via Pollinations using open-source LLMs. Fair trade-off, but with real limitations."}
            </p>

            {/* Tile grid 2×2 */}
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  icon: FileText,
                  accent: "rgba(129,140,248,0.85)",
                  glow: "rgba(129,140,248,0.06)",
                  border: "rgba(129,140,248,0.12)",
                  badge: lang === "ru" ? "Контекст" : lang === "ua" ? "Контекст" : lang === "de" ? "Kontext" : "Context",
                  title: lang === "ru" ? "Длинные тексты — слабо" : lang === "ua" ? "Довгі тексти — слабо" : lang === "de" ? "Lange Texte — schwach" : "Long texts — weak spot",
                  body: lang === "ru" ? "300–500 слов сложно. Большие фрагменты могут вернуть пустой или урезанный результат." : lang === "ua" ? "300–500 слів складно. Великі фрагменти можуть повернути порожній або урізаний результат." : lang === "de" ? "300–500 Wörter sind schwierig. Lange Fragmente können ein leeres Ergebnis zurückgeben." : "300–500 words is already hard. Large passages may return empty or truncated output.",
                  stat: "~40%",
                  statLabel: lang === "ru" ? "успех на длинных текстах" : lang === "ua" ? "успіх на довгих текстах" : lang === "de" ? "Erfolg bei langen Texten" : "success on long texts",
                },
                {
                  icon: Clock,
                  accent: "rgba(129,140,248,0.9)",
                  glow: "rgba(129,140,248,0.06)",
                  border: "rgba(129,140,248,0.15)",
                  badge: lang === "ru" ? "Скорость" : lang === "ua" ? "Швидкість" : lang === "de" ? "Tempo" : "Speed",
                  title: lang === "ru" ? "8–15 секунд на ответ" : lang === "ua" ? "8–15 секунд на відповідь" : lang === "de" ? "8–15 Sek. Antwortzeit" : "8–15 sec response time",
                  body: lang === "ru" ? "Платные GPT стримят текст сразу. Бесплатный ждёт полного ответа и только потом показывает." : lang === "ua" ? "Платні GPT стрімлять одразу. Безплатний чекає повної відповіді і тільки потім показує." : lang === "de" ? "Kostenpflichtige GPT streamen sofort. Kostenlos wartet und zeigt dann alles auf einmal." : "Paid GPT streams live. Free waits for the full answer, then shows it all at once.",
                  stat: "vs 1–3s",
                  statLabel: lang === "ru" ? "у платных моделей" : lang === "ua" ? "у платних моделей" : lang === "de" ? "bei kostenpflichtigen" : "with paid models",
                },
                {
                  icon: AlertTriangle,
                  accent: "rgba(99,102,241,0.7)",
                  glow: "rgba(99,102,241,0.04)",
                  border: "rgba(99,102,241,0.12)",
                  badge: lang === "ru" ? "Точность" : lang === "ua" ? "Точність" : lang === "de" ? "Präzision" : "Precision",
                  title: lang === "ru" ? "Нестабильные инструкции" : lang === "ua" ? "Нестабільні інструкції" : lang === "de" ? "Unstabile Instruktionen" : "Unstable instructions",
                  body: lang === "ru" ? "Иногда игнорирует формат, отвечает не на то или добавляет лишнее. Платные модели заметно точнее." : lang === "ua" ? "Іноді ігнорує формат, відповідає не на те або додає зайве. Платні моделі значно точніші." : lang === "de" ? "Ignoriert Format, antwortet falsch oder fügt Unnötiges hinzu. Kostenpflichtige sind präziser." : "Sometimes ignores format, answers wrong or adds extras. Paid models are far more precise.",
                  stat: "~60%",
                  statLabel: lang === "ru" ? "соблюдение формата" : lang === "ua" ? "дотримання формату" : lang === "de" ? "Format-Einhaltung" : "format compliance",
                },
                {
                  icon: Wifi,
                  accent: "rgba(129,140,248,0.5)",
                  glow: "rgba(99,102,241,0.03)",
                  border: "rgba(99,102,241,0.10)",
                  badge: lang === "ru" ? "Надёжность" : lang === "ua" ? "Надійність" : lang === "de" ? "Verfügbarkeit" : "Uptime",
                  title: lang === "ru" ? "Зависит от Pollinations" : lang === "ua" ? "Залежить від Pollinations" : lang === "de" ? "Abhängig von Pollinations" : "Depends on Pollinations",
                  body: lang === "ru" ? "Если сервис недоступен — ИИ не работает. Таймауты и лимиты — не теория, а реальность." : lang === "ua" ? "Якщо сервіс недоступний — ШІ не працює. Таймаути та ліміти — це реальність." : lang === "de" ? "Wenn Pollinations down ist, geht kein KI. Timeouts und Rate-Limits passieren wirklich." : "If Pollinations is down, free AI stops. Timeouts and rate limits actually happen.",
                  stat: "~95%",
                  statLabel: lang === "ru" ? "uptime (нестабильно)" : lang === "ua" ? "uptime (нестабільно)" : lang === "de" ? "Uptime (instabil)" : "uptime (unreliable)",
                },
              ].map((tile, i) => {
                const TileIcon = tile.icon;
                return (
                  <div
                    key={i}
                    className="rounded-2xl p-4 flex flex-col gap-3"
                    style={{ background: `linear-gradient(135deg, ${tile.glow}, rgba(255,255,255,0.01))`, border: `1px solid ${tile.border}` }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${tile.border}` }}>
                        <TileIcon className="w-4 h-4" style={{ color: tile.accent }} />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)", color: tile.accent }}>
                        {tile.badge}
                      </span>
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold mb-1.5 leading-snug" style={{ color: "#CBD5E1" }}>{tile.title}</p>
                      <p className="text-[11px] leading-relaxed" style={{ color: "rgba(148,163,184,0.65)" }}>{tile.body}</p>
                    </div>
                    {/* Mini stat */}
                    <div className="flex items-baseline gap-1.5 mt-auto pt-1 border-t" style={{ borderColor: `${tile.border}` }}>
                      <span className="text-base font-bold" style={{ color: tile.accent }}>{tile.stat}</span>
                      <span className="text-[10px]" style={{ color: "rgba(148,163,184,0.5)" }}>{tile.statLabel}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── FREE MODEL CARD ── */}
          <div className="relative z-10">
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(129,140,248,0.06) 100%)",
                border: isFreeMode ? "1.5px solid rgba(129,140,248,0.55)" : "1.5px solid rgba(129,140,248,0.22)",
                boxShadow: isFreeMode ? "0 0 0 3px rgba(99,102,241,0.12), inset 0 0 40px rgba(99,102,241,0.05)" : "inset 0 0 40px rgba(99,102,241,0.03)",
                transition: "border 0.2s, box-shadow 0.2s",
              }}
            >
              <div className="px-6 pt-5 pb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(99,102,241,0.18)", border: "1px solid rgba(129,140,248,0.2)" }}>
                    <Cpu className="w-5 h-5" style={{ color: "#818CF8" }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold" style={{ color: "#E2E8F0" }}>GPT-OSS 20B</span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(99,102,241,0.22)", color: "#818CF8" }}>
                        {t.freeMode.badge}
                      </span>
                      {isFreeMode && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: "rgba(99,102,241,0.22)", color: "#818CF8" }}>
                          <Check className="w-3 h-3" /> {lang === "ru" ? "Активен" : lang === "ua" ? "Активний" : lang === "de" ? "Aktiv" : "Active"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs" style={{ color: "#64748B" }}>
                      {lang === "ru" ? "Meta · Llama 3.3 70B · via Pollinations AI · без ключа" :
                       lang === "ua" ? "Meta · Llama 3.3 70B · via Pollinations AI · без ключа" :
                       lang === "de" ? "Meta · Llama 3.3 70B · via Pollinations AI · kein Schlüssel nötig" :
                       "Meta · Llama 3.3 70B · via Pollinations AI · no key needed"}
                    </p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed mb-4" style={{ color: "#94A3B8" }}>
                  {t.freeMode.description}
                </p>
                <div className="flex items-start gap-2.5 p-3 rounded-xl" style={{ background: "rgba(99,102,241,0.10)", border: "1px solid rgba(99,102,241,0.14)" }}>
                  <Zap className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: "#818CF8" }} />
                  <p className="text-xs leading-relaxed" style={{ color: "rgba(148,163,184,0.75)" }}>
                    {lang === "ru"
                      ? "Работает без регистрации и API-ключа. Ответы могут занимать 5–15 секунд. Добавьте ключ OpenAI для мгновенного доступа к GPT-моделям."
                      : lang === "ua"
                      ? "Працює без реєстрації та API-ключа. Відповіді можуть займати 5–15 секунд. Додайте ключ OpenAI для миттєвого доступу до GPT-моделей."
                      : lang === "de"
                      ? "Funktioniert ohne Registrierung und API-Schlüssel. Antworten können 5–15 Sekunden dauern. Füge deinen OpenAI-Schlüssel für sofortigen Zugang hinzu."
                      : "Works without registration or API key. Responses may take 5–15 seconds. Add an OpenAI key for instant access to GPT models."}
                  </p>
                </div>
              </div>
              <div className="px-6 py-4 flex items-center justify-between border-t" style={{ borderColor: "rgba(129,140,248,0.10)" }}>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" style={{ color: "#818CF8" }} />
                  <span className="text-xs font-medium" style={{ color: "#64748B" }}>
                    {lang === "ru" ? "Без ключа API · Бесплатно" : lang === "ua" ? "Без ключа API · Безплатно" : lang === "de" ? "Kein API-Schlüssel · Kostenlos" : "No API key · Always free"}
                  </span>
                </div>
                <div className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: "rgba(99,102,241,0.18)", color: "#818CF8" }}>
                  {isFreeMode
                    ? (lang === "ru" ? "Активен (нет ключа)" : lang === "ua" ? "Активний (немає ключа)" : lang === "de" ? "Aktiv (kein Schlüssel)" : "Active · No key set")
                    : (lang === "ru" ? "Добавлен API ключ" : lang === "ua" ? "Додано API ключ" : lang === "de" ? "API-Schlüssel hinterlegt" : "API key set")}
                </div>
              </div>
            </div>
          </div>
        </div>{/* end max-w-3xl dark content */}

        {/* Footnote — inside dark section */}
        <div className="max-w-3xl mx-auto px-6 pb-6 pt-4 text-center relative z-10">
          <p className="text-xs" style={{ color: "rgba(100,116,139,0.6)" }}>
            {ml.footnote}{" "}
            <a
              href="https://platform.openai.com/docs/pricing"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
              style={{ color: "rgba(129,140,248,0.65)" }}
            >
              platform.openai.com/docs/pricing
            </a>
          </p>
        </div>
        <SiteFooter dark />
      </div>{/* end dark full-width section */}
    </div>
  );
}
