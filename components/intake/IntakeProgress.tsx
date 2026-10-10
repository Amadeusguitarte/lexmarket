'use client';
import { Check } from 'lucide-react';
import type { IntakeStage, ProgressNamedStep } from './types';
import { getNamedStage } from './types';

interface IntakeProgressProps {
  currentStage: IntakeStage;
  onNavigateStage?: (target: IntakeStage) => void;
  completedStages?: Set<IntakeStage> | IntakeStage[];
  isStageCompleted?: (stage: IntakeStage) => boolean;
}

const NAMED_STEPS: { name: ProgressNamedStep; stage: IntakeStage; index: number }[] = [
  { name: 'Tu situación', stage: 'narrative', index: 0 },
  { name: 'Detalles', stage: 'clarification', index: 1 },
  { name: 'Documentos', stage: 'evidence', index: 2 },
  { name: 'Privacidad', stage: 'parties', index: 3 },
  { name: 'Revisión', stage: 'review', index: 4 }
];

export default function IntakeProgress({
  currentStage,
  onNavigateStage,
  completedStages,
  isStageCompleted
}: IntakeProgressProps) {
  const activeNamed = getNamedStage(currentStage);
  const activeIndex = NAMED_STEPS.findIndex((s) => s.name === activeNamed);

  const checkIsDone = (stepStage: IntakeStage): boolean => {
    if (isStageCompleted) return isStageCompleted(stepStage);
    if (completedStages instanceof Set) {
      return (
        completedStages.has(stepStage) ||
        (stepStage === 'narrative' && completedStages.has('summary_review'))
      );
    }
    if (Array.isArray(completedStages)) {
      return completedStages.includes(stepStage);
    }
    return false;
  };

  return (
    <nav className="intake-stage-progress" aria-label="Progreso del caso">
      <ol className="intake-stage-list">
        {NAMED_STEPS.map((step, idx) => {
          const isDone = checkIsDone(step.stage);
          const isCurrent = idx === activeIndex;

          return (
            <li
              key={step.name}
              className={`intake-stage-item ${isCurrent ? 'current' : ''} ${isDone ? 'completed' : ''}`}
            >
              <button
                type="button"
                className={`intake-stage-btn ${isCurrent ? 'current' : ''} ${isDone ? 'completed' : ''}`}
                onClick={() => onNavigateStage?.(step.stage)}
                aria-current={isCurrent ? 'step' : undefined}
                title={`Ir al paso ${idx + 1}: ${step.name}`}
              >
                <div
                  className={`intake-stage-indicator ${isCurrent ? 'current' : ''} ${isDone ? 'completed' : ''}`}
                >
                  {isDone && !isCurrent ? (
                    <Check size={13} className="intake-check-icon" />
                  ) : (
                    <span className="intake-step-number">{idx + 1}</span>
                  )}
                </div>
                <span className="intake-stage-title">{step.name}</span>
              </button>
              {idx < NAMED_STEPS.length - 1 && <span className="intake-stage-divider" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
