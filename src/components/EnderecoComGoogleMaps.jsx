import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Loader2 } from "lucide-react";

export default function EnderecoComGoogleMaps({ value, onChange, label = "Endereço" }) {
  const [inputValue, setInputValue] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const autocompleteService = useRef(null);
  const placesService = useRef(null);

  useEffect(() => {
    if (window.google && window.google.maps) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
      const mapDiv = document.createElement('div');
      const map = new window.google.maps.Map(mapDiv);
      placesService.current = new window.google.maps.places.PlacesService(map);
    }
  }, []);

  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    if (!newValue || newValue.length < 3) {
      setSuggestions([]);
      return;
    }

    if (autocompleteService.current) {
      setLoading(true);
      autocompleteService.current.getPlacePredictions(
        {
          input: newValue,
          componentRestrictions: { country: 'br' }
        },
        (predictions, status) => {
          setLoading(false);
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions);
          } else {
            setSuggestions([]);
          }
        }
      );
    }
  };

  const handleSelectSuggestion = (placeId, description) => {
    if (placesService.current) {
      placesService.current.getDetails(
        { placeId },
        (place, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
            const addressData = {
              endereco: description,
              endereco_place_id: placeId,
              endereco_lat: place.geometry?.location?.lat(),
              endereco_lng: place.geometry?.location?.lng()
            };
            
            setInputValue(description);
            setSuggestions([]);
            onChange(addressData);
          }
        }
      );
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-white flex items-center gap-2">
        <MapPin className="w-4 h-4" />
        {label}
      </Label>
      <div className="relative">
        <Input
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Digite o endereço..."
          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 animate-spin text-white/50" />
          </div>
        )}
        {suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-white/20 rounded-lg shadow-2xl max-h-60 overflow-y-auto">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.place_id}
                type="button"
                onClick={() => handleSelectSuggestion(suggestion.place_id, suggestion.description)}
                className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-colors border-b border-white/5 last:border-0 flex items-start gap-2"
              >
                <MapPin className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{suggestion.description}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="text-xs text-indigo-300">
        Digite para buscar endereços. Selecione da lista para preencher automaticamente.
      </p>
    </div>
  );
}