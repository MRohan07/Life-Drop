/* @module: Card.types — Card component props and container types */
import { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  isInteractive?: boolean;
  variant?: 'default' | 'glass' | 'dark' | 'amber';
}
