import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { PdfPageFlow, zoomedPageWidth } from "./PdfPageFlow";

/**
 * PDF zoom (owner bug round 2026-11-15): the top bar's ladder renders through
 * the width seam — the page boxes, the text layer, the annotations and the
 * position rects all key off the page width, so the zoom only has to land as
 * a width. jsdom has no stylesheet (the column's padding reads 0) and no
 * canvas, so this pins the LAYOUT half: the measured fit-width baseline and
 * the zoomed column/page geometry at the container boundary.
 */

vi.mock("./pdf-render", () => ({
  openPdfDocument: async () => ({
    numPages: 2,
    pageSize: () => ({ width: 400, height: 300 }),
    async renderPage() {
      return { cancel: () => {}, promise: Promise.resolve() };
    },
    async renderTextLayer(_pageNumber: number, layer: HTMLElement) {
      layer.replaceChildren();
      return { cancel: () => {}, promise: Promise.resolve() };
    },
    destroy: () => {},
  }),
}));

beforeEach(() => {
  // The flow measures its column through ResizeObserver before any page
  // mounts; the suite-wide stub never fires, so this file gives it one that
  // reports a real width on observe (the annotation-hover file's exact
  // pattern). jsdom has no stylesheet, so the column padding reads 0 — the
  // fit baseline IS the reported width (800).
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(private readonly callback: ResizeObserverCallback) {}
      observe(target: Element): void {
        this.callback([{ contentRect: { width: 800 } } as ResizeObserverEntry], target as unknown as ResizeObserver);
      }
      unobserve(): void {}
      disconnect(): void {}
    },
  );
});

const noop = () => {};

function renderFlow(zoom?: number) {
  return render(
    <LanguageProvider>
      <PdfPageFlow
        blob={new Blob(["the mock owns the bytes"])}
        initialPage={null}
        flashTarget={false}
        onPageChange={noop}
        onTotalPages={noop}
        zoom={zoom}
      />
    </LanguageProvider>,
  );
}

describe("PDF zoom — the width seam (owner bug round 2026-11-15)", () => {
  it("zoomedPageWidth floors the fit-width × multiplier product", () => {
    expect(zoomedPageWidth(800, 1)).toBe(800);
    expect(zoomedPageWidth(800, 1.5)).toBe(1200);
    expect(zoomedPageWidth(913, 1.25)).toBe(1141); // 1141.25 → floor
    expect(zoomedPageWidth(800, 0.5)).toBe(400);
  });

  it("zoom 1 keeps the classic fit-width column (max-w cap, no inline width)", async () => {
    const view = renderFlow(1);
    const pageBox = await vi.waitFor(() => {
      const el = view.container.querySelector('[data-page="1"]');
      expect(el).not.toBeNull();
      return el as HTMLElement;
    });
    // The measured baseline (800) IS the page width at fit.
    expect(pageBox.style.width).toBe("800px");
    const column = pageBox.parentElement!;
    expect(column.className).toContain("max-w-[980px]");
    expect(column.style.width).toBe("");
    view.unmount();
  });

  it("zoom > 1: pages render at fit × zoom and the column carries the inline width", async () => {
    const view = renderFlow(1.5);
    const pageBox = await vi.waitFor(() => {
      const el = view.container.querySelector('[data-page="1"]');
      expect(el).not.toBeNull();
      return el as HTMLElement;
    });
    expect(pageBox.style.width).toBe("1200px"); // 800 × 1.5
    const column = pageBox.parentElement!;
    // The zoomed column: inline outer width, max-w dropped, auto margins
    // dropped (overflow must run RIGHT only — centered overflow strands the
    // left half beyond scroll reach).
    expect(column.style.width).toBe("1200px"); // jsdom padding 0
    expect(column.className).not.toContain("max-w-[980px]");
    expect(column.className).not.toContain("mx-auto");
    // The scroll container is the horizontal scroll owner.
    expect(column.parentElement!.className).toContain("overflow-x-auto");
    view.unmount();
  });

  it("zoom < 1: pages shrink and the column stays centered (mx-auto kept)", async () => {
    const view = renderFlow(0.5);
    const pageBox = await vi.waitFor(() => {
      const el = view.container.querySelector('[data-page="1"]');
      expect(el).not.toBeNull();
      return el as HTMLElement;
    });
    expect(pageBox.style.width).toBe("400px");
    const column = pageBox.parentElement!;
    expect(column.style.width).toBe("400px");
    expect(column.className).toContain("mx-auto");
    view.unmount();
  });
});
