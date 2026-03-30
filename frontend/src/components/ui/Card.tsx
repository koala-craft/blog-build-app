import React from 'react';

export function Card({ children, className = "", style }: { children: React.ReactNode, className?: string, style?: React.CSSProperties }) {
  return (
    <div 
      className={`glass rounded-2xl p-6 md:p-8 transition-all duration-300 relative overflow-hidden ${className}`} 
      style={style}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return (
    <div className="flex flex-col gap-2 mb-6">
      <h3 className={`text-2xl font-black tracking-tight text-gray-900 dark:text-white ${className}`}>
        {children}
      </h3>
      <div className="w-12 h-1 bg-primary-500 rounded-full" />
    </div>
  );
}
