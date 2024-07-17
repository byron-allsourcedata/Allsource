import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SliderContextType {
  showSlider: boolean;
  setShowSlider: React.Dispatch<React.SetStateAction<boolean>>;
}

const SliderContext = createContext<SliderContextType | undefined>(undefined);

export const useSlider = (): SliderContextType => {
  const context = useContext(SliderContext);
  if (!context) {
    throw new Error('useSlider must be used within a SliderProvider');
  }
  return context;
};

interface SliderProviderProps {
  children: ReactNode;
}

export const SliderProvider: React.FC<SliderProviderProps> = ({ children }) => {
  const [showSlider, setShowSlider] = useState(false);

  return (
    <SliderContext.Provider value={{ showSlider, setShowSlider }}>
      {children}
    </SliderContext.Provider>
  );
};
