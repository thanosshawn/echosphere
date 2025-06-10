// src/components/Logo.tsx
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <Link href="/" className={`flex items-center gap-2 text-2xl font-headline font-bold text-primary ${className}`}>
      <MessageCircle className="h-7 w-7" />
      <span>EchoSphere</span>
    </Link>
  );
};

export default Logo;
