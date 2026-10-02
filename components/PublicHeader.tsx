'use client';

import React, { useEffect, useState } from 'react';

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

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const evaluateHeader = (isScrollEvent: boolean) => {
      const currentScrollY = window.scrollY;
      const maxScrollY =
        document.documentElement.scrollHeight - window.innerHeight;
      const diff = currentScrollY - lastScrollY;

      if (currentScrollY <= 25) {
        // At the very top: natural transparent resting state over the spacer
        setHidden(false);
        setScrolled(false);
      } else {
        // Anywhere scrolled: always frosted glass, never transparent over content
        setScrolled(true);

        if (!isScrollEvent) {
          // On page load / reload with scroll restoration or anchor hash
          if (currentScrollY > 80) {
            setHidden(true);
          } else {
            setHidden(false);
          }
        } else if (currentScrollY < maxScrollY - 20) {
          if (Math.abs(diff) > 8) {
            if (diff > 0 && currentScrollY > 80) {
              // Scrolling down -> hide smoothly
              setHidden(true);
            } else if (diff < 0) {
              // Scrolling up -> reveal frosted
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

    // Evaluate immediately on mount
    evaluateHeader(false);

    // Browser scroll restoration can occur asynchronously right after mount:
    const t1 = setTimeout(() => evaluateHeader(false), 60);
    const t2 = setTimeout(() => evaluateHeader(false), 200);

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('pageshow', () => evaluateHeader(false));

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('scroll', handleScroll);
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
      >
        {children}
      </header>
    </>
  );
}

export default PublicHeaderWrapper;
