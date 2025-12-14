import { User, ChatSession, Event } from './types';

// Координаты центра (Москва) - оставляем, чтобы карта знала, где открыться
export const MOCK_CENTER_LAT = 55.7558;
export const MOCK_CENTER_LNG = 37.6173;

// ПУСТЫЕ СПИСКИ (Фейков больше нет)
export const MOCK_USERS: User[] = [];

export const MOCK_CHATS_INITIAL: ChatSession[] = [];

export const MOCK_EVENTS: Event[] = [];

export const MOCK_INCOMING_LIKES: string[] = [];