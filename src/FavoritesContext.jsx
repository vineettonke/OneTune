import { createContext, useContext, useState } from 'react';

const FavoritesContext = createContext();

export const useFavorites = () => useContext(FavoritesContext);

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState({
    songs: [],
    playlists: [],
    albums: [],
  });

  const toggleFavorite = (type, item) => {
    setFavorites((prev) => {
      const exists = prev[type].some((i) => i.id === item.id);
      const updated = exists
        ? prev[type].filter((i) => i.id !== item.id)
        : [...prev[type], item];
      return { ...prev, [type]: updated };
    });
  };

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}