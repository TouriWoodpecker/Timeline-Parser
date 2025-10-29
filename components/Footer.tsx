import React, { useState, useEffect } from 'react';

const quotes = [
  { text: "The old world is dying, and the new world struggles to be born: now is the time of monsters.", author: "Antonio Gramsci" },
  { text: "I'm a pessimist because of intelligence, but an optimist because of will.", author: "Antonio Gramsci" },
  { text: "I hate the indifferent.", author: "Antonio Gramsci" },
  { text: "To tell the truth is revolutionary.", author: "Antonio Gramsci" },
  { text: "Man is condemned to be free; because once thrown into the world, he is responsible for everything he does.", author: "Jean-Paul Sartre" },
  { text: "All that we see or seem / Is but a dream within a dream.", author: "Edgar Allan Poe" },
  { text: "I was ashamed of myself when I realized life was a costume party and I attended with my real face.", author: "Franz Kafka" },
  { text: "In the fight between you and the world, back the world.", author: "Franz Kafka" },
  { text: "Don't panic.", author: "Douglas Adams" }
];

export const Footer: React.FC = () => {
  const [quote, setQuote] = useState({ text: '', author: '' });

  useEffect(() => {
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, []);

  const footerStyle: React.CSSProperties = {
    padding: '48px 24px',
    textAlign: 'center',
    color: 'var(--md-sys-color-on-surface-variant)',
    fontStyle: 'italic',
    marginTop: 'auto',
  };

  return (
    <footer style={footerStyle}>
      <p className="md-typescale-body-medium" style={{ margin: 0 }}>
        &ldquo;{quote.text}&rdquo; &ndash; {quote.author}
      </p>
    </footer>
  );
};