
import { Interest, User, Event, ChatSession } from './types';

export const CURRENT_USER_ID = 'me';

// Mock location (Moscow center approx)
export const MOCK_CENTER_LAT = 55.7558;
export const MOCK_CENTER_LNG = 37.6173;

export const INITIAL_USER: User = {
  id: CURRENT_USER_ID,
  name: 'Александр',
  age: 28,
  gender: 'male',
  photoUrl: '',
  bio: 'Люблю активный отдых и хорошие книги.',
  city: 'Москва',
  // Expanded interests to demonstrate matching logic (Matches with Scarlett: Reading, Travel)
  interests: [Interest.GYM, Interest.READING, Interest.TRAVEL, Interest.RUNNING, Interest.MOVIES],
  location: { lat: MOCK_CENTER_LAT, lng: MOCK_CENTER_LNG },
};

export const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'Анджелина',
    age: 48,
    gender: 'female',
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Angelina_Jolie_2_June_2014_%28cropped%29.jpg/480px-Angelina_Jolie_2_June_2014_%28cropped%29.jpg',
    bio: 'Актриса, режиссер, посол доброй воли. Ищу вдохновение для новых проектов и путешествий.',
    interests: [Interest.TRAVEL, Interest.READING, Interest.ART, Interest.VOLUNTEERING],
    city: 'Москва',
    location: { lat: 55.7510, lng: 37.6150 }, // Close
    isCelebrity: true,
  },
  {
    id: '2',
    name: 'Брэд',
    age: 60,
    gender: 'male',
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Brad_Pitt_Fury_2014.jpg/480px-Brad_Pitt_Fury_2014.jpg',
    bio: 'Архитектура, кино и мотоциклы. Ценитель искусства.',
    interests: [Interest.ART, Interest.CARS_MOTO, Interest.TRAVEL, Interest.MOVIES],
    city: 'Москва',
    location: { lat: 55.7600, lng: 37.6200 }, // Close
    isCelebrity: true,
  },
  {
    id: '3',
    name: 'Ким',
    age: 43,
    gender: 'female',
    photoUrl: 'https://24smi.org/public/media/celebrity/2020/02/26/yl72gvlpluya-kim-kardashian.jpg',
    bio: 'Бизнес, мода и фитнес. Люблю утренние тренировки и здоровое питание.',
    interests: [Interest.FITNESS, Interest.GYM, Interest.COOKING, Interest.BLOGGING],
    city: 'Москва',
    location: { lat: 55.7400, lng: 37.6300 }, // Medium
    isCelebrity: true,
  },
  {
    id: '4',
    name: 'Том',
    age: 61,
    gender: 'male',
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Tom_Cruise_by_Gage_Skidmore_2.jpg/480px-Tom_Cruise_by_Gage_Skidmore_2.jpg',
    bio: 'Только хардкор, только экстрим. Бег, пилотирование и никаких каскадеров.',
    interests: [Interest.RUNNING, Interest.GYM, Interest.TRAVEL, Interest.CARS_MOTO],
    city: 'Москва',
    location: { lat: 55.7700, lng: 37.5900 }, // Medium
    isCelebrity: true,
  },
  {
    id: '5',
    name: 'Скарлетт',
    age: 39,
    gender: 'female',
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Scarlett_Johansson_by_Gage_Skidmore_2_%28cropped%2C_2%29.jpg/480px-Scarlett_Johansson_by_Gage_Skidmore_2_%28cropped%2C_2%29.jpg',
    bio: 'Люблю музыку, чтение сценариев. Ищу интересных собеседников.',
    // Updated interests to have 4 matches with Alexander (Reading, Travel, Movies, Running)
    interests: [Interest.FITNESS, Interest.READING, Interest.TRAVEL, Interest.MOVIES, Interest.RUNNING],
    city: 'Москва',
    location: { lat: 55.7200, lng: 37.6000 }, // Far
    isCelebrity: true,
  },
  {
    id: '6',
    name: 'Владимир',
    age: 71,
    gender: 'male',
    photoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSar-dOX5wlTgiNcQ_V1621gw86BxQWzR7jJg&s',
    bio: 'Дзюдо, хоккей, рыбалка и охота. Люблю отдых на природе в тайге.',
    interests: [Interest.FISHING, Interest.HUNTING, Interest.GYM, Interest.HIKING],
    city: 'Москва',
    location: { lat: 55.7800, lng: 37.6500 }, // Far
    isCelebrity: true,
  },
  {
    id: '7',
    name: 'Антонио',
    age: 63,
    gender: 'male',
    photoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRYO4smbDMlaPDJJJaTca0HXlA-secTDuKeyg&s',
    bio: 'Актер, певец, режиссер. Обожаю музыку и футбол.',
    interests: [Interest.MUSIC, Interest.ART, Interest.COOKING, Interest.FOOTBALL],
    city: 'Москва',
    location: { lat: 55.7300, lng: 37.6400 }, // Far
    isCelebrity: true,
  },
  {
    id: '8',
    name: 'MACAN',
    age: 22,
    gender: 'male',
    photoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ2bhUIPiH8jKjt41oAb6vvBjLi_n4pcQ9SCw&s',
    bio: 'Музыка, скорость и настоящие эмоции. Ценю искренность.',
    interests: [Interest.CARS_MOTO, Interest.MUSIC, Interest.GYM, Interest.MOVIES],
    city: 'Москва',
    location: { lat: 55.7550, lng: 37.6450 }, // Near Center
    isCelebrity: true,
  },
  {
    id: '9',
    name: 'ANNA ASTI',
    age: 33,
    gender: 'female',
    photoUrl: 'https://cdn-images.dzcdn.net/images/artist/ab711d78e547003bbfb18036822eb307/1900x1900-000000-80-0-0.jpg',
    bio: 'Царица чартов. Люблю моду, путешествия и душевные разговоры.',
    interests: [Interest.MUSIC, Interest.TRAVEL, Interest.PHOTOGRAPHY, Interest.COOKING],
    city: 'Москва',
    location: { lat: 55.7450, lng: 37.5950 }, // Arbat area
    isCelebrity: true,
  },
  {
    id: '10',
    name: 'Баста',
    age: 44,
    gender: 'male',
    photoUrl: 'https://cdn-images.dzcdn.net/images/artist/bac9a8bce57b3feb07a8a69b985032b1/1900x1900-000000-80-0-0.jpg',
    bio: 'Газгольдер. Музыка, бизнес и семья. Люблю бокс и хорошее кино.',
    interests: [Interest.MUSIC, Interest.FINANCE, Interest.GYM, Interest.MOVIES],
    city: 'Москва',
    location: { lat: 55.7620, lng: 37.6580 }, // Basmanny
    isCelebrity: true,
  },
  {
    id: '11',
    name: 'SHAMAN',
    age: 32,
    gender: 'male',
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/46/%D0%A8%D0%B0%D0%BC%D0%B0%D0%BD_%D0%BD%D0%B0_%D0%BF%D1%80%D0%B5%D0%BC%D0%B8%D0%B8_%22%D0%A8%D0%B0%D0%BD%D1%81%D0%BE%D0%BD_%D0%B3%D0%BE%D0%B4%D0%B0_%E2%80%93_2025%22_%2812-04-2025%29_%28cropped%29.jpg',
    bio: 'Я русский. Творчество, история и родные просторы.',
    interests: [Interest.MUSIC, Interest.WRITING, Interest.HIKING, Interest.READING],
    city: 'Москва',
    location: { lat: 55.7530, lng: 37.6220 }, // Red Square area
    isCelebrity: true,
  },
  {
    id: '12',
    name: 'Ваня Дмитриенко',
    age: 18,
    gender: 'male',
    photoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQcZGjvTpG4PX7idMqPZLZ_VmJJhYRWiSVStQ&s',
    bio: 'Венера-Юпитер. Гейминг, музыка и блогинг.',
    interests: [Interest.GAMING, Interest.MUSIC, Interest.BLOGGING, Interest.BOARD_GAMES],
    city: 'Москва',
    location: { lat: 55.7680, lng: 37.6000 }, // Tverskaya
    isCelebrity: true,
  },
  {
    id: '13',
    name: 'Mona',
    age: 27,
    gender: 'female',
    photoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTughKvaq4T8ONDienQTx6SODUmUIcjh4gy2g&s',
    bio: 'Музыка души. Искусство, медитации и творчество.',
    interests: [Interest.MUSIC, Interest.ART, Interest.YOGA, Interest.PHOTOGRAPHY],
    city: 'Москва',
    location: { lat: 55.7350, lng: 37.5850 }, // Park Kultury
    isCelebrity: true,
  },
  {
    id: '14',
    name: 'Полина Гагарина',
    age: 37,
    gender: 'female',
    photoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcStW0hGppAHtgnFVlgqWb_KAKIBv7M_J_yEKQ&s',
    bio: 'Спектакль окончен. Спорт, здоровый образ жизни и сцена.',
    interests: [Interest.MUSIC, Interest.FITNESS, Interest.TRAVEL, Interest.DANCING],
    city: 'Москва',
    location: { lat: 55.7250, lng: 37.6150 }, // Yakimanka
    isCelebrity: true,
  }
];

