'use client';

import { createPortal } from 'react-dom';

export const Portal = ({ children }: { children: React.ReactNode }) => {
  if (typeof window === 'undefined') return null;

  return createPortal(children, document.body);
};

