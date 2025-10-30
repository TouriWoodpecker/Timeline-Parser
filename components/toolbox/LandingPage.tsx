import React from 'react';

interface LandingPageProps {
    onSelectModule: (index: number) => void;
}

const ModuleButton: React.FC<{
    title: string;
    description: string;
    icon: string;
    onClick: () => void;
}> = ({ title, description, icon, onClick }) => {
    return (
        <div 
            onClick={onClick}
            className="card card--elevated"
            style={{ 
                cursor: 'pointer',
                padding: '24px',
                textAlign: 'left',
                transition: 'transform 200ms ease-out, box-shadow 200ms ease-out',
            }}
            onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = 'var(--md-sys-elevation-level2)';
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--md-sys-elevation-level1)';
            }}
        >
            <span className="material-symbols-outlined" style={{ fontSize: '36px', color: 'var(--md-sys-color-primary)', marginBottom: '16px' }}>{icon}</span>
            <h2 className="md-typescale-title-large" style={{ margin: '0 0 8px 0' }}>{title}</h2>
            <p className="md-typescale-body-medium" style={{ margin: 0, color: 'var(--md-sys-color-on-surface-variant)' }}>{description}</p>
        </div>
    );
};

export const LandingPage: React.FC<LandingPageProps> = ({ onSelectModule }) => {
    const modules = [
        { title: 'OCR', description: 'Extract raw text from PDF files.', icon: 'document_scanner', index: 0 },
        { title: 'Parser', description: 'Structure raw text into a data table.', icon: 'mediation', index: 1 },
        { title: 'Analyze', description: 'Analyze entries against a corpus.', icon: 'science', index: 3 },
        { title: 'Insights', description: 'Find key insights in analyzed data.', icon: 'insights', index: 4 },
    ];

    return (
        <div style={{
            paddingTop: '80px', // Account for header
            display: 'flex',
            flexDirection: 'column',
            gap: '32px'
        }}>
            <div>
                <h1 className="md-typescale-display-small" style={{ margin: 0 }}>pea I</h1>
                <p className="md-typescale-title-medium" style={{ margin: '8px 0 0 0', color: 'var(--md-sys-color-on-surface-variant)' }}>
                    Insights, Parsing, Extracting, Analyzing
                </p>
            </div>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '24px',
            }}>
                {modules.map(mod => (
                    <ModuleButton
                        key={mod.title}
                        title={mod.title}
                        description={mod.description}
                        icon={mod.icon}
                        onClick={() => onSelectModule(mod.index)}
                    />
                ))}
            </div>
        </div>
    );
};