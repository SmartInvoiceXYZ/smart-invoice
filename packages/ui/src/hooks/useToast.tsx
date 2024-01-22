import {
  AlertStatus as ChakraAlertStatus,
  CreateToastFnReturn,
  ToastId,
  useToast as useChakraToast,
} from '@chakra-ui/react';
import { ToastProps, UseToastReturn } from '@smart-invoice/types';
import _ from 'lodash';
import React, { useRef } from 'react';

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
    duration: duration ?? 3000,
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

  return {
    success(props: Omit<ToastProps, 'status'>) {
      toastIdRef.current = ToastBase({
        ...props,
        status: 'success' as ChakraAlertStatus,
        closeToast,
        isClosable: props.isClosable ?? true,
        toast,
      });
    },
    error(props: Omit<ToastProps, 'status'>) {
      toastIdRef.current = ToastBase({
        ...props,
        status: 'error' as ChakraAlertStatus,
        closeToast,
        isClosable: props.isClosable ?? true,
        toast,
      });
    },
    warning(props: Omit<ToastProps, 'status'>) {
      toastIdRef.current = ToastBase({
        ...props,
        status: 'warning' as ChakraAlertStatus,
        closeToast,
        isClosable: props.isClosable ?? true,
        toast,
      });
    },
    loading(props: Omit<ToastProps, 'status'>) {
      toastIdRef.current = ToastBase({
        ...props,
        status: 'loading' as ChakraAlertStatus,
        closeToast,
        isClosable: props.isClosable ?? true,
        toast,
      });
    },
    info(props: Omit<ToastProps, 'status'>) {
      toastIdRef.current = ToastBase({
        ...props,
        status: 'info' as ChakraAlertStatus,
        closeToast,
        isClosable: props.isClosable ?? true,
        toast,
      });
    },
  };
};
