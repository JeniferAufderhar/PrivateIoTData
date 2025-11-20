/**
 * Vendor bundle for code splitting
 * Separates heavy third-party dependencies from application code
 * This improves initial load time and enables better caching
 */

// Core React libraries
export { default as React } from 'react';
export { default as ReactDOM } from 'react-dom/client';

// Web3 and blockchain libraries
export * from 'viem';
export * from 'wagmi';
export * from '@rainbow-me/rainbowkit';

// UI component libraries
export * from '@radix-ui/react-alert-dialog';
export * from '@radix-ui/react-dialog';
export * from '@radix-ui/react-dropdown-menu';
export * from '@radix-ui/react-label';
export * from '@radix-ui/react-select';
export * from '@radix-ui/react-slot';
export * from '@radix-ui/react-tabs';
export * from '@radix-ui/react-toast';

// Utility libraries
export { default as clsx } from 'clsx';
export * from 'class-variance-authority';
export * from 'tailwind-merge';
export * from 'lucide-react';
