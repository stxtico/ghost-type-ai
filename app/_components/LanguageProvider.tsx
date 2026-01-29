"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Lang =
  | "en"
  | "es"
  | "fr"
  | "de"
  | "it"
  | "pt"
  | "ar"
  | "zh"
  | "ja"
  | "ko"
  | "ru"
  | "hi";

export const LANG_LABEL: Record<Lang, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
  pt: "Português",
  ar: "العربية",
  zh: "中文",
  ja: "日本語",
  ko: "한국어",
  ru: "Русский",
  hi: "हिन्दी",
};

type Dict = Record<string, string>;

const DICT: Record<Lang, Dict> = {
  en: {
    dashboard: "Dashboard",
    textScan: "Text Scan",
    imageScan: "Image Scan",
    newText: "New Text Scan",
    savedText: "Saved Text Scans",
    newImage: "New Image Scan",
    savedImage: "Saved Image Scans",
    billing: "Billing",
    download: "Download",
    account: "Account",
    tools: "Tools",
  },
  es: {
    dashboard: "Panel",
    textScan: "Escaneo de texto",
    imageScan: "Escaneo de imagen",
    newText: "Nuevo escaneo de texto",
    savedText: "Textos guardados",
    newImage: "Nuevo escaneo de imagen",
    savedImage: "Imágenes guardadas",
    billing: "Facturación",
    download: "Descargar",
    account: "Cuenta",
    tools: "Herramientas",
  },
  fr: { dashboard: "Tableau de bord", textScan: "Scan texte", imageScan: "Scan image", newText: "Nouveau scan texte", savedText: "Scans texte enregistrés", newImage: "Nouveau scan image", savedImage: "Scans image enregistrés", billing: "Facturation", download: "Télécharger", account: "Compte", tools: "Outils" },
  de: { dashboard: "Dashboard", textScan: "Text-Scan", imageScan: "Bild-Scan", newText: "Neuer Text-Scan", savedText: "Gespeicherte Text-Scans", newImage: "Neuer Bild-Scan", savedImage: "Gespeicherte Bild-Scans", billing: "Abrechnung", download: "Download", account: "Konto", tools: "Tools" },
  it: { dashboard: "Dashboard", textScan: "Scansione testo", imageScan: "Scansione immagine", newText: "Nuova scansione testo", savedText: "Scansioni testo salvate", newImage: "Nuova scansione immagine", savedImage: "Scansioni immagine salvate", billing: "Fatturazione", download: "Download", account: "Account", tools: "Strumenti" },
  pt: { dashboard: "Painel", textScan: "Detector de texto", imageScan: "Detector de imagem", newText: "Novo texto", savedText: "Textos salvos", newImage: "Nova imagem", savedImage: "Imagens salvas", billing: "Cobrança", download: "Baixar", account: "Conta", tools: "Ferramentas" },
  ar: { dashboard: "لوحة التحكم", textScan: "فحص النص", imageScan: "فحص الصورة", newText: "فحص نص جديد", savedText: "فحوصات النص المحفوظة", newImage: "فحص صورة جديد", savedImage: "فحوصات الصور المحفوظة", billing: "الفوترة", download: "تحميل", account: "الحساب", tools: "الأدوات" },
  zh: { dashboard: "仪表盘", textScan: "文本检测", imageScan: "图片检测", newText: "新的文本检测", savedText: "已保存文本", newImage: "新的图片检测", savedImage: "已保存图片", billing: "账单", download: "下载", account: "账户", tools: "工具" },
  ja: { dashboard: "ダッシュボード", textScan: "テキスト検出", imageScan: "画像検出", newText: "新しいテキスト", savedText: "保存済みテキスト", newImage: "新しい画像", savedImage: "保存済み画像", billing: "請求", download: "ダウンロード", account: "アカウント", tools: "ツール" },
  ko: { dashboard: "대시보드", textScan: "텍스트 검사", imageScan: "이미지 검사", newText: "새 텍스트", savedText: "저장된 텍스트", newImage: "새 이미지", savedImage: "저장된 이미지", billing: "결제", download: "다운로드", account: "계정", tools: "도구" },
  ru: { dashboard: "Панель", textScan: "Проверка текста", imageScan: "Проверка изображения", newText: "Новый текст", savedText: "Сохранённые тексты", newImage: "Новое изображение", savedImage: "Сохранённые изображения", billing: "Оплата", download: "Скачать", account: "Аккаунт", tools: "Инструменты" },
  hi: { dashboard: "डैशबोर्ड", textScan: "टेक्स्ट स्कैन", imageScan: "इमेज स्कैन", newText: "नया टेक्स्ट", savedText: "सेव किए हुए टेक्स्ट", newImage: "नई इमेज", savedImage: "सेव की हुई इमेज", billing: "बिलिंग", download: "डाउनलोड", account: "अकाउंट", tools: "टूल्स" },
};

type LangCtx = {
  lang: Lang;
  setLang: (l: Lang) => void;
};

const Ctx = createContext<LangCtx | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = localStorage.getItem("gt_lang");
    if (saved && saved in LANG_LABEL) setLangState(saved as Lang);
  }, []);

  useEffect(() => {
    localStorage.setItem("gt_lang", lang);
  }, [lang]);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === "gt_lang" && e.newValue && e.newValue in LANG_LABEL) {
        setLangState(e.newValue as Lang);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = useMemo(() => ({ lang, setLang: setLangState }), [lang]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLang() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useLang must be used inside LanguageProvider");
  return v;
}

export function t(lang: Lang, key: string) {
  return DICT[lang]?.[key] ?? DICT.en[key] ?? key;
}
