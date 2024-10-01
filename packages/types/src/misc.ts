import {
  AlertStatus as ChakraAlertStatus,
  CreateToastFnReturn,
  ToastProps as ChakraToastProps,
} from '@chakra-ui/react';
import { ReactNode } from 'react';

export type Modals = {
  networkChange: boolean;
  deposit: boolean;
  lock: boolean;
  release: boolean;
  resolve: boolean;
  withdraw: boolean;
  addMilestones: boolean;
  tip: boolean;
};

type CustomToastProps = {
  status: ChakraAlertStatus;
  title: string | ReactNode;
  description?: string | ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon?: any; // IconType;
  iconName?: string;
  iconColor?: string;
  toast?: CreateToastFnReturn;
  closeToast?: () => void;
  descriptionNoOfLines?: number;
};

export type ToastProps = CustomToastProps & ChakraToastProps;

export interface UseToastReturn {
  success: (_props: Omit<ToastProps, 'status'>) => void;
  error: (_props: Omit<ToastProps, 'status'>) => void;
  warning: (_props: Omit<ToastProps, 'status'>) => void;
  loading: (_props: Omit<ToastProps, 'status'>) => void;
  info: (_props: Omit<ToastProps, 'status'>) => void;
}
