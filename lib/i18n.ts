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
  quickView: { he: "צפייה", ru: "Смотреть" },
  remove: { he: "הסרה", ru: "Удалить" },
  subtotal: { he: "סכום ביניים", ru: "Промежуточный итог" },
  items: { he: "פריטים", ru: "товаров" },
  fullName: { he: "שם מלא", ru: "Полное имя" },
  phone: { he: "טלפון", ru: "Телефон" },
  city: { he: "עיר", ru: "Город" },
  address: { he: "כתובת", ru: "Адрес" },
  region: { he: "אזור משלוח", ru: "Регион доставки" },
  notes: { he: "הערות להזמנה", ru: "Примечания к заказу" },
  orderSummary: { he: "סיכום הזמנה", ru: "Итог заказа" },
  sendOrder: { he: "שליחת הזמנה", ru: "Отправить заказ" },
  sending: { he: "שולח…", ru: "Отправка…" },
  couponCode: { he: "קוד קופון", ru: "Промокод" },
  apply: { he: "החל", ru: "Применить" },
  orderReceived: { he: "ההזמנה התקבלה!", ru: "Заказ принят!" },
  orderNumber: { he: "מספר הזמנה", ru: "Номер заказа" },
  continueShopping: { he: "להמשך קנייה", ru: "Продолжить покупки" },
  myAccount: { he: "האזור האישי", ru: "Личный кабинет" },
  logout: { he: "יציאה", ru: "Выход" },
  displayName: { he: "איך לקרוא לך?", ru: "Как вас зовут?" },
  pin: { he: "קוד אישי", ru: "Личный код" },
  myActivity: { he: "הפעילות שלי", ru: "Моя активность" },
  referFriend: { he: "חבר מביא חבר", ru: "Приведи друга" },
  shareLink: { he: "שיתוף הקישור שלי", ru: "Поделиться ссылкой" },
  copied: { he: "הקישור הועתק", ru: "Ссылка скопирована" },
  redeem: { he: "מימוש", ru: "Обменять" },
  yourPoints: { he: "הנקודות שלך", ru: "Ваши баллы" },
  buyAgain: { he: "הזמן שוב", ru: "Заказать снова" },
  needHelp: { he: "צריך עזרה לבחור?", ru: "Нужна помощь с выбором?" },
  talkToUs: { he: "דבר איתנו עכשיו", ru: "Напишите нам" },
  backInStock: { he: "רוצה לדעת כשהוא חוזר?", ru: "Сообщить о поступлении?" },
  notifyMe: { he: "עדכנו אותי", ru: "Уведомить меня" },
  relatedProducts: { he: "מוצרים שיכולים לעניין אותך", ru: "Может вас заинтересовать" },
  bestSellers: { he: "מה כולם לוקחים", ru: "Самое популярное" },
  justDropped: { he: "חדש בחנות", ru: "Новинки" },
  forYou: { he: "אולי תאהב גם", ru: "Вам может понравиться" },
  joinCommunity: { he: "הצטרפו לקהילה", ru: "Вступайте в сообщество" },
  joinFree: { he: "הצטרפות חינם", ru: "Бесплатная регистрация" },
  install: { he: "התקנה", ru: "Установить" },
  installApp: { he: "התקינו את האתר", ru: "Установите приложение" },
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
