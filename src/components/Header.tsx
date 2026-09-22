import React, { useState } from "react";
import {
  Flower2,
  RotateCcw,
  Sparkles,
  BookmarkCheck,
  Compass,
  BookOpen,
  Info,
  Menu,
  X,
  Palette,
} from "lucide-react";
import { getSavedBouquets } from "../utils/savedBouquetsStorage.ts";

export type AppNavView =
  | "builder"
  | "evaluation"
  | "my-bouquets"
  | "inspiration"
  | "flower-guide"
  | "how-it-works"
  | "about";

interface HeaderProps {
  onReset: () => void;
  activeView: AppNavView;
  setActiveView: (view: AppNavView) => void;
  hasBouquet: boolean;
  score: number;
}

export const Header: React.FC<HeaderProps> = ({
  onReset,
  activeView,
  setActiveView,
  hasBouquet,
  score,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const savedCount = getSavedBouquets().length;

  const navItems = [
    { id: "builder" as AppNavView, label: "Studio", icon: Palette },
    {
      id: "my-bouquets" as AppNavView,
      label: "My Bouquets",
      icon: BookmarkCheck,
      badge: savedCount > 0 ? savedCount : undefined,
    },
    { id: "inspiration" as AppNavView, label: "Inspiration", icon: Sparkles },
    { id: "flower-guide" as AppNavView, label: "Flower Guide", icon: BookOpen },
    { id: "how-it-works" as AppNavView, label: "How It Works", icon: Compass },
    { id: "about" as AppNavView, label: "About", icon: Info },
  ];

  const handleNavClick = (view: AppNavView) => {
    setActiveView(view);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#FDFCF9]/95 backdrop-blur-md border-b border-[#E8E4D9] transition-colors">
      <div className="max-w-[1720px] w-full mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => handleNavClick("builder")}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#2D4F1E] text-[#FDFCF9] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <Flower2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-xl text-[#2D2D2D] tracking-tight">
                Bloomix
              </span>
              <span className="text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-[#2D4F1E]/10 text-[#2D4F1E] border border-[#2D4F1E]/20">
                Artistic Floral Studio
              </span>
            </div>
            <p className="text-xs text-[#2D2D2D]/70 hidden md:block font-serif italic">
              "Create a bouquet you'll actually want to give."
            </p>
          </div>
        </div>

        {/* Center Desktop Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#F4EFE6] p-1 rounded-2xl border border-[#E8E4D9]">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`text-xs font-serif font-bold px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? "bg-white text-[#2D4F1E] shadow-xs"
                    : "text-[#2D2D2D]/70 hover:text-[#2D2D2D] hover:bg-white/50"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="px-1.5 py-0.2 bg-[#2D4F1E] text-white text-[9px] font-sans font-bold rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* Evaluation Quick Button */}
          {hasBouquet && (
            <button
              type="button"
              id="header-score-btn"
              onClick={() => handleNavClick("evaluation")}
              className={`text-xs font-serif font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer border ${
                activeView === "evaluation"
                  ? "bg-[#2D4F1E] text-white border-[#2D4F1E] shadow-xs"
                  : "bg-white text-[#2D4F1E] border-[#2D4F1E]/30 hover:bg-[#F4F9F1]"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Score & Insights</span>
              <span className="w-5 h-5 rounded-full bg-[#2D4F1E] text-white text-[10px] flex items-center justify-center font-bold font-sans">
                {score}
              </span>
            </button>
          )}

          {/* Reset button */}
          <button
            type="button"
            onClick={onReset}
            title="Reset Studio"
            className="p-2 rounded-xl text-[#2D2D2D]/60 hover:text-[#2D2D2D] hover:bg-[#F4EFE6] transition-colors cursor-pointer border border-transparent hover:border-[#E8E4D9]"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Mobile Menu Trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-[#2D2D2D] bg-[#F4EFE6] border border-[#E8E4D9] cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-[#E8E4D9] px-4 py-3 space-y-1 shadow-lg animate-in slide-in-from-top-2 duration-200">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full text-left text-xs font-serif font-bold p-3 rounded-xl flex items-center justify-between transition-colors ${
                  isActive
                    ? "bg-[#F4F9F1] text-[#2D4F1E]"
                    : "text-[#2D2D2D] hover:bg-[#FAF8F3]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 text-[#2D4F1E]" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-2 py-0.5 bg-[#2D4F1E] text-white text-[10px] font-sans font-bold rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
