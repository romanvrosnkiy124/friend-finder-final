import React, { useState, useRef, useEffect } from 'react';
import { User, ChatSession, Event } from '../types';
import { ArrowLeft, Send, MoreVertical, Calendar, Info } from 'lucide-react';

interface ChatWindowProps {
  currentUser: User;
  session: ChatSession | undefined;
  partner?: User;
  event?: Event;
  isTyping?: boolean;
  isOnline?: boolean;
  onBack: () => void;
  onSendMessage: (text: string) => void;
  onProfileClick?: () => void; // <--- НОВОЕ: Функция клика по профилю
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ 
  currentUser, 
  session, 
  partner, 
  event, 
  isTyping, 
  isOnline,
  onBack, 
  onSendMessage,
  onProfileClick // Получаем функцию
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session?.messages]);

  const handleSend = () => {
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!session) return null;

  const title = partner ? partner.name : (event ? event.title : 'Чат');
  const photoUrl = partner ? partner.photoUrl : '';
  
  let statusText = '';
  if (partner) {
      statusText = isOnline ? 'В сети' : 'Не в сети';
  } else if (event) {
      statusText = `${event.participantsIds.length} участников`;
  }

  return (
    <div className="flex flex-col h-full bg-white animate-slide-in">
      
      {/* Header */}
      <div className="h-16 px-4 border-b flex items-center justify-between shrink-0 bg-white z-10 shadow-sm">
        <div className="flex items-center gap-1">
          <button onClick={onBack} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full mr-1">
            <ArrowLeft size={24} />
          </button>
          
          {/* Кликабельная область профиля */}
          <div 
            onClick={() => partner && onProfileClick && onProfileClick()} 
            className={`flex items-center gap-3 py-1 px-2 rounded-lg transition-colors ${partner ? 'cursor-pointer hover:bg-gray-50 active:bg-gray-100' : ''}`}
          >
            <div className="relative">
                {partner ? (
                <img src={photoUrl} className="w-10 h-10 rounded-full object-cover bg-gray-200" alt={title} />
                ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <Calendar size={20} />
                </div>
                )}
                
                {partner && isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                )}
            </div>

            <div className="flex flex-col">
                <h3 className="font-bold text-gray-900 leading-none">{title}</h3>
                <span className={`text-xs mt-1 ${isOnline ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                    {statusText}
                </span>
            </div>
          </div>
        </div>
        
        <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-full">
          <MoreVertical size={24} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-[#f0f2f5] space-y-3">
        {event && (
            <div className="bg-white p-3 rounded-xl shadow-sm mb-4 border border-indigo-100 flex items-start gap-3">
                <Info className="text-indigo-500 shrink-0 mt-0.5" size={20} />
                <div>
                    <p className="text-sm text-gray-800 font-medium">{event.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{event.date} • {event.locationName}</p>
                </div>
            </div>
        )}

        {session.messages.map((msg) => {
          const isMe = msg.senderId === currentUser.id;
          return (
            <div 
              key={msg.id} 
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm shadow-sm relative group ${
                  isMe 
                    ? 'bg-indigo-600 text-white rounded-br-none' 
                    : 'bg-white text-gray-900 rounded-bl-none border border-gray-100'
                }`}
              >
                {msg.text}
                <div className={`text-[10px] mt-1 text-right opacity-70 ${isMe ? 'text-indigo-100' : 'text-gray-400'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            </div>
          );
        })}
        
        {isTyping && (
            <div className="flex justify-start">
                <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none shadow-sm border border-gray-100">
                    <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                    </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white border-t flex items-center gap-2">
        <input 
          type="text" 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Напишите сообщение..." 
          className="flex-1 bg-gray-100 text-gray-900 placeholder-gray-500 px-4 py-3 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
        />
        <button 
          onClick={handleSend}
          disabled={!inputText.trim()}
          className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors shadow-md"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};
