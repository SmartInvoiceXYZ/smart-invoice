import { Modals, ModalType, OverlayContextType } from '@smartinvoicexyz/types';
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
  addMilestones: false,
};

export const OverlayContext = createContext({} as OverlayContextType);

interface OverlayProviderProps {
  children?: ReactNode | undefined;
}

export function OverlayContextProvider({ children }: OverlayProviderProps) {
  const [modals, setModals] = useState(defaults);

  const returnValue = useMemo(
    () => ({
      modals,
      openModal: (m: ModalType) => setModals({ ...defaults, [m]: true }),
      closeModals: () => setModals(defaults),
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
