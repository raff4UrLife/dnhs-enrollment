// src/components/enrollment/steb-tabs.tsx
import { cn } from "@/lib/utils";

interface StepTabsProps {
  steps: { label: string }[];
  currentStep: number;
}

export function StepTabs({ steps, currentStep }: StepTabsProps) {
  return (
    // <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-white/15 bg-white/15 sm:grid-cols-5">
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-white/15 bg-white/15 sm:grid-cols-3 md:grid-cols-6">
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isDone = index < currentStep;
        return (
          <div
            key={step.label}
            className={cn(
              "px-4 py-3 text-center sm:text-left",
              isActive ? "bg-white/10" : "bg-secondary",
            )}
          >
            <p
              className={cn(
                "font-serif text-sm font-semibold",
                isActive
                  ? "text-primary"
                  : isDone
                    ? "text-white/70"
                    : "text-white/40",
              )}
            >
              {index + 1}
            </p>
            <p
              className={cn(
                "text-xs font-medium",
                isActive ? "text-white" : "text-white/50",
              )}
            >
              {step.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}
