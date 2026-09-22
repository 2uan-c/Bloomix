import React, { useState, useEffect, useRef } from "react";
import type {
  BouquetItem,
  BouquetScoreResult,
  ChatMessage,
  Flower,
  GeminiExplanationResponse,
  Occasion,
  BouquetStyle,
} from "../engine/types.ts";
import { fetchBouquetExplanation, sendChatMessage } from "../services/api.ts";
import {
  Sparkles,
  Bot,
  User,
  Send,
  RefreshCw,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

interface GeminiAdvisorProps {
  bouquet: BouquetItem[];
  flowersMap: Map<string, Flower>;
  selectedOccasion: Occasion;
  selectedStyle: BouquetStyle;
  scoreResult: BouquetScoreResult;
  onApplySubstitution?: (originalId: string, suggestedId: string) => void;
}

export const GeminiAdvisor: React.FC<GeminiAdvisorProps> = ({
  bouquet,
  flowersMap,
  selectedOccasion,
  selectedStyle,
  scoreResult,
  onApplySubstitution,
}) => {
  const [explanation, setExplanation] = useState<GeminiExplanationResponse | null>(null);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [explanationError, setExplanationError] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "initial",
      sender: "bloomix",
      text: `Hello! I'm your Bloomix AI Floral Consultant. Your bouquet scored **${scoreResult.overall}/100** for **${selectedOccasion.name}** in a **${selectedStyle.name}** style. Feel free to ask me any questions on flower symbolism, composition, or how to tweak your arrangement!`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const advisorAbortRef = useRef<AbortController | null>(null);

  // Clean up any in-flight requests on unmount
  useEffect(() => {
    return () => {
      if (advisorAbortRef.current) {
        advisorAbortRef.current.abort();
      }
    };
  }, []);

  // Prepare payload for Gemini
  const getPayload = () => {
    return {
      bouquet: bouquet.map((b) => {
        const flower = flowersMap.get(b.flowerId);
        return {
          flowerId: b.flowerId,
          name: flower?.name || b.flowerId,
          quantity: b.quantity,
          role: flower?.roles || [],
          color: b.selectedColor || flower?.colors[0] || "natural",
        };
      }),
      selectedStyle: {
        id: selectedStyle.id,
        name: selectedStyle.name,
        description: selectedStyle.description,
      },
      selectedOccasion: {
        id: selectedOccasion.id,
        name: selectedOccasion.name,
        displayName: selectedOccasion.displayName,
      },
      scoringResult: scoreResult,
    };
  };

  // Load explanation ONLY on explicit user trigger
  const loadExplanation = async () => {
    if (bouquet.length === 0 || isLoadingExplanation) return;
    setIsLoadingExplanation(true);
    setExplanationError(null);

    if (advisorAbortRef.current) {
      advisorAbortRef.current.abort();
    }
    const controller = new AbortController();
    advisorAbortRef.current = controller;

    try {
      const payload = getPayload();
      const result = await fetchBouquetExplanation(payload, controller.signal);
      setExplanation(result);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      const message = err instanceof Error ? err.message : "Failed to load explanation";
      setExplanationError(message);
    } finally {
      setIsLoadingExplanation(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSendingMessage]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputPrompt;
    if (!query.trim() || isSendingMessage) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt("");
    setIsSendingMessage(true);

    try {
      const history = messages.map((m) => ({
        role: m.sender === "user" ? ("user" as const) : ("model" as const),
        text: m.text,
      }));

      const context = getPayload();
      const response = await sendChatMessage(query, history, context);

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bloomix",
        text: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: "bloomix",
          text: "I experienced a brief network issue connecting to the AI service. The deterministic score of your bouquet remains authoritative. Please feel free to ask again!",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Pre-filled question prompt chips matching user requirements
  const promptChips = [
    "Why did my bouquet get this score?",
    "What flower should I replace?",
    `Is this suitable for ${selectedOccasion.name}?`,
    `How can I make this bouquet more ${selectedStyle.name}?`,
  ];

  return (
    <div className="space-y-6" id="gemini-advisor-section">
      {/* 1. What Bloomix Thinks Section */}
      <div className="bg-white rounded-2xl border border-[#E8E4D9] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E8E4D9] pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#FAF8F3] border border-[#E8E4D9] text-[#8B3A3A]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#2D2D2D]">
                Bloomix AI Advisor
              </h3>
              <p className="text-xs text-[#2D2D2D]/60">
                Floristry analysis & design consultation grounded in deterministic evaluation
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadExplanation}
            disabled={isLoadingExplanation}
            className="text-xs text-[#2D2D2D]/70 hover:text-[#2D2D2D] flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E8E4D9] hover:bg-[#FAF8F3] transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isLoadingExplanation ? "animate-spin text-[#2D4F1E]" : ""}`} />
            <span>Re-analyze</span>
          </button>
        </div>

        {isLoadingExplanation ? (
          <div className="py-8 text-center space-y-3">
            <div className="inline-block animate-spin text-2xl">🌸</div>
            <p className="text-xs text-[#2D2D2D]/60">
              Bloomix is reviewing your bouquet against floristry design principles...
            </p>
          </div>
        ) : explanationError ? (
          <div className="p-4 rounded-xl bg-[#FAF6F0] border border-[#EBDCCB] text-[#8B5A2B] text-xs space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4" />
              <span>AI Analysis Note</span>
            </div>
            <p>
              Your authoritative scoring result is {scoreResult.overall}/100. AI commentary encountered a brief delay. Click Re-analyze to try again.
            </p>
          </div>
        ) : explanation ? (
          <div className="space-y-4">
            {/* Summary narrative */}
            <p className="text-xs sm:text-sm text-[#2D2D2D]/85 leading-relaxed bg-[#FAF8F3] p-4 rounded-xl border border-[#E8E4D9]">
              {explanation.summary}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Strengths */}
              <div className="p-4 rounded-xl bg-[#F5F8F2] border border-[#D5E4CE] space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#2D4F1E]">
                  <CheckCircle className="w-4 h-4 text-[#2D4F1E]" />
                  <span>Key Strengths</span>
                </div>
                <ul className="space-y-1.5 text-xs text-[#2D2D2D]/80">
                  {explanation.strengths.map((str, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-[#2D4F1E] font-bold">•</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Potential Improvements */}
              <div className="p-4 rounded-xl bg-[#FAF6F0] border border-[#EBDCCB] space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#8B5A2B]">
                  <TrendingUp className="w-4 h-4 text-[#8B5A2B]" />
                  <span>Practical Improvements</span>
                </div>
                <ul className="space-y-1.5 text-xs text-[#2D2D2D]/80">
                  {explanation.improvements.map((imp, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-[#8B5A2B] font-bold">•</span>
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Structured Recommendations (KEEP, ADD, REMOVE, REPLACE) */}
            {explanation.recommendations && explanation.recommendations.length > 0 && (
              <div className="p-4 rounded-xl bg-[#FAF8F3] border border-[#E8E4D9] space-y-3">
                <div className="font-serif text-xs font-bold text-[#2D2D2D] flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#8B3A3A]" />
                    <span>Florist Action Recommendations</span>
                  </div>
                  <span className="text-[10px] font-normal text-[#2D2D2D]/60 bg-white px-2 py-0.5 rounded border border-[#E8E4D9]">
                    Structured Format
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {explanation.recommendations.map((rec, idx) => {
                    const actionStyles: Record<string, { badge: string; bg: string; border: string }> = {
                      KEEP: {
                        badge: "bg-[#EAF3E7] text-[#2D4F1E] border-[#C8DFBF]",
                        bg: "bg-white",
                        border: "border-[#E8E4D9]",
                      },
                      ADD: {
                        badge: "bg-[#E8F1F5] text-[#1B4B66] border-[#C5DCED]",
                        bg: "bg-white",
                        border: "border-[#E8E4D9]",
                      },
                      REMOVE: {
                        badge: "bg-[#FBEBEB] text-[#9E2A2B] border-[#F2C5C5]",
                        bg: "bg-white",
                        border: "border-[#E8E4D9]",
                      },
                      REPLACE: {
                        badge: "bg-[#FEF5E7] text-[#8B5A2B] border-[#F8DCB8]",
                        bg: "bg-white",
                        border: "border-[#E8E4D9]",
                      },
                    };

                    const style = actionStyles[rec.action] || actionStyles.KEEP;

                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg ${style.bg} border ${style.border} space-y-1.5 shadow-xs`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded border ${style.badge}`}
                          >
                            {rec.action}
                          </span>
                          <span className="font-medium text-xs text-[#2D2D2D] truncate">
                            {rec.flowerName}
                            {rec.targetFlowerName ? ` → ${rec.targetFlowerName}` : ""}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#2D2D2D]/75 leading-relaxed">
                          {rec.reason}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Substitutions if any */}
            {explanation.substitutions && explanation.substitutions.length > 0 && (
              <div className="p-4 rounded-xl bg-[#FAF8F3] border border-[#E8E4D9] space-y-2.5">
                <div className="font-serif text-xs font-bold text-[#2D2D2D] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#8B3A3A]" />
                  <span>Recommended Flower Substitutions</span>
                </div>
                <div className="space-y-2">
                  {explanation.substitutions.map((sub, i) => {
                    const origFlower = Array.from(flowersMap.values()).find(
                      (f) => f.name.toLowerCase() === sub.originalFlower.toLowerCase()
                    );
                    const suggFlower = Array.from(flowersMap.values()).find(
                      (f) => f.name.toLowerCase() === sub.suggestedFlower.toLowerCase()
                    );

                    return (
                      <div
                        key={i}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-white border border-[#E8E4D9] gap-2 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="font-medium text-[#2D2D2D] flex items-center gap-1.5">
                            <span className="line-through text-[#2D2D2D]/40">{sub.originalFlower}</span>
                            <ArrowRight className="w-3 h-3 text-[#2D2D2D]/40" />
                            <span className="text-[#2D4F1E] font-bold">{sub.suggestedFlower}</span>
                          </div>
                          <p className="text-[11px] text-[#2D2D2D]/65">{sub.reason}</p>
                        </div>

                        {onApplySubstitution && origFlower && suggFlower && (
                          <button
                            type="button"
                            onClick={() => onApplySubstitution(origFlower.id, suggFlower.id)}
                            className="px-3 py-1.5 rounded-lg bg-[#2D4F1E] hover:bg-[#233F17] text-white font-medium text-[11px] transition-colors self-start sm:self-auto cursor-pointer shadow-xs"
                          >
                            Apply Substitution
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-[#FAF8F3] border border-[#E8E4D9] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5 text-center sm:text-left">
              <span className="font-serif font-bold text-[#2D2D2D] block">
                Florist AI Insights
              </span>
              <span className="text-[#2D2D2D]/60 text-[11px]">
                Click below to receive detailed strengths, improvements, and botanical tips tailored to your bouquet.
              </span>
            </div>
            <button
              type="button"
              onClick={loadExplanation}
              disabled={isLoadingExplanation}
              className="px-3.5 py-2 rounded-xl bg-[#2D4F1E] hover:bg-[#233F17] text-white font-serif font-bold text-xs transition-colors cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Consult AI Advisor</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Ask Bloomix Chat Panel */}
      <div className="bg-white rounded-2xl border border-[#E8E4D9] p-5 sm:p-6 shadow-xs space-y-4" id="bloomix-chat-section">
        <div className="flex items-center justify-between border-b border-[#E8E4D9] pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#FAF8F3] border border-[#E8E4D9] text-[#2D4F1E]">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#2D2D2D]">
                Ask Bloomix
              </h3>
              <p className="text-xs text-[#2D2D2D]/60">
                Grounded floral Q&A based on authoritative scoring
              </p>
            </div>
          </div>
        </div>

        {/* Quick Chips */}
        <div className="flex flex-wrap gap-1.5">
          {promptChips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(chip)}
              className="text-xs px-2.5 py-1 rounded-full bg-[#F4EFE6] hover:bg-[#EAE5D9] text-[#2D2D2D] border border-[#E8E4D9] transition-all cursor-pointer text-left"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Message Thread */}
        <div className="min-h-[220px] max-h-[360px] overflow-y-auto space-y-3 pr-1 py-1">
          {messages.map((msg) => {
            const isUser = msg.sender === "user";
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-full bg-[#2D4F1E] text-white flex items-center justify-center shrink-0 text-xs font-bold">
                    🌿
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? "bg-[#2D4F1E] text-white rounded-tr-xs"
                      : "bg-[#F4EFE6] text-[#2D2D2D] rounded-tl-xs border border-[#E8E4D9]"
                  }`}
                >
                  <div className="prose prose-xs max-w-none">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                  <div
                    className={`text-[9px] mt-1 text-right ${
                      isUser ? "text-white/80" : "text-[#2D2D2D]/50"
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-full bg-[#E8E4D9] text-[#2D2D2D] flex items-center justify-center shrink-0 text-xs font-bold">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}

          {isSendingMessage && (
            <div className="flex items-center gap-2 text-xs text-[#2D2D2D]/60 py-2">
              <div className="w-6 h-6 rounded-full bg-[#2D4F1E] text-white flex items-center justify-center text-xs animate-pulse">
                🌿
              </div>
              <span>Bloomix is thinking...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2 pt-2 border-t border-[#E8E4D9]"
        >
          <input
            type="text"
            id="chat-user-input"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Ask a question (e.g. Why did this get 92? What to replace?)..."
            className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#E8E4D9] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D4F1E]/20 focus:border-[#2D4F1E] text-[#2D2D2D] placeholder-[#2D2D2D]/40"
          />
          <button
            type="submit"
            disabled={!inputPrompt.trim() || isSendingMessage}
            className="p-2.5 rounded-xl bg-[#2D4F1E] hover:bg-[#233F17] disabled:opacity-40 text-white transition-colors cursor-pointer"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
