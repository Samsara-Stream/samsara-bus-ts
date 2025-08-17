import React, { createContext, useContext, ReactNode } from 'react';
import { SamsaraBus } from 'samsara-bus-ts';

interface SamsaraBusContextValue {
  bus: SamsaraBus;
}

const SamsaraBusContext = createContext<SamsaraBusContextValue | null>(null);

interface SamsaraBusProviderProps {
  bus: SamsaraBus;
  children: ReactNode;
}

export function SamsaraBusProvider({ bus, children }: SamsaraBusProviderProps) {
  return (
    <SamsaraBusContext.Provider value={{ bus }}>
      {children}
    </SamsaraBusContext.Provider>
  );
}

export function useSamsaraBus(): SamsaraBus {
  const context = useContext(SamsaraBusContext);
  if (!context) {
    throw new Error('useSamsaraBus must be used within a SamsaraBusProvider');
  }
  return context.bus;
}
