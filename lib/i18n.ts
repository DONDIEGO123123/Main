"use client";
import { useEffect, useState } from "react";

export type Lang = "he" | "ru";
const KEY = "luxe-lang";
const EVT = "luxe-lang-change";

const dict: Record<string, { he: string; ru: string }> = {
  home: { he: "בית", ru: "Главная" },
  products: { he: "מוצרים", ru: "Товары" },
  promotions: { he: "מבצעים", ru: "Акции" },
  delivery: { he: "משלוחים", ru: "Доставка" },
  reviews: { he: "ביקורות", ru: "Отзывы" },
  faq: { he: "שאלות", ru: "Вопросы" },
  contact: { he: "צור קשר", ru: "Контакты" },
  community: { he: "קהילה", ru: "Сообщество" },
  cart: { he: "העגלה שלי", ru: "Моя корзина" },
  addToCart: { he: "הוספה לעגלה", ru: "В корзину" },
  added: { he: "נוסף לעגלה", ru: "Добавлено" },
  checkout: { he: "למעבר לתשלום", ru: "Оформить заказ" },
  emptyCart: { he: "העגלה ריקה", ru: "Корзина пуста" },
  total: { he: "סה״כ", ru: "Итого" },
  shipping: { he: "משלוח", ru: "Доставка" },
  free: { he: "חינם", ru: "Бесплатно" },
  soldOut: { he: "אזל מהמלאי", ru: "Нет в наличии" },
  join: { he: "הצטרפות לקהילה", ru: "Вступить в сообщество" },
  login: { he: "כניסה", ru: "Вход" },
  points: { he: "נקודות", ru: "Баллы" },
  rewards: { he: "מרכז ההטבות", ru: "Центр наград" },
  myOrders: { he: "ההזמנות שלי", ru: "Мои заказы" },
  search: { he: "חיפוש מוצר…", ru: "Поиск товара…" },
  noResults: { he: "לא מצאת את מה שחיפשת?", ru: "Не нашли то, что искали?" },
  allProducts: { he: "לכל המוצרים", ru: "Все товары" },
  share: { he: "שיתוף", ru: "Поделиться" },
  save: { he: "שמירה", ru: "Сохранить" },
  bundle: { he: "חבילה משתלמת", ru: "Выгодный набор" },
};

export function t(key: string, lang: Lang): string {
  return dict[key]?.[lang] ?? dict[key]?.he ?? key;
}

export function useLang() {
  const [lang, setLangState] = useState<Lang>("he");

  useEffect(() => {
    const saved = (localStorage.getItem(KEY) as Lang) || "he";
    setLangState(saved);
    const sync = () => setLangState((localStorage.getItem(KEY) as Lang) || "he");
    window.addEventListener(EVT, sync);
    return () => window.removeEventListener(EVT, sync);
  }, []);

  const setLang = (l: Lang) => {
    localStorage.setItem(KEY, l);
    document.documentElement.lang = l;
    window.dispatchEvent(new Event(EVT));
  };

  return { lang, setLang, t: (k: string) => t(k, lang) };
}
