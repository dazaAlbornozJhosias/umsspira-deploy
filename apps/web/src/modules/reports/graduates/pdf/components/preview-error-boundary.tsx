'use client';

import { Component, ReactNode } from 'react';

interface PreviewErrorBoundaryProps {
  children: ReactNode;
  // Se llama una vez cuando lo de adentro falla
  onError: () => void;
}

interface PreviewErrorBoundaryState {
  hasError: boolean;
}

// Atrapa las fallas del visor de PDF para que no tumben la pantalla de titulados.
// Pasa, por ejemplo, en navegadores que no soportan la versión de pdf.js que trae react-pdf.
export class PreviewErrorBoundary extends Component<PreviewErrorBoundaryProps, PreviewErrorBoundaryState> {
  state: PreviewErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): PreviewErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(): void {
    this.props.onError();
  }

  render(): ReactNode {
    return this.state.hasError ? null : this.props.children;
  }
}
