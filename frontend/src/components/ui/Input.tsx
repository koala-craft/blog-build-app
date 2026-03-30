import React from 'react';

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-900/40 px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400/80 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all shadow-sm ${props.className || ''}`}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-900/40 px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400/80 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all shadow-sm min-h-[120px] ${props.className || ''}`}
    />
  );
}
