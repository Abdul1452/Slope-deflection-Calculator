import {
  CalculatorFormData,
  FixedEndMomentResults,
  SlopeDeflectionEquation,
  Span,
  SupportType,
} from "@/typings";
import { calculateFixedEndMoments } from "./calculations";
import { getLoadResultant } from "./loadResultant";

export interface FinalMoments {
  [key: string]: number;
}

/** Joint rotations keyed by node label ("A", "B", ...), in radians. */
export interface Rotations {
  [node: string]: number;
}

export interface BeamSolution {
  rotations: Rotations;
  moments: FinalMoments;
  equations: SlopeDeflectionEquation[];
  fixedEndMoments: FixedEndMomentResults[];
  /** Spans acting as statically determinate overhangs (free at one end). */
  overhangs: boolean[];
  warnings: string[];
}

/**
 * One member end moment held as coefficients rather than as text:
 *
 *   M = constant + sum over nodes of (coefficient * theta_node)
 *
 * The previous implementation rendered these to strings and recovered the
 * numbers with regular expressions, which silently dropped any rotation the
 * regex did not know about. Keeping the coefficients is what makes an
 * arbitrary number of unknown rotations solvable.
 */
interface EndMoment {
  constant: number;
  coefficients: Map<number, number>;
}

const emptyEndMoment = (): EndMoment => ({
  constant: 0,
  coefficients: new Map(),
});

const addCoefficient = (moment: EndMoment, node: number, value: number) => {
  moment.coefficients.set(node, (moment.coefficients.get(node) ?? 0) + value);
};

export const nodeLabel = (index: number): string =>
  String.fromCharCode(65 + index);

/**
 * Support type at each node. Interior nodes are shared by two spans, so a
 * disagreement between the two is resolved in favour of the more restrictive
 * support.
 */
const resolveNodeSupports = (
  spans: Span[],
  warnings: string[]
): SupportType[] => {
  const nodeCount = spans.length + 1;
  const supports: SupportType[] = [];

  for (let i = 0; i < nodeCount; i++) {
    const before = i > 0 ? spans[i - 1].endSupport : undefined;
    const after = i < spans.length ? spans[i].startSupport : undefined;

    if (before === undefined) {
      supports.push(after ?? "hinged");
      continue;
    }
    if (after === undefined) {
      supports.push(before);
      continue;
    }

    if (before === "fixed" || after === "fixed") {
      supports.push("fixed");
    } else if (before === "none" || after === "none") {
      warnings.push(
        `Support ${nodeLabel(
          i
        )} is an interior support, so it cannot be a free end; it was treated as pinned.`
      );
      supports.push("hinged");
    } else {
      supports.push(before);
    }
  }

  return supports;
};

/** Gaussian elimination with partial pivoting. Returns null if singular. */
const solveLinearSystem = (
  matrix: number[][],
  rhs: number[]
): number[] | null => {
  const size = rhs.length;
  if (size === 0) return [];

  // Work on copies so the caller's arrays stay intact.
  const a = matrix.map((row) => [...row]);
  const b = [...rhs];

  for (let col = 0; col < size; col++) {
    let pivot = col;
    for (let row = col + 1; row < size; row++) {
      if (Math.abs(a[row][col]) > Math.abs(a[pivot][col])) pivot = row;
    }

    // Scale the singularity test to the matrix so that a legitimately small
    // EI is not mistaken for a mechanism.
    const scale = Math.max(...a.map((row) => Math.abs(row[col])), 1);
    if (Math.abs(a[pivot][col]) < 1e-12 * scale) return null;

    if (pivot !== col) {
      [a[col], a[pivot]] = [a[pivot], a[col]];
      [b[col], b[pivot]] = [b[pivot], b[col]];
    }

    for (let row = col + 1; row < size; row++) {
      const factor = a[row][col] / a[col][col];
      if (factor === 0) continue;
      for (let k = col; k < size; k++) a[row][k] -= factor * a[col][k];
      b[row] -= factor * b[col];
    }
  }

  const solution = new Array<number>(size).fill(0);
  for (let row = size - 1; row >= 0; row--) {
    let sum = b[row];
    for (let k = row + 1; k < size; k++) sum -= a[row][k] * solution[k];
    solution[row] = sum / a[row][row];
  }
  return solution;
};

const formatCoefficient = (value: number): string => {
  const rounded = Number(value.toFixed(4));
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(4);
};

/** Renders an end moment for display, with rotation terms as multiples of EI. */
const formatEndMoment = (moment: EndMoment, eiReference: number): string => {
  const parts: string[] = [moment.constant.toFixed(2)];

  const nodes = Array.from(moment.coefficients.keys()).sort((a, b) => a - b);
  for (const node of nodes) {
    const coefficient = moment.coefficients.get(node) ?? 0;
    if (Math.abs(coefficient) < 1e-12) continue;

    const relative = eiReference !== 0 ? coefficient / eiReference : coefficient;
    const sign = relative < 0 ? "-" : "+";
    const magnitude = formatCoefficient(Math.abs(relative));
    parts.push(`${sign} ${magnitude}EIθ${nodeLabel(node)}`);
  }

  return parts.join(" ");
};

/**
 * Solves a continuous beam by the slope-deflection method.
 *
 * Every joint that is free to rotate contributes one unknown and one moment
 * equilibrium equation, so beams with any number of spans and any mix of
 * fixed, pinned and roller supports go through the same code path.
 */
