import React from 'react';
import { ChatSession, User, Event } from '../types';
import { MessageCircle, Calendar, ChevronRight } from 'lucide-react';

interface ChatListProps {
  sessions: ChatSession[];
  users: User[];
  events: Event[];
  onSelectChat: (id: string) => void;
  onlineUsers: Set<string>; // <--- НОВОЕ: Список тех, кто онлайн
}

export const ChatList: React.FC<ChatListProps> = ({ 
  sessions, 
  users, 
  events, 
  onSelectChat,
  onlineUsers 
}) => {
  
  if (sessions.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <MessageCircle size={32} className="opacity-50" />
        </div>
        <h3 className="font-semibold text-lg text-gray-600">Нет сообщений</h3>
        <p className="text-sm mt-2">Находите друзей в поиске или на карте, чтобы начать общение!</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-3">
      <h2 className="text-xl font-bold text-gray-800 mb-4 px-1">Ваши чаты</h2>
      
      {sessions.map(session => {
        let name = '';
        let avatar = '';
        let subtitle = '';
        let isOnline = false;

        // Логика для Личных чатов
        if (session.type === 'direct') {
          const partner = users.find(u => u.id === session.id);
          name = partner ? partner.name : 'Неизвестный';
          avatar = partner ? partner.photoUrl : '';
          // Проверяем, онлайн ли человек
          isOnline = onlineUsers.has(session.id); 
        } 
        // Логика для Событий
        else {
          const event = events.find(e => e.id === session.eventId);
          name = event ? event.title : 'Событие удалено';
          avatar = ''; // Для событий можно сделать иконку
          subtitle = 'Групповой чат';
        }

        // Последнее сообщение
        const lastMsg = session.messages[session.messages.length - 1];
        const lastMsgText = lastMsg ? lastMsg.text : 'Нет сообщений';
        const time = lastMsg ? new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

        return (
          <div 
            key={session.id}
            onClick={() => onSelectChat(session.id)}
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:bg-gray-50 transition-colors active:scale-[0.98]"
          >
            {/* Аватарка + Индикатор Онлайн */}
            <div className="relative shrink-0">
              {session.type === 'direct' ? (
                <img src={avatar} alt={name} className="w-14 h-14 rounded-full object-cover bg-gray-200" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <Calendar size={24} />
                </div>
              )}
              
              {/* Зеленая точка (только для личных чатов) */}
              {session.type === 'direct' && isOnline && (
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-1">
                <h3 className="font-bold text-gray-900 truncate pr-2">{name}</h3>
                <span className="text-xs text-gray-400 shrink-0">{time}</span>
              </div>
              <p className={`text-sm truncate ${session.unread > 0 ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
                {session.unread > 0 && <span className="inline-block w-2 h-2 bg-indigo-600 rounded-full mr-2"></span>}
                {lastMsgText}
              </p>
            </div>
            
            <ChevronRight size={20} className="text-gray-300" />
          </div>
        );
      })}
    </div>
  );
};
