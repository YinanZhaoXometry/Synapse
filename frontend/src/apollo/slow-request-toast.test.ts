/**
 * The slow-request hint link's contract: toast once past the threshold,
 * stay quiet within the suppression window (a cold-start burst toasts once,
 * not per request), re-arm after the window, never speak in automated
 * browsers (Playwright e2e), and cancel the pending timer when the
 * operation settles early or the subscription tears down.
 */
import { ApolloLink, Observable } from "@apollo/client";
import { execute } from "@apollo/client/link";
import { parse } from "graphql";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({ toast: { info: vi.fn() } }));

import {
  resetSlowRequestToastForTest,
  SLOW_REQUEST_SUPPRESS_MS,
  slowRequestToastLink,
  SLOW_REQUEST_TOAST_MS,
} from "./slow-request-toast";
import { getApolloClient } from "./client";
import { toast } from "sonner";

const DOC = parse("query Plans { plans { id } }");

/** A terminal downstream that never settles (the cold-start limbo). */
function hangs(): ApolloLink {
  return new ApolloLink(() => new Observable(() => () => {}));
}

/** A terminal downstream that completes immediately. */
function instant(): ApolloLink {
  return new ApolloLink(
    () =>
      new Observable((observer) => {
        observer.next({ data: {} });
        observer.complete();
      }),
  );
}

/** A terminal downstream that fails immediately. */
function errors(): ApolloLink {
  return new ApolloLink(
    () =>
      new Observable((observer) => {
        observer.error(new Error("boom"));
      }),
  );
}

function run(link: ApolloLink): Promise<unknown> {
  // AC4 execute takes the ExecuteContext ({ client }) as its third argument —
  // the same shape the session-guard link test rides.
  return new Promise((resolve, reject) => {
    execute(link, { query: DOC }, { client: getApolloClient() }).subscribe({ next: resolve, error: reject });
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  resetSlowRequestToastForTest();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("slowRequestToastLink", () => {
  it("toasts once when a request is still in flight past the threshold", async () => {
    void run(slowRequestToastLink().concat(hangs()));
    await vi.advanceTimersByTimeAsync(SLOW_REQUEST_TOAST_MS);

    expect(vi.mocked(toast.info)).toHaveBeenCalledTimes(1);
    // Copy resolves through the dictionary — never the raw key.
    const [title, options] = vi.mocked(toast.info).mock.calls[0];
    expect(title).toBeTruthy();
    expect(title).not.toContain("apollo.slowRequest");
    expect(options?.description).toBeTruthy();
    expect(options?.description).not.toContain("apollo.slowRequest");
    expect(options?.duration).toBe(6000);
  });

  it("two concurrent slow requests toast once, not twice", async () => {
    void run(slowRequestToastLink().concat(hangs()));
    void run(slowRequestToastLink().concat(hangs()));
    await vi.advanceTimersByTimeAsync(SLOW_REQUEST_TOAST_MS + 100);

    expect(vi.mocked(toast.info)).toHaveBeenCalledTimes(1);
  });

  it("a request that settles before the threshold never toasts", async () => {
    await run(slowRequestToastLink().concat(instant()));
    await vi.advanceTimersByTimeAsync(SLOW_REQUEST_TOAST_MS + 1000);

    expect(vi.mocked(toast.info)).not.toHaveBeenCalled();
  });

  it("a request that errors before the threshold never toasts", async () => {
    await expect(run(slowRequestToastLink().concat(errors()))).rejects.toBeTruthy();
    await vi.advanceTimersByTimeAsync(SLOW_REQUEST_TOAST_MS + 1000);

    expect(vi.mocked(toast.info)).not.toHaveBeenCalled();
  });

  it("stays quiet within the suppression window, re-arms after it", async () => {
    void run(slowRequestToastLink().concat(hangs()));
    await vi.advanceTimersByTimeAsync(SLOW_REQUEST_TOAST_MS);
    expect(vi.mocked(toast.info)).toHaveBeenCalledTimes(1);

    // Inside the window: the second slow request stays silent.
    void run(slowRequestToastLink().concat(hangs()));
    await vi.advanceTimersByTimeAsync(SLOW_REQUEST_TOAST_MS);
    expect(vi.mocked(toast.info)).toHaveBeenCalledTimes(1);

    // Past the window: a fresh slow request may speak again.
    await vi.advanceTimersByTimeAsync(SLOW_REQUEST_SUPPRESS_MS);
    void run(slowRequestToastLink().concat(hangs()));
    await vi.advanceTimersByTimeAsync(SLOW_REQUEST_TOAST_MS);
    expect(vi.mocked(toast.info)).toHaveBeenCalledTimes(2);
  });

  it("never toasts in an automated browser (Playwright e2e)", async () => {
    vi.stubGlobal("navigator", { webdriver: true });
    void run(slowRequestToastLink().concat(hangs()));
    await vi.advanceTimersByTimeAsync(SLOW_REQUEST_TOAST_MS + 1000);

    expect(vi.mocked(toast.info)).not.toHaveBeenCalled();
  });

  it("unsubscribing cancels the pending timer", () => {
    const subscription = execute(slowRequestToastLink().concat(hangs()), { query: DOC }, {
      client: getApolloClient(),
    }).subscribe({ next: () => {}, error: () => {} });

    subscription.unsubscribe();
    vi.advanceTimersByTime(SLOW_REQUEST_TOAST_MS + 1000);

    expect(vi.mocked(toast.info)).not.toHaveBeenCalled();
  });
});