export const solveBeam = (formData: CalculatorFormData): BeamSolution => {
  const { spans, modulusOfElasticity: E, momentOfInertia: globalI } = formData;
  const warnings: string[] = [];
  const spanCount = spans.length;
  const nodeCount = spanCount + 1;

  const settlements = Array.from(
    { length: nodeCount },
    (_, i) => formData.sinkingSupports[i] ?? 0
  );

  const supports = resolveNodeSupports(spans, warnings);

  // A span is an overhang when it hangs past the last support at either end.
  const overhangs = spans.map(
    (span, i) =>
      (i === 0 && span.startSupport === "none") ||
      (i === spanCount - 1 && span.endSupport === "none")
  );

  const fixedEndMoments: FixedEndMomentResults[] = [];
  const startMoments: EndMoment[] = [];
  const endMoments: EndMoment[] = [];

  // Reference rigidity, used only to present coefficients as multiples of EI.
  const eiReference = E * globalI;

  spans.forEach((span, i) => {
    const label = `${nodeLabel(i)}${nodeLabel(i + 1)}`;
    const start = emptyEndMoment();
    const end = emptyEndMoment();

    if (overhangs[i]) {
      // An overhang is statically determinate: the free end carries no moment,
      // and the supported end carries the full static moment of its load.
      const { totalLoad, centroidFromStart } = getLoadResultant(span);

      if (span.startSupport === "none") {
        end.constant = totalLoad * (span.length - centroidFromStart);
      } else {
        start.constant = -totalLoad * centroidFromStart;
      }

      fixedEndMoments.push({
        spanLabel: label,
        startMoment: start.constant,
        endMoment: end.constant,
      });
    } else {
      const fem = calculateFixedEndMoments(span);
      fixedEndMoments.push({
        spanLabel: label,
        startMoment: fem.start,
        endMoment: fem.end,
      });

      // A span's own moment of inertia is relative to the global value.
      const ei = E * globalI * span.momentOfInertia;
      const k = (2 * ei) / span.length;
      const chordRotation = (settlements[i + 1] - settlements[i]) / span.length;

      // M_ij = FEM_ij + (2EI/L)(2*theta_i + theta_j - 3*psi)
      start.constant = fem.start - 3 * k * chordRotation;
      addCoefficient(start, i, 2 * k);
      addCoefficient(start, i + 1, k);

      end.constant = fem.end - 3 * k * chordRotation;
      addCoefficient(end, i, k);
      addCoefficient(end, i + 1, 2 * k);
    }

    startMoments.push(start);
    endMoments.push(end);
  });

  // Unknowns: every node that can rotate. A fixed support has zero rotation,
  // and the tip of an overhang is not a joint at all.
  const unknownNodes: number[] = [];
  for (let i = 0; i < nodeCount; i++) {
    const isFreeEnd =
      (i === 0 && spans[0]?.startSupport === "none") ||
      (i === nodeCount - 1 && spans[spanCount - 1]?.endSupport === "none");
    if (supports[i] !== "fixed" && !isFreeEnd) unknownNodes.push(i);
  }
  const columnOf = new Map(unknownNodes.map((node, index) => [node, index]));

  // Moment equilibrium at each rotating joint: the member end moments there
  // sum to zero. At an end joint there is only one member, so this reduces to
  // the familiar "the moment at a pin is zero".
  const matrix: number[][] = [];
  const rhs: number[] = [];

  for (const node of unknownNodes) {
    const row = new Array<number>(unknownNodes.length).fill(0);
    let constant = 0;

    const members: EndMoment[] = [];
    if (node > 0) members.push(endMoments[node - 1]);
    if (node < spanCount) members.push(startMoments[node]);

    for (const member of members) {
      constant += member.constant;
      member.coefficients.forEach((value, coefficientNode) => {
        const column = columnOf.get(coefficientNode);
        // A fixed node has no column because its rotation is zero.
        if (column !== undefined) row[column] += value;
      });
    }

    matrix.push(row);
    rhs.push(-constant);
  }

  const solved = solveLinearSystem(matrix, rhs);
  const rotationByNode = new Map<number, number>();

  if (solved === null) {
    warnings.push(
      "The supports given do not restrain the beam, so the rotations have no unique solution. Check the support types."
    );
  } else {
    unknownNodes.forEach((node, index) =>
      rotationByNode.set(node, solved[index])
    );
  }

  const evaluate = (moment: EndMoment): number => {
    let total = moment.constant;
    moment.coefficients.forEach((value, node) => {
      total += value * (rotationByNode.get(node) ?? 0);
    });
    return total;
  };

  const moments: FinalMoments = {};
  const equations: SlopeDeflectionEquation[] = [];

  spans.forEach((_, i) => {
    const from = nodeLabel(i);
    const to = nodeLabel(i + 1);
    moments[`M${from}${to}`] = evaluate(startMoments[i]);
    moments[`M${to}${from}`] = evaluate(endMoments[i]);

    equations.push({
      spanLabel: `${from}${to}`,
      startEquation: formatEndMoment(startMoments[i], eiReference),
      endEquation: formatEndMoment(endMoments[i], eiReference),
    });
  });

  const rotations: Rotations = {};
  rotationByNode.forEach((value, node) => {
    rotations[nodeLabel(node)] = value;
  });

  return {
    rotations,
    moments,
    equations,
    fixedEndMoments,
    overhangs,
    warnings,
  };
};
