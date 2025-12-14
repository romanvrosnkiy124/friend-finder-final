import React, { useState, useRef } from 'react';
import { User, Interest } from '../types';
import { X, Camera, Save, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { supabase } from '../supabaseClient'; // Импортируем Supabase

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUpdate: (user: User) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, currentUser, onUpdate }) => {
  const [formData, setFormData] = useState<User>(currentUser);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Обновляем форму при открытии
  React.useEffect(() => {
    setFormData(currentUser);
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const toggleInterest = (interest: string) => {
    const current = formData.interests;
    if (current.includes(interest)) {
      setFormData({ ...formData, interests: current.filter(i => i !== interest) });
    } else {
      setFormData({ ...formData, interests: [...current, interest] });
    }
  };

  // --- ЗАГРУЗКА ФОТО В SUPABASE ---
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        // 1. Загружаем
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        // 2. Получаем ссылку
        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        
        // 3. Обновляем локальное состояние
        setFormData(prev => ({ ...prev, photoUrl: data.publicUrl }));

    } catch (error: any) {
        alert('Ошибка загрузки: ' + error.message);
    } finally {
        setIsLoading(false);
    }
  };

  // --- СОХРАНЕНИЕ ДАННЫХ В БАЗУ ---
  const handleSave = async () => {
    setIsLoading(true);
    try {
        // 1. Обновляем таблицу profiles
        const { error } = await supabase
            .from('profiles')
            .update({
                full_name: formData.name,
                bio: formData.bio,
                interests: formData.interests.join(','),
                avatar_url: formData.photoUrl,
                // city: formData.city, // Если нужно обновлять город
            })
            .eq('id', currentUser.id);

        if (error) throw error;

        // 2. Обновляем приложение
        onUpdate(formData);
        onClose();
        
    } catch (error: any) {
        console.error('Ошибка сохранения:', error);
        alert('Не удалось сохранить изменения');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">Редактировать профиль</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {/* Фото */}
          <div className="flex justify-center mb-6">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <img 
                src={formData.photoUrl || "https://via.placeholder.com/150"} 
                className="w-28 h-28 rounded-full object-cover border-4 border-indigo-50 shadow-md" 
                alt="Avatar"
              />
              <div className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full border-4 border-white shadow-lg hover:bg-indigo-700 transition-colors">
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">О себе</label>
              <textarea 
                value={formData.bio} 
                onChange={e => setFormData({...formData, bio: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Интересы</label>
              <div className="flex flex-wrap gap-2">
                {Object.values(Interest).map((interest) => (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      formData.interests.includes(interest)
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50">
          <Button fullWidth onClick={handleSave} disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700">
            {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" size={18} />}
            Сохранить
          </Button>
        </div>

      </div>
    </div>
  );
};