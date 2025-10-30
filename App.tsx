import React, { useState, useRef, useEffect } from 'react';

// Core components
import { Header } from './components/Header';
import { Footer } from './components/Footer';

// Toolbox components
import { Toolbox } from './Toolbox';
import { LandingPage } from './components/toolbox/LandingPage';

function App() {
  const [toolboxView, setToolboxView] = useState<'landing' | 'tools'>('landing');
  const [activeToolboxTab, setActiveToolboxTab] = useState(2); // Home is default
  
  // Global loading and status state for the toolbox
  const [isToolboxLoading, setIsToolboxLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Header state
  const [headerMessage, setHeaderMessage] = useState('');
  const headerRef = useRef<HTMLElement>(null);
  const headerMessageTimeoutRef = useRef<number | null>(null);

  // Effect to manage the global header message
  useEffect(() => {
    if (headerMessageTimeoutRef.current) {
        clearTimeout(headerMessageTimeoutRef.current);
    }

    let message = '';
    let isSticky = false;
    let isError = false;

    if (isToolboxLoading && loadingMessage) {
        message = loadingMessage;
        isSticky = true;
    } else if (error) {
        message = `Error: ${error}`;
        isError = true;
    } else if (statusMessage) {
        message = statusMessage;
    }

    setHeaderMessage(message);

    if (message && !isSticky) {
        const timeoutDuration = isError ? 6000 : 4000;
        headerMessageTimeoutRef.current = window.setTimeout(() => {
            setHeaderMessage('');
            if(statusMessage) setStatusMessage('');
            if(error) setError(null);
        }, timeoutDuration);
    }
  }, [isToolboxLoading, loadingMessage, statusMessage, error]);

  // --- Handlers --- //
  const handleSelectModule = (index: number) => {
      setActiveToolboxTab(index);
      setToolboxView('tools');
  };

  const handleGoHome = () => {
    setToolboxView('landing');
    setActiveToolboxTab(2); // Home is index 2
  };
  
  const renderCurrentView = () => {
    if (toolboxView === 'landing') {
      return <LandingPage onSelectModule={handleSelectModule} />;
    }
    return (
      <Toolbox 
          activeTab={activeToolboxTab}
          setLoading={setIsToolboxLoading}
          setLoadingMessage={setLoadingMessage}
          setStatusMessage={setStatusMessage}
          setError={setError}
      />
    );
  };

  return (
    <>
      <Header 
        ref={headerRef}
        isVisible={true} // Header is always visible now
        message={headerMessage}
        isLoading={isToolboxLoading}
      />
      <main>
        {renderCurrentView()}
      </main>
      <Footer 
        toolboxView={toolboxView}
        activeTabIndex={activeToolboxTab}
        onTabSelect={handleSelectModule} // Re-use for direct tab selection
        onGoHome={handleGoHome}
      />
      {/* FabMenu is removed as the app is now toolbox-only */}
    </>
  );
}

export default App;
