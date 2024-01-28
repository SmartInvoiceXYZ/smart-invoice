import { Modals } from '@smart-invoice/types';
import React, {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useState,
} from 'react';

const defaults: Modals = {
  networkChange: false,
  deposit: false,
  lock: false,
  release: false,
  resolve: false,
  withdraw: false,
  addMilestone: false,
  tip: false,
};

export type OverlayContextType = {
  modals: Modals;
  setModals: (modals: Partial<Modals>) => void;
  closeModals: () => void;
};

export const OverlayContext = createContext({} as OverlayContextType);

interface OverlayProviderProps {
  children?: ReactNode | undefined;
}

export function OverlayContextProvider({ children }: OverlayProviderProps) {
  const [modals, setModals] = useState(defaults);

  const showModal = (m: Partial<Modals>) => {
    // This allows to show only one modal at a time.
    // In addition, this reset any true value for other modals.
    setModals({ ...defaults, ...m });
  };

  const closeModals = () => {
    setModals(defaults);
  };

  const returnValue = useMemo(
    () => ({
      modals,
      setModals: showModal,
      closeModals,
    }),
    [modals],
  );

  return (
    <OverlayContext.Provider value={returnValue}>
      {children}
    </OverlayContext.Provider>
  );
}

export const useOverlay = (): OverlayContextType => useContext(OverlayContext);
