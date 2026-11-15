import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowRightIcon, CheckIcon, CloseIcon, DownloadIcon } from "./landing-icons";

/** The gradient download CTA panel above the FAQ. */
export function LandingDownloadSection({ onOpen }: { onOpen: (event: React.MouseEvent) => void }) {
  const { t } = useLanguage();
  return (
    <section className="lp-download-section" aria-labelledby="lp-download-title">
      <div className="lp-container">
        <div className="lp-download-panel">
          <svg className="lp-download-lines" viewBox="0 0 1200 460" preserveAspectRatio="none" aria-hidden="true">
            <g fill="none" stroke="var(--lp-on-warm)" strokeWidth="1" opacity="0.14">
              <path d="M0 92 196 160 378 58M1200 90 1010 168 830 62M0 376l194-74 176 88M1200 372l-190-70-180 88" />
              <path d="m196 160-2 142M1010 168v134M378 58l76 322M830 62l-74 330" strokeDasharray="5 8" />
            </g>
            <g fill="var(--lp-on-warm)" opacity="0.18">
              <circle cx="196" cy="160" r="7" />
              <circle cx="194" cy="302" r="5" />
              <circle cx="378" cy="58" r="6" />
              <circle cx="454" cy="380" r="8" />
              <circle cx="1010" cy="168" r="7" />
              <circle cx="1010" cy="302" r="5" />
              <circle cx="830" cy="62" r="6" />
              <circle cx="756" cy="392" r="8" />
            </g>
          </svg>
          <div className="lp-download-content">
            <p className="lp-eyebrow">{t("landing.download.eyebrow")}</p>
            <h2 id="lp-download-title">
              {t("landing.download.title1")}
              <br />
              {t("landing.download.title2")}
            </h2>
            <p className="lp-section-lead">{t("landing.download.lead")}</p>
            <div className="lp-download-actions">
              <button className="lp-btn lp-btn-dark" type="button" onClick={(event) => onOpen(event)}>
                <DownloadIcon />
                {t("landing.download.cta")}
              </button>
              <a className="lp-btn lp-btn-subtle" href="#lp-faq">
                {t("landing.download.faq")}
                <ArrowRightIcon />
              </a>
            </div>
            <p className="lp-download-note">{t("landing.download.note")}</p>
            <div className="lp-download-platforms" aria-label={t("landing.download.platformsAria")}>
              <span>macOS</span>
              <span>Windows</span>
              <span>iOS / Android</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * The shared download dialog (header/hero/CTA triggers): native <dialog> with
 * the design's in/out animations, focus restore to the trigger, platform
 * radio group + status line, and the "先体验产品演示" shortcut that closes and
 * scrolls to the preview stage.
 */
export function DownloadDialog({
  open,
  onClose,
  triggerRef,
}: {
  open: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
}) {
  const { t } = useLanguage();
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const [closing, setClosing] = useState(false);
  const [status, setStatus] = useState("");
  const [platform, setPlatform] = useState("macOS");

  // Open: showModal + focus the close button (design behavior). Scroll lock on
  // body replaces the design's body:has(dialog[open]) rule.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      window.clearTimeout(closeTimerRef.current ?? undefined);
      setClosing(false);
      setStatus("");
      if (!dialog.open) dialog.showModal();
      closeBtnRef.current?.focus();
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close with the design's 120ms exit animation (skipped under reduced motion).
  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog?.open) return;
    if (closing) {
      const finish = () => {
        dialog.close();
        setClosing(false);
        triggerRef.current?.focus({ preventScroll: true });
        onClose();
      };
      const reduceMotion =
        window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
        document.documentElement.classList.contains("reduce-motion");
      if (reduceMotion) {
        finish();
        return;
      }
      closeTimerRef.current = window.setTimeout(finish, 120);
      return () => window.clearTimeout(closeTimerRef.current ?? undefined);
    }
  }, [closing, open, onClose, triggerRef]);

  // The gate above only animates when the parent flips open→closed intent; a
  // plain `requestClose` (parent sets open=false without closing) still ends
  // with the dialog hidden.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open && dialog?.open && !closing) {
      dialog.close();
      document.body.style.overflow = "";
    }
  }, [open, closing]);

  useEffect(() => () => window.clearTimeout(closeTimerRef.current ?? undefined), []);

  const requestClose = () => setClosing(true);

  const confirmPlatform = () => {
    setStatus(t("landing.dialog.status", { platform }));
  };

  const goToPreview = () => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    requestClose();
    window.setTimeout(() => {
      document.getElementById("lp-preview")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
      document.querySelector<HTMLElement>('.lp-demo-tab[aria-selected="true"]')?.focus({ preventScroll: true });
    }, 140);
  };

  return (
    <dialog
      ref={dialogRef}
      className={closing ? "lp-dialog is-closing" : "lp-dialog"}
      id="lp-download-dialog"
      aria-labelledby="lp-download-dialog-title"
      aria-describedby="lp-download-dialog-copy"
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      onClick={(event) => {
        if (event.target !== dialogRef.current) return;
        const bounds = dialogRef.current.getBoundingClientRect();
        const outside =
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom;
        if (outside) requestClose();
      }}
    >
      <div className="lp-dialog-inner">
        <div className="lp-dialog-header">
          <h2 id="lp-download-dialog-title">{t("landing.dialog.title")}</h2>
          <button
            className="lp-dialog-close"
            type="button"
            ref={closeBtnRef}
            aria-label={t("landing.dialog.closeAria")}
            onClick={requestClose}
          >
            <CloseIcon />
          </button>
        </div>
        <p className="lp-dialog-copy" id="lp-download-dialog-copy">
          {t("landing.dialog.copy")}
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            confirmPlatform();
          }}
        >
          <div className="lp-platform-list" role="radiogroup" aria-label={t("landing.dialog.platformAria")}>
            <label className="lp-platform-option">
              <input type="radio" name="platform" value="macOS" checked={platform === "macOS"} onChange={() => setPlatform("macOS")} />
              <DesktopIcon />
              <span>
                <span className="lp-platform-name">macOS</span>
                <span className="lp-platform-meta">{t("landing.dialog.p1.meta")}</span>
              </span>
            </label>
            <label className="lp-platform-option">
              <input type="radio" name="platform" value="Windows" checked={platform === "Windows"} onChange={() => setPlatform("Windows")} />
              <DesktopIcon />
              <span>
                <span className="lp-platform-name">Windows</span>
                <span className="lp-platform-meta">{t("landing.dialog.p2.meta")}</span>
              </span>
            </label>
            <label className="lp-platform-option">
              <input type="radio" name="platform" value={t("landing.dialog.p3.name")} checked={platform === t("landing.dialog.p3.name")} onChange={() => setPlatform(t("landing.dialog.p3.name"))} />
              <MobileIcon />
              <span>
                <span className="lp-platform-name">{t("landing.dialog.p3.name")}</span>
                <span className="lp-platform-meta">{t("landing.dialog.p3.meta")}</span>
              </span>
            </label>
          </div>
          <div className="lp-dialog-actions">
            <button className="lp-btn lp-btn-primary" type="button" onClick={confirmPlatform}>
              <CheckIcon />
              {t("landing.dialog.confirm")}
            </button>
            <button className="lp-btn lp-btn-secondary" type="button" onClick={goToPreview}>
              {t("landing.dialog.preview")}
            </button>
          </div>
          {status && (
            <p className="lp-dialog-status" role="status" aria-live="polite">
              {status}
            </p>
          )}
          <p className="lp-dialog-footnote">{t("landing.dialog.footnote")}</p>
        </form>
      </div>
    </dialog>
  );
}

function DesktopIcon() {
  return (
    <svg className="lp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8m-4-4v4" />
    </svg>
  );
}

function MobileIcon() {
  return (
    <svg className="lp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="6" y="2" width="12" height="20" rx="3" />
      <path d="M10 5h4m-3 14h2" />
    </svg>
  );
}
