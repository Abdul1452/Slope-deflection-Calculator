"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Calculator } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  CalculatorFormData,
  FixedEndMomentResults,
  SlopeDeflectionEquation,
  Span,
} from "@/typings";
import { LOAD_TYPES } from "../utils/loadTypes";
import { Rotations, solveBeam } from "../utils/beamSolver";
import { extractCriticalBMSF, SpanCriticalPoints } from "../utils/criticalBMSF";
import { calculateBMSF } from "../utils/calculateBMSF";
import { calculateReactions } from "../utils/calculateReactions";
import Results from "../components/results";
import SpanInput from "../components/span-inputs";

const initialSpan: Span = {
  length: 0,
  momentOfInertia: 0,
  loadType: LOAD_TYPES.UDL,
  startSupport: "hinged",
  endSupport: "hinged",
  loadMagnitude: 0,
  pointLoadDistances: { a: 0, b: 0 },
};

export default function CalculatePage() {
  const [formData, setFormData] = useState<CalculatorFormData>({
    modulusOfElasticity: 0,
    momentOfInertia: 0,
    numberOfSpans: 0,
    spans: [],
    sinkingSupports: [],
  });
  const [results, setResults] = useState<FixedEndMomentResults[]>([]);
  const [slopeDeflectionEquations, setSlopeDeflectionEquations] = useState<
    SlopeDeflectionEquation[]
  >([]);
  const [rotations, setRotations] = useState<Rotations>({});
  const [solverWarnings, setSolverWarnings] = useState<string[]>([]);
  const [finalMoments, setFinalMoments] = useState<{ [key: string]: number }>(
    {}
  );
  const [reactions, setReactions] = useState<{ [key: string]: number }>({});
  const [criticalPoints, setCriticalPoints] = useState<SpanCriticalPoints[]>(
    []
  );

  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    const isValid = validateForm();
    setIsFormValid(isValid);
  }, [formData]);

  const validateForm = () => {
    // Any number of spans is solvable now that each rotating joint contributes
    // its own unknown, so this only checks that the inputs are physical.
    if (
      formData.modulusOfElasticity <= 0 ||
      formData.momentOfInertia <= 0 ||
      formData.numberOfSpans < 1 ||
      formData.spans.length === 0
    ) {
      return false;
    }

    for (const span of formData.spans) {
      if (
        span.length <= 0 ||
        span.momentOfInertia <= 0 ||
        span.loadMagnitude < 0
      ) {
        return false;
      }
    }

    return true;
  };

  const handleNumberOfSpansChange = (value: number) => {
    const newSpans = Array(value)
      .fill(null)
      .map(() => ({ ...initialSpan }));
    const newSinkingSupports = Array(value + 1).fill(0);

    setFormData((prev) => ({
      ...prev,
      numberOfSpans: value,
      spans: newSpans,
      sinkingSupports: newSinkingSupports,
    }));
  };

  const handleSpanChange = (index: number, span: Span) => {
    setFormData((prev) => ({
      ...prev,
      spans: prev.spans.map((s, i) => (i === index ? span : s)),
    }));
  };

  const handleSinkingSupportChange = (index: number, value: number) => {
    setFormData((prev) => ({
      ...prev,
      sinkingSupports: prev.sinkingSupports.map((s, i) =>
        i === index ? value : s
      ),
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // One pass builds the fixed-end moments, the slope-deflection equations
    // and the joint rotations, so every result below comes from the same
    // system of equations.
    const solution = solveBeam(formData);
    const { moments } = solution;

    const reactions = calculateReactions(formData.spans, moments);

    const {
      results: bmsfResults,
      startReactions,
      startMoments,
    } = calculateBMSF(formData.spans, moments);
    const criticalPoints = extractCriticalBMSF(
      formData.spans,
      bmsfResults,
      startReactions,
      startMoments
    );

    setResults(solution.fixedEndMoments);
    setSlopeDeflectionEquations(solution.equations);
    setRotations(solution.rotations);
    setSolverWarnings(solution.warnings);
    setFinalMoments(moments);
    setReactions(reactions);
    setCriticalPoints(criticalPoints);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-8"
        >
          <Card className="mx-auto max-w-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="p-6">
              <div className="flex items-center space-x-4">
                <Calculator className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Slope Deflection Calculator
                </h1>
              </div>

              <div className="mt-8 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="length">Number of Spans</Label>
                  <Input
                    type="number"
                    value={formData.numberOfSpans}
                    onChange={(e) =>
                      handleNumberOfSpansChange(parseInt(e.target.value) || 0)
                    }
                    min={0}
                    className="bg-white dark:bg-gray-900"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="load">Modulus of Elasticity</Label>
                  <Input
                    type="number"
                    step="any"
                    value={formData.modulusOfElasticity}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        modulusOfElasticity: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="bg-white dark:bg-gray-900"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="elasticity">Moment of Inertia (I)</Label>
                  <Input
                    type="number"
                    step="any"
                    value={formData.momentOfInertia}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        momentOfInertia: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="bg-white dark:bg-gray-900"
                  />
                </div>
                <div className="gap-4 grid grid-cols-2 items-center border border-chart-1 rounded-lg p-4">
                  {formData.sinkingSupports.map((value, index) => (
                    <div key={index}>
                      <label className="block text-sm font-medium mb-1">
                        Sink Support {String.fromCharCode(65 + index)}{" "}
                        <span className="text-chart-1 text-xs">(m)</span>
                      </label>
                      <Input
                        type="number"
                        step="any"
                        value={value}
                        onChange={(e) =>
                          handleSinkingSupportChange(
                            index,
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="bg-white dark:bg-gray-900"
                      />
                    </div>
                  ))}
                </div>
                {formData.spans.map((span, index) => (
                  <div key={index} className="space-y-4">
                    <SpanInput
                      span={span}
                      index={index}
                      onChange={(span) => handleSpanChange(index, span)}
                    />
                  </div>
                ))}

                <Button
                  className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                  disabled={!isFormValid}
                >
                  Calculate
                  <Calculator className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </Card>
          {results.length > 0 && (
            <div className="mt-8 space-y-6">
              <Results
                equations={slopeDeflectionEquations}
                rotations={rotations}
                warnings={solverWarnings}
                finalMoments={finalMoments}
                reactions={reactions}
                criticalPoints={criticalPoints}
                results={results}
              />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
