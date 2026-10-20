'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export interface ToastProps {
  message: string;
  isError?: boolean;
  duration?: number;
  onClose?: () => void;
  portalTarget?: Element | null;
  portal?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function Toast({
  message,
  isError = false,
  duration = 4000,
  onClose,
  portalTarget,
  portal = true,
  className = 'toast',
  style,
}: ToastProps) {
  const [displayedMessage, setDisplayedMessage] = useState<string>(message);
  const [displayedError, setDisplayedError] = useState<boolean>(isError);
  const [isExiting, setIsExiting] = useState<boolean>(false);

  // Keep track of dismissed message so it never resurrects in a loop
  const dismissedRef = useRef<string | null>(null);
  const exitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Up-to-date refs for stable callback
  const messageRef = useRef(message);
  messageRef.current = message;
  const displayedMessageRef = useRef(displayedMessage);
  displayedMessageRef.current = displayedMessage;
  const isExitingRef = useRef(isExiting);
  isExitingRef.current = isExiting;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const handleDismiss = useCallback(() => {
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }

    dismissedRef.current = displayedMessageRef.current || messageRef.current;
    setIsExiting(true);

    exitTimerRef.current = setTimeout(() => {
      setDisplayedMessage('');
      setIsExiting(false);
      onCloseRef.current?.();
    }, 350); // Matches CSS fade-out transition duration
  }, []);

  // Listen strictly to incoming message / error changes
  useEffect(() => {
    if (!message) {
      // Parent cleared message
      dismissedRef.current = null;
      if (displayedMessageRef.current && !isExitingRef.current) {
        setIsExiting(true);
        if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
        exitTimerRef.current = setTimeout(() => {
          setDisplayedMessage('');
          setIsExiting(false);
        }, 350);
      }
      return;
    }

    // If this message was already dismissed, do not resurrect it
    if (dismissedRef.current === message) {
      return;
    }

    // Brand new message
    dismissedRef.current = null;
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }

    setDisplayedMessage(message);
    setDisplayedError(isError);
    setIsExiting(false);

    autoCloseTimerRef.current = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => {
      if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    };
  }, [message, isError, duration, handleDismiss]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
      if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    };
  }, []);

  if (!displayedMessage) return null;

  const isLawyerToast = className.includes('lawyer-dash-toast');
  const exitClass = isLawyerToast ? 'lawyer-dash-toast-exiting toast-exiting' : 'toast-exiting';

  const content = (
    <div
      className={`${className} ${displayedError ? 'error' : ''} ${isExiting ? exitClass : 'toast-entering'}`}
      role={displayedError ? 'alert' : 'status'}
      style={style}
    >
      {displayedError ? (
        <AlertCircle size={18} />
      ) : (
        <CheckCircle2 size={18} className={isLawyerToast ? 'text-emerald-600' : undefined} />
      )}
      <span>{displayedMessage}</span>
      <button
        aria-label="Cerrar notificación"
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleDismiss();
        }}
      >
        <X size={isLawyerToast ? 15 : 18} />
      </button>
    </div>
  );

  if (!portal) {
    return content;
  }

  if (typeof document === 'undefined') return null;

  const targetNode = portalTarget !== undefined
    ? portalTarget
    : (document.querySelector('dialog[open]') || document.body);

  if (!targetNode) return null;

  return createPortal(content, targetNode);
}

export default Toast;
