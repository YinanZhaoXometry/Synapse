/**
 * Mastery Marking claim hooks (FR-15, epic-15 T2). The per-material claim
 * read feeds the reader's green marking state; the two mutations carry the
 * claim/unmark. Both mutations sweep the claim list — rows are history
 * (claim→unclaim→re-claim accumulates rows) and the read-back is the honest
 * state; the open claims are derived client-side from `clearedAt == null`.
 * A claim is NEVER evidence: nothing here touches mastery fields (AD-14) and
 * no clientMutationId is minted (AD-12 — the inputs have no client uuid).
 *
 * Optimistic paints (owner bug round 2026-11-15): the green arrives on the
 * click, not after the round-trip — the claim paints a temp full-shape row
 * (the list update hands it to the server row on the response), the unmark
 * paints the SAME row with clearedAt set (the list holds refs, so the
 * normalized object write is enough there). A wire failure clears the
 * optimistic layer and the call site toasts (AD-9).
 */
import { useMutation, useQuery } from "@apollo/client/react";
import type { ApolloCache } from "@apollo/client";
import {
  ClaimSectionDocument,
  SectionMarkingsDocument,
  UnclaimSectionDocument,
  type ClaimSectionMutation,
  type UnclaimSectionMutation,
} from "@/types/graphql";
import { newClientUuid } from "@/lib/uuid";
import { mapSectionMarking } from "../mappers";
import type { SectionMarkingView } from "../views";

/**
 * All of a material's claim rows (open + cleared), newest first as the server
 * returns them — never re-sorted client-side; the consumer derives the open
 * claims (`clearedAt == null`).
 */
export function useSectionMarkingsQuery(materialId: string) {
  const result = useQuery(SectionMarkingsDocument, { variables: { materialId }, skip: !materialId });
  const rows = (result.data?.sectionMarkings ?? []).map(mapSectionMarking);
  return {
    data: result.data !== undefined ? rows : undefined,
    loading: result.loading && !result.data,
    error: result.error,
    refetch: result.refetch,
  };
}

/** Mark a section — the claim, never evidence. Re-claiming an already-open
 * section returns that row unchanged (the server's claim law). */
export function useClaimSectionMutation() {
  return useMutation(ClaimSectionDocument, {
    // The claim list is the one read the green state derives from — the
    // read-back carries the fresh (or unchanged) row honestly.
    refetchQueries: [SectionMarkingsDocument],
  });
}

/** Unmark a section: claimedAt stands, clearedAt is set — history stays. */
export function useUnclaimSectionMutation() {
  return useMutation(UnclaimSectionDocument, {
    // Same sweep: the cleared row (clearedAt now set) rides the read-back.
    refetchQueries: [SectionMarkingsDocument],
  });
}

// -- the optimistic paint layer (owner bug round 2026-11-15) --------------------------

/** A client-minted temp id for the optimistic claim row (`optimistic-` prefixed —
 * the real row replaces it through the list update). */
export function newOptimisticMarkingId(): string {
  return `optimistic-${newClientUuid()}`;
}

/** The full-shape optimistic claim paint (a fresh open row, server clock mocked
 * with the click time — the sweep lands the server's own claimedAt). */
export function buildClaimSectionOptimistic(
  materialId: string,
  sectionId: string,
  tempId: string,
  claimedAt: string,
): ClaimSectionMutation {
  return {
    __typename: "Mutation",
    claimSection: {
      __typename: "ClaimSectionPayload",
      sectionMarking: {
        __typename: "SectionMarking",
        id: tempId,
        materialId,
        sectionId,
        claimedAt,
        clearedAt: null,
      },
    },
  } as unknown as ClaimSectionMutation;
}

/**
 * The claim's list handoff: the temp row is replaced by the server row at the
 * head (newest-first) — no gap where the green would flicker out between the
 * optimistic clear and the read-back sweep. Runs in the optimistic phase too.
 */
export function claimSectionListUpdate(materialId: string, tempId: string) {
  return (cache: ApolloCache, result: { data?: ClaimSectionMutation | null }) => {
    const real = result.data?.claimSection?.sectionMarking;
    if (!real) return;
    const existing = cache.readQuery({ query: SectionMarkingsDocument, variables: { materialId } });
    const rest = (existing?.sectionMarkings ?? []).filter(
      (r) => r != null && r.id !== tempId && r.id !== real.id,
    );
    cache.writeQuery({
      query: SectionMarkingsDocument,
      variables: { materialId },
      data: { sectionMarkings: [real, ...rest] },
    });
  };
}

/**
 * The full-shape optimistic unmark paint: the SAME row (no temp id — the list
 * holds its ref and the normalized object write is enough) with clearedAt set
 * to the click time; the sweep lands the server's own clock.
 */
export function buildUnclaimSectionOptimistic(
  row: { materialId: string; sectionId: string; claimedAt: string; id: string },
  clearedAt: string,
): UnclaimSectionMutation {
  return {
    __typename: "Mutation",
    unclaimSection: {
      __typename: "UnclaimSectionPayload",
      sectionMarking: {
        __typename: "SectionMarking",
        id: row.id,
        materialId: row.materialId,
        sectionId: row.sectionId,
        claimedAt: row.claimedAt,
        clearedAt,
      },
    },
  } as unknown as UnclaimSectionMutation;
}
