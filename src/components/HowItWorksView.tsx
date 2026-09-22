import React from "react";
import { CheckCircle2, ShieldCheck, Sparkles, Sliders, Cpu, Compass, Flower2, Heart } from "lucide-react";

export const HowItWorksView: React.FC = () => {
  return (
    <div className="max-w-4xl w-full mx-auto space-y-8">
      {/* Hero */}
      <div className="bg-white p-8 rounded-3xl border border-[#E8E4D9] shadow-xs space-y-3 text-center">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-[#2D4F1E] text-white flex items-center justify-center shadow-xs">
          <Compass className="w-6 h-6" />
        </div>
        <h2 className="font-serif font-bold text-2xl sm:text-3xl text-[#2D2D2D]">
          How Bloomix Works
        </h2>
        <p className="text-sm text-[#2D2D2D]/70 max-w-xl mx-auto leading-relaxed">
          Bloomix merges classical European botanical floristry rules with a deterministic mathematical scoring engine and Gemini AI synthesis.
        </p>
      </div>

      {/* 4 Pillars of Deterministic Scoring */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#2D4F1E]" />
          <h3 className="font-serif font-bold text-xl text-[#2D2D2D]">
            The 4 Deterministic Scoring Pillars
          </h3>
        </div>
        <p className="text-xs text-[#2D2D2D]/60">
          Scores are 100% mathematical, instantaneous, and strictly reproducible. AI does not hallucinate scores.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-[#E8E4D9] shadow-xs space-y-2">
            <span className="text-xs uppercase font-bold text-[#2D4F1E] tracking-wider">Pillar 1</span>
            <h4 className="font-serif font-bold text-base text-[#2D2D2D]">Color Harmony (25%)</h4>
            <p className="text-xs text-[#2D2D2D]/70 leading-relaxed">
              Evaluates hue angles, color temperature balance (warm vs. cool), and saturation contrasts based on itten color wheel harmonies.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E8E4D9] shadow-xs space-y-2">
            <span className="text-xs uppercase font-bold text-[#2D4F1E] tracking-wider">Pillar 2</span>
            <h4 className="font-serif font-bold text-base text-[#2D2D2D]">Botanical Compatibility (25%)</h4>
            <p className="text-xs text-[#2D2D2D]/70 leading-relaxed">
              Analyzes physical florist proportions: focal blooms, secondary accents, filler clouds, and foliage framing for structural equilibrium.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E8E4D9] shadow-xs space-y-2">
            <span className="text-xs uppercase font-bold text-[#2D4F1E] tracking-wider">Pillar 3</span>
            <h4 className="font-serif font-bold text-base text-[#2D2D2D]">Style Consistency (25%)</h4>
            <p className="text-xs text-[#2D2D2D]/70 leading-relaxed">
              Checks whether the selected flowers, foliage scale, and geometry match the chosen aesthetic style (Romantic, Minimal, Luxury, Rustic, etc.).
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E8E4D9] shadow-xs space-y-2">
            <span className="text-xs uppercase font-bold text-[#2D4F1E] tracking-wider">Pillar 4</span>
            <h4 className="font-serif font-bold text-base text-[#2D2D2D]">Occasion Suitability (25%)</h4>
            <p className="text-xs text-[#2D2D2D]/70 leading-relaxed">
              Verifies cultural symbolism, floriography meanings, and occasion traditions (Valentine's, Birthday, Get Well, Graduation, etc.).
            </p>
          </div>
        </div>
      </div>

      {/* Role of Gemini AI */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8E4D9] shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#2D4F1E]" />
          <h3 className="font-serif font-bold text-xl text-[#2D2D2D]">
            Role of Gemini AI in Bloomix
          </h3>
        </div>

        <p className="text-xs sm:text-sm text-[#2D2D2D]/75 leading-relaxed">
          Gemini acts as your personal master florist consultant. It takes the deterministic score, your specific stems, and your chosen occasion to craft nuanced advice, emotional card messages, and intelligent substitution recommendations.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-[#FAF8F3] border border-[#E8E4D9]">
            <span className="text-xs font-bold text-[#2D2D2D] block mb-1">Explain & Advise</span>
            <p className="text-[11px] text-[#2D2D2D]/60">Translates mathematical scores into poetic, easy-to-understand florist insights.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#FAF8F3] border border-[#E8E4D9]">
            <span className="text-xs font-bold text-[#2D2D2D] block mb-1">Smart Substitutions</span>
            <p className="text-[11px] text-[#2D2D2D]/60">Suggests seasonal botanical alternatives to fix score issues.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#FAF8F3] border border-[#E8E4D9]">
            <span className="text-xs font-bold text-[#2D2D2D] block mb-1">Occasion Poetry</span>
            <p className="text-[11px] text-[#2D2D2D]/60">Composes bespoke gift card messages tailored to your exact blooms.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AboutView: React.FC = () => {
  return (
    <div className="max-w-2xl w-full mx-auto space-y-6">
      {/* Main About Card */}
      <div className="bg-white p-7 sm:p-10 rounded-3xl border border-[#E8E4D9] shadow-xs space-y-6">
        <div className="space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-[#2D4F1E] text-white flex items-center justify-center shadow-xs mb-3">
            <Flower2 className="w-5 h-5" />
          </div>
          <h2 className="font-serif font-bold text-2xl sm:text-3xl text-[#2D2D2D] tracking-tight">
            About Bloomix
          </h2>
          <p className="text-sm sm:text-base font-serif text-[#2D4F1E] font-medium leading-relaxed">
            A digital florist studio designed to make bouquet creation simple, visual, and personal.
          </p>
        </div>

        <div className="space-y-4 text-sm sm:text-base text-[#2D2D2D]/80 leading-relaxed pt-2 border-t border-[#E8E4D9]/80">
          <p>
            Bloomix was created from a simple idea: choosing flowers can be difficult when you do not know which flowers, colors, or combinations work well together.
          </p>
          <p>
            Bloomix lets customers choose an occasion, select a style and flowers, arrange their bouquet, and receive a clear score with helpful AI suggestions.
          </p>
          <p>
            The goal is simple: help anyone create a thoughtful bouquet with more confidence, while keeping the final decision in their hands.
          </p>
        </div>
      </div>

      {/* Creator Section */}
      <div className="bg-[#FAF8F3] p-6 sm:p-8 rounded-3xl border border-[#E8E4D9] space-y-3">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-[#2D4F1E]" />
          <h3 className="font-serif font-bold text-lg text-[#2D2D2D]">
            Built by the Creator
          </h3>
        </div>

        <div className="space-y-2 text-xs sm:text-sm text-[#2D2D2D]/75 leading-relaxed">
          <p className="font-serif font-semibold text-[#2D4F1E]">
            The Bloomix Founder &amp; Developer · Vietnam
          </p>
          <p>
            Bloomix is an independent project exploring how interactive design, floral knowledge, and AI can make flower selection more accessible and personal.
          </p>
        </div>
      </div>
    </div>
  );
};
