import React from 'react';

interface ModuleWrapperProps {
    title: string;
    description: string;
    children: React.ReactNode;
}

export const ModuleWrapper: React.FC<ModuleWrapperProps> = ({ title, description, children }) => {
    return (
        <div className="card card--elevated">
            <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                    <h2 className="md-typescale-title-large" style={{ margin: '0 0 8px 0' }}>{title}</h2>
                    <p className="md-typescale-body-medium" style={{ margin: 0, color: 'var(--md-sys-color-on-surface-variant)' }}>
                        {description}
                    </p>
                </div>
                {children}
            </div>
        </div>
    );
};