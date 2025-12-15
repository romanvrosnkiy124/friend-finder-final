import React from 'react';
import { Event, User } from '../types';
import { Calendar, MapPin, Users, MessageCircle, Plus } from 'lucide-react';
import { Button } from './Button';

interface EventListProps {
  events: Event[];
  users: User[];
  currentUser: User;
  onJoinEvent: (eventId: string) => void;
  onCreateEventClick: () => void;
}

export const EventList: React.FC<EventListProps> = ({ 
  events, 
  users, 
  currentUser,
  onJoinEvent, 
  onCreateEventClick 
}) => {
  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="p-4 bg-white shadow-sm shrink-0 flex justify-between items-center z-10">
        <h2 className="text-xl font-bold text-gray-800">События рядом</h2>
        <button 
          onClick={onCreateEventClick}
          className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 shadow-md transition-all active:scale-95"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <Calendar size={48} className="mb-4 opacity-50" />
                <p>Пока нет событий</p>
                <p className="text-sm">Создайте первое!</p>
            </div>
        ) : (
            events.map(event => {
              const isParticipant = event.participantsIds.includes(currentUser.id);
              const organizer = users.find(u => u.id === event.organizerId);
              
              return (
                <div key={event.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                        <h3 className="font-bold text-lg text-gray-800 leading-tight mb-1">{event.title}</h3>
                        <div className="flex items-center text-xs text-gray-500">
                            <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-medium">
                                {organizer ? organizer.name : 'Автор неизвестен'}
                            </span>
                        </div>
                    </div>
                    <div className="text-center bg-gray-50 px-3 py-1 rounded-lg min-w-[3.5rem]">
                        <span className="block text-xs text-gray-400 uppercase font-bold">{new Date(event.date).toLocaleString('ru', { month: 'short' })}</span>
                        <span className="block text-xl font-bold text-indigo-600">{new Date(event.date).getDate()}</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>
                  
                  <div className="flex flex-col gap-2 mb-4">
                      <div className="flex items-center text-gray-500 text-sm">
                        <MapPin size={16} className="mr-2 text-indigo-400" />
                        {event.locationName}
                      </div>
                      <div className="flex items-center text-gray-500 text-sm">
                        <Users size={16} className="mr-2 text-indigo-400" />
                        {event.participantsIds.length} участников
                      </div>
                  </div>

                  {event.tags && event.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {event.tags.map(tag => (
                        <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">#{tag}</span>
                      ))}
                    </div>
                  )}

                  <Button 
                    fullWidth 
                    variant={isParticipant ? "secondary" : "primary"}
                    onClick={() => onJoinEvent(event.id)}
                    className="flex items-center justify-center gap-2"
                  >
                    {isParticipant ? (
                        <>
                            <MessageCircle size={18} />
                            Открыть чат
                        </>
                    ) : (
                        "Присоединиться"
                    )}
                  </Button>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
};
