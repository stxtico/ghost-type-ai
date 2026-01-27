"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Lang = "en" | "es" | "fr" | "de" | "pt" | "it";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
};

const LanguageContext = createContext<Ctx | null>(null);

const FALLBACK: Ctx = { lang: "en", setLang: () => {} };

export const LANG_LABEL: Record<Lang, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  pt: "Português",
  it: "Italiano",
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = window.localStorage.getItem("gt_lang") || "";
    if (saved === "en" || saved === "es" || saved === "fr" || saved === "de" || saved === "pt" || saved === "it") {
      setLangState(saved);
    }
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    window.localStorage.setItem("gt_lang", l);
  }

  const value = useMemo(() => ({ lang, setLang }), [lang]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  return useContext(LanguageContext) ?? FALLBACK;
}

/**
 * Minimal dictionary — add keys as you need.
 * If a key is missing it falls back to English or the key itself.
 */
const DICT: Record<Lang, Record<string, string>> = {
  en: {
    dashboard: "Dashboard",
    textScan: "Text Scan",
    imageScan: "Image Scan",
    ghostTyper: "Ghost Typer",
    savedText: "Saved Text Scans",
    savedImage: "Saved Image Scans",
    newText: "New Text Scan",
    newImage: "New Image Scan",
    billing: "Billing",
    download: "Download",
    account: "Account",
  },
  es: {
    dashboard: "Panel",
    textScan: "Detector de texto",
    imageScan: "Detector de imagen",
    ghostTyper: "Ghost Typer",
    savedText: "Escaneos de texto guardados",
    savedImage: "Escaneos de imagen guardados",
    newText: "Nuevo escaneo de texto",
    newImage: "Nuevo escaneo de imagen",
    billing: "Facturación",
    download: "Descargar",
    account: "Cuenta",
  },
  fr: {
    dashboard: "Tableau de bord",
    textScan: "Analyse texte",
    imageScan: "Analyse image",
    ghostTyper: "Ghost Typer",
    savedText: "Analyses texte enregistrées",
    savedImage: "Analyses image enregistrées",
    newText: "Nouvelle analyse texte",
    newImage: "Nouvelle analyse image",
    billing: "Facturation",
    download: "Télécharger",
    account: "Compte",
  },
  de: {
    dashboard: "Dashboard",
    textScan: "Text-Scan",
    imageScan: "Bild-Scan",
    ghostTyper: "Ghost Typer",
    savedText: "Gespeicherte Text-Scans",
    savedImage: "Gespeicherte Bild-Scans",
    newText: "Neuer Text-Scan",
    newImage: "Neuer Bild-Scan",
    billing: "Abrechnung",
    download: "Download",
    account: "Konto",
  },
  pt: {
    dashboard: "Painel",
    textScan: "Detector de texto",
    imageScan: "Detector de imagem",
    ghostTyper: "Ghost Typer",
    savedText: "Textos salvos",
    savedImage: "Imagens salvas",
    newText: "Novo texto",
    newImage: "Nova imagem",
    billing: "Cobrança",
    download: "Download",
    account: "Conta",
  },
  it: {
    dashboard: "Dashboard",
    textScan: "Analisi testo",
    imageScan: "Analisi immagine",
    ghostTyper: "Ghost Typer",
    savedText: "Scansioni testo salvate",
    savedImage: "Scansioni immagine salvate",
    newText: "Nuova scansione testo",
    newImage: "Nuova scansione immagine",
    billing: "Fatturazione",
    download: "Download",
    account: "Account",
  },
};

export function t(lang: Lang, key: string) {
  return DICT[lang]?.[key] ?? DICT.en[key] ?? key;
}
