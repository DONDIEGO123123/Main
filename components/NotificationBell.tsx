"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useMember } from "@/lib/member";
import {
  listNotifications, markAllRead, markRead, timeAgo, type Notification,
} from "@/lib/notifications";

/** Bell with unread badge and a slide-in panel. Members only. */
export default function NotificationBell() {
  const { member } = useMember();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);

  const load = async () => {
    if (!member) return;
    const list = await listNotifications(member.id);
    setItems(list);
    setUnread(list.filter((n) => !n.is_read).length);
  };

  useEffect(() => {
    if (!member) return;
    load();

    // live updates — a new notification appears without a refresh
    const channel = createClient()
      .channel(`notif-${member.id}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `member_id=eq.${member.id}` },
        () => load())
      .subscribe();

    return () => { createClient().removeChannel(channel); };
  }, [member?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!member) return null;

  const openItem = async (n: Notification) => {
    if (!n.is_read) { await markRead(n.id); load(); }
    if (n.link) setOpen(false);
  };

  const clearAll = async () => { await markAllRead(member.id); load(); };

  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="התראות"
        className="relative h-10 w-10 grid place-items-center rounded-full glass text-gold">
        <span className="text-lg">🔔</span>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-gold text-ink
                           text-[11px] font-bold grid place-items-center tabular-nums">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)} />

            <motion.aside
              className="fixed top-0 bottom-0 left-0 z-[81] w-[88vw] max-w-sm bg-panel border-l border-gold/20 flex flex-col"
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 260 }}
            >
              <div className="flex items-center gap-2 p-5 border-b border-white/10">
                <h2 className="font-display text-xl font-bold gold-text flex-1">התראות</h2>
                {unread > 0 && (
                  <button onClick={clearAll} className="text-smoke text-xs hover:text-gold transition">
                    סמן הכל כנקרא
                  </button>
                )}
                <button onClick={() => setOpen(false)} aria-label="סגירה"
                  className="h-9 w-9 rounded-full glass text-gold text-xl leading-none">×</button>
              </div>

              {items.length === 0 ? (
                <div className="flex-1 grid place-items-center text-center px-8">
                  <div>
                    <p className="text-gold/30 text-5xl mb-3">🔔</p>
                    <p className="text-smoke text-sm">אין התראות עדיין</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {items.map((n) => {
                    const body = (
                      <div className={`glass p-3 flex gap-3 ${n.is_read ? "opacity-60" : "border-gold/30"}`}>
                        <span className="text-xl shrink-0">{n.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">{n.title}</p>
                          {n.body && <p className="text-smoke text-xs mt-0.5">{n.body}</p>}
                          <p className="text-smoke text-[11px] mt-1">{timeAgo(n.created_at)}</p>
                        </div>
                        {!n.is_read && <span className="h-2 w-2 rounded-full bg-gold shrink-0 mt-1.5" />}
                      </div>
                    );

                    return n.link ? (
                      <Link key={n.id} href={n.link} onClick={() => openItem(n)}>{body}</Link>
                    ) : (
                      <button key={n.id} onClick={() => openItem(n)} className="w-full text-right">{body}</button>
                    );
                  })}
                </div>
              )}

              <div className="border-t border-white/10 p-4">
                <Link href="/me/notifications" onClick={() => setOpen(false)}
                  className="btn-ghost block text-center py-2.5 text-sm">
                  הגדרות התראות
                </Link>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
