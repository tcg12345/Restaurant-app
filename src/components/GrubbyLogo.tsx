interface GrubbyLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function GrubbyLogo({ size = 'md', showText = true, className = '' }: GrubbyLogoProps) {
  const dimensions = {
    sm: { icon: 28, text: 'text-lg' },
    md: { icon: 36, text: 'text-xl' },
    lg: { icon: 44, text: 'text-2xl' }
  };

  const { icon, text } = dimensions[size];

  return (
    <div className={`flex items-center gap-2 justify-start ${className}`}>
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Rounded square background */}
        <rect width="48" height="48" rx="12" fill="hsl(var(--primary))" />
        {/* Fork - left */}
        <path
          d="M16 10v8c0 2.5 1.5 4.5 4 5v15a1.5 1.5 0 003 0V23c2.5-.5 4-2.5 4-5v-8"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Fork tines */}
        <line x1="19" y1="10" x2="19" y2="17" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="23" y1="10" x2="23" y2="17" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
        {/* Knife - right */}
        <path
          d="M32 10v5c0 4-2 6.5-3.5 7.5V38a1.5 1.5 0 003 0V22.5c1.5-1 3.5-3.5 3.5-7.5V10"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Knife blade fill */}
        <path
          d="M32 10v5c0 4-2 6.5-3.5 7.5V10h3.5z"
          fill="white"
          opacity="0.3"
        />
      </svg>
      {showText && (
        <span className={`${text} font-bold tracking-tight`}>Grubby</span>
      )}
    </div>
  );
}