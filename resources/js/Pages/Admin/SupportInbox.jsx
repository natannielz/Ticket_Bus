import React, { useState, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { MessageCircle, Search, User, Clock, Send, CheckCircle } from 'lucide-react';

export default function SupportInbox() {
  const [activeChat, setActiveChat] = useState(null);
  const [chats, setChats] = useState([
    { id: 'u1', name: 'User 123', lastMsg: 'Does the bus have WiFi?', time: '2m', unread: true, status: 'online' },
    { id: 'u2', name: 'Budi Santoso', lastMsg: 'Can I reschedule?', time: '1h', unread: false, status: 'offline' },
  ]);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState('');

  // Simulate Receiving "ChatEvent" from gRPC Stream
  useEffect(() => {
    // const stream = client.StreamChatUpdates(new Empty());
    // stream.on('data', (update) => { ... handle new msg ... });

    // Mock incoming every 10s
    const interval = setInterval(() => {
      const newMsgCheck = Math.random() > 0.7;
      if (newMsgCheck) {
        // Flash badge or update list
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const openChat = (chat) => {
    setActiveChat(chat);
    // Fetch history using gRPC (mocked here)
    setMessages([
      { id: 1, sender: chat.name, content: chat.lastMsg, time: chat.time, isMe: false }
    ]);
    // Mark read
    setChats(prev => prev.map(c => c.id === chat.id ? { ...c, unread: false } : c));
  };

  const sendReply = (e) => {
    e.preventDefault();
    if (!reply.trim()) return;

    setMessages(prev => [...prev, {
      id: Date.now(),
      sender: 'You',
      content: reply,
      time: 'Just now',
      isMe: true
    }]);
    setReply('');

    // gRPC: client.sendMessage(...)
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
                <p className={`text-xs truncate ${chat.unread ? 'font-bold text-gray-800' : 'text-gray-500'}`}>{chat.lastMsg}</p>
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
                    onChange={e => setReply(e.target.value)}
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
