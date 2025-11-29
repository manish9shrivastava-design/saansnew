'use client';

import { useEffect, useState } from 'react';
import * as React from 'react';

type ToastProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: 'default' | 'destructive';
  action?: React.ReactNode;
}

export type Toast = ToastProps & {
  id: string;
};

const listeners: Array<(toast: Toast) => void> = [];

let memoryState: Toast[] = [];

function dispatch(toast: Toast) {
  memoryState = [...memoryState, toast];
  listeners.forEach(listener => {
    listener(toast);
  });
}

function useToast() {
  const [state, setState] = useState<Toast[]>(memoryState);

  useEffect(() => {
    const listener = (toast: Toast) => {
        setState(prevState => [...prevState, toast]);
    };
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    toasts: state,
    toast: (props: ToastProps) => {
        const newToast: Toast = {
            ...props,
            id: crypto.randomUUID(),
        }
        dispatch(newToast);
    }
  };
}

export { useToast, dispatch };
