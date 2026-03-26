import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Book } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { ImagePlus, X, Flame, Trophy, BookOpen, Cpu, PenLine, ArrowRight } from "lucide-react";
import { useLang } from "@/contexts/language-context";
import { LanguagePicker } from "@/components/language-picker";
import { useStreak } from "@/hooks/use-streak";
import {
  MFlask, MFeather, MTrash, MGear, MPlus,
} from "@/components/icons";
import { SiteFooter } from "@/components/site-footer";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const COVER_COLORS = [
  "#007AFF", "#5856D6", "#AF52DE", "#FF2D55", "#FF3B30",
  "#FF9500", "#FFCC00", "#34C759", "#00C7BE", "#30B0C7",
  "#1C1C1E", "#2C2C2E", "#48484A", "#636366",
];

async function resizeCoverImage(file: File, maxW = 600, maxH = 840, quality = 0.85): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const blobUrl = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      if (width > maxW || height > maxH) {
        const ratio = Math.min(maxW / width, maxH / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(blobUrl);
      canvas.toBlob((blob) => resolve(blob ?? file), "image/jpeg", quality);
    };
    img.onerror = () => { URL.revokeObjectURL(blobUrl); resolve(file); };
    img.src = blobUrl;
  });
}

function CoverUploadArea({
  preview, onFile, onClear, label
}: {
  preview: string | null;
  onFile: (file: File) => void;
  onClear: () => void;
  label: string;
}) {
  const ref = useRef<HTMLInputElement>(null);

  return (
    <div className="relative">
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { if (e.target.files?.[0]) onFile(e.target.files[0]); }}
      />
      {preview ? (
        <div className="relative w-full h-32 rounded-2xl overflow-hidden">
          <img src={preview} alt="Cover" className="w-full h-full object-cover" />
          <button
            onClick={onClear}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            <X className="h-3.5 w-3.5 text-white" />
          </button>
          <button
            onClick={() => ref.current?.click()}
            className="absolute bottom-2 right-2 text-xs bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-full hover:bg-black/70 transition-colors flex items-center gap-1"
          >
            <ImagePlus className="h-3 w-3" /> Replace
          </button>
        </div>
      ) : (
        <button
          onClick={() => ref.current?.click()}
          className="w-full h-24 rounded-2xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-primary"
          data-testid="button-upload-cover"
        >
          <ImagePlus className="h-5 w-5" />
          <span className="text-xs font-medium">{label}</span>
          <span className="text-[10px] opacity-60">JPG, PNG, WebP</span>
        </button>
      )}
    </div>
  );
}

function CreateBookDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t } = useLang();
  const h = t.home;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState("scientific");
  const [coverColor, setCoverColor] = useState(COVER_COLORS[0]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const BOOK_MODES = [
    { value: "scientific", label: h.modeScientific, sub: h.modeScientificSub, icon: MFlask },
    { value: "fiction", label: h.modeFiction, sub: h.modeFictionSub, icon: MFeather },
  ];

  const handleFile = async (file: File) => {
    const resized = await resizeCoverImage(file);
    const resizedFile = new File([resized], file.name, { type: "image/jpeg" });
    setCoverFile(resizedFile);
    setCoverPreview(URL.createObjectURL(resized));
  };

  const clearFile = () => {
    setCoverFile(null);
    setCoverPreview(null);
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const book: Book = await apiRequest("POST", "/api/books", data);
      if (coverFile) {
        const fd = new FormData();
        fd.append("cover", coverFile);
        await fetch(`/api/books/${book.id}/cover`, { method: "POST", body: fd });
      }
      return book;
    },
    onSuccess: async (book: Book) => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      onClose();
      reset();
      navigate(`/book/${book.id}`);
    },
    onError: () => toast({ title: "Error", description: "Could not create book", variant: "destructive" }),
  });

  const reset = () => {
    setTitle(""); setDescription(""); setMode("scientific");
    setCoverColor(COVER_COLORS[0]); setCoverFile(null); setCoverPreview(null);
  };

  const handleClose = () => { onClose(); reset(); };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-card border-card-border rounded-3xl p-0 overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-xl font-bold tracking-tight">{h.createTitle}</DialogTitle>
          <p className="text-sm text-muted-foreground mt-0.5">{h.createDesc}</p>
        </div>

        <div className="px-6 py-4 space-y-4 max-h-[65vh] overflow-y-auto">
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h.createCoverImage}</Label>
            <CoverUploadArea preview={coverPreview} onFile={handleFile} onClear={clearFile} label={h.createCoverImage} />
            {!coverPreview && (
              <>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="h-px flex-1 bg-border" />
                  {t.common.or} {h.createCover.toLowerCase()}
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {COVER_COLORS.map(c => (
                    <button
                      key={c}
                      className={`w-7 h-7 rounded-full transition-all ${coverColor === c ? "ring-2 ring-offset-2 ring-offset-card scale-110" : "hover:scale-105"}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setCoverColor(c)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h.createMode}</Label>
            <div className="grid grid-cols-2 gap-2.5">
              {BOOK_MODES.map(m => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.value}
                    data-testid={`mode-${m.value}`}
                    onClick={() => setMode(m.value)}
                    className={`relative p-3.5 rounded-2xl border text-left transition-all ${
                      mode === m.value
                        ? "border-primary/60 bg-primary/8 shadow-sm"
                        : "border-border bg-background hover:border-border/80 hover:bg-muted/30"
                    }`}
                  >
                    <Icon
                      size={20}
                      className="mb-2"
                      style={{ color: mode === m.value ? "#F96D1C" : "#8a7a70" }}
                    />
                    <div className={`text-sm font-semibold ${mode === m.value ? "text-primary" : "text-foreground"}`}>
                      {m.label}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{m.sub}</div>
                    {mode === m.value && <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-primary" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h.createName}</Label>
            <Input
              data-testid="input-book-title"
              placeholder={h.createNamePlaceholder}
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === "Enter" && title.trim() && createMutation.mutate({ title: title.trim(), description, mode, coverColor })}
              className="bg-background rounded-xl h-11 border-border focus-visible:ring-1 focus-visible:ring-primary text-sm"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {h.createDesc} <span className="normal-case font-normal opacity-50">(optional)</span>
            </Label>
            <Textarea
              data-testid="input-book-description"
              placeholder={h.createDescPlaceholder}
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="bg-background rounded-xl resize-none border-border focus-visible:ring-1 focus-visible:ring-primary text-sm"
            />
          </div>
        </div>

        <div className="px-6 pb-6 pt-3 flex gap-2.5">
          <Button variant="secondary" onClick={handleClose} className="flex-1 h-11 rounded-xl text-sm font-medium" data-testid="button-cancel-create">
            {t.common.cancel}
          </Button>
          <Button
            onClick={() => createMutation.mutate({ title: title.trim(), description, mode, coverColor })}
            disabled={!title.trim() || createMutation.isPending}
            className="flex-1 h-11 rounded-xl text-sm font-semibold"
            data-testid="button-confirm-create"
          >
            {createMutation.isPending ? t.common.loading : t.common.new}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BookCard({ book, onDelete }: { book: Book; onDelete: (id: number) => void }) {
  const [, navigate] = useLocation();
  const { t } = useLang();

  return (
    <div
      data-testid={`book-card-${book.id}`}
      className="group flex flex-col cursor-pointer transition-transform duration-200 hover:scale-[1.02]"
      onClick={() => navigate(`/book/${book.id}`)}
    >
      <div className="relative aspect-[148/210] rounded-xl overflow-hidden shadow-apple-sm mb-3">
        {book.coverImage ? (
          <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: `linear-gradient(145deg, ${book.coverColor}aa 0%, ${book.coverColor} 100%)` }}
          >
            {book.mode === "fiction"
              ? <MFeather size={40} style={{ color: "rgba(255,255,255,0.4)" }} />
              : <MFlask size={40} style={{ color: "rgba(255,255,255,0.4)" }} />}
          </div>
        )}
        <button
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
          onClick={e => { e.stopPropagation(); onDelete(book.id); }}
          data-testid={`delete-book-${book.id}`}
        >
          <MTrash size={16} style={{ color: "white" }} />
        </button>
      </div>

      <h3 data-testid={`text-book-title-${book.id}`} className="font-semibold text-[15px] leading-tight line-clamp-2 mb-1">
        {book.title}
      </h3>
      <div className="flex items-center gap-2">
        <span className="text-[12px] text-muted-foreground">
          {book.mode === "fiction" ? t.home.modeFiction : t.home.modeScientific}
        </span>
      </div>
    </div>
  );
}

function StreakBadge() {
  const { streak } = useStreak();
  const { lang, t } = useLang();
  const [, navigate] = useLocation();

  const dayLabel: Record<string, string> = { en: "day streak", ru: "д. подряд", ua: "дн. поспіль", de: "Tage" };
  const label = dayLabel[lang] || dayLabel.en;

  const goal = (() => {
    try { return JSON.parse(localStorage.getItem("moodra_streak_goal") || "null"); } catch { return null; }
  })();

  const goalDisplay = goal
    ? `${goal.amount} ${goal.type === "words" ? (lang === "ru" ? "сл." : lang === "ua" ? "сл." : lang === "de" ? "Wörter" : "words") : (lang === "ru" ? "гл." : lang === "ua" ? "розд." : lang === "de" ? "Kap." : "ch.")}/day`
    : null;

  if (streak.currentStreak === 0 && !goal) return (
    <button
      onClick={() => navigate("/habits")}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all hover:opacity-80 select-none"
      style={{ background: "rgba(249,109,28,0.06)", border: "1px dashed rgba(249,109,28,0.25)", color: "#c47040" }}
      title={t.habits.setGoal}
    >
      <Flame className="w-3.5 h-3.5" style={{ color: "#F96D1C", opacity: 0.5 }} />
      <span className="text-xs font-medium">{t.habits.setGoal}</span>
    </button>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => navigate("/habits")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all hover:opacity-80 select-none cursor-pointer"
          style={{
            background: streak.currentStreak > 0 ? "rgba(249,109,28,0.09)" : "rgba(249,109,28,0.05)",
            border: "1px solid rgba(249,109,28,0.18)",
          }}
        >
          <Flame className="w-3.5 h-3.5" style={{ color: "#F96D1C" }} />
          {streak.currentStreak > 0 && (
            <span className="text-sm font-bold" style={{ color: "#F96D1C" }}>
              {streak.currentStreak}
            </span>
          )}
          <span className="text-xs font-medium hidden sm:inline" style={{ color: "#c47040" }}>
            {streak.currentStreak > 0 ? label : (goalDisplay || t.habits.setGoal)}
          </span>
          {goalDisplay && streak.currentStreak > 0 && (
            <span className="text-[10px] hidden md:inline ml-0.5 opacity-70" style={{ color: "#c47040" }}>
              · {goalDisplay}
            </span>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs p-3 rounded-xl max-w-[200px]">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <Flame className="w-3 h-3 text-orange-500" />
            <span className="font-semibold">{t.habits.title}</span>
          </div>
          {streak.currentStreak > 0 && (
            <>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">{t.habits.streakLabel}</span>
                <span className="font-medium">{streak.currentStreak}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">{t.habits.longestStreak}</span>
                <span className="font-medium flex items-center gap-1">
                  <Trophy className="w-2.5 h-2.5 text-yellow-500" />
                  {streak.longestStreak}
                </span>
              </div>
            </>
          )}
          {goal && (
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">{t.habits.goalLabel}</span>
              <span className="font-medium">{goalDisplay}</span>
            </div>
          )}
          <div className="mt-1 pt-1 border-t border-border/40 text-muted-foreground/70 text-center text-[10px]">
            {t.habits.setGoal} →
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export default function Home() {
  const [showCreate, setShowCreate] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { t, lang } = useLang();
  const h = t.home;

  const { data: books = [], isLoading } = useQuery<Book[]>({ queryKey: ["/api/books"] });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/books/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      toast({ title: h.deleteConfirm });
    },
  });

  const navLinks: { href: string; icon: any; label: string }[] = [
    { href: "/habits", icon: Flame, label: lang === "ru" ? "Привычки письма" : lang === "ua" ? "Звички письма" : lang === "de" ? "Schreibgewohnheiten" : "Writing Habits" },
    { href: "/models", icon: Cpu, label: lang === "ru" ? "AI Модели" : lang === "ua" ? "AI Моделі" : lang === "de" ? "KI-Modelle" : "AI Models" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 glass">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center select-none">
            <img
              src="/moodra-logo-new.png"
              alt="Moodra"
              style={{ height: "38px", width: "auto", display: "block" }}
            />
          </div>

          <div className="flex items-center gap-2.5">
            <StreakBadge />

            <Button
              onClick={() => setShowCreate(true)}
              data-testid="button-new-book"
              className="rounded-full px-5 font-semibold flex items-center gap-2"
              style={{
                background: "linear-gradient(160deg, #F96D1C 0%, #FF9640 100%)",
                color: "#fff",
                border: "none",
              }}
            >
              <MPlus size={16} />
              {h.newBook}
            </Button>
            <LanguagePicker />
            <button
              data-testid="button-settings"
              onClick={() => navigate("/settings")}
              className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 transition-all hover:opacity-80"
              style={{ background: "rgba(249,109,28,0.08)" }}
              title={t.common.settings}
            >
              {user?.profileImageUrl ? (
                <img src={user.profileImageUrl} alt="avatar" className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #F96D1C 0%, #FF9640 100%)" }}
                >
                  {[user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "?"}
                </div>
              )}
              <MGear size={14} style={{ color: "#8a7a70" }} />
            </button>
          </div>
        </div>

        {/* Sub-navigation */}
        <div
          style={{ background: "rgba(250,242,234,0.6)" }}
        >
          <div className="max-w-7xl mx-auto px-6 flex items-center gap-1" style={{ paddingTop: 6, paddingBottom: 13 }}>
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all"
              style={{
                background: "rgba(249,109,28,0.10)",
                color: "#F96D1C",
                border: "1px solid rgba(249,109,28,0.18)",
              }}
            >
              <BookOpen className="w-3 h-3" />
              {lang === "ru" ? "Мои книги" : lang === "ua" ? "Мої книги" : lang === "de" ? "Meine Bücher" : "My Books"}
            </button>
            {navLinks.map(({ href, icon: Icon, label }) => (
              <button
                key={href}
                onClick={() => navigate(href)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all hover:bg-black/5 hover:text-foreground"
                style={{ color: "#8a7a70" }}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">
        {books.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <img
              src="/moodra-icon.png"
              alt="Moodra"
              className="w-20 h-20 mb-7"
              style={{ borderRadius: "28px", objectFit: "cover" }}
            />
            <h2 className="text-2xl font-bold mb-3" style={{ color: "#1a0d06" }}>
              {h.emptyTitle}
            </h2>
            <p className="text-sm leading-relaxed max-w-sm mb-8" style={{ color: "#8a7060" }}>
              {h.emptyDesc}
            </p>
            <div className="flex flex-col gap-3 items-center">
              <Button
                onClick={() => setShowCreate(true)}
                data-testid="button-create-first-book"
                className="rounded-full px-8 py-5 font-semibold text-base"
                style={{
                  background: "linear-gradient(160deg, #F96D1C 0%, #FF9640 100%)",
                  color: "#fff",
                  border: "none",
                  boxShadow: "0 4px 20px rgba(249,109,28,0.30)",
                }}
              >
                {h.emptyBtn}
              </Button>
              <p className="text-xs" style={{ color: "#c0b0a0" }}>{h.emptyTagline}</p>
            </div>

            {/* Quick links when empty */}
            <div className="mt-16 flex items-center gap-3 flex-wrap justify-center">
              {navLinks.map(({ href, icon: Icon, label }) => (
                <button
                  key={href}
                  onClick={() => navigate(href)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all hover:scale-[1.02]"
                  style={{
                    background: "rgba(249,109,28,0.06)",
                    color: "#8a7a70",
                    border: "1px solid rgba(249,109,28,0.10)",
                  }}
                >
                  <Icon className="w-4 h-4" style={{ color: "#F96D1C" }} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col animate-pulse">
                  <div className="aspect-[3/4] bg-muted rounded-xl mb-3" />
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              ))
            ) : (
              books.map(book => (
                <BookCard key={book.id} book={book} onDelete={id => deleteMutation.mutate(id)} />
              ))
            )}
          </div>
        )}

      </main>

      <SiteFooter />
      <CreateBookDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
