"use client";

import { useState, useEffect } from "react";

const CONSENT_KEY = "phonehub_cookie_consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) {
      setVisible(true);
    }
  }, []);

  const saveConsent = (value: string) => {
    localStorage.setItem(CONSENT_KEY, value);
    setVisible(false);
  };

  const handleAccept = () => saveConsent("accepted");
  const handleReject = () => saveConsent("rejected");

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-base-100/95 backdrop-blur-lg border-t border-base-300 p-4 shadow-2xl">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-base-content/70 flex-1">
          We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.{" "}
          <a href="/privacy" className="link link-primary text-sm">Privacy Policy</a>
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={handleReject} className="btn btn-outline btn-sm">
            Reject
          </button>
          <button onClick={handleAccept} className="btn btn-primary btn-sm">
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
