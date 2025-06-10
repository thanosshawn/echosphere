
"use client";

import { useState, useEffect, useRef, FormEvent } from 'react';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import type { GlobalChatMessage } from '@/types';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, Timestamp, limit } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Send, X, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const GlobalChat = () => {
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<GlobalChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!db) return;

    const q = query(collection(db, "global-chat-messages"), orderBy("createdAt", "asc"), limit(50));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedMessages: GlobalChatMessage[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedMessages.push({
          id: doc.id,
          userId: data.userId,
          username: data.username,
          avatarUrl: data.avatarUrl,
          text: data.text,
          createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(), // Convert Firestore Timestamp
        });
      });
      setMessages(fetchedMessages);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !db) return;

    setIsLoading(true);
    try {
      await addDoc(collection(db, "global-chat-messages"), {
        userId: currentUser.uid,
        username: currentUser.displayName || currentUser.email || 'Anonymous',
        avatarUrl: currentUser.photoURL,
        text: newMessage,
        createdAt: serverTimestamp(),
      });
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
      // Consider adding a toast notification for the error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 rounded-full h-14 w-14 sm:h-16 sm:w-16 shadow-lg z-50"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Global Chat"
      >
        {isOpen ? <X className="h-6 w-6 sm:h-7 sm:w-7" /> : <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7" />}
      </Button>

      {isOpen && (
        <Card className={cn(
          "fixed bottom-20 right-4 sm:bottom-24 sm:right-6 z-40 w-[calc(100vw-2rem)] sm:w-96 h-[60vh] sm:h-[70vh] max-h-[500px] sm:max-h-[600px] shadow-2xl rounded-lg flex flex-col",
          "transition-all duration-300 ease-in-out",
          isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
        )}>
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-4 border-b">
            <CardTitle className="text-base sm:text-lg font-headline">Global Chat</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-7 w-7 sm:h-8 sm:w-8">
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </CardHeader>
          <CardContent className="flex-grow p-0 overflow-hidden">
            <ScrollArea className="h-full p-3 sm:p-4" ref={scrollAreaRef}>
              <div className="space-y-3 sm:space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={cn(
                    "flex items-start gap-2 sm:gap-3 text-sm",
                    msg.userId === currentUser?.uid ? "justify-end" : ""
                  )}>
                    {msg.userId !== currentUser?.uid && (
                       <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                        <AvatarImage src={msg.avatarUrl || undefined} alt={msg.username} />
                        <AvatarFallback className="text-xs">
                            {msg.username ? msg.username.charAt(0).toUpperCase() : <UserIcon className="h-3 w-3" />}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={cn(
                      "p-2 sm:p-2.5 rounded-lg max-w-[70%] sm:max-w-[75%]",
                      msg.userId === currentUser?.uid 
                        ? "bg-primary text-primary-foreground rounded-br-none" 
                        : "bg-muted rounded-bl-none"
                    )}>
                      <p className="font-semibold text-xs mb-0.5">{msg.userId === currentUser?.uid ? "You" : msg.username}</p>
                      <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                      <p className="text-2xs opacity-70 mt-1 text-right">
                         {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                     {msg.userId === currentUser?.uid && (
                       <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                        <AvatarImage src={msg.avatarUrl || undefined} alt={msg.username} />
                        <AvatarFallback className="text-xs">
                            {msg.username ? msg.username.charAt(0).toUpperCase() : <UserIcon className="h-3 w-3" />}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
              </div>
              <div ref={messagesEndRef} />
            </ScrollArea>
          </CardContent>
          <CardFooter className="p-3 sm:p-4 border-t">
            {currentUser ? (
              <form onSubmit={handleSendMessage} className="w-full flex items-center gap-2">
                <Input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-grow text-sm"
                  disabled={isLoading}
                />
                <Button type="submit" size="icon" disabled={isLoading || !newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            ) : (
              <p className="text-xs text-muted-foreground text-center w-full">
                Please <a href="/login" className="underline text-primary">log in</a> to chat.
              </p>
            )}
          </CardFooter>
        </Card>
      )}
    </>
  );
};

export default GlobalChat;
