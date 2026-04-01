import { useEffect } from "react";

interface PageHeadProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  jsonLd?: Record<string, any>;
}

export function PageHead({
  title,
  description,
  canonical,
  ogTitle,
  ogDescription,
  ogImage,
  jsonLd,
}: PageHeadProps) {
  useEffect(() => {
    const prev = {
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.getAttribute("content") ?? "",
      ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute("content") ?? "",
      ogDesc: document.querySelector('meta[property="og:description"]')?.getAttribute("content") ?? "",
      ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute("content") ?? "",
      twTitle: document.querySelector('meta[name="twitter:title"]')?.getAttribute("content") ?? "",
      twDesc: document.querySelector('meta[name="twitter:description"]')?.getAttribute("content") ?? "",
    };

    if (title) document.title = title;

    const setMeta = (selector: string, value: string | undefined) => {
      if (!value) return;
      const el = document.querySelector(selector);
      if (el) el.setAttribute("content", value);
    };

    if (description) setMeta('meta[name="description"]', description);
    if (ogTitle) setMeta('meta[property="og:title"]', ogTitle);
    if (ogDescription) setMeta('meta[property="og:description"]', ogDescription);
    if (ogImage) setMeta('meta[property="og:image"]', ogImage);
    if (ogTitle) setMeta('meta[name="twitter:title"]', ogTitle);
    if (ogDescription) setMeta('meta[name="twitter:description"]', ogDescription);

    let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (canonical) {
      if (!canonicalEl) {
        canonicalEl = document.createElement("link");
        canonicalEl.rel = "canonical";
        document.head.appendChild(canonicalEl);
      }
      canonicalEl.href = canonical;
    }

    let jsonLdEl: HTMLScriptElement | null = null;
    if (jsonLd) {
      const existing = document.getElementById("page-jsonld");
      if (existing) existing.remove();
      jsonLdEl = document.createElement("script");
      jsonLdEl.type = "application/ld+json";
      jsonLdEl.id = "page-jsonld";
      jsonLdEl.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(jsonLdEl);
    }

    return () => {
      document.title = prev.title;
      setMeta('meta[name="description"]', prev.description);
      setMeta('meta[property="og:title"]', prev.ogTitle);
      setMeta('meta[property="og:description"]', prev.ogDesc);
      setMeta('meta[property="og:image"]', prev.ogImage);
      setMeta('meta[name="twitter:title"]', prev.twTitle);
      setMeta('meta[name="twitter:description"]', prev.twDesc);
      if (canonicalEl && !canonical) canonicalEl.remove();
      if (canonicalEl && canonical) canonicalEl.href = "";
      document.getElementById("page-jsonld")?.remove();
    };
  }, [title, description, canonical, ogTitle, ogDescription, ogImage, jsonLd]);

  return null;
}
