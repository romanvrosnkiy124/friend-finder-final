import React, { useState, useMemo, useEffect } from 'react';
import { 
  User, 
  AppView, 
  FilterState, 
  ChatSession,
  Event
} from './types';
import { 
  MOCK_USERS, 
  MOCK_CHATS_INITIAL, 
  MOCK_EVENTS,
  MOCK_INCOMING_LIKES,
  MOCK_CENTER_LAT,
  MOCK_CENTER_LNG
} from './constants';
import { 
  Map, 
  MessageCircle, 
  User as UserIcon, 
  RotateCcw, 
  Filter, 
  Heart, 
  X,
  Search,
  Calendar,
  RefreshCw,
  MapPin,
  Globe,
  Send,
  Loader2
} from 'lucide-react';

import { UserCard } from './components/UserCard';
import { Button } from './components/Button';
import { FilterModal } from './components/FilterModal';
import { MapView } from './components/MapView';
import { ChatList } from './components/ChatList';
import { ChatWindow } from './components/ChatWindow';
import { EventList } from './components/EventList';
import { CreateEventModal } from './components/CreateEventModal';
import { EditProfileModal } from './components/EditProfileModal';
import { MatchModal } from './components/MatchModal';
import { RegistrationForm } from './components/RegistrationForm';
import { LikesList } from './components/LikesList';
import { generateCelebrityReply } from './services/geminiService';
import { supabase } from './supabaseClient';

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat1)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; 
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

