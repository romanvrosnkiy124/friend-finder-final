
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, Search, CheckCircle, AlertCircle } from 'lucide-react';

interface CityAutocompleteProps {
  value: string;
  onChange: (cityName: string, lat?: number, lng?: number) => void;
  className?: string;
  placeholder?: string;
  isValid?: boolean; // New prop to control visual state
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
}

export const CityAutocomplete: React.FC<CityAutocompleteProps> = ({ 
  value, 
  onChange, 
  className = "",
  placeholder = "Введите город",
  isValid = false
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  // Debounce timer
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync with external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getCityName = (city: NominatimResult) => {
    return city.address.city || city.address.town || city.address.village || city.display_name.split(',')[0];
  };

  const fetchCities = async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=10&accept-language=ru&featuretype=city`
      );
      const data: NominatimResult[] = await response.json();
      
      // Deduplication Logic
      const uniqueCities = new Map<string, NominatimResult>();
      
      data.forEach((item) => {
        const name = getCityName(item);
        const region = item.address.state || '';
        const country = item.address.country || '';
        
        // Create a unique key based on Name + Region + Country to avoid duplicates
        // e.g. "Moscow-Moscow-Russia" vs "Moscow-Idaho-USA"
        const key = `${name}-${region}-${country}`.toLowerCase();
        
        if (!uniqueCities.has(key)) {
            uniqueCities.set(key, item);
        }
      });

      // Limit to 5 unique results
      setSuggestions(Array.from(uniqueCities.values()).slice(0, 5));
      setIsOpen(true);
    } catch (error) {
      console.error("Error fetching cities:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    
    // Pass only text, undefined lat/lng indicates "not validated"
    onChange(val, undefined, undefined);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchCities(val);
    }, 500);
  };

  const handleSelectCity = (city: NominatimResult) => {
    const fullName = getCityName(city);
    
    setInputValue(fullName);
    setIsOpen(false);
    
    // Pass city name AND coordinates to indicate valid selection
    onChange(fullName, parseFloat(city.lat), parseFloat(city.lon));
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <MapPin className={`absolute left-3 top-3 ${isValid && inputValue ? 'text-green-500' : 'text-gray-400'}`} size={18} />
        <input 
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
             if (suggestions.length > 0) setIsOpen(true);
          }}
          className={`w-full bg-gray-50 border rounded-xl py-3 pl-10 pr-10 focus:outline-none focus:ring-2 transition-all ${
             isValid && inputValue 
                ? 'border-green-500 focus:ring-green-200' 
                : inputValue && !isValid 
                    ? 'border-red-300 focus:ring-red-200 bg-red-50' 
                    : 'border-gray-200 focus:ring-indigo-500'
          }`}
          placeholder={placeholder}
          autoComplete="off"
        />
        
        <div className="absolute right-3 top-3 pointer-events-none">
            {isLoading ? (
                <Loader2 size={18} className="animate-spin text-indigo-500" />
            ) : isValid && inputValue ? (
                <CheckCircle size={18} className="text-green-500" />
            ) : inputValue && !isValid ? (
                <AlertCircle size={18} className="text-red-400" />
            ) : null}
        </div>
      </div>

      {inputValue && !isValid && !isLoading && !isOpen && (
         <div className="absolute -bottom-5 left-0 text-[10px] text-red-500 px-2">
            Выберите город из списка
         </div>
      )}

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((city) => (
            <button
              key={city.place_id}
              onClick={() => handleSelectCity(city)}
              className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors border-b border-gray-50 last:border-0"
            >
              <div className="font-medium text-gray-800">
                {getCityName(city)}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {[city.address.state, city.address.country].filter(Boolean).join(', ')}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
