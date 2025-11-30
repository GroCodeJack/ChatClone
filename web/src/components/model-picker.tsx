"use client";

import { useState } from "react";
import { AVAILABLE_MODELS, type ModelConfig } from "@/lib/models/config";
import { ChevronDown, Check } from "lucide-react";

type ModelPickerProps = {
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
};

export function ModelPicker({
  selectedModelId,
  onModelChange,
  disabled = false,
}: ModelPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedModel = AVAILABLE_MODELS.find((m) => m.id === selectedModelId);

  return (
    <div className="relative">
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        title={disabled ? "Model locked for this conversation" : "Select a model"}
        className={`w-full flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm transition ${
          disabled
            ? "cursor-not-allowed border-zinc-200 bg-zinc-50 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900"
            : "border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
        }`}
      >
        <div className="flex flex-col items-start">
          <span className="font-medium">{selectedModel?.name}</span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {selectedModel?.provider}
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && !disabled && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 top-full z-20 mt-1 max-h-80 w-full min-w-[320px] overflow-auto rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
            {AVAILABLE_MODELS.map((model) => (
              <button
                key={model.id}
                onClick={() => {
                  onModelChange(model.id);
                  setIsOpen(false);
                }}
                className="flex w-full items-start gap-3 px-3 py-3 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-zinc-900 dark:text-white">
                      {model.name}
                    </span>
                    <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                      {model.provider}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {model.description}
                  </p>
                </div>
                {model.id === selectedModelId && (
                  <Check className="h-5 w-5 text-zinc-900 dark:text-white" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
