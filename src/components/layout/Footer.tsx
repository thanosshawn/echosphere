// src/components/layout/Footer.tsx
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border py-8 text-center text-muted-foreground">
      <div className="container mx-auto px-4">
        <p>&copy; {new Date().getFullYear()} EchoSphere. All rights reserved.</p>
        <div className="mt-2 space-x-4">
          <Link href="/about" className="hover:text-foreground transition-colors">About Us</Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
