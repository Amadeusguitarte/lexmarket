'use client';
import { Check } from 'lucide-react';
import type { IntakeStage, ProgressNamedStep } from './types';
import { getNamedStage } from './types';

interface IntakeProgressProps {
  currentStage: IntakeStage;
  onNavigateStage?: (target: IntakeStage) => void;
}

const NAMED_STEPS: { name: ProgressNamedStep; stage: IntakeStage; index: number }[] = [
  { name: 'Tu situación', stage: 'narrative', index: 0 },
  { name: 'Detalles', stage: 'clarification', index: 1 },
  { name: 'Documentos', stage: 'evidence', index: 2 },
  { name: 'Privacidad', stage: 'parties', index: 3 },
  { name: 'Revisión', stage: 'review', index: 4 }
];

export default function IntakeProgress({ currentStage, onNavigateStage }: IntakeProgressProps) {
  const activeNamed = getNamedStage(currentStage);
  const activeIndex = NAMED_STEPS.findIndex((s) => s.name === activeNamed);

  return (
    <nav className="intake-stage-progress" aria-label="Progreso del caso">
      <ol className="intake-stage-list">
        {NAMED_STEPS.map((step, idx) => {
          const isDone = idx < activeIndex;
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
                <div className="intake-stage-indicator">
                  {isDone ? (
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
