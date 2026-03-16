import React from 'react';

export function BirdLogo({ className = "", size = 32 }: { className?: string, size?: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path 
        d="M20 9.5C20 9.5 17 4 11 4C5 4 2 9.5 2 9.5C2 9.5 5 15 11 15C17 15 20 9.5 20 9.5Z" 
        stroke="currentColor" 
        strokeWidth="0.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="opacity-20"
      />
      <path 
        d="M12 4C14.5 4 17 5.5 18.5 8C19.5 9.5 20 11 19.5 12.5C19 14 17.5 15 15.5 15.5C13.5 16 11 16 9 15.5C7 15 5.5 14 5 12.5C4.5 11 5 9.5 6 8C7.5 5.5 10 4 12 4Z" 
        stroke="currentColor" 
        strokeWidth="1.2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M12 4L14 2L13 0.5" 
        stroke="currentColor" 
        strokeWidth="1" 
        strokeLinecap="round"
      />
      <path 
        d="M7 11C7 11 8.5 13 11 13C13.5 13 15 11 15 11" 
        stroke="currentColor" 
        strokeWidth="0.8" 
        strokeLinecap="round"
      />
      <circle cx="12" cy="8.5" r="0.5" fill="currentColor" />
    </svg>
  );
}
