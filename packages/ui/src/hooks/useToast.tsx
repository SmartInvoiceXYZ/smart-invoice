import {
  AlertStatus as ChakraAlertStatus,
  CreateToastFnReturn,
  ToastId,
  useToast as useChakraToast,
} from '@chakra-ui/react';
import { ToastProps, UseToastReturn } from '@smartinvoicexyz/types';
import _ from 'lodash';
import React, { useRef } from 'react';

import { Toast } from '../atoms';

const DEFAULT_TOAST_DURATION = 3000;

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
    duration: duration ?? DEFAULT_TOAST_DURATION,
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
      toastIdRef.current = ToastBase({
        ...props,
        status: 'success' as ChakraAlertStatus,
        ...closeProps,
      });
    },
    error(props: Omit<ToastProps, 'status'>) {
      toastIdRef.current = ToastBase({
        ...props,
        status: 'error' as ChakraAlertStatus,
        ...closeProps,
      });
    },
    warning(props: Omit<ToastProps, 'status'>) {
      toastIdRef.current = ToastBase({
        ...props,
        status: 'warning' as ChakraAlertStatus,
        ...closeProps,
      });
    },
    loading(props: Omit<ToastProps, 'status'>) {
      toastIdRef.current = ToastBase({
        ...props,
        status: 'loading' as ChakraAlertStatus,
        ...closeProps,
      });
    },
    info(props: Omit<ToastProps, 'status'>) {
      toastIdRef.current = ToastBase({
        ...props,
        status: 'info' as ChakraAlertStatus,
        ...closeProps,
      });
    },
  };
};
