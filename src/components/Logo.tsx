// src/components/Logo.tsx
import Link from 'next/link';
import Image from 'next/image'; // Import next/image

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <Link href="/" className={`flex items-center gap-2 text-2xl font-headline font-bold text-primary ${className}`}>
      <Image 
        src="/images/echosphere-logo.png" // Updated to local path
        alt="EchoSphere Logo" 
        width={36} 
        height={36} 
        className="rounded-sm" 
      />
      <span>EchoSphere</span>
    </Link>
  );
};

export default Logo;
