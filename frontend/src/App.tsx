/* @module: App — root component, loads routes and global modals */
import React from 'react';
import { LifeDropProvider } from './context/LifeDropContext';
import { AppRoutes } from './routes';
import { GlassFeedbackModal } from './components/common/GlassFeedbackModal';

export function App() {
  return (
    <LifeDropProvider>
      <AppRoutes />
      <GlassFeedbackModal />
    </LifeDropProvider>
  );
}

export default App;
