import { InMemoryCache } from "@apollo/client";
import { describe, expect, it } from "vitest";
import {
  AnnotationsDocument,
  SectionMarkingsDocument,
  type AnnotationsQuery,
  type SectionMarkingsQuery,
} from "@/types/graphql";
import {
  addAnnotationListUpdate,
  buildAddAnnotationOptimistic,
  buildRemoveAnnotationOptimistic,
  newOptimisticAnnotationId,
  removeAnnotationListUpdate,
} from "./annotation-queries";
import {
  buildClaimSectionOptimistic,
  buildUnclaimSectionOptimistic,
  claimSectionListUpdate,
} from "./marking-queries";

/**
 * The optimistic paint layer (owner bug round 2026-11-15): full-shape paints
 * (the study-mark-toggle lesson — a partial paint dies on Apollo's missing-
 * field cache write) and the list handoffs that bridge the optimistic row to
 * the server row without a gap. Pinned on a real InMemoryCache.
 */

const ANNO_PARTS_FIELDS = [
  "id",
  "materialId",
  "createdAt",
  "kind",
  "color",
  "body",
  "locator",
  "range",
] as const;

function seedAnnotations(materialId: string, ids: string[]) {
  const cache = new InMemoryCache();
  cache.writeQuery({
    query: AnnotationsDocument,
    variables: { materialId },
    data: {
      annotations: ids.map((id) => ({
        __typename: "Annotation",
        id,
        materialId,
        createdAt: "2026-11-15T10:00:00Z",
        kind: "highlight",
        color: null,
        body: "",
        locator: { __typename: "ReadingLocator", kind: "markdown", page: null, sectionId: "sec-1" },
        range: { __typename: "AnnotationRange", sectionId: "sec-1", page: null, start: 3, end: 9, quote: "quote" },
      })),
      // The cache REQUIRES the __typename markers for normalization; the
      // generated (non-incremental) types omit them — cast at the seam.
    } as unknown as AnnotationsQuery,
  });
  return cache;
}

describe("annotation optimistic paints (owner bug round 2026-11-15)", () => {
  it("the add paint carries EVERY field the AnnotationParts fragment selects", () => {
    const paint = buildAddAnnotationOptimistic(
      {
        materialId: "m-1",
        locator: { kind: "pdf", page: 2, sectionId: null },
        range: { page: 2, start: 5, end: 9, quote: "QUIC" },
        kind: "highlight",
        color: "coral",
        body: "",
      },
      newOptimisticAnnotationId(),
      "2026-11-15T12:00:00Z",
    );
    const row = paint.addAnnotation.annotation;
    for (const field of ANNO_PARTS_FIELDS) {
      expect(row).toHaveProperty(field);
    }
    expect(row.locator).toHaveProperty("kind");
    expect(row.locator).toHaveProperty("page");
    expect(row.locator).toHaveProperty("sectionId");
    expect(row.range).toHaveProperty("sectionId");
    expect(row.range).toHaveProperty("page");
    expect(row.range).toHaveProperty("start");
    expect(row.range).toHaveProperty("end");
    expect(row.range).toHaveProperty("quote");
  });

  it("newOptimisticAnnotationId mints optimistic-prefixed ids that never collide with server uuids", () => {
    const id = newOptimisticAnnotationId();
    expect(id.startsWith("optimistic-")).toBe(true);
    expect(newOptimisticAnnotationId()).not.toBe(id);
  });

  it("addAnnotationListUpdate replaces the temp row with the server row at the head (newest-first)", () => {
    const cache = seedAnnotations("m-1", ["a-1"]);
    const real = {
      __typename: "Annotation",
      id: "a-real",
      materialId: "m-1",
      createdAt: "2026-11-15T12:00:00Z",
      kind: "underline",
      color: "blue",
      body: "",
      locator: { __typename: "ReadingLocator", kind: "markdown", page: null, sectionId: "sec-1" },
      range: { __typename: "AnnotationRange", sectionId: "sec-1", page: null, start: 0, end: 4, quote: "text" },
    };
    addAnnotationListUpdate("m-1", "optimistic-t1")(
      cache,
      { data: { __typename: "Mutation", addAnnotation: { __typename: "AddAnnotationPayload", annotation: real } } } as never,
    );
    const list = cache.readQuery({ query: AnnotationsDocument, variables: { materialId: "m-1" } });
    expect(list?.annotations.map((a) => a.id)).toEqual(["a-real", "a-1"]);
  });

  it("addAnnotationListUpdate is a no-op on a null payload (the failure path)", () => {
    const cache = seedAnnotations("m-1", ["a-1"]);
    addAnnotationListUpdate("m-1", "optimistic-t1")(cache, { data: null });
    const list = cache.readQuery({ query: AnnotationsDocument, variables: { materialId: "m-1" } });
    expect(list?.annotations.map((a) => a.id)).toEqual(["a-1"]);
  });

  it("removeAnnotationListUpdate evicts the row; other rows survive", () => {
    const cache = seedAnnotations("m-1", ["a-1", "a-2"]);
    removeAnnotationListUpdate("m-1", "a-1")(cache);
    const list = cache.readQuery({ query: AnnotationsDocument, variables: { materialId: "m-1" } });
    expect(list?.annotations.map((a) => a.id)).toEqual(["a-2"]);
  });

  it("the remove paint reports the deleted id verbatim", () => {
    const paint = buildRemoveAnnotationOptimistic("a-1");
    expect(paint.removeAnnotation.deletedAnnotationId).toBe("a-1");
  });
});

