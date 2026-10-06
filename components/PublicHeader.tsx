'use client';

import React, { useEffect, useState, useRef } from 'react';

interface PublicHeaderWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function PublicHeaderWrapper({
  children,
  className = '',
}: PublicHeaderWrapperProps) {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isHoveredRef = useRef(false);
  const revealedByScrollUpRef = useRef(false);
  const revealedByMouseRef = useRef(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const cancelHide = () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    };

    const scheduleHide = (delay = 300) => {
      cancelHide();
      hideTimeoutRef.current = setTimeout(() => {
        // Only hide if user did NOT reveal by scrolling up, is scrolled down, and not hovering
        if (
          window.scrollY > 80 &&
          !isHoveredRef.current &&
          !revealedByScrollUpRef.current
        ) {
          setHidden(true);
          revealedByMouseRef.current = false;
        }
        hideTimeoutRef.current = null;
      }, delay);
    };

    const evaluateHeader = (isScrollEvent: boolean) => {
      const currentScrollY = window.scrollY;
      const maxScrollY =
        document.documentElement.scrollHeight - window.innerHeight;
      const diff = currentScrollY - lastScrollY;

      if (currentScrollY <= 25) {
        // At the very top: natural transparent resting state
        cancelHide();
        revealedByScrollUpRef.current = false;
        revealedByMouseRef.current = false;
        setHidden(false);
        setScrolled(false);
      } else {
        setScrolled(true);

        if (!isScrollEvent) {
          if (
            currentScrollY > 80 &&
            !isHoveredRef.current &&
            !revealedByMouseRef.current &&
            !revealedByScrollUpRef.current
          ) {
            setHidden(true);
          } else {
            setHidden(false);
          }
        } else if (currentScrollY < maxScrollY - 20) {
          if (Math.abs(diff) > 8) {
            if (diff > 0 && currentScrollY > 80) {
              // Scrolling down -> hide smoothly and reset revealed state
              if (!isHoveredRef.current) {
                cancelHide();
                revealedByScrollUpRef.current = false;
                revealedByMouseRef.current = false;
                setHidden(true);
              }
            } else if (diff < 0) {
              // Scrolling up -> PERMANENTLY reveal header while navigating up
              cancelHide();
              revealedByScrollUpRef.current = true;
              revealedByMouseRef.current = false;
              setHidden(false);
            }
          }
        }
      }

      lastScrollY = currentScrollY;
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => evaluateHeader(true));
        ticking = true;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const currentScrollY = window.scrollY;
      if (currentScrollY <= 25) return;

      const isNearTop = e.clientY <= 75;
      const isMovingUpNearTop = e.movementY < -4 && e.clientY < 140;

      if (isNearTop || isMovingUpNearTop) {
        cancelHide();
        if (!revealedByScrollUpRef.current) {
          revealedByMouseRef.current = true;
        }
        setHidden(false);
      } else if (
        e.clientY > 85 &&
        !isHoveredRef.current &&
        revealedByMouseRef.current &&
        !revealedByScrollUpRef.current &&
        currentScrollY > 80
      ) {
        // Only auto-hide on mouse leave if it was revealed by cursor (not by scrolling up!)
        scheduleHide(300);
      }
    };

    // Evaluate immediately on mount
    evaluateHeader(false);

    const t1 = setTimeout(() => evaluateHeader(false), 60);
    const t2 = setTimeout(() => evaluateHeader(false), 200);

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('pageshow', () => evaluateHeader(false));

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      cancelHide();
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('pageshow', () => evaluateHeader(false));
    };
  }, []);

  return (
    <>
      <div className="public-header-spacer" aria-hidden="true" />
      <header
        className={`public-header-wrapper ${scrolled ? 'header-scrolled' : ''} ${
          hidden ? 'header-hidden' : ''
        } ${className}`}
        onMouseEnter={() => {
          isHoveredRef.current = true;
          if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
          }
          setHidden(false);
        }}
        onMouseLeave={(e) => {
          isHoveredRef.current = false;
          // Only auto-hide if revealed by mouse and user didn't scroll up to it
          if (
            window.scrollY > 80 &&
            e.clientY > 70 &&
            revealedByMouseRef.current &&
            !revealedByScrollUpRef.current
          ) {
            if (hideTimeoutRef.current) {
              clearTimeout(hideTimeoutRef.current);
            }
            hideTimeoutRef.current = setTimeout(() => {
              if (
                window.scrollY > 80 &&
                !isHoveredRef.current &&
                !revealedByScrollUpRef.current
              ) {
                setHidden(true);
                revealedByMouseRef.current = false;
              }
              hideTimeoutRef.current = null;
            }, 250);
          }
        }}
      >
        {children}
      </header>
    </>
  );
}

export default PublicHeaderWrapper;
