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

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const maxScrollY =
            document.documentElement.scrollHeight - window.innerHeight;
          const diff = currentScrollY - lastScrollY;

          // If at or near the very top of the page:
          // Keep header visible, transparent, and in natural resting size
          if (currentScrollY <= 25) {
            setHidden(false);
            setScrolled(false);
          } else if (currentScrollY < maxScrollY - 20) {
            // Once scrolled past top threshold, enable the floating glass treatment
            setScrolled(true);

            // Minimum scroll delta threshold (8px) to prevent twitching/jitter on small finger movements
            if (Math.abs(diff) > 8) {
              if (diff > 0 && currentScrollY > 80) {
                // Scrolling down -> hide smoothly
                setHidden(true);
              } else if (diff < 0) {
                // Scrolling up -> reveal smoothly
                setHidden(false);
              }
            }
          }

          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
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
