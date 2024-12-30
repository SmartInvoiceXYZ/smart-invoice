import {
  AlertStatus as ChakraAlertStatus,
  CreateToastFnReturn,
  ToastId,
  useToast as useChakraToast,
} from '@chakra-ui/react';
import { ToastProps, UseToastReturn } from '@smartinvoicexyz/types';
import _ from 'lodash';
import { useRef } from 'react';

import { Toast } from '../atoms';

const ToastBase = ({
  toast,
  title,
  description,
  iconName,
  status,
  id,
  duration,
  closeToast,
  descriptionNoOfLines = 2,
  ...props // gets the rest of the original Chakra Toast props (such as isClosable)
}: ToastProps & {
  status: ChakraAlertStatus;
  toast: Partial<CreateToastFnReturn>;
}) => {
  return toast({
    title,
    description,
    status,
    id,
    duration,
    position: 'top-right',
    ...props,
    render: () => (
      <Toast
        title={_.toString(title) || ''}
        description={description}
        iconName={iconName}
        status={status}
        closeToast={closeToast}
        descriptionNoOfLines={descriptionNoOfLines}
        {...props}
      />
    ),
  });
};

export const useToast = (): UseToastReturn => {
  const toast = useChakraToast();
  const toastIdRef = useRef<ToastId | null>(null);

  function closeToast() {
    if (toastIdRef.current) {
      toast.close(toastIdRef.current);
    }
  }
  const closeProps = { isClosable: true, closeToast, toast };

  return {
    success(props: Omit<ToastProps, 'status'>) {
      closeToast();
      toastIdRef.current = ToastBase({
        ...closeProps,
        ...props,
        status: 'success' as ChakraAlertStatus,
      });
    },
    error(props: Omit<ToastProps, 'status'>) {
      closeToast();
      toastIdRef.current = ToastBase({
        ...closeProps,
        ...props,
        status: 'error' as ChakraAlertStatus,
      });
    },
    warning(props: Omit<ToastProps, 'status'>) {
      closeToast();
      toastIdRef.current = ToastBase({
        ...closeProps,
        ...props,
        status: 'warning' as ChakraAlertStatus,
      });
    },
    loading(props: Omit<ToastProps, 'status'>) {
      closeToast();
      toastIdRef.current = ToastBase({
        ...closeProps,
        ...props,
        status: 'loading' as ChakraAlertStatus,
      });
    },
    info(props: Omit<ToastProps, 'status'>) {
      closeToast();
      toastIdRef.current = ToastBase({
        ...closeProps,
        ...props,
        status: 'info' as ChakraAlertStatus,
      });
    },
  };
};