const App: React.FC = () => {
  // ==========================================
  // 1. СОСТОЯНИЯ (STATE)
  // ==========================================
  const [view, setView] = useState<AppView>('register');
  const [isLoading, setIsLoading] = useState(true);
  
  // НОВОЕ: Список ID пользователей, которые сейчас онлайн
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  const [currentUser, setCurrentUser] = useState<User>({
    id: 'me',
    name: '',
    age: 0,
    gender: 'male',
    photoUrl: '',
    bio: '',
    interests: [],
    location: { lat: MOCK_CENTER_LAT, lng: MOCK_CENTER_LNG },
  });

  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>(MOCK_CHATS_INITIAL);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>(MOCK_EVENTS);
  const [incomingLikes, setIncomingLikes] = useState<string[]>([]);
  
  const [filters, setFilters] = useState<FilterState>({
    ageRange: [18, 99],
    gender: 'all',
    interests: [],
    radius: 50,
  });

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [swipedUserIds, setSwipedUserIds] = useState<Set<string>>(new Set());
  const [animatingButton, setAnimatingButton] = useState<'left' | 'right' | null>(null);
  const [typingChatId, setTypingChatId] = useState<string | null>(null);
  const [dailyDirectMessagesCount, setDailyDirectMessagesCount] = useState(0);
  const [inspectingUser, setInspectingUser] = useState<User | null>(null);
  const [matchModalUser, setMatchModalUser] = useState<User | null>(null);

  // ==========================================
  // 2. ФУНКЦИИ (LOGIC)
  // ==========================================

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data) {
        setCurrentUser({
          id: data.id,
          name: data.full_name || 'Без имени',
          age: data.age || 18,
          gender: 'male',
          photoUrl: data.avatar_url || '', 
          bio: data.bio || '', 
          city: data.city || '', 
          interests: data.interests ? data.interests.split(',') : [],
          location: (data.latitude && data.longitude) 
            ? { lat: data.latitude, lng: data.longitude } 
            : { lat: MOCK_CENTER_LAT, lng: MOCK_CENTER_LNG }, 
        });
        setView('map');
        updateUserLocation();
        fetchEvents();
      }
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserLocation = () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      
      setCurrentUser(prev => ({
        ...prev,
        location: { lat: latitude, lng: longitude }
      }));

      if (currentUser.id !== 'me') {
        await supabase
          .from('profiles')
          .update({ latitude: latitude, longitude: longitude })
          .eq('id', currentUser.id);
      }
    }, (error) => {
      console.error("Ошибка GPS:", error);
    });
  };

  const fetchRealUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', currentUser.id); 

      if (data && data.length > 0) {
        const realUsers: User[] = data.map(u => ({
          id: u.id,
          name: u.full_name || 'Аноним',
          age: u.age || 25,
          gender: 'male',
          photoUrl: u.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
          bio: 'Пользователь приложения',
          interests: u.interests ? u.interests.split(',') : [],
          location: { 
            lat: u.latitude || MOCK_CENTER_LAT, 
            lng: u.longitude || MOCK_CENTER_LNG 
          }
        }));
        setUsers(realUsers);
      } else {
        setUsers([]); 
      }
    } catch (error) {
      console.error('Ошибка загрузки людей:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase.from('events').select('*').order('created_at', { ascending: false });
      
      if (data) {
        const loadedEvents: Event[] = data.map(e => ({
          id: e.id.toString(),
          title: e.title,
          description: e.description,
          date: e.date,
          locationName: e.location_name,
          organizerId: e.organizer_id,
          participantsIds: e.participants_ids || [],
          tags: e.tags ? e.tags.split(',') : []
        }));
        setEvents(loadedEvents);
      }
    } catch (error) {
      console.error("Ошибка загрузки событий:", error);
    }
  };

  // ==========================================
  // 3. ЭФФЕКТЫ (EFFECTS)
  // ==========================================

  // --- НОВОЕ: ОТСЛЕЖИВАНИЕ ОНЛАЙН СТАТУСА (PRESENCE) ---
  useEffect(() => {
    if (currentUser.id === 'me') return;

    // Создаем канал для отслеживания статуса
    const presenceChannel = supabase.channel('online_users', {
      config: {
        presence: {
          key: currentUser.id,
        },
      },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        // Получаем список всех, кто онлайн
        const newState = presenceChannel.presenceState();
        const onlineIds = new Set(Object.keys(newState));
        setOnlineUsers(onlineIds);
        console.log('Пользователи онлайн:', onlineIds);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Говорим всем: "Я онлайн!"
          await presenceChannel.track({
            online_at: new Date().toISOString(),
            user_id: currentUser.id,
          });
        }
      });

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [currentUser.id]);


  // --- Эффект 1: Проверка входа ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchUserProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        if (currentUser.id === 'me') { 
             fetchUserProfile(session.user.id);
        }
      } else {
        setView('register');
        setCurrentUser(prev => ({ ...prev, id: 'me' }));
        setIsLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // --- Эффект 2: Загрузка людей ---
  useEffect(() => {
    if (currentUser.id !== 'me') {
      fetchRealUsers();
    }
  }, [currentUser.id]); 

  // --- Эффект 3: ЧАТ ---
  useEffect(() => {
    if (currentUser.id === 'me') return;

    const loadChatHistory = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: true });

      if (data) {
        const newSessions: ChatSession[] = [];
        
        data.forEach(msg => {
          const partnerId = msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id;
          
          let session = newSessions.find(s => s.id === partnerId);
          if (!session) {
            session = { id: partnerId, type: 'direct', messages: [], unread: 0 };
            newSessions.push(session);
          }
          
          session.messages.push({
            id: msg.id.toString(),
            senderId: msg.sender_id,
            receiverId: msg.receiver_id,
            text: msg.text,
            timestamp: new Date(msg.created_at).getTime()
          });
        });
        
        if (newSessions.length > 0) {
            setChatSessions(prev => {
                const combined = [...prev.filter(s => !newSessions.find(ns => ns.id === s.id)), ...newSessions];
                return combined;
            });
        }
      }
    };
    
    loadChatHistory();

    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
         const newMsg = payload.new;
         
         if (newMsg.sender_id === currentUser.id) return;

         if (newMsg.receiver_id === currentUser.id) {
            const partnerId = newMsg.sender_id;
            
            const messageObj = {
                id: newMsg.id.toString(),
                senderId: newMsg.sender_id,
                receiverId: newMsg.receiver_id,
                text: newMsg.text,
                timestamp: new Date(newMsg.created_at).getTime()
            };

            setChatSessions(prev => {
                const existing = prev.find(s => s.id === partnerId);
                if (existing) {
                    if (existing.messages.some(m => m.timestamp === messageObj.timestamp)) {
                        return prev;
                    }
                    return prev.map(s => s.id === partnerId ? {
                        ...s,
                        messages: [...s.messages, messageObj],
                        unread: (activeSessionId !== partnerId) ? s.unread + 1 : s.unread
                    } : s);
                } else {
                    return [{
                        id: partnerId,
                        type: 'direct',
                        messages: [messageObj],
                        unread: 1
                    }, ...prev];
                }
            });
         }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser.id, activeSessionId]);


  // ==========================================
  // 4. ОСТАЛЬНАЯ ЛОГИКА
  // ==========================================

  const visibleUsers = useMemo(() => {
    return users.map(user => ({
      ...user,
      distance: getDistanceFromLatLonInKm(
        currentUser.location.lat, 
        currentUser.location.lng, 
        user.location.lat, 
        user.location.lng
      )
    })).filter(user => {
      if (view === 'swipe' && swipedUserIds.has(user.id)) return false;
      if (filters.radius < 100 && (user.distance || 0) > filters.radius) return false;
      if (filters.gender !== 'all' && user.gender !== filters.gender) return false;
      if (user.age < filters.ageRange[0] || user.age > filters.ageRange[1]) return false;
      
      if (filters.interests.length > 0) {
        const hasCommon = user.interests.some(i => filters.interests.includes(i));
        if (!hasCommon) return false;
      }
      return true;
    });
  }, [users, currentUser, swipedUserIds, filters, view]);

  const processLike = (targetUser: User) => {
    setSwipedUserIds(prev => new Set(prev).add(targetUser.id));
    const commonInterests = currentUser.interests.filter(i => targetUser.interests.includes(i));
    
    if (commonInterests.length >= 1) {
        const existing = chatSessions.find(s => s.id === targetUser.id);
        if (!existing) {
          setChatSessions(prev => [
            { id: targetUser.id, type: 'direct', messages: [], unread: 0 },
            ...prev
          ]);
          setMatchModalUser(targetUser);
        }
        setIncomingLikes(prev => prev.filter(id => id !== targetUser.id));
    } else {
        if (incomingLikes.includes(targetUser.id)) {
            setIncomingLikes(prev => prev.filter(id => id !== targetUser.id));
            alert(`К сожалению, у вас с ${targetUser.name} нет общих интересов.`);
        }
    }
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    setAnimatingButton(direction);
    setTimeout(() => setAnimatingButton(null), 300);

    if (visibleUsers.length === 0) return;
    const userToSwipe = visibleUsers[0];
    
    if (direction === 'right') {
        processLike(userToSwipe);
    } else {
        setSwipedUserIds(prev => new Set(prev).add(userToSwipe.id));
    }
  };

  const handleIncomingReject = (userId: string) => {
      setIncomingLikes(prev => prev.filter(id => id !== userId));
      setSwipedUserIds(prev => new Set(prev).add(userId));
  };

  const handleSendMessage = async (text: string) => {
    if (!activeSessionId) return;

    const optimisticMessage = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      receiverId: activeSessionId,
      text,
      timestamp: Date.now()
    };

    setChatSessions(prev => prev.map(session => {
      if (session.id === activeSessionId) {
        return {
          ...session,
          messages: [...session.messages, optimisticMessage]
        };
      }
      return session;
    }));

    try {
      const { error } = await supabase
        .from('messages')
        .insert([
          {
            sender_id: currentUser.id,
            receiver_id: activeSessionId,
            text: text
          }
        ]);
        
      if (error) console.error('Ошибка отправки:', error);

    } catch (err) {
      console.error(err);
    }
  };

  const openProfile = async (user: User) => {
    setInspectingUser(user);
  };

  const handleStartChatFromModal = () => {
    if (matchModalUser) {
        setActiveSessionId(matchModalUser.id);
        setView('chat');
        setMatchModalUser(null);
    }
  };

  const handleMapDirectMessage = (targetUser: User) => {
      if (dailyDirectMessagesCount >= 3) {
          alert('На сегодня лимит прямых сообщений исчерпан (3/3).');
          return;
      }
      const existing = chatSessions.find(s => s.id === targetUser.id);
      if (!existing) {
          setChatSessions(prev => [
            { id: targetUser.id, type: 'direct', messages: [], unread: 0 },
            ...prev
          ]);
      }
      setDailyDirectMessagesCount(prev => prev + 1);
      setInspectingUser(null);
      setActiveSessionId(targetUser.id);
      setView('chat');
  };

  const handleJoinEvent = async (eventId: string) => {
    const targetEvent = events.find(e => e.id === eventId);
    if (!targetEvent) return;

    const isAlreadyJoined = targetEvent.participantsIds.includes(currentUser.id);

    // ВАРИАНТ 1: Мы уже участники -> Просто открываем чат
    if (isAlreadyJoined) {
        const existingSession = chatSessions.find(s => s.id === eventId);
        if (!existingSession) {
             setChatSessions(prev => [{
                 id: eventId,
                 type: 'event',
                 eventId: eventId,
                 messages: [],
                 unread: 0
             }, ...prev]);
        }
        setActiveSessionId(eventId);
        setView('chat');
        return; 
    }

    // ВАРИАНТ 2: Мы НЕ участники -> Вступаем через Базу
    const newParticipants = [...targetEvent.participantsIds, currentUser.id];

    // 1. Оптимистичное обновление интерфейса
    setEvents(prev => prev.map(event => {
        if (event.id === eventId) {
            return { ...event, participantsIds: newParticipants };
        }
        return event;
    }));

    // 2. Отправка в Supabase
    try {
        const { error } = await supabase
            .from('events')
            .update({ participants_ids: newParticipants })
            .eq('id', eventId);
        
        if (error) throw error;

        // 3. Создаем сессию чата и переходим
        setChatSessions(prev => [{
             id: eventId,
             type: 'event',
             eventId: eventId,
             messages: [],
             unread: 0
        }, ...prev]);
        
        setActiveSessionId(eventId);
        setView('chat');

    } catch (error) {
        console.error("Ошибка вступления:", error);
        alert("Не удалось вступить в событие");
        fetchEvents();
    }
  };

  const handleCreateEvent = async (data: Partial<Event>) => {
      try {
          const { error } = await supabase.from('events').insert([{
              title: data.title,
              description: data.description || '',
              date: data.date,
              location_name: data.locationName,
              tags: data.tags ? data.tags.join(',') : '',
              organizer_id: currentUser.id,
              participants_ids: [currentUser.id]
          }]);

          if (error) throw error;

          fetchEvents();
          setActiveSessionId(null); 
          setView('events');

      } catch (error: any) {
          console.error("Ошибка создания:", error);
          alert("Не удалось создать событие: " + error.message);
      }
  };

  const handleUpdateProfile = (updatedUser: User) => {
    setCurrentUser(updatedUser);
  };

  const handleRegistrationComplete = (user: User) => {
    setCurrentUser(user);
    setView('swipe');
  };

  const handleResetFilters = () => {
    setFilters({ ageRange: [18, 99], gender: 'all', interests: [], radius: 50 });
  };

  const handleIncreaseRadius = () => {
    setFilters(prev => ({ ...prev, radius: 100 }));
  };

  // --- RENDER ---
  
  // ИСПРАВЛЕНИЕ: ЭКРАН ЗАГРУЗКИ (РУКОПОЖАТИЕ 🤝)
  if (isLoading) {
    return (
      <div className="max-w-md mx-auto h-[100dvh] bg-white flex flex-col items-center justify-center">
         <div className="flex items-center justify-center mb-6 animate-bounce">
            {/* Твой эмодзи рукопожатия */}
            <span className="text-7xl">🤝</span>
         </div>
         <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  if (view === 'register') {
    return (
      <RegistrationForm 
        initialData={currentUser} 
        onComplete={handleRegistrationComplete} 
      />
    );
  }

  const activeSession = chatSessions.find(s => s.id === activeSessionId);
  const activePartner = activeSession?.type === 'direct' ? users.find(u => u.id === activeSessionId) : undefined;
  const activeEvent = activeSession?.type === 'event' ? events.find(e => e.id === activeSessionId) : undefined;

  return (
    <div className="max-w-md mx-auto h-[100dvh] bg-gray-50 flex flex-col relative overflow-hidden shadow-2xl">
      <div className="h-16 px-4 bg-white flex items-center justify-between shadow-sm z-20 shrink-0">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-pink-500">
          F2F
        </h1>
        {view === 'swipe' && (
          <button onClick={() => setIsFilterOpen(true)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
            <Filter size={24} />
          </button>
        )}
      </div>

      <div className="flex-1 relative overflow-hidden flex flex-col min-h-0">
        {view === 'swipe' && (
          <div className="w-full h-full flex flex-col">
            <div className="flex-1 relative min-h-0 p-2">
              {visibleUsers.length > 0 ? (
                <UserCard 
                  user={visibleUsers[0]} 
                  currentUser={currentUser}
                  distance={visibleUsers[0].distance || 0} 
                  // ВОТ ЭТУ СТРОЧКУ НУЖНО ДОБАВИТЬ:
                  isOnline={onlineUsers.has(visibleUsers[0].id)}
                  
                  onInfoClick={() => openProfile(visibleUsers[0])}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-center bg-white rounded-3xl shadow p-6">
                  <Search size={48} className="text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700">Никого нет рядом</h3>
                  <p className="text-gray-500 mt-2 mb-6 max-w-xs">Попробуйте расширить зону поиска или сбросить фильтры.</p>
                  <div className="flex flex-col gap-3 w-full max-w-xs">
                    {filters.radius < 100 && (
                        <Button variant="primary" onClick={handleIncreaseRadius} className="flex items-center justify-center gap-2"> <Globe size={18} /> Искать дальше (+100км) </Button>
                    )}
                    <Button variant="secondary" onClick={handleResetFilters} className="flex items-center justify-center gap-2"> <RefreshCw size={18} /> Сбросить фильтры </Button>
                    <Button variant="outline" onClick={() => setIsFilterOpen(true)}> Настроить фильтры </Button>
                    <Button variant="ghost" onClick={() => setSwipedUserIds(new Set())} className="text-gray-400 mt-2"> <RotateCcw size={16} className="mr-2" /> Пересмотреть всех </Button>
                  </div>
                </div>
              )}
            </div>
            {visibleUsers.length > 0 && (
              <div className="h-24 shrink-0 flex justify-center items-center gap-8 pb-4">
                <Button variant="custom" className={`bg-gradient-to-br from-white to-red-100 text-red-500 shadow-xl border-2 border-white hover:border-red-200 hover:from-red-50 hover:to-red-200 w-[65px] h-[65px] rounded-full transition-all duration-300 ${animatingButton === 'left' ? 'scale-125 ring-4 ring-red-200 shadow-inner' : 'hover:scale-110 active:scale-95'}`} onClick={() => handleSwipe('left')}> <X size={32} strokeWidth={2.5} /> </Button>
                <Button variant="custom" className={`bg-gradient-to-br from-white to-green-100 text-green-500 shadow-xl border-2 border-white hover:border-green-200 hover:from-green-50 hover:to-green-200 w-[65px] h-[65px] rounded-full transition-all duration-300 ${animatingButton === 'right' ? 'scale-125 ring-4 ring-green-200 shadow-inner' : 'hover:scale-110 active:scale-95'}`} onClick={() => handleSwipe('right')}> <Heart size={32} fill="currentColor" className="text-green-500" strokeWidth={0} /> </Button>
              </div>
            )}
          </div>
        )}

        {view === 'map' && (
          <div className="w-full h-full">
            <MapView users={visibleUsers} currentUser={currentUser} onSelectUser={openProfile} />
          </div>
        )}

        {view === 'events' && (
            <div className="w-full h-full">
                <EventList events={events} users={[currentUser, ...users]} currentUser={currentUser} onJoinEvent={handleJoinEvent} onCreateEventClick={() => setIsCreateEventOpen(true)} />
            </div>
        )}

        {view === 'likes' && (
            <div className="w-full h-full">
                <LikesList incomingLikes={incomingLikes} users={users} currentUser={currentUser} onAccept={processLike} onReject={handleIncomingReject} />
            </div>
        )}

        {view === 'chat' && !activeSessionId && (
          <ChatList 
            sessions={chatSessions} 
            users={users} 
            events={events}
            onSelectChat={setActiveSessionId}
            onlineUsers={onlineUsers} 
          />
        )}

        {view === 'chat' && activeSessionId && (
          <div className="absolute inset-0 z-30 bg-white">
            <ChatWindow currentUser={currentUser} session={activeSession} partner={activePartner} event={activeEvent} isTyping={typingChatId === activeSessionId} onBack={() => setActiveSessionId(null)} onSendMessage={handleSendMessage} />
          </div>
        )}

        {view === 'profile' && (
           <div className="p-6 overflow-y-auto h-full bg-white">
             <div className="flex flex-col items-center mb-6">
                <img src={currentUser.photoUrl} className="w-32 h-32 rounded-full object-cover mb-4 border-4 border-indigo-100" alt="me" />
                <h2 className="text-2xl font-bold">{currentUser.name}, {currentUser.age}</h2>
                {currentUser.city && (
                  <div className="flex items-center gap-1 text-gray-500 mt-1"> <MapPin size={16} /> <span>{currentUser.city}</span> </div>
                )}
                <div className="flex flex-wrap justify-center gap-2 mt-3">
                  {currentUser.interests.map(i => ( <span key={i} className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600">{i}</span> ))}
                </div>
             </div>
             <div className="bg-indigo-50 p-4 rounded-xl mb-6">
               <h3 className="font-semibold text-indigo-900 mb-2">О себе</h3>
               <p className="text-indigo-700">{currentUser.bio}</p>
             </div>
             <Button variant="outline" fullWidth className="mb-2" onClick={() => setIsEditProfileOpen(true)}> Редактировать профиль </Button>
             <Button variant="ghost" fullWidth className="text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => setView('register')}>Выйти</Button>
           </div>
        )}
      </div>

      {inspectingUser && (
        <div className="absolute inset-0 z-40 bg-black/60 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
             <div className="relative h-64">
               <img src={inspectingUser.photoUrl} className="w-full h-full object-cover" />
               <button onClick={() => setInspectingUser(null)} className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"> <X size={20} /> </button>
             </div>
             <div className="p-6">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-2xl font-bold flex items-center gap-2"> {inspectingUser.name}, {inspectingUser.age} </h2>
                  {inspectingUser.distance !== undefined && ( <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded"> ~{Math.round(inspectingUser.distance)} км </span> )}
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {inspectingUser.interests.map(i => {
                      const isCommon = currentUser.interests.includes(i);
                      return ( <span key={i} className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${isCommon ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-transparent'}`}> {i} </span> );
                  })}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">{inspectingUser.bio}</p>
                <div className="flex gap-3">
                  <Button variant="outline" fullWidth onClick={() => setInspectingUser(null)}> Закрыть </Button>
                  {view === 'map' && currentUser.interests.filter(i => inspectingUser.interests.includes(i)).length >= 1 && !chatSessions.find(s => s.id === inspectingUser.id) ? (
                      <Button fullWidth className="bg-green-600 hover:bg-green-700 border-0 flex items-center justify-center gap-2" onClick={() => handleMapDirectMessage(inspectingUser)} disabled={dailyDirectMessagesCount >= 3}> <Send size={18} /> {dailyDirectMessagesCount >= 3 ? 'Лимит' : `Написать (${3 - dailyDirectMessagesCount})`} </Button>
                   ) : (
                      <Button fullWidth className="bg-gradient-to-r from-indigo-600 to-pink-500 border-0" onClick={() => { processLike(inspectingUser); setInspectingUser(null); }}> Лайкнуть </Button>
                   )}
                </div>
             </div>
          </div>
        </div>
      )}

      <MatchModal isOpen={!!matchModalUser} currentUser={currentUser} matchedUser={matchModalUser} onClose={() => setMatchModalUser(null)} onStartChat={handleStartChatFromModal} />
      <FilterModal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} filters={filters} setFilters={setFilters} />
      <CreateEventModal isOpen={isCreateEventOpen} onClose={() => setIsCreateEventOpen(false)} onSubmit={handleCreateEvent} />
      <EditProfileModal isOpen={isEditProfileOpen} onClose={() => setIsEditProfileOpen(false)} currentUser={currentUser} onUpdate={handleUpdateProfile} />

      {/* Bottom Navigation */}
      <div className="bg-white border-t border-gray-200 h-16 px-2 pb-1 flex items-center justify-between shrink-0 z-20 relative">
         
         {/* 1. КАРТА (Теперь первая) */}
         <button 
           onClick={() => setView('map')}
           className={`flex flex-col items-center gap-0.5 flex-1 transition-colors ${view === 'map' ? 'text-indigo-600' : 'text-gray-400'}`}
         >
           <Map size={22} />
           <span className="text-[10px] font-medium">Карта</span>
         </button>

         {/* 2. ПОИСК (Теперь второй) */}
         <button 
           onClick={() => setView('swipe')}
           className={`flex flex-col items-center gap-0.5 flex-1 transition-colors ${view === 'swipe' ? 'text-indigo-600' : 'text-gray-400'}`}
         >
           <Search size={22} />
           <span className="text-[10px] font-medium">Поиск</span>
         </button>

         {/* 3. СОБЫТИЯ */}
         <button 
           onClick={() => setView('events')}
           className={`flex flex-col items-center gap-0.5 flex-1 transition-colors ${view === 'events' ? 'text-indigo-600' : 'text-gray-400'}`}
         >
           <Calendar size={22} />
           <span className="text-[10px] font-medium">События</span>
         </button>

         {/* 4. ЛАЙКИ */}
         <button 
           onClick={() => setView('likes')}
           className={`flex flex-col items-center gap-0.5 flex-1 transition-colors ${view === 'likes' ? 'text-indigo-600' : 'text-gray-400'}`}
         >
           <div className="relative">
               <Heart size={22} className={view === 'likes' ? 'fill-current' : ''} />
               {incomingLikes.length > 0 && (
                   <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-pink-500 rounded-full border-2 border-white"></span>
               )}
           </div>
           <span className="text-[10px] font-medium">Лайки</span>
         </button>

         {/* 5. ЧАТЫ */}
         <button 
           onClick={() => setView('chat')}
           className={`flex flex-col items-center gap-0.5 flex-1 transition-colors ${view === 'chat' ? 'text-indigo-600' : 'text-gray-400'}`}
         >
           <div className="relative">
             <MessageCircle size={22} />
             {chatSessions.reduce((acc, s) => acc + s.unread, 0) > 0 && (
               <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
             )}
           </div>
           <span className="text-[10px] font-medium">Чаты</span>
         </button>

         {/* 6. ПРОФИЛЬ */}
         <button 
           onClick={() => setView('profile')}
           className={`flex flex-col items-center gap-0.5 flex-1 transition-colors ${view === 'profile' ? 'text-indigo-600' : 'text-gray-400'}`}
         >
           <UserIcon size={22} />
           <span className="text-[10px] font-medium">Профиль</span>
         </button>
      </div>
    </div>
  );
};

export default App;
