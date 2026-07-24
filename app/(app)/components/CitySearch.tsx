"use client";

import { useMemo, useState } from "react";

interface City {
  id: number;
  city: string;
  country: string;
}

interface CitySearchProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

const cities: City[] = [
  { id: 1, city: "New York", country: "United States" },
  { id: 2, city: "Los Angeles", country: "United States" },
  { id: 3, city: "Chicago", country: "United States" },
  { id: 4, city: "Toronto", country: "Canada" },
  { id: 5, city: "Vancouver", country: "Canada" },
  { id: 6, city: "Mexico City", country: "Mexico" },
  { id: 7, city: "Monterrey", country: "Mexico" },
  { id: 8, city: "São Paulo", country: "Brazil" },
  { id: 9, city: "Rio de Janeiro", country: "Brazil" },
  { id: 10, city: "Brasília", country: "Brazil" },
  { id: 11, city: "Buenos Aires", country: "Argentina" },
  { id: 12, city: "Córdoba", country: "Argentina" },
  { id: 13, city: "Asunción", country: "Paraguay" },
  { id: 14, city: "Ciudad del Este", country: "Paraguay" },
  { id: 15, city: "Santiago", country: "Chile" },
  { id: 16, city: "Lima", country: "Peru" },
  { id: 17, city: "Bogotá", country: "Colombia" },
  { id: 18, city: "Montevideo", country: "Uruguay" },
  { id: 19, city: "Quito", country: "Ecuador" },
  { id: 20, city: "Santa Cruz", country: "Bolivia" },
];

export default function CitySearch({
  label,
  placeholder,
  value,
  onChange,
}: CitySearchProps) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);

  const filteredCities = useMemo(() => {
    if (!query) return cities;

    return cities.filter(
      (city) =>
        city.city.toLowerCase().includes(query.toLowerCase()) ||
        city.country.toLowerCase().includes(query.toLowerCase())
    );
  }, [query]);

  const selectCity = (city: City) => {
    const fullName = `${city.city}, ${city.country}`;
    setQuery(fullName);
    onChange(fullName);
    setOpen(false);
  };

  return (
    <div className="relative w-full">
      <label className="block mb-2 font-semibold text-gray-700">
        {label}
      </label>

      <input
        type="text"
        value={query}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
      />

      {open && (
        <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-lg border bg-white shadow-lg">
          {filteredCities.length > 0 ? (
            filteredCities.map((city) => (
              <button
                key={city.id}
                type="button"
                onClick={() => selectCity(city)}
                className="block w-full border-b px-4 py-3 text-left hover:bg-blue-50"
              >
                <p className="font-medium">{city.city}</p>
                <p className="text-sm text-gray-500">{city.country}</p>
              </button>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">
              No cities found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}