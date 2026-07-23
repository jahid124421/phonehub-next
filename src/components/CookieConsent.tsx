"use client";

import { useState, useEffect } from "react";

const CONSENT_KEY = "phonehub_cookie_consent";

interface ConsentState {
  functional: boolean;
  analytics: boolean;
  advertising: boolean;
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [prefs, setPrefs] = useState<ConsentState>({
    functional: true,
    analytics: false,
    advertising: false,
  });

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) {
      setVisible(true);
    }
  }, []);

  const saveConsent = (value: string) => {
    localStorage.setItem(CONSENT_KEY, value);
    setVisible(false);
    setShowModal(false);

    if (value === "accepted") {
      window.dispatchEvent(new CustomEvent("cookie-consent", { detail: { analytics: true, advertising: true } }));
    } else if (value === "custom") {
      window.dispatchEvent(new CustomEvent("cookie-consent", { detail: prefs }));
    }
  };

  const handleAcceptAll = () => saveConsent("accepted");
  const handleRejectAll = () => saveConsent("rejected");
  const handleCustomSave = () => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(prefs));
    saveConsent("custom");
  };

  if (!visible) return null;

  return (
    <>
      {/* Bottom banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-base-100/95 backdrop-blur-lg border-t border-base-300 p-4 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-base-content/70 flex-1">
            We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.{" "}
            <a href="/privacy" className="link link-primary text-xs">Privacy Policy</a>
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setShowModal(true)} className="btn btn-ghost btn-sm">
              Customize
            </button>
            <button onClick={handleRejectAll} className="btn btn-outline btn-sm">
              Reject All
            </button>
            <button onClick={handleAcceptAll} className="btn btn-primary btn-sm">
              Accept All
            </button>
          </div>
        </div>
      </div>

      {/* Customize modal */}
      {showModal && (
        <dialog className="modal modal-open" onClose={() => setShowModal(false)}>
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Cookie Preferences</h3>
            <p className="text-sm text-base-content/60 mb-6">
              Choose which cookies you want to allow. Functional cookies are always enabled as they are necessary for the site to work.
            </p>

            <div className="space-y-4">
              {/* Functional */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Functional</p>
                  <p className="text-xs text-base-content/50">Required for the website to function properly</p>
                </div>
                <input type="checkbox" className="toggle toggle-primary" checked disabled readOnly />
              </div>

              {/* Analytics */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Analytics</p>
                  <p className="text-xs text-base-content/50">Help us understand how visitors use our site</p>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={prefs.analytics}
                  onChange={(e) => setPrefs({ ...prefs, analytics: e.target.checked })}
                />
              </div>

              {/* Advertising */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Advertising</p>
                  <p className="text-xs text-base-content/50">Used to show you relevant ads on other sites</p>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={prefs.advertising}
                  onChange={(e) => setPrefs({ ...prefs, advertising: e.target.checked })}
                />
              </div>
            </div>

            <div className="modal-action">
              <button onClick={() => setShowModal(false)} className="btn btn-ghost btn-sm">
                Cancel
              </button>
              <button onClick={handleCustomSave} className="btn btn-primary btn-sm">
                Save Preferences
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop" onClick={() => setShowModal(false)}>
            <button aria-label="Close">close</button>
          </form>
        </dialog>
      )}
    </>
  );
}
