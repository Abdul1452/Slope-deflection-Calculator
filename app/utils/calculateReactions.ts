import { FinalMoments } from "./beamSolver";
import { getLoadResultant } from "./loadResultant";
import { Span } from "@/typings";

export interface Reactions {
  [key: string]: number;
}

export const calculateReactions = (
  spans: Span[],
  finalMoments: FinalMoments
): Reactions => {
  const reactions: Reactions = {};

  spans.forEach((span, index) => {
    const startNode = String.fromCharCode(65 + index);
    const endNode = String.fromCharCode(66 + index);

    const startMoment = finalMoments[`M${startNode}${endNode}`] || 0;
    const endMoment = finalMoments[`M${endNode}${startNode}`] || 0;

    const { startReaction, endReaction } = calculateSpanReactions(
      span,
      startMoment,
      endMoment
    );

    // Supports shared by two spans collect both contributions. These stay
    // unrounded: rounding each span to whole kN used to destroy the precision
    // of the total, which matters for lightly loaded spans.
    reactions[`R${startNode}`] =
      (reactions[`R${startNode}`] || 0) + startReaction;
    reactions[`R${endNode}`] = (reactions[`R${endNode}`] || 0) + endReaction;
  });

  return reactions;
};

/**
 * Vertical reactions for a single span from its end moments.
 *
 * Taking moments about the start of the span gives
 *
 *   R_end = (W * xbar + M_start + M_end) / L
 *
 * for member end moments in the slope-deflection sign convention, with the
 * start reaction following from vertical equilibrium. Driving every load type
 * through the one resultant keeps the reactions consistent with the fixed-end
 * moments, instead of repeating a hand-derived formula per load type.
 */
export const calculateSpanReactions = (
  span: Span,
  startMoment: number,
  endMoment: number
): { startReaction: number; endReaction: number } => {
  const { length: L, startSupport, endSupport } = span;
  const { totalLoad, centroidFromStart } = getLoadResultant(span);

  // An overhang is carried entirely by its supported end; the free tip has no
  // reaction at all.
  if (startSupport === "none" || endSupport === "none") {
    return startSupport === "none"
      ? { startReaction: 0, endReaction: totalLoad }
      : { startReaction: totalLoad, endReaction: 0 };
  }

  if (L === 0) return { startReaction: 0, endReaction: 0 };

  const endReaction =
    (totalLoad * centroidFromStart + startMoment + endMoment) / L;

  return { startReaction: totalLoad - endReaction, endReaction };
};
