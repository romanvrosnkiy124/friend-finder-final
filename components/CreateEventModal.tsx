import React, { useState } from 'react';
import { Event } from '../types';
import { X, MapPin } from 'lucide-react';
import { Button } from './Button';
import { CityAutocomplete } from './CityAutocomplete';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: Partial<Event>) => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<Partial<Event>>({
    title: '',
    description: '',
    date: '',
    locationName: '',
    tags: []
  });
  
  const [tagInput, setTagInput] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!formData.title || !formData.date || !formData.locationName) {
        alert('Заполните обязательные поля');
        return;
    }
    onSubmit(formData);
    setFormData({ title: '', description: '', date: '', locationName: '', tags: [] });
    onClose();
  };

  const addTag = () => {
      if (tagInput.trim()) {
          setFormData(prev => ({
              ...prev,
              tags: [...(prev.tags || []), tagInput.trim()]
          }));
          setTagInput('');
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">Создать событие</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                <input 
                    type="text" 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Например: Поход в кино"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Дата</label>
                    <input 
                        type="date" 
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                        value={formData.date?.split('T')[0]}
                        onChange={e => setFormData({...formData, date: e.target.value})}
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Где встречаемся?</label>
                <div className="relative">
                    <CityAutocomplete 
                        value={formData.locationName || ''}
                        onChange={(val) => setFormData({...formData, locationName: val})}
                        placeholder="Введите адрес или место"
                        isValid={true}
                    />
                    <div className="absolute right-3 top-3 text-gray-400 pointer-events-none">
                        <MapPin size={18} />
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                <textarea 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
                    placeholder="Подробности события..."
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Теги</label>
                <div className="flex gap-2 mb-2 flex-wrap">
                    {formData.tags?.map((tag, i) => (
                        <span key={i} className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg text-xs flex items-center gap-1">
                            #{tag}
                            <button onClick={() => setFormData(prev => ({...prev, tags: prev.tags?.filter((_, idx) => idx !== i)}))}>
                                <X size={12} />
                            </button>
                        </span>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Добавить тег"
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addTag()}
                    />
                    <button onClick={addTag} className="bg-gray-200 text-gray-600 px-3 rounded-xl hover:bg-gray-300">+</button>
                </div>
            </div>
        </div>

        <div className="p-4 border-t bg-gray-50">
            <Button fullWidth onClick={handleSubmit} className="bg-indigo-600 hover:bg-indigo-700">
                Создать событие
            </Button>
        </div>

      </div>
    </div>
  );
};