export const MOCK_CHATS_INITIAL: ChatSession[] = [
  // Empty initially
];

export const MOCK_INCOMING_LIKES = ['5', '9']; // Scarlett and Anna Asti like you

export const MOCK_EVENTS: Event[] = [
  {
    id: 'e1',
    title: 'Благотворительный вечер',
    description: 'Обсуждение гуманитарных миссий и помощи детям.',
    date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    locationName: 'Центр Искусств',
    organizerId: '1', // Angelina
    participantsIds: ['1', '2'],
    tags: [Interest.ART, Interest.TRAVEL, Interest.VOLUNTEERING],
  },
  {
    id: 'e2',
    title: 'Гонки на мотоциклах',
    description: 'Встреча любителей скорости. Шлем обязателен.',
    date: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
    locationName: 'Трек Moscow Raceway',
    organizerId: '4', // Tom Cruise
    participantsIds: ['4', '6', '8'], // Tom, Vladimir, Macan
    tags: [Interest.GYM, Interest.CARS_MOTO],
  },
  {
    id: 'e3',
    title: 'Выставка современного искусства',
    description: 'Презентация новых работ молодых художников.',
    date: new Date(Date.now() + 259200000).toISOString(),
    locationName: 'Галерея на Винзаводе',
    organizerId: '7', // Antonio
    participantsIds: ['7', '3', '13'], // Antonio, Kim, Mona
    tags: [Interest.ART, Interest.MUSIC],
  },
  {
    id: 'e4',
    title: 'Концерт в Лужниках',
    description: 'Большой сборный концерт друзей.',
    date: new Date(Date.now() + 345600000).toISOString(),
    locationName: 'Лужники',
    organizerId: '10', // Basta
    participantsIds: ['10', '9', '11', '14'], // Basta, Asti, Shaman, Gagarina
    tags: [Interest.MUSIC, Interest.DANCING],
  }
];
