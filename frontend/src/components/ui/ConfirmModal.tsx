'use client';

import React from 'react';
import { Button } from './Button';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '実行',
  cancelText = 'キャンセル',
  variant = 'danger',
  isLoading = false
}) => {
  if (!isOpen) return null;

  const variantStyles = {
    danger: 'bg-red-500 hover:bg-red-600 shadow-red-500/20',
    warning: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20',
    primary: 'bg-primary-500 hover:bg-primary-600 shadow-primary-500/20',
  };

  const iconStyles = {
    danger: 'text-red-500 bg-red-100 dark:bg-red-900/40',
    warning: 'text-amber-500 bg-amber-100 dark:bg-amber-900/40',
    primary: 'text-primary-500 bg-primary-100 dark:bg-primary-900/40',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <div className="bento-card border-none shadow-2xl relative overflow-hidden bg-white dark:bg-gray-900">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X size={20} />
          </button>

          <div className="p-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${iconStyles[variant]}`}>
                <AlertTriangle size={32} />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                  {title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                  {message}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <Button
                variant="ghost"
                onClick={onClose}
                className="flex-1 h-12 font-black text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {cancelText}
              </Button>
              <Button
                onClick={() => {
                  onConfirm();
                }}
                isLoading={isLoading}
                className={`flex-1 h-12 font-black text-white shadow-lg ${variantStyles[variant]}`}
              >
                {confirmText}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