describe("marking optimistic paints (owner bug round 2026-11-15)", () => {
  it("the claim paint is a full open row with a null clearedAt", () => {
    const paint = buildClaimSectionOptimistic("m-1", "sec-1", "optimistic-t1", "2026-11-15T12:00:00Z");
    const row = paint.claimSection.sectionMarking;
    expect(row).toMatchObject({
      __typename: "SectionMarking",
      id: "optimistic-t1",
      materialId: "m-1",
      sectionId: "sec-1",
      claimedAt: "2026-11-15T12:00:00Z",
      clearedAt: null,
    });
  });

  it("claimSectionListUpdate replaces the temp row with the server row at the head", () => {
    const cache = new InMemoryCache();
    cache.writeQuery({
      query: SectionMarkingsDocument,
      variables: { materialId: "m-1" },
      data: {
        sectionMarkings: [
          { __typename: "SectionMarking", id: "r-old", materialId: "m-1", sectionId: "sec-0", claimedAt: "2026-11-14T09:00:00Z", clearedAt: "2026-11-14T10:00:00Z" },
        ],
      } as unknown as SectionMarkingsQuery,
    });
    const real = { __typename: "SectionMarking", id: "r-real", materialId: "m-1", sectionId: "sec-1", claimedAt: "2026-11-15T12:00:00Z", clearedAt: null };
    claimSectionListUpdate("m-1", "optimistic-t1")(
      cache,
      { data: { __typename: "Mutation", claimSection: { __typename: "ClaimSectionPayload", sectionMarking: real } } } as never,
    );
    const list = cache.readQuery({ query: SectionMarkingsDocument, variables: { materialId: "m-1" } });
    expect(list?.sectionMarkings.map((r) => r.id)).toEqual(["r-real", "r-old"]);
  });

  it("the unmark paint keeps the SAME row: claimedAt stands, clearedAt is set", () => {
    const paint = buildUnclaimSectionOptimistic(
      { id: "r-1", materialId: "m-1", sectionId: "sec-1", claimedAt: "2026-11-15T09:00:00Z" },
      "2026-11-15T12:00:00Z",
    );
    expect(paint.unclaimSection.sectionMarking).toEqual({
      __typename: "SectionMarking",
      id: "r-1",
      materialId: "m-1",
      sectionId: "sec-1",
      claimedAt: "2026-11-15T09:00:00Z",
      clearedAt: "2026-11-15T12:00:00Z",
    });
  });
});
