/**
 * The responsive ladder's floating surfaces (T6; UX responsive rows): the SAME
 * CompanionPanel the desktop dock mounts, repositioned per width. Tablet
 * 768–1023px → right slide-over above a scrim (scrim tap, Esc, or the top-bar
 * panel toggle dismisses); mobile <768px → bottom sheet at ~65dvh with a drag
 * handle (swipe down past the threshold dismisses; the composer stays usable —
 * the drag lives on the handle strip only, so the reading scroll above is
 * unaffected too: no scrim, the sheet just overlays the column's foot).
 *
 * Both are absolute INSIDE the reader zone (ReaderPage's material row is
 * relative — the surfaces sit under the top bar, leaving the toggle that opens
 * them clickable), so the app's own chrome (icon rail, mobile header/bottom
 * nav) stays untouched — the reader positions the Companion; the panel itself
 * is width-agnostic.
 * Closing unmounts the panel: an in-flight turn abandoned mid-flight persists
 * nothing (use-companion-chat's honesty rule); a finished one re-hydrates from
 * the persisted thread on reopen. Entry animations are CSS keyframes — the
 * global prefers-reduced-motion rule collapses them to instant state changes.
 * Tokens only (scrim/card/glass) — holds in light + dark and every palette.
 */
import { useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { ChevronDown, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Swipe-down distance (px) past which the sheet dismisses. */
const SHEET_DISMISS_PX = 80;

export interface CompanionLayerProps {
  /** The dialog's accessible name (companion.title). */
  label: string;
  onClose(): void;
  children: ReactNode;
}

/** Tablet 768–1023px: the Companion as a right slide-over above the reading. */
export function CompanionOverlay({ label, onClose, children }: CompanionLayerProps) {
  return (
    <div role="dialog" aria-label={label} className="absolute inset-0 z-30">
      <div
        className="absolute inset-0 bg-[var(--scrim)] animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className="absolute inset-y-0 right-0 flex flex-col w-[min(400px,88vw)] bg-card border-l border-border-soft shadow-raised animate-slide-in-right">
        {children}
      </aside>
    </div>
  );
}

/**
 * Mobile <768px: the Companion as a bottom sheet (~65dvh, drag handle). The
 * handle strip is the pointer affordance (aria-hidden — the X button is the
 * keyboard/AT dismissal); dragging translates the sheet live and a swipe past
 * SHEET_DISMISS_PX closes it, snapping back otherwise.
 */
export function CompanionSheet({ label, closeLabel, onClose, children }: CompanionLayerProps & { closeLabel: string }) {
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startY = useRef<number | null>(null);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    startY.current = e.clientY;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (startY.current === null) return;
    setDragY(Math.max(0, e.clientY - startY.current));
  };
  const endDrag = () => {
    if (startY.current === null) return;
    startY.current = null;
    setDragging(false);
    if (dragY > SHEET_DISMISS_PX) onClose();
    setDragY(0);
  };

  return (
    <div
      role="dialog"
      aria-label={label}
      className="absolute inset-x-0 bottom-0 z-30 flex flex-col bg-card border-t border-border-soft rounded-t-2xl shadow-raised overflow-hidden animate-sheet-up"
      style={{
        height: "65dvh",
        transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
        transition: dragging ? "none" : "transform 180ms cubic-bezier(0.32, 0.72, 0, 1)",
      }}
    >
      {/* handle strip: touch drag/swipe affordance (touch-none keeps the
          gesture from scrolling); the close button beside it is the
          keyboard/AT path */}
      <div
        aria-hidden="true"
        className={cn(
          "relative flex-none flex items-center justify-center h-9 touch-none select-none",
          dragging ? "cursor-grabbing" : "cursor-grab",
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <span className="w-10 h-1 rounded-full bg-border" />
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label={closeLabel}
        title={closeLabel}
        className="absolute top-2 right-2 z-10 w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-[var(--glass-2)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}

// -- the immersive float (owner bug round 2026-11-15) ---------------------------------

export interface CompanionFloatProps {
  /** The dialog's accessible name (companion.title). */
  label: string;
  /** The pill's aria label (expand affordance). */
  expandLabel: string;
  /** The card header's collapse button label (the sheet's dismiss label). */
  collapseLabel: string;
  /** A turn is mid-flight — the collapsed pill pulses so minimizing during a
   * reply never hides the activity behind it. */
  streaming: boolean;
  /** Controlled pill ⇄ expanded state (ReaderPage owns it — the ESC chain
   * collapses the card before immersive itself exits). */
  expanded: boolean;
  onExpandedChange(expanded: boolean): void;
  /** "card" (tablet/desktop) — pill ⇄ floating glass card; "sheet" (mobile) —
   * pill ⇄ the ladder's bottom sheet (its dismiss still unmounts, the
   * existing sheet contract). */
  variant: "card" | "sheet";
  children: ReactNode;
}

/**
 * The immersive-mode Companion surface: the chat follows the reader into
 * immersion as a floating pill at the zone's bottom-right that expands into
 * a floating glass card (~400px × min(560px, 70dvh)) — no docked column, no
 * scrim, the reading stays the main surface.
 *
 * Collapsing KEEPS the panel mounted (the card is display-none, not
 * unmounted): an in-flight reply keeps streaming behind the pill — collapse
 * is minimize, not abandon (the honesty rule still governs the surface going
 * away with immersive itself or navigation). On mobile the expanded form is
 * the ladder's bottom sheet, whose swipe-down dismiss unmounts exactly like
 * the non-immersive ladder's sheet. Tokens only — holds in light + dark and
 * every palette; the global prefers-reduced-motion rule collapses the entry
 * animations.
 */
export function CompanionFloat({
  label,
  expandLabel,
  collapseLabel,
  streaming,
  expanded,
  onExpandedChange,
  variant,
  children,
}: CompanionFloatProps) {
  return (
    <>
      {/* The collapsed launcher — a pill, not a dock: one tap (or Enter) opens
          the card; the pulse dot says a reply is still streaming behind it. */}
      <button
        type="button"
        data-testid="companion-float-pill"
        aria-label={expandLabel}
        title={expandLabel}
        onClick={() => onExpandedChange(true)}
        className={cn(
          "absolute bottom-5 right-5 z-30 flex h-12 w-12 items-center justify-center rounded-full glass-panel shadow-raised text-accent-ink",
          "transition-transform hover:scale-105 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          expanded && variant === "card" && "hidden",
        )}
      >
        <Sparkles className="w-5 h-5" aria-hidden="true" />
        {streaming && (
          <span
            data-testid="companion-float-pulse"
            aria-hidden="true"
            className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-accent-ink animate-pulse"
          />
        )}
      </button>

      {variant === "card" && (
        <div
          role="dialog"
          aria-label={label}
          data-testid="companion-float-card"
          className={cn(
            "absolute bottom-5 right-5 z-30 flex flex-col w-[min(400px,88vw)] h-[min(560px,70dvh)] bg-card border border-border-soft rounded-2xl shadow-raised overflow-hidden animate-pop",
            expanded ? "flex" : "hidden",
          )}
        >
          {/* Card header: the title + the collapse (minimize, NOT close) —
              the panel behind it stays mounted and keeps streaming. */}
          <div className="flex-none flex items-center justify-between px-3.5 h-10 border-b border-border-soft bg-secondary/50">
            <span className="text-sm font-semibold text-foreground">{label}</span>
            <button
              type="button"
              onClick={() => onExpandedChange(false)}
              aria-label={collapseLabel}
              title={collapseLabel}
              className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-[var(--glass-2)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronDown className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
          <div className="flex-1 min-h-0">{children}</div>
        </div>
      )}

      {variant === "sheet" && expanded && (
        <CompanionSheet label={label} closeLabel={collapseLabel} onClose={() => onExpandedChange(false)}>
          {children}
        </CompanionSheet>
      )}
    </>
  );
}
