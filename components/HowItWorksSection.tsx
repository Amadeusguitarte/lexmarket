'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FolderOpen, Scale, HeartHandshake, Sparkles, ArrowRight } from 'lucide-react';

interface StepItem {
  n: string;
  index: number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  text: string;
  tag: string;
}

const STEPS: StepItem[] = [
  {
    n: '01',
    index: 0,
    icon: FolderOpen,
    title: 'Abre tu espacio',
    text: 'Comparte lo que tienes y cuéntanos qué te gustaría resolver. Puedes ir sumando documentos después.',
    tag: 'Sin compromiso inicial'
  },
  {
    n: '02',
    index: 1,
    icon: Scale,
    title: 'Conoce tus opciones',
    text: 'Los abogados interesados te presentan una propuesta. Revisa su perfil, el alcance y los honorarios.',
    tag: 'Propuestas y honorarios claros'
  },
  {
    n: '03',
    index: 2,
    icon: HeartHandshake,
    title: 'Elige con quién avanzar',
    text: 'Conversa, resuelve tus dudas y acuerda el acompañamiento que necesitas.',
    tag: 'Acompañamiento a tu medida'
  }
];

interface HowItWorksSectionProps {
  onStart?: () => void;
}

export default function HowItWorksSection({ onStart }: HowItWorksSectionProps) {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isInView, setIsInView] = useState<boolean>(false);
  const sectionRef = useRef<HTMLElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger from step 01 as soon as scroll enters this section
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveStep(0);
            setIsInView(true);
          } else {
            setIsInView(false);
            setActiveStep(0);
            if (timerRef.current) clearInterval(timerRef.current);
          }
        });
      },
      {
        threshold: 0.3,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Smooth sequence rotation: only advances while in view and not paused
  useEffect(() => {
    if (!isInView || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % STEPS.length);
    }, 4000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isInView, isPaused]);

  return (
    <section
      ref={sectionRef}
      id="como-funciona"
      className="how-section"
      aria-label="Cómo funciona LexMarket"
    >
      <div className="wrap">
        {/* Section Heading */}
        <div className="section-heading">
          <div>
            <span className="overline">MENOS VUELTAS. MÁS CLARIDAD.</span>
            <h2>De aquí, hacia adelante.</h2>
          </div>
          <p>
            Sin tener que contar la misma historia<br />
            una y otra vez.
          </p>
        </div>

        {/* Timeline & Steps Interactive Wrapper */}
        <div
          className="how-interactive-wrapper"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Dedicated Cards Track with Central Timeline Rail */}
          <div className="how-cards-track">
            {/* Central Background Connecting Timeline Rail with Animated Light Beam */}
            <div className="how-timeline-rail" aria-hidden="true">
              <div
                className="how-timeline-beam"
                style={{
                  left: `${(activeStep / (STEPS.length - 1)) * 100}%`
                }}
              />
            </div>

            {/* Steps Grid */}
            <div className="steps-grid how-steps-grid">
              {STEPS.map((step) => {
                const Icon = step.icon;
                const isActive = activeStep === step.index;

                return (
                  <article
                    key={step.n}
                    className={`step-card ${isActive ? 'active-step' : ''}`}
                    onClick={() => setActiveStep(step.index)}
                    tabIndex={0}
                    role="button"
                    aria-pressed={isActive}
                    aria-label={`Paso ${step.n}: ${step.title}`}
                  >
                    {/* Top Beacon Circle (Fully visible, completely outside any clipping mask) */}
                    <div className="step-beacon" aria-hidden="true">
                      <span className="beacon-ring" />
                      <span className="beacon-dot" />
                    </div>

                    {/* Step Top Row */}
                    <div className="step-top">
                      <div className="step-icon-box">
                        <Icon size={24} className="step-icon" />
                      </div>
                      <span className="step-number">{step.n}</span>
                    </div>

                    {/* Tag Pill */}
                    <div className="step-tag-pill">
                      <span className="tag-dot" />
                      <span>{step.tag}</span>
                    </div>

                    {/* Step Content */}
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </article>
                );
              })}
            </div>
          </div>

          {/* Interactive Indicator Pills Below */}
          <div className="how-step-indicators" aria-label="Selector de pasos">
            {STEPS.map((step) => (
              <button
                key={step.n}
                type="button"
                className={`step-dot-btn ${activeStep === step.index ? 'active' : ''}`}
                onClick={() => setActiveStep(step.index)}
                aria-label={`Ir al paso ${step.n}`}
              >
                <span className="dot-label">{step.n}</span>
                <span className="dot-bar" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
