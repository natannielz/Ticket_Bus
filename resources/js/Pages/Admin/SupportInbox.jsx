import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { MessageCircle, Search, Send, CheckCircle } from 'lucide-react';
import { io } from 'socket.io-client';

export default function SupportInbox() {
  const [activeChat, setActiveChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState('');
  const [typingUsers, setTypingUsers] = useState({}); // userId -> bool
  const socketRef = useRef(null);
  const activeChatRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Sync ref with state
  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchConversations();

    const SOCKET_URL = import.meta.env?.VITE_SOCKET_URL || 'http://localhost:3005';
    // Use a single socket connection
    const socket = io(SOCKET_URL, {
      // Optional: Add reconnection options
      reconnection: true,
      reconnectionAttempts: 5
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      // Join using the user ID from localStorage
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (storedUser.id) {
        socket.emit('join', { userId: storedUser.id, role: storedUser.role });
      }
    });

    socket.on('receive_message', (msg) => {
      console.log("[Admin Inbox] Received:", msg);

      // Use the REF to get the current active chat without re-binding the listener
      const currentChat = activeChatRef.current;

      // If message is for the currently open chat, append it
      if (currentChat && (String(msg.sender_id) === String(currentChat.sender_id) || String(msg.receiver_id) === String(currentChat.sender_id))) {
        setMessages(prev => {
          // Prevent duplicates using string comparison for IDs
          const isMe = !!msg.is_admin;
          const exists = prev.some(m => String(m.id) === String(msg.id) || (m.content === msg.content && m.isMe === isMe));

          if (exists) return prev;

          return [...prev, {
            id: msg.id,
            sender: msg.sender_name,
            content: msg.content,
            isMe: isMe,
            time: new Date(msg.created_at || Date.now()).toLocaleTimeString()
          }];
        });
      }

      // Always refresh conversation list
      fetchConversations();
    });

    socket.on('typing', (data) => {
      if (data.role !== 'admin') {
        setTypingUsers(prev => ({
          ...prev,
          [data.user_id]: data.is_typing
        }));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []); // Empty dependency array -> Run once on mount

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/admin/chat/conversations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.data) setChats(result.data.map(c => ({
        id: c.sender_id,
        name: c.sender_name,
        lastMsg: c.last_msg,
        time: new Date(c.last_msg_time).toLocaleTimeString(),
        sender_id: c.sender_id
      })));
    } catch (err) { console.error(err); }
  };

  const openChat = async (chat) => {
    setActiveChat(chat);
    try {
      const res = await fetch(`/api/chat/history/${chat.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.data) setMessages(result.data.map(m => ({
        id: m.id,
        sender: m.sender_name,
        content: m.content,
        time: new Date(m.created_at).toLocaleTimeString(),
        isMe: !!m.is_admin
      })));
    } catch (err) { console.error(err); }
  };

  const sendReply = (e) => {
    e.preventDefault();
    if (!reply.trim() || !activeChat || !socketRef.current) return;

    const msgData = {
      sender_id: user.id,
      sender_name: user.name,
      receiver_id: activeChat.sender_id,
      content: reply,
      is_admin: true
    };

    // Optimistic Update
    const tempId = `temp-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: tempId,
      sender: user.name,
      content: reply,
      time: new Date().toLocaleTimeString(),
      isMe: true
    }]);

    socketRef.current.emit('send_message', msgData);
    setReply('');

    // Clear typing
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socketRef.current.emit('typing', {
      user_id: user.id,
      user_name: user.name,
      role: 'admin',
      receiver_id: activeChat.sender_id,
      is_typing: false
    });
  };

  const handleReplyChange = (e) => {
    const val = e.target.value;
    setReply(val);

    if (!activeChat || !socketRef.current) return;

    socketRef.current.emit('typing', {
      user_id: user.id,
      user_name: user.name,
      role: 'admin',
      receiver_id: activeChat.sender_id,
      is_typing: true
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit('typing', {
        user_id: user.id,
        user_name: user.name,
        role: 'admin',
        receiver_id: activeChat.sender_id,
        is_typing: false
      });
    }, 2000);
  };

  return (
    <AdminLayout>
      <div className="flex h-[85vh] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Sidebar List */}
        <div className="w-1/3 border-r border-gray-100 flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-bold text-lg mb-4">Support Inbox</h2>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full bg-gray-50 border-0 rounded-xl pl-9 py-2 text-sm focus:ring-1 focus:ring-gray-200"
                placeholder="Search conversations..."
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {chats.map(chat => (
              <div
                key={chat.id}
                onClick={() => openChat(chat)}
                className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${activeChat?.id === chat.id ? 'bg-blue-50/50' : ''}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-xs text-gray-600">
                        {chat.name.charAt(0)}
                      </div>
                      {chat.status === 'online' && <div className="w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white absolute -bottom-0.5 -right-0.5"></div>}
                    </div>
                    <span className={`font-bold text-sm ${chat.unread ? 'text-black' : 'text-gray-600'}`}>{chat.name}</span>
                  </div>
                  <span className="text-[10px] text-gray-400">{chat.time}</span>
                </div>
                <p className={`text-xs truncate ${chat.unread ? 'font-bold text-gray-800' : 'text-gray-500'}`}>
                  {typingUsers[chat.sender_id] ? <span className="text-green-600 animate-pulse italic">Typing...</span> : chat.lastMsg}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Details */}
        <div className="w-2/3 flex flex-col bg-slate-50">
          {activeChat ? (
            <>
              {/* Header */}
              <div className="p-4 bg-white border-b border-gray-100 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold">{activeChat.name}</h3>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded-full tracking-wider">Active Ticket #8823</span>
                </div>
                <button className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1">
                  <CheckCircle size={14} /> Resolve
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl p-4 text-sm shadow-sm ${msg.isMe
                      ? 'bg-black text-white rounded-tr-none'
                      : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                      }`}>
                      <p>{msg.content}</p>
                      <p className={`text-[10px] mt-2 opacity-50 ${msg.isMe ? 'text-right' : ''}`}>{msg.time}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="p-4 bg-white border-t border-gray-200">
                <form onSubmit={sendReply} className="flex gap-3">
                  <input
                    className="flex-1 rounded-xl border-gray-200 focus:ring-black focus:border-black"
                    placeholder="Type your reply..."
                    value={reply}
                    onChange={handleReplyChange}
                  />
                  <button type="submit" className="p-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-shadow shadow-lg hover:shadow-xl">
                    <Send size={20} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <MessageCircle size={48} className="opacity-20 mb-4" />
              <p>Select a conversation to start chatting.</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
