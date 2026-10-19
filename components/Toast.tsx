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
  const [activeMessage, setActiveMessage] = useState(message);
  const [activeError, setActiveError] = useState(isError);
  const [isExiting, setIsExiting] = useState(false);
  const exitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerExit = useCallback(() => {
    setIsExiting(true);
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    exitTimerRef.current = setTimeout(() => {
      setActiveMessage('');
      setIsExiting(false);
      onClose?.();
    }, 350); // Matches CSS fade-out animation duration
  }, [onClose]);

  // When message changes, reset and show, or initiate smooth fade-out if cleared
  useEffect(() => {
    if (message) {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
      setActiveMessage(message);
      setActiveError(isError);
      setIsExiting(false);
    } else if (activeMessage && !isExiting) {
      triggerExit();
    }
  }, [message, isError, activeMessage, isExiting, triggerExit]);

  // Auto-dismiss countdown
  useEffect(() => {
    if (!activeMessage || isExiting) return;
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = setTimeout(() => {
      triggerExit();
    }, duration);

    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, [activeMessage, isExiting, duration, triggerExit]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, []);

  if (!activeMessage) return null;

  const isLawyerToast = className.includes('lawyer-dash-toast');
  const exitClass = isLawyerToast ? 'lawyer-dash-toast-exiting toast-exiting' : 'toast-exiting';

  const content = (
    <div
      className={`${className} ${activeError ? 'error' : ''} ${isExiting ? exitClass : 'toast-entering'}`}
      role={activeError ? 'alert' : 'status'}
      style={style}
    >
      {activeError ? (
        <AlertCircle size={18} />
      ) : (
        <CheckCircle2 size={18} className={isLawyerToast ? 'text-emerald-600' : undefined} />
      )}
      <span>{activeMessage}</span>
      <button
        aria-label="Cerrar notificación"
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          triggerExit();
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
