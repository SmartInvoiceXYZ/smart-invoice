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
  addMilestone: boolean;
};

type CustomToastProps = {
  status: ChakraAlertStatus;
  title: string | ReactNode;
  description?: string | ReactNode;
  icon?: any; // IconType;
  iconName?: string;
  iconColor?: string;
  toast?: CreateToastFnReturn;
  closeToast?: () => void;
  descriptionNoOfLines?: number;
};

export type ToastProps = CustomToastProps & ChakraToastProps;

export interface UseToastReturn {
  success: (props: Omit<ToastProps, 'status'>) => void;
  error: (props: Omit<ToastProps, 'status'>) => void;
  warning: (props: Omit<ToastProps, 'status'>) => void;
  loading: (props: Omit<ToastProps, 'status'>) => void;
  info: (props: Omit<ToastProps, 'status'>) => void;
}
