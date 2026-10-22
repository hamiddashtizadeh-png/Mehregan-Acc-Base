import React from 'react';
import { AlertTriangle, Trash2, Check } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  details?: string;
  errorMessage?: string | null;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  isDestructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  title,
  message,
  details,
  errorMessage,
  confirmText = 'حذف قطعی',
  cancelText = 'انصراف',
  isLoading = false,
  isDestructive = true,
  onConfirm,
  onClose,
}) => {
  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="sm"
      closeOnEsc={!isLoading}
      closeOnOverlayClick={!isLoading}
      headerClassName={
        isDestructive
          ? 'bg-rose-50/90 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/50'
          : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800'
      }
      title={
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-xl ${
              isDestructive
                ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400'
                : 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
            }`}
          >
            {isDestructive ? (
              <Trash2 className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>
          <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{title}</span>
        </div>
      }
      footer={
        <>
          <Button
            variant="outline"
            size="md"
            onClick={handleClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={isDestructive ? 'danger' : 'primary'}
            size="md"
            onClick={onConfirm}
            isLoading={isLoading}
            leftIcon={
              !isLoading ? (
                isDestructive ? (
                  <Trash2 className="w-4 h-4" />
                ) : (
                  <Check className="w-4 h-4" />
                )
              ) : undefined
            }
          >
            {isLoading ? 'در حال انجام...' : confirmText}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {errorMessage && (
          <div className="p-3.5 bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 rounded-xl text-xs font-bold text-rose-950 dark:text-rose-200 flex items-start gap-2 animate-pulse">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="block font-black text-rose-900 dark:text-rose-100">علت عدم امکان حذف:</span>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{message}</p>
        {details && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line font-mono">
            {details}
          </div>
        )}
        {isDestructive && (
          <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1.5 pt-1">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>توجه: پس از حذف، این رکورد از دیتابیس پاکسازی می‌شود.</span>
          </p>
        )}
      </div>
    </Modal>
  );
};

