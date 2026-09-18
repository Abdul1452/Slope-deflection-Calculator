"use client";

import { FixedEndMomentResults, SlopeDeflectionEquation } from "@/typings";
import { Rotations } from "../utils/beamSolver";
import { SpanCriticalPoints } from "../utils/criticalBMSF";
import BMSFCharts from "./bmsf-charts";
import { motion } from "framer-motion";

interface Props {
  equations: SlopeDeflectionEquation[];
  rotations: Rotations;
  warnings?: string[];
  finalMoments?: { [key: string]: number };
  reactions?: { [key: string]: number };
  criticalPoints?: SpanCriticalPoints[];
  results: FixedEndMomentResults[];
}

const revealVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Results({
  equations,
  rotations,
  warnings,
  finalMoments,
  reactions,
  criticalPoints,
  results,
}: Props) {
  const rotationEntries = Object.entries(rotations ?? {});
  return (
    <div className="space-y-6">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={revealVariants}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Fixed End Moments
        </h2>
        <div className="space-y-2">
          {results.map((result) => (
            <motion.div
              key={result.spanLabel}
              className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md"
              initial="hidden"
              animate="visible"
              variants={revealVariants}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <p className="text-gray-900 dark:text-white">
                Span {result.spanLabel}:
              </p>
              <p className="pl-4 text-gray-700 dark:text-gray-300">
                FEM{result.spanLabel}: {result.startMoment.toFixed(2)}{" "}
                <span className="text-sm text-indigo-600 dark:text-indigo-400">
                  KNM
                </span>
              </p>
              <p className="pl-4 text-gray-700 dark:text-gray-300">
                FEM{result.spanLabel.split("").reverse().join("")}:{" "}
                {result.endMoment.toFixed(2)}{" "}
                <span className="text-sm text-indigo-600 dark:text-indigo-400">
                  KNM
                </span>
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={revealVariants}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Slope Deflection Equations
        </h3>
        <div className="space-y-4">
          {equations.map((eq) => {
            if (!eq.startEquation && !eq.endEquation) return null;

            return (
              <motion.div
                key={eq.spanLabel}
                className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md"
                initial="hidden"
                animate="visible"
                variants={revealVariants}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    Span {eq.spanLabel}:
                  </span>
                </div>
                <div className="pl-4 text-gray-700 dark:text-gray-300">
                  {eq.startEquation && (
                    <div>
                      M{eq.spanLabel} ={" "}
                      <span className="font-bold">{eq.startEquation}</span>
                    </div>
                  )}
                  {eq.endEquation && (
                    <div>
                      M{eq.spanLabel.split("").reverse().join("")} ={" "}
                      <span className="font-bold">{eq.endEquation}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {warnings && warnings.length > 0 && (
        <div
          role="alert"
          className="mt-4 p-4 rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950"
        >
          {warnings.map((warning) => (
            <p key={warning} className="text-amber-900 dark:text-amber-200">
              {warning}
            </p>
          ))}
        </div>
      )}

      {rotationEntries.length > 0 && (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={revealVariants}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-4"
        >
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
            Boundary Conditions
          </h3>
          <div className="space-y-2 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            {rotationEntries.map(([node, value]) => (
              <p key={node} className="text-gray-700 dark:text-gray-300">
                θ{node} = {value.toFixed(6)}
              </p>
            ))}
          </div>
        </motion.div>
      )}

      {finalMoments && Object.keys(finalMoments).length > 0 && (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={revealVariants}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-4"
        >
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
            Final Moments
          </h3>
          <div className="space-y-2 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            {Object.entries(finalMoments).map(([key, value]) => (
              <p key={key} className="text-gray-700 dark:text-gray-300">
                {key} = <span className="font-bold">{value.toFixed(2)}</span>{" "}
                <span className="text-sm text-indigo-600 dark:text-indigo-400">
                  KNM
                </span>
              </p>
            ))}
          </div>
        </motion.div>
      )}

      {reactions && Object.keys(reactions).length > 0 && (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={revealVariants}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-4"
        >
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
            Support Reactions
          </h3>
          <div className="space-y-2 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            {Object.entries(reactions).map(([key, value]) => (
              <p key={key} className="text-gray-700 dark:text-gray-300">
                {key} = <span className="font-bold">{value.toFixed(2)}</span>{" "}
                <span className="text-sm text-indigo-600 dark:text-indigo-400">
                  KN
                </span>
              </p>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div
        initial="hidden"
        animate="visible"
        variants={revealVariants}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="mt-6"
      >
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Bending Moments and Shear Forces
        </h3>
        <div className="space-y-4">
          {criticalPoints?.map((span) => (
            <motion.div
              key={span.spanLabel}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md"
              initial="hidden"
              animate="visible"
              variants={revealVariants}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <h4 className="font-medium mb-2 text-gray-900 dark:text-white">
                Span {span.spanLabel}
              </h4>
              <div className="space-y-2">
                {span.criticalPoints.map((point, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-3 gap-4 text-sm text-gray-700 dark:text-gray-300"
                  >
                    <div>{point.location}</div>
                    <div>BM: {point.bendingMoment.toFixed(2)} KNm</div>
                    <div>SF: {point.shearForce.toFixed(2)} KN</div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {criticalPoints && criticalPoints.length > 0 && (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={revealVariants}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="mt-8"
        >
          <BMSFCharts criticalPoints={criticalPoints} />
        </motion.div>
      )}
    </div>
  );
}
