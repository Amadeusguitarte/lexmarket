'use client';

import React from 'react';

interface PublicHeaderWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function PublicHeaderWrapper({
  children,
  className = '',
}: PublicHeaderWrapperProps) {
  return (
    <>
      <div className="public-header-spacer" aria-hidden="true" />
      <header className={`public-header-wrapper ${className}`}>
        {children}
      </header>
    </>
  );
}

export default PublicHeaderWrapper;

