/**
 * Annotation hooks (FR-16, epic-13 T3): the reader's per-material
 * annotation read (newest-first) + the add/remove writes.
 *
 * The writes ride OPTIMISTIC paints (owner bug round 2026-11-15): the user's
 * highlight lands instantly — the mutation round-trip + read-back sweep run
 * invisibly behind it. The paint carries EVERY field the documents select
 * (the study-mark-toggle lesson: a partial paint dies on Apollo's
 * "Missing field" cache write) and the per-call `update` hands the list from
 * the temp optimistic row to the real server row with no gap (without it,
 * clearing the optimistic layer would drop the row until the sweep lands).
 * A wire failure clears the optimistic layer — the highlight rolls back
 * honestly, and the call site toasts (AD-9).
 */
import { useMemo } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import type { ApolloCache } from "@apollo/client";
import {
  AddAnnotationDocument,
  AnnotationsDocument,
  RemoveAnnotationDocument,
  type AddAnnotationMutation,
  type RemoveAnnotationMutation,
} from "@/types/graphql";
import { mapAnnotation } from "../mappers";
import { newClientUuid } from "@/lib/uuid";
import type { Annotation } from "@/domain/entities";

export function useAnnotationsQuery(materialId: string) {
  const result = useQuery(AnnotationsDocument, { variables: { materialId }, skip: !materialId });
  // Referentially stable per cache generation: the mapped rows memoize on the
  // raw data identity. This hook's data feeds the reader's annotation effects
  // (re-apply → report → setState), so a fresh array per render once looped
  // that cycle to "Maximum update depth exceeded" on any annotated material.
  const rows = useMemo(() => (result.data?.annotations ?? []).map(mapAnnotation), [result.data]);
  return {
    data: result.data !== undefined ? rows : undefined,
    loading: result.loading && !result.data,
    error: result.error,
    refetch: result.refetch,
  };
}

/** Add one annotation (kind/color/body optional — the chips send kind+color, empty body). */
export function useAddAnnotationMutation() {
  return useMutation(AddAnnotationDocument, {
    // The read-back stays: the sweep re-applies the server truth through the
    // engine and survives reload — but the OPTIMISTIC paint (the call site's
    // optimisticResponse + update) is what the user sees instantly.
    refetchQueries: [AnnotationsDocument],
  });
}

/** Remove one annotation by id (the list panel's per-item delete). */
export function useRemoveAnnotationMutation() {
  return useMutation(RemoveAnnotationDocument, {
    refetchQueries: [AnnotationsDocument],
  });
}

// -- the optimistic paint layer (owner bug round 2026-11-15) --------------------------

export interface AnnotationOptimisticInput {
  materialId: string;
  locator: { kind: string; page: number | null; sectionId: string | null };
  range: { sectionId?: string | null; page?: number | null; start: number; end: number; quote: string };
  kind: string;
  color: string | null | undefined;
  body: string | null | undefined;
}

/**
 * A client-minted temp id for the optimistic row — `optimistic-` prefixed so
 * a stray one can never collide with a server uuid; the real row replaces it
 * through the list update (and the sweep confirms).
 */
export function newOptimisticAnnotationId(): string {
  return `optimistic-${newClientUuid()}`;
}

/** The full-shape optimistic addAnnotation paint (every selected field). */
export function buildAddAnnotationOptimistic(
  input: AnnotationOptimisticInput,
  tempId: string,
  createdAt: string,
): AddAnnotationMutation {
  return {
    __typename: "Mutation",
    addAnnotation: {
      __typename: "AddAnnotationPayload",
      annotation: {
        __typename: "Annotation",
        id: tempId,
        materialId: input.materialId,
        createdAt,
        kind: input.kind,
        color: input.color ?? null,
        body: input.body ?? "",
        locator: {
          __typename: "ReadingLocator",
          kind: input.locator.kind,
          page: input.locator.page ?? null,
          sectionId: input.locator.sectionId ?? null,
        },
        range: {
          __typename: "AnnotationRange",
          sectionId: input.range.sectionId ?? null,
          page: input.range.page ?? null,
          start: input.range.start,
          end: input.range.end,
          quote: input.range.quote,
        },
      },
    },
  } as unknown as AddAnnotationMutation;
}

/**
 * The add's list handoff: on the real response, the temp row is replaced by
 * the server row at the head (newest-first) — no gap where the highlight
 * would flicker out between the optimistic clear and the read-back sweep.
 * Runs in the optimistic phase too (the temp row IS the paint).
 */
export function addAnnotationListUpdate(materialId: string, tempId: string) {
  return (cache: ApolloCache, result: { data?: AddAnnotationMutation | null }) => {
    const real = result.data?.addAnnotation?.annotation;
    if (!real) return;
    const existing = cache.readQuery({ query: AnnotationsDocument, variables: { materialId } });
    const rest = (existing?.annotations ?? []).filter(
      (a) => a != null && a.id !== tempId && a.id !== real.id,
    );
    cache.writeQuery({
      query: AnnotationsDocument,
      variables: { materialId },
      data: { annotations: [real, ...rest] },
    });
  };
}

/** The full-shape optimistic removeAnnotation paint. */
export function buildRemoveAnnotationOptimistic(id: string): RemoveAnnotationMutation {
  return {
    __typename: "Mutation",
    removeAnnotation: {
      __typename: "RemoveAnnotationPayload",
      deletedAnnotationId: id,
    },
  } as unknown as RemoveAnnotationMutation;
}

/** The remove's list handoff: evict the row from the cached list (both the
 * optimistic phase and the real response — instant removal, honest rollback). */
export function removeAnnotationListUpdate(materialId: string, id: string) {
  return (cache: ApolloCache) => {
    const existing = cache.readQuery({ query: AnnotationsDocument, variables: { materialId } });
    cache.writeQuery({
      query: AnnotationsDocument,
      variables: { materialId },
      data: { annotations: (existing?.annotations ?? []).filter((a) => a != null && a.id !== id) },
    });
  };
}
