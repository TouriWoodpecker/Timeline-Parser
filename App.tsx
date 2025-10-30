import React, { useState, useRef } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Toolbox } from './Toolbox';
import { getRandomQuote } from './utils/quotes';

function App() {
  const [toolboxView, setToolboxView] = useState<'landing' | 'tools'>('landing');
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [headerMessage, setHeaderMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  const headerRef = useRef<HTMLElement>(null);
  
  const handleGoHome = () => {
    setToolboxView('landing');
    setHeaderMessage('');
  };

  const handleTabSelect = (index: number) => {
    setToolboxView('tools');
    setActiveTabIndex(index);
  };

  const handleSetLoading = (loading: boolean, message: string = '') => {
    setIsLoading(loading);
    if (loading) {
      setHeaderMessage(message || getRandomQuote());
    } else {
      setHeaderMessage('');
    }
  };
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: 'var(--md-sys-color-surface)',
      color: 'var(--md-sys-color-on-surface)',
      transition: 'background-color 0.3s, color 0.3s'
    }}>
      <Header 
        ref={headerRef}
        isVisible={isHeaderVisible}
        message={headerMessage}
        isLoading={isLoading}
      />
      <main style={{
        flexGrow: 1,
        padding: '24px',
        paddingTop: `calc(80px + 24px)`, // Header height + padding
        paddingBottom: `calc(80px + 24px)`, // Footer height + padding
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto',
        boxSizing: 'border-box'
      }}>
        <Toolbox
          view={toolboxView}
          activeTabIndex={activeTabIndex}
          onSelectModule={handleTabSelect}
          setLoading={handleSetLoading}
        />
      </main>
      <Footer
        toolboxView={toolboxView}
        activeTabIndex={activeTabIndex}
        onTabSelect={handleTabSelect}
        onGoHome={handleGoHome}
      />
    </div>
  );
}

export default App;
