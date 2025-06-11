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
        src="https://storage.googleapis.com/projectx-upload/e7466e43-933c-499e-ad0a-d555ac5332a2/image.jpeg" 
        alt="EchoSphere Logo" 
        width={36} 
        height={36} 
        className="rounded-sm" // Using rounded-sm for a gentle rounding
      />
      <span>EchoSphere</span>
    </Link>
  );
};

export default Logo;
