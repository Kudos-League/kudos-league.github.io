import React from 'react';

const SettingsSection: React.FC<{
  title: string;
  description?: string;
  noBorder?: boolean;
  children: React.ReactNode;
}> = ({ title, description, noBorder, children }) => (
    <div
        className={
            'grid gap-y-10 gap-x-8 px-6 py-10 md:grid-cols-3 ' +
			(noBorder ? '' : 'border-b border-gray-200 dark:border-white/10')
        }
    >
        <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
            {description ? (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
            ) : null}
        </div>
        <div className="md:col-span-2">{children}</div>
    </div>
);

export default React.memo(SettingsSection);
