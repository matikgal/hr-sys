'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, Plus, Search, MessageSquare, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { Conversation, ChatMessage, Employee } from '@/types';
import {
  subscribeToConversations,
  subscribeToMessages,
  sendMessage,
  markConversationRead,
  getOrCreateConversation,
} from '@/services/db/chat';
import { getAllEmployees } from '@/services/db/employees';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
}

function formatMsgTime(iso: string | null): string {
  if (!iso) return '';
  try {
    const d = parseISO(iso);
    if (isToday(d)) return format(d, 'HH:mm');
    if (isYesterday(d)) return 'wczoraj';
    return format(d, 'd MMM', { locale: pl });
  } catch {
    return '';
  }
}

function Avatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div className={cn(
      'rounded-full bg-primary flex items-center justify-center shrink-0 font-bold text-primary-foreground',
      size === 'sm' ? 'size-8 text-[10px]' : 'size-9 text-[11px]'
    )}>
      {initials}
    </div>
  );
}

export function ChatPanel({ open, onClose }: ChatPanelProps) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [empSearch, setEmpSearch] = useState('');
  const [creatingConv, setCreatingConv] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Subscribe to conversations
  useEffect(() => {
    if (!user?.uid || !open) return;
    const unsub = subscribeToConversations(user.uid, setConversations);
    return unsub;
  }, [user?.uid, open]);

  // Subscribe to active conversation messages
  useEffect(() => {
    if (!activeConvId) { setMessages([]); return; }
    const unsub = subscribeToMessages(activeConvId, setMessages);
    return unsub;
  }, [activeConvId]);

  // Mark read when opening a conversation
  useEffect(() => {
    if (activeConvId && user?.uid) {
      markConversationRead(activeConvId, user.uid).catch(() => {});
    }
  }, [activeConvId, user?.uid]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when conversation selected
  useEffect(() => {
    if (activeConvId) inputRef.current?.focus();
  }, [activeConvId]);

  // Load employees for new chat
  useEffect(() => {
    if (showNewChat && employees.length === 0) {
      getAllEmployees().then(setEmployees).catch(console.error);
    }
  }, [showNewChat, employees.length]);

  const activeConv = conversations.find(c => c.id === activeConvId);
  const otherUid = activeConv?.participants.find(p => p !== user?.uid);
  const otherName = otherUid ? (activeConv?.participantNames[otherUid] ?? 'Nieznany') : '';

  const handleSend = useCallback(async () => {
    if (!input.trim() || !activeConvId || !user?.uid || sending) return;
    setSending(true);
    const text = input;
    setInput('');
    try {
      await sendMessage(
        activeConvId,
        user.uid,
        user.displayName ?? user.email ?? 'Użytkownik',
        text,
      );
    } catch {
      setInput(text);
    } finally {
      setSending(false);
    }
  }, [input, activeConvId, user, sending]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startConversation = async (emp: Employee) => {
    if (!user?.uid || !emp.authId || creatingConv) return;
    setCreatingConv(true);
    try {
      const convId = await getOrCreateConversation(
        user.uid,
        user.displayName ?? user.email ?? 'Użytkownik',
        emp.authId,
        `${emp.firstName} ${emp.lastName}`,
      );
      setActiveConvId(convId);
      setShowNewChat(false);
      setEmpSearch('');
    } finally {
      setCreatingConv(false);
    }
  };

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCounts?.[user?.uid ?? ''] ?? 0), 0);

  const filteredEmployees = employees.filter(e => {
    if (e.authId === user?.uid) return false;
    if (e.status === 'inactive') return false;
    const q = empSearch.toLowerCase();
    return !q || `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) || e.email.toLowerCase().includes(q);
  });

  if (!open) return null;

  return (
    <div className={cn(
      'fixed bottom-4 right-4 z-50',
      'flex flex-col bg-card border border-border rounded-2xl shadow-2xl',
      'overflow-hidden',
      activeConvId ? 'w-[680px] h-[520px]' : 'w-[320px] h-[480px]',
      'transition-all duration-200',
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-2">
          {(activeConvId || showNewChat) && (
            <button
              onClick={() => {
                if (activeConvId) setActiveConvId(null);
                else { setShowNewChat(false); setEmpSearch(''); }
              }}
              className="mr-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
          )}
          <MessageSquare size={15} className="text-primary" strokeWidth={2} />
          <span className="text-[13px] font-semibold text-foreground">
            {activeConvId ? otherName : showNewChat ? 'Nowa rozmowa' : 'Wiadomości'}
          </span>
          {!activeConvId && totalUnread > 0 && (
            <span className="text-[10px] font-bold bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
              {totalUnread}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {!activeConvId && !showNewChat && (
            <button
              onClick={() => setShowNewChat(true)}
              title="Nowa rozmowa"
              className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-accent transition-colors"
            >
              <Plus size={14} />
            </button>
          )}
          <button
            onClick={onClose}
            className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-accent transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Conversation list — always visible when no active conv; sidebar when active */}
        <div className={cn(
          'flex flex-col border-r border-border bg-card shrink-0',
          activeConvId ? 'w-[220px]' : 'flex-1'
        )}>
          {/* New chat search */}
          {showNewChat && !activeConvId && (
            <div className="px-3 py-2 border-b border-border">
              <div className="flex items-center gap-2 bg-muted rounded-lg px-2.5 py-1.5">
                <Search size={12} className="text-muted-foreground shrink-0" />
                <input
                  autoFocus
                  value={empSearch}
                  onChange={e => setEmpSearch(e.target.value)}
                  placeholder="Szukaj pracownika…"
                  className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-muted-foreground/60"
                />
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto no-scrollbar">
            {/* Employee picker for new chat */}
            {showNewChat && !activeConvId && (
              <div>
                {filteredEmployees.length === 0 ? (
                  <div className="px-4 py-6 text-center text-[12px] text-muted-foreground">
                    {empSearch ? 'Brak wyników' : 'Ładowanie…'}
                  </div>
                ) : (
                  filteredEmployees.map(emp => (
                    <button
                      key={emp.id}
                      disabled={creatingConv || !emp.authId}
                      onClick={() => startConversation(emp)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-accent transition-colors disabled:opacity-50"
                    >
                      <Avatar name={`${emp.firstName} ${emp.lastName}`} size="sm" />
                      <div className="text-left min-w-0">
                        <p className="text-[12px] font-medium text-foreground truncate">
                          {emp.firstName} {emp.lastName}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">{emp.email}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Conversation list */}
            {(!showNewChat || activeConvId) && conversations.map(conv => {
              const other = conv.participants.find(p => p !== user?.uid);
              const name = other ? (conv.participantNames[other] ?? 'Nieznany') : 'Nieznany';
              const unread = conv.unreadCounts?.[user?.uid ?? ''] ?? 0;
              const isActive = conv.id === activeConvId;
              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-accent transition-colors text-left',
                    isActive && 'bg-accent'
                  )}
                >
                  <Avatar name={name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={cn('text-[12px] truncate', unread > 0 ? 'font-semibold text-foreground' : 'font-medium text-foreground')}>
                        {name}
                      </p>
                      <span className="text-[10px] text-muted-foreground shrink-0 ml-1">
                        {formatMsgTime(conv.lastMessageAt ?? null)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className={cn('text-[11px] truncate', unread > 0 ? 'text-foreground' : 'text-muted-foreground')}>
                        {conv.lastMessage ?? 'Nowa rozmowa'}
                      </p>
                      {unread > 0 && (
                        <span className="ml-1 shrink-0 size-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                          {unread > 9 ? '9+' : unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}

            {!showNewChat && conversations.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full py-8 text-center gap-2">
                <MessageSquare size={28} className="text-muted-foreground/30" strokeWidth={1.5} />
                <p className="text-[12px] text-muted-foreground">Brak rozmów</p>
                <button
                  onClick={() => setShowNewChat(true)}
                  className="text-[11px] font-semibold text-primary hover:underline"
                >
                  Rozpocznij rozmowę
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Message thread */}
        {activeConvId && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-3 space-y-2">
              {messages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-[12px] text-muted-foreground">Napisz pierwszą wiadomość…</p>
                </div>
              )}
              {messages.map((msg, i) => {
                const isOwn = msg.senderId === user?.uid;
                const prevMsg = messages[i - 1];
                const showName = !isOwn && msg.senderId !== prevMsg?.senderId;
                return (
                  <div key={msg.id} className={cn('flex flex-col', isOwn ? 'items-end' : 'items-start')}>
                    {showName && (
                      <p className="text-[10px] text-muted-foreground mb-0.5 ml-1">{msg.senderName}</p>
                    )}
                    <div className={cn(
                      'max-w-[75%] rounded-2xl px-3 py-2 text-[13px] leading-snug',
                      isOwn
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-muted text-foreground rounded-bl-sm'
                    )}>
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-0.5 mx-1">
                      {formatMsgTime(msg.createdAt)}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-2.5 border-t border-border shrink-0">
              <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Napisz wiadomość…"
                  className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground/60"
                  disabled={sending}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="size-7 flex items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors shrink-0"
                >
                  <Send size={13} strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
