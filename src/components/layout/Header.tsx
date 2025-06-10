
// src/components/layout/Header.tsx
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Bell, LogOut, PlusCircle, User, Settings, LayoutDashboard, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';
import { Skeleton } from '@/components/ui/skeleton';
import ThemeSwitcher from '@/components/ThemeSwitcher';

const Header = () => {
  const { currentUser, loading, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Logo />
        
        <div className="flex items-center gap-2 md:gap-3">
          {/* Desktop Navigation & Actions */}
          <nav className="hidden md:flex items-center gap-1 md:gap-2">
            <Button variant="ghost" asChild size="sm">
              <Link href="/">Stories</Link>
            </Button>
            <Button variant="ghost" asChild size="sm">
              <Link href="/stories/create" className="flex items-center">
                <PlusCircle className="mr-1.5 h-4 w-4" />
                <span>Create</span>
              </Link>
            </Button>
            <ThemeSwitcher />
            {currentUser && !loading && (
              <Button variant="ghost" size="icon" asChild>
                <Link href="/notifications">
                  <Bell className="h-5 w-5" />
                  <span className="sr-only">Notifications</span>
                </Link>
              </Button>
            )}
          </nav>

          {/* User Authentication Area */}
          <div className="flex items-center">
            {loading ? (
              <Skeleton className="h-9 w-9 md:w-20 rounded-md md:rounded-full" />
            ) : currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={currentUser.photoURL || undefined} alt={currentUser.displayName || currentUser.email || 'User'} />
                      <AvatarFallback>
                        {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 
                         currentUser.email ? currentUser.email.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {currentUser.displayName || currentUser.email}
                      </p>
                      {currentUser.email && <p className="text-xs leading-none text-muted-foreground">
                        {currentUser.email}
                      </p>}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                     <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/profile/${currentUser.uid}`}><User className="mr-2 h-4 w-4" /> Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings"><Settings className="mr-2 h-4 w-4" /> Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              // Login/Signup buttons for desktop, hidden on mobile (handled in sheet)
              <div className="hidden md:flex items-center gap-2">
                <Button variant="outline" asChild size="sm">
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Trigger */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0 flex flex-col">
                <div className="p-4 border-b">
                  <Logo />
                </div>
                <nav className="flex-grow p-4 space-y-1">
                  <Button variant="ghost" className="w-full justify-start text-base py-3" asChild onClick={() => setIsMobileMenuOpen(false)}>
                    <Link href="/">Stories</Link>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-base py-3" asChild onClick={() => setIsMobileMenuOpen(false)}>
                    <Link href="/stories/create">Create Story</Link>
                  </Button>
                  
                  {currentUser && !loading && (
                    <Button variant="ghost" className="w-full justify-start text-base py-3" asChild onClick={() => setIsMobileMenuOpen(false)}>
                      <Link href="/notifications">Notifications</Link>
                    </Button>
                  )}

                  {!currentUser && !loading && (
                    <>
                      <DropdownMenuSeparator className="my-2"/>
                      <Button variant="ghost" className="w-full justify-start text-base py-3" asChild onClick={() => setIsMobileMenuOpen(false)}>
                        <Link href="/login">Login</Link>
                      </Button>
                      <Button variant="ghost" className="w-full justify-start text-base py-3" asChild onClick={() => setIsMobileMenuOpen(false)}>
                        <Link href="/signup">Sign Up</Link>
                      </Button>
                    </>
                  )}
                </nav>
                <div className="p-4 border-t mt-auto">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Theme</span>
                    <ThemeSwitcher />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
