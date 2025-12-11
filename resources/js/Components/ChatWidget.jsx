import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Minus } from 'lucide-react';

// Mocking gRPC Client import (In real implementation, this comes from protoc-gen-grpc-web)
// import { ChatServiceClient } from '@/services/proto/Bus_systemServiceClientPb';
// import { ChatMessage, UserIdentity } from '@/services/proto/bus_system_pb';

export default function ChatWidget({ userId = 'guest-001', userName = 'Guest' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  // Auto-scroll ref
  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  // Simulate gRPC Connection
  useEffect(() => {
    if (isOpen) {
      connectToChat();
    }
    // distinct cleanup if real stream
  }, [isOpen]);

  const connectToChat = () => {
    setIsConnecting(true);
    // gRPC Logic:
    // const client = new ChatServiceClient('http://localhost:8080'); // Envoy Proxy URL
    // const stream = client.joinChat(new UserIdentity().setUserId(userId));

    // stream.on('data', (response) => {
    //   const msg = response.toObject();
    //   setMessages(prev => [...prev, msg]);
    // });

    // SIMULATION for Demo (since we lack Envoy):
    setTimeout(() => {
      setIsConnecting(false);
      setMessages([
        { id: 1, sender: 'admin', content: 'Halo! Ada yang bisa kami bantu?', isAdmin: true, time: new Date().toLocaleTimeString() }
      ]);
    }, 1000);
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: userId,
      content: input,
      isAdmin: false,
      time: new Date().toLocaleTimeString()
    };

    // UI Update (Optimistic)
    setMessages(prev => [...prev, newMsg]);
    setInput('');

    // gRPC Call:
    // const msgFn = new ChatMessage();
    // msgFn.setSenderId(userId);
    // msgFn.setContent(input);
    // client.sendMessage(msgFn);

    // Simulation Reply
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'admin',
        content: 'Terima kasih, agen kami akan segera merespons.',
        isAdmin: true,
        time: new Date().toLocaleTimeString()
      }]);
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
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
            <input
              className="flex-1 bg-gray-100 border-0 rounded-xl text-xs px-3 focus:ring-1 focus:ring-black"
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
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
