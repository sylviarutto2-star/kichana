import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const KEY = "kichana_cookie_consent_v1";

export function CookieBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try { setShow(!localStorage.getItem(KEY)); } catch { setShow(false); }
  }, []);
  if (!show) return null;
  const set = (v: "all" | "essential") => {
    try { localStorage.setItem(KEY, v); } catch { /* storage unavailable — dismiss anyway */ }
    setShow(false);
  };
  return (
    <div className="fixed bottom-4 inset-x-4 md:inset-x-auto md:right-6 md:bottom-6 md:max-w-sm z-50">
      <div className="card p-4 shadow-pop">
        <p className="text-sm">
          We use essential cookies to keep you signed in and a tiny bit of optional analytics to improve the app. <Link to="/cookies" className="text-terracotta-600 underline">Read more</Link>.
        </p>
        <div className="mt-3 flex gap-2">
          <button onClick={() => set("essential")} className="btn-outline text-xs flex-1">Essential only</button>
          <button onClick={() => set("all")} className="btn-primary text-xs flex-1">Accept all</button>
        </div>
      </div>
    </div>
  );
}
