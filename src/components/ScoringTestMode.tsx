import React, { useState, useMemo } from "react";
import { OFFICIAL_TEST_CASES, type PresetBouquet } from "../data/presets.ts";
import { scoreBouquet, flowersMap, occasionsList, stylesList } from "../engine/bouquetScorer.ts";
import type { BouquetScoreResult } from "../engine/types.ts";
import {
  FlaskConical,
  Play,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ScoringTestModeProps {
  onLoadTestCase: (testCase: PresetBouquet, autoEvaluate?: boolean) => void;
  currentScoreResult?: BouquetScoreResult | null;
}

export const ScoringTestMode: React.FC<ScoringTestModeProps> = ({
  onLoadTestCase,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("test-case-1");

  // Pre-calculate deterministic results for all 4 test cases
  const testResults = useMemo(() => {
    return OFFICIAL_TEST_CASES.map((tc) => {
      const result = scoreBouquet(tc.items, tc.occasionId, tc.styleId);
      const occasionObj = occasionsList.occasions.find((o) => o.id === tc.occasionId);
      const styleObj = stylesList.styles.find((s) => s.id === tc.styleId);
      return {
        testCase: tc,
        result,
        occasionObj,
        styleObj,
      };
    });
  }, []);

  const activeTest = testResults.find((t) => t.testCase.id === selectedCaseId) || testResults[0];

  const getScoreBadgeClass = (score: number) => {
    if (score >= 90) return "bg-[#2D4F1E]/15 text-[#2D4F1E] border-[#2D4F1E]/30";
    if (score >= 80) return "bg-[#3D6B28]/15 text-[#3D6B28] border-[#3D6B28]/30";
    if (score >= 70) return "bg-[#8B5A2B]/15 text-[#8B5A2B] border-[#8B5A2B]/30";
    return "bg-[#8B3A3A]/15 text-[#8B3A3A] border-[#8B3A3A]/30";
  };

  return (
    <div
      className="bg-[#FAF8F3] rounded-2xl border border-[#E0D8C8] p-4 sm:p-5 shadow-xs space-y-4"
      id="scoring-test-suite-panel"
    >
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#2D4F1E] text-[#FDFCF9]">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-base font-bold text-[#2D2D2D]">
                Scoring Engine Test Mode
              </h3>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#2D4F1E]/10 text-[#2D4F1E] border border-[#2D4F1E]/20">
                Deterministic Audit
              </span>
            </div>
            <p className="text-xs text-[#2D2D2D]/70">
              Verify the 4 official benchmark test cases against the deterministic math engine.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs text-[#2D4F1E] hover:text-[#233F17] font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2D4F1E]/30 bg-white hover:bg-[#F3EFE6] transition-colors cursor-pointer self-start sm:self-auto"
        >
          <span>{isOpen ? "Collapse Suite" : "View Comparison Matrix"}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* 4 Test Case Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {testResults.map(({ testCase, result }) => {
          const isSelected = testCase.id === selectedCaseId;
          const scoreClass = getScoreBadgeClass(result.overall);

          return (
            <div
              key={testCase.id}
              id={`test-case-card-${testCase.id}`}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2.5 ${
                isSelected
                  ? "bg-white border-[#2D4F1E] ring-2 ring-[#2D4F1E]/20 shadow-xs"
                  : "bg-[#FAF8F3] border-[#E8E4D9] hover:bg-white hover:border-[#2D4F1E]/40"
              }`}
              onClick={() => setSelectedCaseId(testCase.id)}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-serif font-bold text-xs text-[#2D2D2D]">
                    {testCase.name}
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${scoreClass}`}>
                    {result.overall}/100
                  </span>
                </div>
                <p className="text-[11px] text-[#2D2D2D]/70 line-clamp-2 leading-relaxed">
                  {testCase.subtitle}
                </p>
              </div>

              <div className="pt-2 border-t border-[#E8E4D9] flex items-center justify-between text-[11px]">
                <span className="text-[#2D2D2D]/60 font-medium">
                  {result.rating.label}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLoadTestCase(testCase, true);
                  }}
                  className="inline-flex items-center gap-1 text-[#2D4F1E] font-semibold hover:underline cursor-pointer"
                >
                  <Play className="w-3 h-3" />
                  <span>Evaluate</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Test Case In-Depth Breakdown */}
      {activeTest && (
        <div className="p-4 rounded-xl bg-white border border-[#E8E4D9] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8E4D9] pb-3">
            <div>
              <div className="font-serif font-bold text-sm text-[#2D2D2D] flex items-center gap-2">
                <span>{activeTest.testCase.name}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${getScoreBadgeClass(activeTest.result.overall)}`}>
                  Overall Score: {activeTest.result.overall}/100
                </span>
              </div>
              <p className="text-xs text-[#2D2D2D]/70 mt-0.5">
                {activeTest.testCase.expectedBehavior}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onLoadTestCase(activeTest.testCase, true)}
              className="px-3.5 py-1.5 rounded-lg bg-[#2D4F1E] hover:bg-[#233F17] text-white font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto shadow-xs"
            >
              <span>Load into Builder & AI Advisor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Subscore pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-[#FAF8F3] border border-[#E8E4D9]">
              <div className="text-[10px] text-[#2D2D2D]/60 font-medium uppercase">Color (25%)</div>
              <div className="font-serif font-bold text-sm text-[#2D2D2D]">
                {activeTest.result.color.score}/100
              </div>
              <div className="text-[10px] text-[#2D2D2D]/60">
                {activeTest.result.color.issues.length === 0 ? "No issues" : `${activeTest.result.color.issues.length} note(s)`}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-[#FAF8F3] border border-[#E8E4D9]">
              <div className="text-[10px] text-[#2D2D2D]/60 font-medium uppercase">Compatibility (30%)</div>
              <div className="font-serif font-bold text-sm text-[#2D2D2D]">
                {activeTest.result.compatibility.score}/100
              </div>
              <div className="text-[10px] text-[#2D2D2D]/60">
                {activeTest.result.compatibility.issues.length === 0 ? "No issues" : `${activeTest.result.compatibility.issues.length} note(s)`}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-[#FAF8F3] border border-[#E8E4D9]">
              <div className="text-[10px] text-[#2D2D2D]/60 font-medium uppercase">Style (20%)</div>
              <div className="font-serif font-bold text-sm text-[#2D2D2D]">
                {activeTest.result.style.score}/100
              </div>
              <div className="text-[10px] text-[#2D2D2D]/60">
                {activeTest.result.style.issues.length === 0 ? "No issues" : `${activeTest.result.style.issues.length} note(s)`}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-[#FAF8F3] border border-[#E8E4D9]">
              <div className="text-[10px] text-[#2D2D2D]/60 font-medium uppercase">Occasion (25%)</div>
              <div className="font-serif font-bold text-sm text-[#2D2D2D]">
                {activeTest.result.occasion.score}/100
              </div>
              <div className="text-[10px] text-[#2D2D2D]/60">
                {activeTest.result.occasion.issues.length === 0 ? "No issues" : `${activeTest.result.occasion.issues.length} note(s)`}
              </div>
            </div>
          </div>

          {/* Mathematical verification note */}
          <div className="text-[11px] text-[#2D2D2D]/70 bg-[#FAF8F3] p-2.5 rounded-lg border border-[#E8E4D9] flex items-center justify-between flex-wrap gap-2">
            <span>
              <strong>Formula Verification:</strong> ({activeTest.result.color.score} × 0.25) + ({activeTest.result.compatibility.score} × 0.30) + ({activeTest.result.style.score} × 0.20) + ({activeTest.result.occasion.score} × 0.25) = <strong className="text-[#2D4F1E]">{activeTest.result.overall}</strong>
            </span>
            <span className="text-[#2D4F1E] font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              100% Deterministic Engine
            </span>
          </div>
        </div>
      )}

      {/* Expanded Side-by-Side Comparison Matrix */}
      {isOpen && (
        <div className="overflow-x-auto rounded-xl border border-[#E8E4D9] bg-white">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF8F3] border-b border-[#E8E4D9] text-[#2D2D2D]/80">
                <th className="p-3 font-serif font-bold">Benchmark Case</th>
                <th className="p-3 font-semibold text-center">Color (25%)</th>
                <th className="p-3 font-semibold text-center">Compatibility (30%)</th>
                <th className="p-3 font-semibold text-center">Style (20%)</th>
                <th className="p-3 font-semibold text-center">Occasion (25%)</th>
                <th className="p-3 font-serif font-bold text-center">Overall Score</th>
                <th className="p-3 font-semibold">Diagnostic Summary</th>
                <th className="p-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E4D9]">
              {testResults.map(({ testCase, result }) => {
                const allIssues = [
                  ...result.color.issues,
                  ...result.compatibility.issues,
                  ...result.style.issues,
                  ...result.occasion.issues,
                ];

                return (
                  <tr key={testCase.id} className="hover:bg-[#FAF8F3]/50">
                    <td className="p-3 font-medium text-[#2D2D2D]">
                      <div className="font-bold">{testCase.name}</div>
                      <div className="text-[10px] text-[#2D2D2D]/60">{testCase.subtitle}</div>
                    </td>
                    <td className="p-3 text-center font-mono">{result.color.score}</td>
                    <td className="p-3 text-center font-mono">{result.compatibility.score}</td>
                    <td className="p-3 text-center font-mono">{result.style.score}</td>
                    <td className="p-3 text-center font-mono">{result.occasion.score}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-md font-bold font-mono ${getScoreBadgeClass(result.overall)}`}>
                        {result.overall}
                      </span>
                    </td>
                    <td className="p-3 max-w-xs text-[11px] text-[#2D2D2D]/75">
                      {allIssues.length === 0 ? (
                        <span className="text-[#2D4F1E] font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> High harmony
                        </span>
                      ) : (
                        <div className="space-y-0.5">
                          {allIssues.slice(0, 2).map((iss, i) => (
                            <div key={i} className="line-clamp-1 text-[10px]">
                              • {iss.message}
                            </div>
                          ))}
                          {allIssues.length > 2 && (
                            <div className="text-[9px] text-[#2D2D2D]/50">
                              +{allIssues.length - 2} more issue(s)
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => onLoadTestCase(testCase, true)}
                        className="px-2.5 py-1 rounded bg-[#2D4F1E] hover:bg-[#233F17] text-white text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        Load
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
