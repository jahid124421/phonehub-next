"use client";

import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";

const ALERTS_KEY = "phonehub_alerts";

interface PriceAlert {
  productId: string;
  targetPrice: number;
  createdAt: string;
}

function getAlerts(): PriceAlert[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(ALERTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveAlert(alert: PriceAlert): PriceAlert[] {
  const alerts = getAlerts().filter((a) => a.productId !== alert.productId);
  alerts.push(alert);
  localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
  return alerts;
}

export default function PriceAlertButton({
  productId,
  currentPrice,
}: {
  productId: string;
  currentPrice: number;
}) {
  const [open, setOpen] = useState(false);
  const [targetPrice, setTargetPrice] = useState(Math.round(currentPrice * 0.9));
  const [existingAlert, setExistingAlert] = useState<PriceAlert | null>(null);
  const [showToast, setShowToast] = useState(false);
  const modalRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const alerts = getAlerts();
    const found = alerts.find((a) => a.productId === productId);
    setExistingAlert(found ?? null);
    if (found) {
      setTargetPrice(found.targetPrice);
    }
  }, [productId]);

  useEffect(() => {
    if (open) {
      modalRef.current?.showModal();
    } else {
      modalRef.current?.close();
    }
  }, [open]);

  const handleSave = () => {
    const alert: PriceAlert = {
      productId,
      targetPrice,
      createdAt: new Date().toISOString(),
    };
    saveAlert(alert);
    setExistingAlert(alert);
    setOpen(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`btn btn-outline btn-sm gap-1 ${existingAlert ? "btn-success" : ""}`}
        title={existingAlert ? "Update price alert" : "Set price alert"}
        aria-label={existingAlert ? "Update price alert" : "Set price alert"}
      >
        <Bell className="w-4 h-4" />
        {existingAlert ? "Alert Set" : "Set Price Alert"}
      </button>

      <dialog ref={modalRef} className="modal" onClose={() => setOpen(false)}>
        <div className="modal-box">
          <h3 className="font-bold text-lg">
            {existingAlert ? "Update Price Alert" : "Set Price Alert"}
          </h3>
          <p className="text-base-content/60 text-sm mt-2">Get notified when the price drops.</p>

          <div className="py-4 space-y-4">
            <div className="flex justify-between items-center bg-base-200 rounded-xl px-4 py-3">
              <span className="text-sm font-medium">Current Price</span>
              <span className="font-bold text-primary">${currentPrice.toLocaleString()}</span>
            </div>

            <label className="form-control w-full">
              <div className="label">
                <span className="label-text font-medium">Notify me when price is at or below</span>
              </div>
              <label className="input input-bordered flex items-center gap-2 w-full">
                <span className="text-base-content/60">$</span>
                <input
                  type="number"
                  min={1}
                  max={currentPrice}
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(Number(e.target.value))}
                  className="grow outline-none bg-transparent"
                />
              </label>
            </label>
          </div>

          <div className="modal-action">
            <button className="btn btn-ghost" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
              <Bell className="w-4 h-4" />
              Notify Me
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

      {showToast && (
        <div className="toast toast-end z-50">
          <div className="alert alert-success">
            <Bell className="w-4 h-4" />
            <span>Price alert saved!</span>
          </div>
        </div>
      )}
    </>
  );
}
