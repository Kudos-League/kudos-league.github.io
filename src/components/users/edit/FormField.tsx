import React from 'react';

const FormField: React.FC<{
  label?: string;
  help?: React.ReactNode;
  children: React.ReactNode;
}> = ({ label, help, children }) => (
    <div>
        {label ? (
            <label className="block font-semibold mb-1 text-gray-900 dark:text-white">{label}</label>
        ) : null}
        {children}
        {help ? <p className="text-xs text-gray-500 italic mt-2">{help}</p> : null}
    </div>
);

export default React.memo(FormField);
