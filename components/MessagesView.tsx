
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { db, supabase } from '../services/supabase';
import { UserProfile, Message } from '../types';

interface MessagesViewProps {
  user: UserProfile;
}

interface MessageWithStatus extends Message {
  deliveryStatus?: 'sending' | 'failed' | 'delivered';
}

const MessagesView: React.FC<MessagesViewProps> = ({ user }) => {
  const [contacts, setContacts] = useState<UserProfile[]>([]);
  const [selectedContact, setSelectedContact] = useState<UserProfile | null>(null);
  const [allUserMessages, setAllUserMessages] = useState<MessageWithStatus[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isAdmin = user.role === 'admin';

  useEffect(() => {
    const initCommCenter = async () => {
      try {
        setLoading(true);
        setDbError(null);
        
        const isDbReady = await db.verifyDatabase();
        if (!isDbReady) {
          setDbError("Ecosystem Desynchronized: The 'messages' table is missing. Copy the code from schema.sql into your Supabase SQL Editor.");
          setLoading(false);
          return;
        }

        const allProfiles = await db.getAllProfiles();
        const filteredContacts = isAdmin
          ? allProfiles.filter(p => p.role === 'student')
          : allProfiles.filter(p => p.role === 'admin');
        
        setContacts(filteredContacts);

        const initialMsgs = await db.getMessages(user.id);
        setAllUserMessages(initialMsgs.map(m => ({ ...m, deliveryStatus: 'delivered' })));
      } catch (err: any) {
        console.error("Comm Center Init Error:", err);
        if (err.message?.includes('PGRST205') || err.code === 'PGRST205') {
          setDbError("Schema Cache Miss: Table 'messages' not found in database.");
        }
      } finally {
        setLoading(false);
      }
    };
    initCommCenter();
  }, [isAdmin, user.id]);

  // Mark messages as read when a contact is selected
  useEffect(() => {
    if (selectedContact) {
      const markAsRead = async () => {
        try {
          await db.markMessagesAsRead(user.id, selectedContact.id);
          // Locally update current chat messages to be read
          setAllUserMessages(prev => prev.map(m => 
            (m.receiver_id === user.id && m.sender_id === selectedContact.id) 
              ? { ...m, is_read: true } 
              : m
          ));
        } catch (e) {
          console.error("Failed to mark messages as read", e);
        }
      };
      markAsRead();
    }
  }, [selectedContact, user.id]);

  useEffect(() => {
    if (dbError) return;

    const currentUserId = user.id;
    const channel = supabase
      .channel('messages_realtime_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new as Message;
            if (newMsg.sender_id === currentUserId || newMsg.receiver_id === currentUserId) {
              setAllUserMessages(prev => {
                if (prev.some(m => m.id === newMsg.id)) return prev;
                
                if (newMsg.sender_id === currentUserId) {
                  const optimisticIdx = prev.findIndex(m => 
                     m.id.startsWith('temp_') && 
                     m.content.trim() === newMsg.content.trim() && 
                     m.receiver_id === newMsg.receiver_id
                  );

                  if (optimisticIdx !== -1) {
                    const updated = [...prev];
                    updated[optimisticIdx] = { ...newMsg, deliveryStatus: 'delivered' };
                    return updated;
                  }
                }
                return [...prev, { ...newMsg, deliveryStatus: 'delivered' }];
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedMsg = payload.new as Message;
            if (updatedMsg.receiver_id === currentUserId || updatedMsg.sender_id === currentUserId) {
              setAllUserMessages(prev => prev.map(m => m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id, dbError]);

  const currentChatMessages = useMemo(() => {
    if (!selectedContact) return [];
    return allUserMessages.filter(m => 
      (m.sender_id === user.id && m.receiver_id === selectedContact.id) ||
      (m.sender_id === selectedContact.id && m.receiver_id === user.id)
    );
  }, [allUserMessages, selectedContact, user.id]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    if (currentChatMessages.length > 0) {
      scrollToBottom();
    }
  }, [currentChatMessages.length, selectedContact?.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedContact || sending || dbError) return;

    const messageContent = newMessage.trim();
    const tempId = `temp_${crypto.randomUUID()}`;
    
    const optimisticMsg: MessageWithStatus = {
      id: tempId,
      sender_id: user.id,
      receiver_id: selectedContact.id,
      content: messageContent,
      created_at: new Date().toISOString(),
      is_read: false,
      deliveryStatus: 'sending'
    };

    setAllUserMessages(prev => [...prev, optimisticMsg]);
    setNewMessage('');
    setSending(true);

    try {
      await db.sendMessage(user.id, selectedContact.id, messageContent);
    } catch (err) {
      console.error("Transmission Error:", err);
      // Mark as failed instead of removing to prevent "blink"
      setAllUserMessages(prev => prev.map(m => m.id === tempId ? { ...m, deliveryStatus: 'failed' } : m));
    } finally {
      setSending(false);
    }
  };

  const retryMessage = async (msg: MessageWithStatus) => {
    setAllUserMessages(prev => prev.map(m => m.id === msg.id ? { ...m, deliveryStatus: 'sending' } : m));
    try {
      await db.sendMessage(user.id, msg.receiver_id, msg.content);
    } catch (err) {
      setAllUserMessages(prev => prev.map(m => m.id === msg.id ? { ...m, deliveryStatus: 'failed' } : m));
    }
  };

  const getContactMeta = (contactId: string) => {
    const thread = allUserMessages.filter(m => 
      (m.sender_id === user.id && m.receiver_id === contactId) ||
      (m.sender_id === contactId && m.receiver_id === user.id)
    );
    const lastMsg = thread[thread.length - 1];
    const unreadCount = thread.filter(m => m.receiver_id === user.id && !m.is_read).length;
    return { lastMsg, unreadCount };
  };

  if (loading) return (
    <div className="py-24 flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#790BFD] border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(121,11,253,0.3)]"></div>
      <p className="text-[#790BFD] font-black animate-pulse uppercase tracking-widest text-xs">Linking Terminals...</p>
    </div>
  );

  if (dbError) return (
    <div className="h-[70vh] flex flex-col items-center justify-center p-12 text-center bg-[#181922] border border-red-500/20 rounded-[48px] shadow-2xl">
      <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center text-4xl mb-8 animate-pulse">⚠️</div>
      <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Comm Link Error</h2>
      <p className="text-[#A1A1B3] font-bold max-w-lg mb-10 leading-relaxed uppercase tracking-widest text-xs">{dbError}</p>
      <div className="bg-[#0E0E17] p-8 rounded-3xl border border-[#232435] text-left max-w-xl w-full">
         <p className="text-[10px] font-black text-[#790BFD] uppercase tracking-widest mb-4">Final Step to Fix:</p>
         <ol className="text-xs font-bold text-[#4C4D5E] space-y-3 list-decimal pl-5">
           <li>Go to Supabase Dashboard &gt; SQL Editor</li>
           <li>Paste the code from <code>schema.sql</code> and click Run</li>
           <li>Refresh this page</li>
         </ol>
      </div>
      <button onClick={() => window.location.reload()} className="mt-12 px-12 py-5 bg-[#790BFD] text-white rounded-[32px] font-black uppercase text-xs tracking-widest shadow-xl">Re-sync Interface</button>
    </div>
  );

  return (
    <div className="h-[75vh] flex bg-[#181922] border border-[#232435] rounded-[48px] overflow-hidden shadow-2xl animate-in fade-in">
      {/* Directory */}
      <div className="w-80 border-r border-[#232435] flex flex-col bg-[#0E0E17]/20">
        <div className="p-8 border-b border-[#232435] flex items-center justify-between">
           <h3 className="text-[11px] font-black text-[#790BFD] uppercase tracking-[0.4em]">Directory</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {contacts.map(contact => {
            const { lastMsg, unreadCount } = getContactMeta(contact.id);
            const isSelected = selectedContact?.id === contact.id;
            return (
              <button
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className={`w-full flex items-center gap-4 p-4 rounded-[28px] transition-all relative group ${isSelected ? 'bg-[#790BFD]/10 border border-[#790BFD]/30' : 'hover:bg-[#181922] border border-transparent'}`}
              >
                <div className="relative shrink-0">
                  <img src={contact.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.id}`} className={`w-12 h-12 rounded-2xl border-2 transition-all ${isSelected ? 'border-[#790BFD]' : 'border-[#232435]'}`} alt="" />
                  {unreadCount > 0 && !isSelected && <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-[#181922] flex items-center justify-center text-[8px] font-black text-white">{unreadCount}</div>}
                </div>
                <div className="text-left overflow-hidden flex-1">
                  <p className={`text-xs font-black truncate ${isSelected ? 'text-[#790BFD]' : 'text-white'}`}>{contact.name}</p>
                  <p className="text-[9px] font-bold text-[#4C4D5E] uppercase truncate tracking-tighter mt-0.5">{lastMsg?.content || 'Node Online'}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col relative bg-[#0E0E17]/30">
        {selectedContact ? (
          <>
            <div className="p-8 border-b border-[#232435] flex items-center justify-between bg-[#181922]/50 backdrop-blur-xl relative z-10">
              <div className="flex items-center gap-4">
                <img src={selectedContact.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedContact.id}`} className="w-12 h-12 rounded-2xl border border-[#790BFD]/30" alt="" />
                <div>
                  <h4 className="text-base font-black text-white">{selectedContact.name}</h4>
                  <p className="text-[9px] font-black text-[#3DD598] uppercase tracking-widest">Protocol Active</p>
                </div>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar relative bg-black/5">
              {currentChatMessages.map(msg => {
                const isMine = msg.sender_id === user.id;
                const status = msg.deliveryStatus || 'delivered';
                
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                    <div className="max-w-[75%] flex flex-col items-end gap-1">
                      <div className={`p-5 rounded-[28px] text-sm font-bold shadow-xl relative transition-all ${
                        status === 'sending' ? 'opacity-40 animate-pulse' : 
                        status === 'failed' ? 'border-red-500 bg-red-500/10 text-red-500' : 'opacity-100'
                      } ${
                        isMine 
                          ? (status === 'failed' ? '' : 'bg-[#790BFD] text-white rounded-br-none')
                          : 'bg-[#181922] border border-[#232435] text-[#A1A1B3] rounded-bl-none shadow-[#00000044]'
                      }`}>
                        {msg.content}
                        <div className="flex items-center gap-2 mt-2">
                           <p className={`text-[8px] font-black uppercase opacity-40 ${isMine && status !== 'failed' ? 'text-white' : 'text-[#4C4D5E]'}`}>
                             {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </p>
                           {isMine && status === 'delivered' && <span className="text-[8px] opacity-60">✓✓</span>}
                        </div>
                      </div>
                      {status === 'failed' && (
                        <button onClick={() => retryMessage(msg)} className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:underline px-4">Retry Pulse ⚡</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-8 bg-[#181922]/80 backdrop-blur-xl border-t border-[#232435] relative z-10">
              <form onSubmit={handleSendMessage} className="flex gap-4">
                <input 
                  type="text" 
                  autoFocus
                  disabled={sending}
                  value={newMessage} 
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder={`Dispatch message...`} 
                  className="flex-1 bg-[#0E0E17] border border-[#232435] rounded-[32px] px-8 py-5 text-white font-bold outline-none focus:border-[#790BFD] transition-all shadow-inner text-sm disabled:opacity-50" 
                />
                <button 
                  type="submit" 
                  disabled={!newMessage.trim() || sending}
                  className="px-10 bg-[#790BFD] text-white rounded-[32px] font-black uppercase text-[10px] tracking-widest shadow-2xl hover:bg-[#8d2dfd] active:scale-95 transition-all disabled:opacity-50"
                >
                  {sending ? 'Syncing...' : 'Dispatch'}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-20">
            <div className="w-32 h-32 bg-[#181922] border border-[#232435] rounded-[48px] flex items-center justify-center text-5xl mb-8 shadow-2xl">
              <span className="animate-pulse">🛰️</span>
            </div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">Select Node</h3>
            <p className="text-[11px] font-black text-[#4C4D5E] uppercase tracking-[0.4em] max-w-sm">Establish a secure data link to start real-time messaging.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesView;
