
export enum Interest {
  TRAVEL = 'Путешествия',
  GYM = 'Тренажёрный зал',
  FITNESS = 'Фитнес',
  READING = 'Чтение',
  FOOTBALL = 'Футбол',
  CARS_MOTO = 'Автомобили и мотоциклы',
  HIKING = 'Походы',
  BOARD_GAMES = 'Настольные игры',
  DANCING = 'Танцы',
  FINANCE = 'Инвестиции и финансы',
  FISHING = 'Рыбалка',
  HUNTING = 'Охота',
  VOLUNTEERING = 'Волонтерство',
  GARDENING = 'Садоводство и цветоводство',
  COOKING = 'Кулинария и выпечка',
  PHOTOGRAPHY = 'Фотография',
  GAMING = 'Видеоигры (гейминг)',
  ART = 'Рисование и живопись',
  TREKKING = 'Пеший туризм и хайкинг',
  CRAFTS = 'Рукоделие',
  MUSIC = 'Игра на музыкальных инструментах',
  MOVIES = 'Просмотр фильмов и сериалов',
  BLOGGING = 'Ведение блога',
  WRITING = 'Писательство',
  YOGA = 'Йога и медитация',
  RUNNING = 'Бег',
  CAMPING = 'Кемпинг',
  WOODWORKING = 'Резьба по дереву',
}

export interface User {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female';
  photoUrl: string;
  bio: string;
  interests: string[]; // Changed from Interest[] to string[] to allow custom interests
  city?: string;
  location: {
    lat: number;
    lng: number;
  };
  distance?: number;
  isCelebrity?: boolean; // New field to mark celebrity accounts
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: number;
  isAiGenerated?: boolean;
}

export interface ChatSession {
  id: string;
  type: 'direct' | 'event';
  eventId?: string;
  messages: Message[];
  unread: number;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  locationName: string;
  organizerId: string;
  participantsIds: string[];
  tags: string[]; // Changed from Interest[] to string[]
}

export interface FilterState {
  ageRange: [number, number];
  gender: 'all' | 'male' | 'female';
  interests: string[]; // Changed from Interest[] to string[]
  radius: number; // Search radius in km
}

export type AppView = 'swipe' | 'map' | 'chat' | 'profile' | 'events' | 'register' | 'likes';
