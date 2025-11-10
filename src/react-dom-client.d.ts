/**
 * Type declaration for react-dom/client
 * This ensures TypeScript can find the types even if @types/react-dom is not properly installed
 */

declare module 'react-dom/client' {
  import { ReactElement } from 'react';
  
  interface Root {
    render(children: ReactElement): void;
    unmount(): void;
  }
  
  export function createRoot(container: HTMLElement | null): Root;
  export function hydrateRoot(container: HTMLElement | null, children: ReactElement): Root;
}

