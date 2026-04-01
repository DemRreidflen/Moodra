import { Switch, Route } from "wouter";
import MissionPage from "@/pages/mission";
import FeaturesPage from "@/pages/features";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { AiErrorProvider } from "@/contexts/ai-error-context";
import { LanguageProvider } from "@/contexts/language-context";
import { useLang } from "@/contexts/language-context";
import Home from "@/pages/home";
import BookEditor from "@/pages/book-editor";
import LoginPage from "@/pages/login";
import SettingsPage from "@/pages/settings";
import ApiKeyGuidePage from "@/pages/api-key-guide";
import FaqPage from "@/pages/faq";
import InspirationPage from "@/pages/inspiration";
import ModelsPage from "@/pages/models";
import CodexPage from "@/pages/codex";
import HabitsPage from "@/pages/habits";
import NotFound from "@/pages/not-found";
import { BookLoader } from "@/components/book-loader";
import { MobileBlocker } from "@/components/mobile-blocker";
import { OnboardingModal } from "@/components/onboarding-modal";
import { CookieBanner } from "@/components/cookie-banner";

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { lang } = useLang();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      const userId = (user as any).id;
      const key = `moodra_onboarding_v1_${userId}`;
      if (!localStorage.getItem(key)) {
        setShowOnboarding(true);
      }
    }
  }, [isAuthenticated, user]);

  if (isLoading) return <BookLoader />;
  if (!isAuthenticated) return <LoginPage />;

  return (
    <>
      {showOnboarding && user && (
        <OnboardingModal
          lang={lang}
          userId={(user as any).id}
          onClose={() => setShowOnboarding(false)}
        />
      )}
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/home" component={Home} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/api-key-guide" component={ApiKeyGuidePage} />
        <Route path="/faq" component={FaqPage} />
        <Route path="/inspiration" component={InspirationPage} />
        <Route path="/models" component={ModelsPage} />
        <Route path="/codex" component={CodexPage} />
        <Route path="/habits" component={HabitsPage} />
        <Route path="/book/:id" component={BookEditor} />
        <Route path="/mission" component={MissionPage} />
        <Route path="/features" component={FeaturesPage} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <ThemeProvider>
          <TooltipProvider>
            <AiErrorProvider>
              <Toaster />
              <CookieBanner />
              <MobileBlocker>
                <Router />
              </MobileBlocker>
            </AiErrorProvider>
          </TooltipProvider>
        </ThemeProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
