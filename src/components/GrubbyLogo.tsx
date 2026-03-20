interface GrubbyLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function GrubbyLogo({ size = 'md', showText = true, className = '' }: GrubbyLogoProps) {
  const textSize = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <div className={`flex items-center gap-2 justify-start ${className}`}>
      {showText && (
        <h1 className={`font-headline font-bold tracking-tight ${textSize[size]} text-primary`}>
          The Culinary Editorial
        </h1>
      )}
    </div>
  );
}
