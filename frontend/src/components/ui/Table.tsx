import React from 'react';

export function Table({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`overflow-x-auto w-full ${className}`}>
      <table className="w-full text-left text-sm border-separate border-spacing-0">
        {children}
      </table>
    </div>
  );
}

export function Th({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return (
    <th className={`px-4 py-3 font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-[10px] bg-black/[0.03] dark:bg-black/20 border-b border-black/[0.05] dark:border-white/5 ${className}`}>
      {children}
    </th>
  );
}

export function Td({ children, className = "", colSpan }: { children: React.ReactNode, className?: string, colSpan?: number }) {
  return (
    <td colSpan={colSpan} className={`px-4 py-3 text-gray-700 dark:text-gray-300 border-b border-black/[0.05] dark:border-white/5 ${className}`}>
      {children}
    </td>
  );
}
