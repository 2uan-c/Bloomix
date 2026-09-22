import React, { useState, useMemo } from "react";
import type { Flower } from "../engine/types.ts";
import { FlowerBotanicalImage } from "./FlowerBotanicalImage.tsx";
import { COLOR_HEX_MAP, ROLE_DETAILS } from "../utils/flowerAssets.ts";
import { Search, BookOpen, Filter, Sparkles, Heart } from "lucide-react";

interface FlowerGuideViewProps {
  flowers: Flower[];
  onSelectFlowerToStudio?: (flowerId: string) => void;
}

export const FlowerGuideView: React.FC<FlowerGuideViewProps> = ({
  flowers,
  onSelectFlowerToStudio,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedFlower, setSelectedFlower] = useState<Flower | null>(flowers[0] || null);

  const filtered = useMemo(() => {
    return flowers.filter((f) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        f.name.toLowerCase().includes(q) ||
        f.displayName.toLowerCase().includes(q) ||
        f.meaning.some((m) => m.toLowerCase().includes(q));

      const matchRole = selectedRole === "all" || f.roles.includes(selectedRole as any);
      return matchSearch && matchRole;
    });
  }, [flowers, searchTerm, selectedRole]);

  return (
    <div className="max-w-6xl w-full mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8E4D9] shadow-xs space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#2D4F1E] text-white flex items-center justify-center">
            <BookOpen className="w-4 h-4" />
          </div>
          <h2 className="font-serif font-bold text-2xl text-[#2D2D2D]">
            Botanical Flower Encyclopedia & Meaning Guide
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-[#2D2D2D]/70 max-w-2xl">
          Explore flower languages (floriography), seasonal palettes, structural roles in bouquet architecture, and occasion symbolism.
        </p>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-2xl border border-[#E8E4D9] flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2D2D2D]/40" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search flower name or symbolism..."
            className="w-full pl-10 pr-4 py-2 bg-[#FAF8F3] border border-[#E8E4D9] rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#2D4F1E]"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
          {["all", "focal", "secondary", "filler", "foliage"].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setSelectedRole(r)}
              className={`text-xs px-3 py-1.5 rounded-xl capitalize font-medium transition-colors cursor-pointer ${
                selectedRole === r
                  ? "bg-[#2D4F1E] text-white font-bold"
                  : "bg-[#FAF8F3] text-[#2D2D2D]/75 border border-[#E8E4D9] hover:bg-[#F3EFE6]"
              }`}
            >
              {r === "all" ? "All Roles" : r}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Catalog List + Detailed Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Species Grid (7 cols) */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[700px] overflow-y-auto pr-1">
          {filtered.map((flower) => {
            const isSelected = selectedFlower?.id === flower.id;
            const primaryRole = flower.roles[0];
            const roleDetail = ROLE_DETAILS[primaryRole];

            return (
              <div
                key={flower.id}
                onClick={() => setSelectedFlower(flower)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                  isSelected
                    ? "bg-[#F4F9F1] border-[#2D4F1E] ring-2 ring-[#2D4F1E]/20 shadow-xs"
                    : "bg-white border-[#E8E4D9] hover:border-[#2D4F1E]/40 hover:bg-[#FAF8F3]"
                }`}
              >
                <div className="w-14 h-14 rounded-xl overflow-hidden border border-[#D6CFC0] bg-[#F0EEE6] shrink-0 shadow-2xs">
                  <FlowerBotanicalImage
                    flowerId={flower.id}
                    color={flower.colors[0]}
                    size="sm"
                    catalogBackdrop={true}
                    className="w-full h-full"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 justify-between">
                    <h4 className="font-serif font-bold text-sm text-[#2D2D2D] truncate">
                      {flower.name}
                    </h4>
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-black/5 text-[#2D2D2D]/70">
                      {roleDetail?.label || primaryRole}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#2D2D2D]/60 italic block truncate">
                    {flower.displayName}
                  </span>
                  <p className="text-[11px] text-[#2D4F1E] mt-0.5 capitalize truncate">
                    {flower.meaning.join(" • ")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Detailed Species Dossier (5 cols) */}
        {selectedFlower && (
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-[#E8E4D9] shadow-xs space-y-5 sticky top-24">
            {/* Hero Image */}
            <div className="relative w-full h-48 rounded-2xl overflow-hidden border border-[#E8E4D9] shadow-inner">
              <FlowerBotanicalImage
                flowerId={selectedFlower.id}
                color={selectedFlower.colors[0]}
                size="hero"
                catalogBackdrop={true}
                className="w-full h-full"
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md border border-[#E8E4D9] text-xs font-bold text-[#2D4F1E]">
                {selectedFlower.roles.map((r) => r.toUpperCase()).join(" / ")}
              </div>
            </div>

            {/* Title & Meaning */}
            <div>
              <div className="flex items-baseline justify-between">
                <h3 className="font-serif font-bold text-2xl text-[#2D2D2D]">
                  {selectedFlower.name}
                </h3>
                <span className="text-sm text-[#2D2D2D]/60 italic font-serif">
                  {selectedFlower.displayName}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5">
                {selectedFlower.meaning.map((m) => (
                  <span
                    key={m}
                    className="text-xs px-2.5 py-0.5 rounded-full bg-[#FAF8F3] border border-[#E8E4D9] text-[#2D2D2D] font-medium capitalize"
                  >
                    ✦ {m}
                  </span>
                ))}
              </div>
            </div>

            {/* Color Palette & Visual Weight */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#E8E4D9]">
              <div className="p-3 rounded-xl bg-[#FAF8F3] border border-[#E8E4D9]">
                <span className="text-[10px] text-[#2D2D2D]/60 uppercase font-semibold block mb-1.5">
                  Available Colors
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {selectedFlower.colors.map((c) => (
                    <span
                      key={c}
                      className="w-4 h-4 rounded-full border border-black/15 shadow-2xs"
                      style={{ backgroundColor: COLOR_HEX_MAP[c]?.bg || "#ccc" }}
                      title={c}
                    />
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#FAF8F3] border border-[#E8E4D9]">
                <span className="text-[10px] text-[#2D2D2D]/60 uppercase font-semibold block mb-1">
                  Visual Weight
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-[#2D4F1E]">
                    {selectedFlower.visual.visualWeight}
                  </span>
                  <span className="text-xs text-[#2D2D2D]/50">/ 10 density</span>
                </div>
              </div>
            </div>

            {/* Occasion Suitability Highlights */}
            <div>
              <span className="text-xs font-bold text-[#2D2D2D] uppercase tracking-wider block mb-2">
                Top Occasion Matches
              </span>
              <div className="space-y-1.5">
                {Object.entries(selectedFlower.occasions)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .slice(0, 4)
                  .map(([occId, score]) => (
                    <div
                      key={occId}
                      className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-[#FAF8F3]"
                    >
                      <span className="capitalize text-[#2D2D2D] font-medium">{occId}</span>
                      <span className="font-bold text-[#2D4F1E]">
                        {Math.round((score as number) * 100)}% match
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
