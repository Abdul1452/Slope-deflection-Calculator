import { Span } from "@/typings";
import { LOAD_TYPES } from "./loadTypes";

export interface LoadResultant {
  /** Total load carried by the span, in kN (downward positive). */
  totalLoad: number;
  /** Distance from the start of the span to the load centroid, in m. */
  centroidFromStart: number;
}

/**
 * Statically equivalent resultant of a span's load.
 *
 * Used for overhang moments and for the span equilibrium that yields the
 * support reactions, so both stay consistent with the fixed-end-moment
 * formulas in ./calculations.
 */
export const getLoadResultant = (span: Span): LoadResultant => {
  const { length: L, loadMagnitude: P, loadType } = span;

  switch (loadType) {
    case LOAD_TYPES.CENTER_POINT:
      return { totalLoad: P, centroidFromStart: L / 2 };

    case LOAD_TYPES.POINT_AT_DISTANCE: {
      const a = span.pointLoadDistances?.a ?? 0;
      return { totalLoad: P, centroidFromStart: a };
    }

    // Two equal loads at L/3 and 2L/3 — centroid at midspan by symmetry.
    case LOAD_TYPES.TWO_POINT_LOADS:
      return { totalLoad: 2 * P, centroidFromStart: L / 2 };

    // Three equal loads at L/4, L/2 and 3L/4 — centroid at midspan.
    case LOAD_TYPES.THREE_POINT_LOADS:
      return { totalLoad: 3 * P, centroidFromStart: L / 2 };

    case LOAD_TYPES.UDL:
      return { totalLoad: P * L, centroidFromStart: L / 2 };

    // Triangular load, zero at the left end and peak P at the right end.
    case LOAD_TYPES.VDL_RIGHT:
      return { totalLoad: (P * L) / 2, centroidFromStart: (2 * L) / 3 };

    // Triangular load, peak P at the left end falling to zero at the right.
    case LOAD_TYPES.VDL_LEFT:
      return { totalLoad: (P * L) / 2, centroidFromStart: L / 3 };

    case LOAD_TYPES.NONE:
    default:
      return { totalLoad: 0, centroidFromStart: 0 };
  }
};
