
import { GoogleGenAI } from "@google/genai";
import { User, Message } from '../types';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateIcebreaker = async (me: User, other: User): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "Привет! Классные фото.";

  try {
    const prompt = `
      Ты помощник в приложении для знакомств "F2F".
      Пользователь А (Я): ${JSON.stringify(me.interests)}, Био: ${me.bio}.
      Пользователь Б (Собеседник): ${JSON.stringify(other.interests)}, Био: ${other.bio}.
      
      Напиши 1 короткое, дружелюбное сообщение (на русском языке) от лица Пользователя А для начала разговора.
      Опирайся на общие интересы. Не используй смайлики чрезмерно. Длина до 150 символов.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Привет! У нас похожие интересы!";
  }
};

export const analyzeCompatibility = async (me: User, other: User): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "Вы оба классные!";

  try {
    const prompt = `
      Сравни двух людей для дружбы.
      Я: ${JSON.stringify(me.interests)}, Возраст: ${me.age}.
      Друг: ${JSON.stringify(other.interests)}, Возраст: ${other.age}.
      
      Напиши 2-3 предложения на русском, почему нам стоит пообщаться. Будь краток и позитивен.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    return "У вас много общего!";
  }
};

export const generateCelebrityReply = async (me: User, celebrity: User, history: Message[]): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "Спасибо за сообщение! Я отвечу чуть позже.";

  try {
    // Construct the chat history text
    const conversation = history.map(msg => 
      `${msg.senderId === me.id ? 'Пользователь' : celebrity.name}: ${msg.text}`
    ).slice(-10).join('\n'); // Last 10 messages for context

    const prompt = `
      Ты ролевая модель. Твоя задача - отвечать на сообщения от лица конкретной известной личности в приложении для знакомств.
      
      ТВОЯ РОЛЬ:
      Имя: ${celebrity.name}
      Возраст: ${celebrity.age}
      Био: ${celebrity.bio}
      Интересы: ${celebrity.interests.join(', ')}
      
      СИТУАЦИЯ:
      Ты общаешься с пользователем по имени ${me.name}.
      
      ИСТОРИЯ ЧАТА:
      ${conversation}
      
      ЗАДАЧА:
      Напиши ответ на последнее сообщение пользователя.
      1. Отвечай строго на русском языке.
      2. Придерживайся стиля общения этой звезды (например, если это рэпер - используй сленг, если политик - будь сдержаннее, но дружелюбен в контексте приложения).
      3. Ответ должен быть кратким (1-2 предложения), как в мессенджере.
      4. Не выходи из роли. Ты - настоящий человек, а не AI.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Celebrity AI Error:", error);
    return "Извини, сейчас я очень занят, напишу позже!";
  }
};

export const validateInterestSafety = async (text: string): Promise<boolean> => {
  const ai = getAiClient();
  // If no API key, fallback to basic length check to not block user, 
  // but in production this should block or use local list.
  if (!ai) return text.length > 2 && text.length < 30;

  try {
    const prompt = `
      You are a content moderator for a friendly social app.
      Evaluate the following interest tag: "${text}".
      
      Is this tag safe, legal, and appropriate for a general audience?
      It MUST NOT relate to violence, crime, drugs, hate speech, sexual violence, or illegal acts.
      
      Answer strictly with "YES" if it is safe, or "NO" if it is unsafe.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const answer = response.text.trim().toUpperCase();
    return answer.includes("YES");
  } catch (error) {
    console.error("Safety check error:", error);
    // Fail safe on error? Or allow? Let's allow simple words if API fails to avoid bad UX.
    return true; 
  }
};
