import React from 'react';
import {
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';

/**
 * S01 Shared System States & Feedback Library
 * Conforms to Meetora Clean Academic / Warm Modern Design System
 */

/* ==========================================================================
   1. Skeleton Loaders
   ========================================================================== */

interface SkeletonProps {
  className?: string;
}

export function SkeletonBox({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-[#E6E6EF]/70 ${className}`}
      aria-hidden="true"
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between mb-2">
        <SkeletonBox className="h-4 w-24" />
        <SkeletonBox className="h-8 w-8 rounded-lg" />
      </div>
      <SkeletonBox className="h-8 w-16 mb-2 mt-3" />
      <SkeletonBox className="h-3 w-36" />
    </div>
  );
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b border-border">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="py-4 px-4">
          <SkeletonBox className="h-4 w-full max-w-35" />
        </td>
      ))}
    </tr>
  );
}

export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-border bg-surface">
      <div className="border-b border-border bg-app-bg px-4 py-3">
        <SkeletonBox className="h-4 w-40" />
      </div>
      <table className="w-full">
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
      <div className="flex items-center gap-3">
        <SkeletonBox className="h-10 w-10 rounded-full" />
        <div className="space-y-1.5 flex-1">
          <SkeletonBox className="h-4 w-3/4" />
          <SkeletonBox className="h-3 w-1/2" />
        </div>
      </div>
      <SkeletonBox className="h-16 w-full" />
      <div className="flex justify-between pt-2">
        <SkeletonBox className="h-8 w-24" />
        <SkeletonBox className="h-8 w-20" />
      </div>
    </div>
  );
}

/* ==========================================================================
   2. Empty States
   ========================================================================== */

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ElementType;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon: Icon = FolderOpen,
  actionText,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-app-bg border border-border text-text-secondary mb-3 shadow-xs">
        <Icon className="h-6 w-6 text-text-secondary" />
      </div>
      <h3 className="text-base font-semibold text-text-primary mb-1">{title}</h3>
      <p className="max-w-md text-xs text-text-secondary leading-relaxed mb-4">
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-primary-hover active:scale-[0.98]"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}

/* ==========================================================================
   3. Error Alert Banner
   ========================================================================== */

interface ErrorAlertProps {
  message: string;
  title?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function ErrorAlert({
  message,
  title = 'Something went wrong',
  onRetry,
  onDismiss,
  className = '',
}: ErrorAlertProps) {
  return (
    <div
      role="alert"
      className={`flex items-start justify-between gap-3 rounded-xl border border-status-danger/30 bg-status-danger/10 p-4 text-xs text-text-primary ${className}`}
    >
      <div className="flex items-start gap-2.5">
        <AlertCircle className="h-5 w-5 shrink-0 text-status-danger mt-0.5" />
        <div>
          <h4 className="font-semibold text-status-danger">{title}</h4>
          <p className="mt-0.5 text-text-secondary leading-relaxed">{message}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1 rounded-md border border-status-danger/30 bg-surface px-2.5 py-1 text-xs font-medium text-status-danger hover:bg-app-bg"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Retry</span>
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            aria-label="Dismiss error"
            className="rounded p-1 text-text-secondary hover:bg-app-bg hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
   4. Toast Notifications
   ========================================================================== */

export type ToastType = 'success' | 'warning' | 'error' | 'info';

interface ToastProps {
  type?: ToastType;
  title: string;
  message?: string;
  onClose?: () => void;
}

export function Toast({ type = 'success', title, message, onClose }: ToastProps) {
  const config = {
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      icon: CheckCircle2,
      iconColor: 'text-status-success',
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-900',
      icon: AlertTriangle,
      iconColor: 'text-status-warning',
    },
    error: {
      bg: 'bg-red-50 border-red-200 text-red-900',
      icon: AlertCircle,
      iconColor: 'text-status-danger',
    },
    info: {
      bg: 'bg-blue-50 border-blue-200 text-blue-900',
      icon: Info,
      iconColor: 'text-status-info',
    },
  }[type];

  const Icon = config.icon;

  return (
    <div
      className={`flex items-start justify-between gap-3 rounded-xl border p-3.5 shadow-md transition-all ${config.bg}`}
    >
      <div className="flex items-start gap-2.5">
        <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${config.iconColor}`} />
        <div>
          <h5 className="font-semibold text-xs leading-tight">{title}</h5>
          {message && <p className="text-[11px] opacity-90 mt-0.5">{message}</p>}
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="rounded p-0.5 opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

/* ==========================================================================
   5. Confirm / Cancellation Modal Dialog
   ========================================================================== */

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#202033]/40 backdrop-blur-xs transition-opacity"
        onClick={onCancel}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-xl z-10 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3 mb-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              isDestructive
                ? 'bg-status-danger/10 text-status-danger'
                : 'bg-primary-soft text-primary'
            }`}
          >
            {isDestructive ? (
              <AlertTriangle className="h-5 w-5" />
            ) : (
              <Info className="h-5 w-5" />
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-text-primary leading-tight">{title}</h3>
          </div>
        </div>

        <p className="text-xs text-text-secondary leading-relaxed mb-6 pl-1">
          {description}
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-border bg-surface px-4 py-2 text-xs font-semibold text-text-secondary hover:bg-app-bg hover:text-text-primary transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors ${
              isDestructive
                ? 'bg-status-danger hover:bg-[#A93845]'
                : 'bg-primary hover:bg-primary-hover'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
