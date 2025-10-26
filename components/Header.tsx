import React from 'react';

export const Header: React.FC = () => {
  return (
    <header>
      <div className="container mx-auto px-4 lg:px-8 py-6">
        <h1 className="text-5xl font-bold text-black">Protocol Timeline Parser</h1>
        <p className="text-black/80 mt-1">
          Upload or paste a protocol to structure its timeline.
        </p>
      </div>
    </header>
  );
};