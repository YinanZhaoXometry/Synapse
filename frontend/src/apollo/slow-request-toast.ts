/**
 * The slow-request hint link: the api deploys on Render, so the first hit
 * after an idle stretch pays a cold start. Any operation still in flight
 * past 3s toasts a friendly heads-up — once, then suppressed for 30s, so a
 * cold-start burst of parallel requests doesn't spam the corner. Automated
 * browsers (Playwright e2e — `navigator.webdriver`) never toast: a
 * fixed-position toast intercepting clicks is flake, not signal.
 */
import { ApolloLink, Observable } from "@apollo/client";
import { toast } from "sonner";
import { translateStatic } from "@/contexts/LanguageContext";

export const SLOW_REQUEST_TOAST_MS = 3000;
export const SLOW_REQUEST_SUPPRESS_MS = 30_000;

// Module-local suppression latch: Date.now() of the last toast (0 = never).
let lastShownAt = 0;

/** Test seam — reset the suppression latch between tests. */
export function resetSlowRequestToastForTest(): void {
  lastShownAt = 0;
}

function showSlowRequestToast(): void {
  lastShownAt = Date.now();
  toast.info(translateStatic("apollo.slowRequest.title"), {
    description: translateStatic("apollo.slowRequest.description"),
    duration: 6000,
  });
}

export function slowRequestToastLink(): ApolloLink {
  return new ApolloLink((operation, forward) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (typeof navigator === "undefined" || navigator.webdriver !== true) {
      timer = setTimeout(() => {
        // Re-check at fire time: sibling slow requests arm their own timers,
        // and only the first one past the suppression window may speak.
        if (Date.now() - lastShownAt < SLOW_REQUEST_SUPPRESS_MS) return;
        showSlowRequestToast();
      }, SLOW_REQUEST_TOAST_MS);
    }
    return new Observable((observer) => {
      const subscription = forward(operation).subscribe({
        next: (value) => observer.next(value),
        error: (error) => {
          if (timer) clearTimeout(timer);
          observer.error(error);
        },
        complete: () => {
          if (timer) clearTimeout(timer);
          observer.complete();
        },
      });
      return () => {
        if (timer) clearTimeout(timer);
        subscription.unsubscribe();
      };
    });
  });
}
