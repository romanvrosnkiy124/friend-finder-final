
import React, { useState, useEffect, useRef } from 'react';
import { User, Interest } from '../types';
import { Button } from './Button';
import { X, User as UserIcon, Camera, AlignLeft, Plus, Loader2, AlertCircle, MapPin } from 'lucide-react';
import { validateInterestSafety } from '../services/geminiService';
import { CityAutocomplete } from './CityAutocomplete';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUpdate: (updatedUser: User) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, currentUser, onUpdate }) => {
  const [formData, setFormData] = useState<User>(currentUser);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Custom Interest State
  const [customInterest, setCustomInterest] = useState('');
  const [isValidatingInterest, setIsValidatingInterest] = useState(false);
  const [interestError, setInterestError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isCityValid, setIsCityValid] = useState(true); // Assume initial user data is valid

  // Update local state when currentUser prop changes or modal opens
  useEffect(() => {
    if (isOpen) {
        setFormData(currentUser);
        setCustomInterest('');
        setInterestError(null);
        setIsCityValid(true); // Reset to true on open (existing data assumed valid)
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

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
    
    if (formData.interests.includes(normalized)) {
        setCustomInterest('');
        return; // Already exists
    }

    setIsValidatingInterest(true);
    setInterestError(null);

    const isSafe = await validateInterestSafety(normalized);

    setIsValidatingInterest(false);

    if (isSafe) {
        toggleInterest(normalized);
        setCustomInterest('');
    } else {
        setInterestError("Недопустимый интерес.");
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCityChange = (cityName: string, lat?: number, lng?: number) => {
    const updates: Partial<User> = { city: cityName };
    
    // Strict validation
    if (lat && lng) {
      updates.location = { lat, lng };
      setIsCityValid(true);
    } else {
      setIsCityValid(false);
    }

    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleDetectLocation = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
        alert('Геолокация не поддерживается вашим браузером');
        setIsLocating(false);
        return;
    }

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            
            // 1. Update coordinates
            setFormData(prev => ({
                ...prev,
                location: { lat: latitude, lng: longitude }
            }));

            // 2. Reverse geocoding to get city name (using OpenStreetMap Nominatim API)
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ru`);
                const data = await response.json();
                
                // Extract city/town/village
                const address = data.address;
                const city = address.city || address.town || address.village || address.state || 'Неизвестно';
                
                setFormData(prev => ({ ...prev, city }));
                setIsCityValid(true);
            } catch (error) {
                console.error("Failed to fetch city name:", error);
            } finally {
                setIsLocating(false);
            }
        },
        (error) => {
            console.error(error);
            alert('Не удалось определить местоположение. Проверьте разрешения.');
            setIsLocating(false);
        }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCityValid) {
        alert('Пожалуйста, выберите корректный город из списка.');
        return;
    }
    onUpdate(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Редактировать профиль</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Photo Upload */}
            <div className="flex flex-col items-center justify-center mb-4">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <div 
                  className="relative group cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => fileInputRef.current?.click()}
                >
                    <img 
                        src={formData.photoUrl} 
                        alt="Profile" 
                        className="w-24 h-24 rounded-full object-cover border-4 border-indigo-50"
                    />
                    <div className="absolute bottom-0 right-0 bg-indigo-600 text-white p-1.5 rounded-full border-2 border-white">
                        <Camera size={14} />
                    </div>
                </div>
                <button 
                  type="button" 
                  className="text-indigo-600 text-xs mt-2 font-medium hover:underline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Изменить фото
                </button>
            </div>

            {/* Name & Age */}
            <div className="flex gap-4">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
                    <div className="relative">
                        <UserIcon className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input 
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                        />
                    </div>
                </div>
                <div className="w-1/3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Возраст</label>
                    <input 
                        type="number"
                        min="18"
                        max="99"
                        value={formData.age}
                        onChange={(e) => setFormData({...formData, age: parseInt(e.target.value) || 18})}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                    />
                </div>
            </div>

            {/* City */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Город</label>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                         <CityAutocomplete 
                             value={formData.city || ''}
                             onChange={handleCityChange}
                             placeholder="Ваш город"
                             isValid={isCityValid}
                          />
                    </div>
                    <button 
                      type="button"
                      onClick={handleDetectLocation}
                      disabled={isLocating}
                      className={`p-2.5 rounded-xl border transition-colors disabled:opacity-50 ${
                        isCityValid 
                            ? 'bg-green-50 text-green-600 border-green-200' 
                            : 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100'
                      }`}
                      title="Определить местоположение"
                    >
                       {isLocating ? <Loader2 size={20} className="animate-spin" /> : <MapPin size={20} />}
                    </button>
                </div>
            </div>

            {/* Gender */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Пол</label>
                <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                  {(['male', 'female'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setFormData({ ...formData, gender: g })}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                        formData.gender === g 
                          ? 'bg-white shadow text-indigo-600' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {g === 'male' ? 'Мужской' : 'Женский'}
                    </button>
                  ))}
                </div>
            </div>

            {/* Bio */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">О себе</label>
                <div className="relative">
                    <AlignLeft className="absolute left-3 top-3 text-gray-400" size={18} />
                    <textarea 
                        value={formData.bio}
                        onChange={(e) => setFormData({...formData, bio: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                        placeholder="Расскажите немного о себе..."
                    />
                </div>
            </div>

            {/* Interests */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Интересы <span className="text-gray-400 font-normal text-xs">(минимум 2)</span>
                </label>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1 mb-2">
                    {Object.values(Interest).map((interest) => (
                        <button
                            key={interest}
                            type="button"
                            onClick={() => toggleInterest(interest)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                                formData.interests.includes(interest)
                                    ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            {interest}
                        </button>
                    ))}
                    {formData.interests
                        .filter(i => !Object.values(Interest).includes(i as Interest))
                        .map(interest => (
                        <button
                            key={interest}
                            type="button"
                            onClick={() => toggleInterest(interest)}
                            className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors border bg-indigo-100 text-indigo-700 border-indigo-200"
                        >
                            {interest}
                        </button>
                    ))}
                </div>

                {/* Add Custom Interest */}
                <div className="flex gap-2">
                    <input 
                        type="text"
                        value={customInterest}
                        onChange={(e) => {
                            setCustomInterest(e.target.value);
                            setInterestError(null);
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomInterest())}
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-xl py-2 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        placeholder="Свой интерес"
                    />
                    <button 
                        type="button"
                        onClick={handleAddCustomInterest}
                        disabled={!customInterest.trim() || isValidatingInterest}
                        className="bg-gray-900 text-white px-3 rounded-xl hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center min-w-[3rem]"
                    >
                        {isValidatingInterest ? <Loader2 size={18} className="animate-spin" /> : <Plus size={20} />}
                    </button>
                </div>
                {interestError && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle size={12} /> {interestError}
                    </p>
                )}

                {formData.interests.length < 2 && (
                    <p className="text-red-500 text-xs mt-1">Выберите минимум 2 интереса</p>
                )}
            </div>

            <Button 
                fullWidth 
                type="submit" 
                className="mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={formData.interests.length < 2 || !isCityValid}
            >
              Сохранить изменения
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
