import React, { useState, useRef } from 'react';
import { User, Interest } from '../types';
import { Button } from './Button';
import { User as UserIcon, Camera, AlignLeft, ArrowRight, MapPin, Loader2, Plus, AlertCircle, Mail, Lock } from 'lucide-react';
import { validateInterestSafety } from '../services/geminiService';
import { CityAutocomplete } from './CityAutocomplete';
import { supabase } from '../supabaseClient';

interface RegistrationFormProps {
  initialData: User;
  onComplete: (user: User) => void;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({ initialData, onComplete }) => {
  const [formData, setFormData] = useState<User>(initialData);
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false); // Состояние загрузки фото

  const [step, setStep] = useState(1);
  const [isLocating, setIsLocating] = useState(false);
  const [isCityValid, setIsCityValid] = useState(false);
  
  const [customInterest, setCustomInterest] = useState('');
  const [isValidatingInterest, setIsValidatingInterest] = useState(false);
  const [interestError, setInterestError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleInterest = (interest: string) => {
    const current = formData.interests;
    if (current.includes(interest)) {
      setFormData({ ...formData, interests: current.filter(i => i !== interest) });
    } else {
      setFormData({ ...formData, interests: [...current, interest] });
    }
  };

  const handleAddCustomInterest = async () => {
      const normalized = customInterest.trim();
      if (!normalized) return;
      if (formData.interests.includes(normalized)) { setCustomInterest(''); return; }
      setIsValidatingInterest(true);
      setInterestError(null);
      const isSafe = await validateInterestSafety(normalized);
      setIsValidatingInterest(false);
      if (isSafe) { toggleInterest(normalized); setCustomInterest(''); } 
      else { setInterestError("Нарушение правил."); }
  };

  // --- НОВАЯ ЛОГИКА ЗАГРУЗКИ ФОТО ---
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
        // 1. Генерируем уникальное имя файла
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        // 2. Загружаем в Supabase Storage (ведро 'avatars')
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        // 3. Получаем публичную ссылку
        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        
        // 4. Сохраняем ссылку в форму
        setFormData({ ...formData, photoUrl: data.publicUrl });
        
    } catch (error: any) {
        alert('Ошибка загрузки фото: ' + error.message);
    } finally {
        setIsUploadingPhoto(false);
    }
  };

  const handleAuth = async () => {
    if (!email || !password) { alert("Введите Email и пароль"); return; }
    setIsRegistering(true);
    try {
        if (isLoginMode) {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
        } else {
            if (formData.interests.length < 2) { alert("Выберите 2 интереса"); setIsRegistering(false); return; }
            const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
            if (authError) throw authError;
            if (authData.user) {
                const { error: profileError } = await supabase.from('profiles').insert([{
                        id: authData.user.id,
                        email: email,
                        full_name: formData.name,
                        age: formData.age,
                        city: formData.city,
                        interests: formData.interests.join(','),
                        avatar_url: formData.photoUrl // Теперь здесь короткая ссылка, а не длинный текст
                    }]);
                if (profileError) throw profileError;
                onComplete({ ...formData, id: authData.user.id });
            }
        }
    } catch (error: any) { alert(error.message); } finally { setIsRegistering(false); }
  };

  const handleNext = () => {
    if (isLoginMode) { handleAuth(); return; }
    if (step === 1) {
      if (!formData.name || !formData.age || !email || !password) { alert("Заполните все поля"); return; }
      setStep(2);
    } else { handleAuth(); }
  };

  const triggerFileInput = () => { fileInputRef.current?.click(); };

  const handleCityChange = (cityName: string, lat?: number, lng?: number) => {
    const updates: Partial<User> = { city: cityName };
    if (lat && lng) { updates.location = { lat, lng }; setIsCityValid(true); } else { setIsCityValid(false); }
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleDetectLocation = () => {
    setIsLocating(true);
    if (!navigator.geolocation) { alert('Нет GPS'); setIsLocating(false); return; }
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            setFormData(prev => ({ ...prev, location: { lat: latitude, lng: longitude } }));
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ru`);
                const data = await response.json();
                const address = data.address;
                const city = address.city || address.town || address.village || address.state || 'Неизвестно';
                setFormData(prev => ({ ...prev, city })); setIsCityValid(true);
            } catch (error) { console.error(error); } finally { setIsLocating(false); }
        },
        (error) => { alert('Ошибка GPS'); setIsLocating(false); }
    );
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-indigo-50 to-white -z-10 rounded-b-[3rem]"></div>
      
      <div className="w-full max-w-md">
        
        {/* Прогресс бар (Логотип удален) */}
        <div className="flex gap-2 mb-8 justify-center">
            {!isLoginMode && (
                <>
                    <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 1 ? 'w-8 bg-indigo-600' : 'w-2 bg-gray-200'}`}></div>
                    <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 2 ? 'w-8 bg-indigo-600' : 'w-2 bg-gray-200'}`}></div>
                </>
            )}
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 animate-fade-in">
          
          {isLoginMode ? (
             <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 text-center mb-6">С возвращением!</h2>
                <div className="relative"> <Mail className="absolute left-3 top-3 text-gray-400" size={18} /> <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Email" /> </div>
                <div className="relative"> <Lock className="absolute left-3 top-3 text-gray-400" size={18} /> <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Пароль" /> </div>
             </div>
          ) : (
            <>
              {step === 1 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-gray-800 text-center mb-4">Создать аккаунт</h2>
                  
                  {/* Загрузка фото */}
                  <div className="flex justify-center mb-4">
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                      <div className="relative group cursor-pointer hover:opacity-90 transition-opacity" onClick={triggerFileInput}>
                          {isUploadingPhoto ? (
                             <div className="w-24 h-24 rounded-full border-4 border-indigo-50 bg-gray-100 flex items-center justify-center">
                                <Loader2 className="animate-spin text-indigo-600" />
                             </div>
                          ) : formData.photoUrl ? (
                            <img src={formData.photoUrl} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-indigo-50 bg-gray-100 shadow-sm"/>
                          ) : (
                            <div className="w-24 h-24 rounded-full border-4 border-indigo-50 bg-gray-100 shadow-sm flex items-center justify-center text-gray-300"> <UserIcon size={48} strokeWidth={1.5} /> </div>
                          )}
                          {!isUploadingPhoto && (
                             <div className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full border-2 border-white shadow-md"> <Camera size={16} /> </div>
                          )}
                      </div>
                  </div>

                  <div className="relative"> <Mail className="absolute left-3 top-3 text-gray-400" size={18} /> <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Email" /> </div>
                  <div className="relative"> <Lock className="absolute left-3 top-3 text-gray-400" size={18} /> <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Пароль (6+ символов)" /> </div>
                  <div className="relative"> <UserIcon className="absolute left-3 top-3 text-gray-400" size={18} /> <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ваше имя" /> </div>
                  <div className="flex gap-4">
                      <div className="w-1/3"> <input type="number" value={formData.age || ''} onChange={(e) => setFormData({...formData, age: parseInt(e.target.value)})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Возраст" /> </div>
                      <div className="flex-1"> <div className="flex gap-2 p-1 bg-gray-100 rounded-xl"> {(['male', 'female'] as const).map((g) => ( <button key={g} onClick={() => setFormData({ ...formData, gender: g })} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${formData.gender === g ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}> {g === 'male' ? 'М' : 'Ж'} </button> ))} </div> </div>
                  </div>
                  <div className="flex gap-2">
                      <div className="relative flex-1"> <CityAutocomplete value={formData.city || ''} onChange={handleCityChange} placeholder="Город" isValid={isCityValid} /> </div>
                      <button onClick={handleDetectLocation} disabled={isLocating} className={`p-3 rounded-xl border transition-colors disabled:opacity-50 ${isCityValid ? 'bg-green-50 text-green-600 border-green-200' : 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100'}`}> {isLocating ? <Loader2 size={20} className="animate-spin" /> : <MapPin size={20} />} </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                 <div className="space-y-5">
                    <h2 className="text-xl font-bold text-gray-800 text-center mb-4">Ваши увлечения</h2>
                    <div> <label className="block text-sm font-medium text-gray-700 mb-1">Кратко о себе</label> <div className="relative"> <AlignLeft className="absolute left-3 top-3 text-gray-400" size={18} /> <textarea value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]" placeholder="Что вы любите делать?" /> </div> </div>
                    <div className="max-h-60 overflow-y-auto pr-1"> <div className="flex flex-wrap gap-2"> {Object.values(Interest).map((interest) => ( <button key={interest} onClick={() => toggleInterest(interest)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${formData.interests.includes(interest) ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}> {interest} </button> ))} {formData.interests.filter(i => !Object.values(Interest).includes(i as Interest)).map(interest => ( <button key={interest} onClick={() => toggleInterest(interest)} className="px-4 py-2 rounded-xl text-sm font-medium transition-all border bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"> {interest} </button> ))} </div> </div>
                    <div className="relative"> <div className="flex gap-2"> <input type="text" value={customInterest} onChange={(e) => { setCustomInterest(e.target.value); setInterestError(null); }} onKeyDown={(e) => e.key === 'Enter' && handleAddCustomInterest()} className="flex-1 bg-gray-50 border border-gray-200 rounded-xl py-2 px-4 outline-none focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="Свой интерес..." /> <button onClick={handleAddCustomInterest} disabled={!customInterest.trim() || isValidatingInterest} className="bg-gray-900 text-white px-3 rounded-xl hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center min-w-[3rem]"> {isValidatingInterest ? <Loader2 size={18} className="animate-spin" /> : <Plus size={20} />} </button> </div> {interestError && <p className="text-red-500 text-xs mt-1">{interestError}</p>} </div>
                 </div>
              )}
            </>
          )}

          <div className="mt-8">
            <Button 
                fullWidth 
                onClick={handleNext} 
                disabled={isRegistering || isUploadingPhoto}
                className="bg-gradient-to-r from-indigo-600 to-pink-500 text-lg shadow-lg shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
               {isRegistering ? (
                   <span className="flex items-center gap-2"><Loader2 className="animate-spin" /> Загрузка...</span>
               ) : (
                   isLoginMode ? 'Войти' : (step === 1 ? 'Продолжить' : 'Создать профиль')
               )}
               {!isRegistering && !isLoginMode && step === 1 && <ArrowRight size={20} className="ml-2" />}
            </Button>
            
            <div className="mt-4 text-center">
                <button 
                    onClick={() => { setIsLoginMode(!isLoginMode); setStep(1); setInterestError(null); }}
                    className="text-indigo-600 text-sm font-medium hover:text-indigo-800 transition-colors"
                >
                    {isLoginMode ? "Нет аккаунта? Создать" : "Уже есть аккаунт? Войти"}
                </button>
            </div>

            {step === 2 && !isRegistering && !isLoginMode && (
                <button onClick={() => setStep(1)} className="w-full text-center text-gray-400 text-sm mt-2 hover:text-gray-600">Назад</button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};