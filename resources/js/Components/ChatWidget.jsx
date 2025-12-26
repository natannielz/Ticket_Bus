import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Minus } from 'lucide-react';
import { io } from 'socket.io-client';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [adminTyping, setAdminTyping] = useState(false);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Get user from local storage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  // Auto-scroll ref
  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]); // Scroll on message update
  useEffect(scrollToBottom, [adminTyping]); // Scroll on typing indicator toggle

  useEffect(() => {
    if (isOpen && !socketRef.current) {
      connectToChat();
    }
  }, [isOpen]);

  const connectToChat = async () => {
    if (!user.id) return;

    setIsConnecting(true);

    // Fetch History
    try {
      const res = await fetch(`/api/chat/history/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.data) setMessages(result.data.map(m => ({
        ...m,
        // Handle integer from DB
        isAdmin: !!m.is_admin,
        time: new Date(m.created_at).toLocaleTimeString()
      })));
    } catch (err) {
      console.error("History fetch failed", err);
    }

    // Initialize Socket
    const socket = io('http://localhost:3005');
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnecting(false);
      socket.emit('join', { userId: user.id, role: user.role });
    });

    socket.on('receive_message', (msg) => {
      setMessages(prev => {
        // Prevent duplicate if it's our own optimistic message coming back
        const isDuplicate = prev.some(m => m.content === msg.content && m.isAdmin === !!msg.is_admin);
        if (isDuplicate && !msg.is_admin) return prev;

        return [...prev, {
          ...msg,
          // Handle both boolean (socket) and integer (db) types
          isAdmin: !!msg.is_admin,
          time: new Date().toLocaleTimeString()
        }];
      });
    });

    socket.on('typing', (data) => {
      // data: { user_id, is_typing, role ... }
      if (data.role === 'admin') {
        setAdminTyping(data.is_typing);
      }
    });

    socket.on('disconnect', () => {
      console.log("Chat disconnected");
    });
  };

  const handleSend = () => {
    if (!input.trim() || !socketRef.current) return;

    const msgData = {
      sender_id: user.id,
      sender_name: user.name,
      receiver_id: 'admin',
      content: input,
      is_admin: false
    };

    // Optimistic Update
    const tempMsg = {
      id: `temp-${Date.now()}`,
      content: input,
      isAdmin: false,
      time: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, tempMsg]);

    socketRef.current.emit('send_message', msgData);
    setInput('');

    // Clear typing status immediately on send
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socketRef.current.emit('typing', {
      user_id: user.id,
      user_name: user.name,
      role: 'user',
      receiver_id: 'admin',
      is_typing: false
    });
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInput(val);

    if (!socketRef.current) return;

    // Don't emit typing for every char, maybe guard? But server handles it.
    // Logic: Emit 'true' immediately, then set timeout to emit 'false'.
    // If new char comes, clear timeout and re-set it.

    socketRef.current.emit('typing', {
      user_id: user.id,
      user_name: user.name,
      role: 'user',
      receiver_id: 'admin',
      is_typing: true
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit('typing', {
        user_id: user.id,
        user_name: user.name,
        role: 'user',
        receiver_id: 'admin',
        is_typing: false
      });
    }, 2000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      {/* Chat Window */}
      {isOpen && (
        <div className="pointer-events-auto bg-white w-80 h-96 rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300 mb-4">
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-900 to-black p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-2 h-2 bg-green-500 rounded-full absolute bottom-0 right-0 border border-black"></div>
                <MessageCircle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold">Luxe Support</h3>
                <p className="text-[10px] text-gray-300">Typically replies in 2m</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1 rounded"><Minus size={16} /></button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
            {isConnecting && <div className="text-center text-xs text-gray-400">Connecting to secure server...</div>}
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.isAdmin ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[80%] rounded-2xl p-3 text-xs shadow-sm ${msg.isAdmin
                  ? 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                  : 'bg-black text-white rounded-tr-none'
                  }`}>
                  <p>{msg.content}</p>
                  <p className={`text-[9px] mt-1 opacity-50 text-right`}>{msg.time}</p>
                </div>
              </div>
            ))}

            {adminTyping && (
              <div className="flex justify-start animate-pulse">
                <div className="bg-gray-200 text-gray-500 rounded-2xl p-3 text-xs shadow-sm bg-white border border-gray-100 rounded-tl-none">
                  <span className="flex gap-1">
                    <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                    <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
            <input
              className="flex-1 bg-gray-100 border-0 rounded-xl text-xs px-3 focus:ring-1 focus:ring-black"
              placeholder="Type a message..."
              value={input}
              onChange={handleInputChange}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <button
              onClick={handleSend}
              className="p-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto w-14 h-14 bg-black text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={28} className="group-hover:animate-pulse" />}
      </button>
    </div>
  );
}
