import React from 'react';

interface Props {
    name: string;
    colorClass?: string;
}

const Pill: React.FC<Props> = ({ name, colorClass }) => {
    return (
        <span
            className={`px-3 py-1 text-sm rounded-full font-medium 
                ${colorClass || 'bg-green-100 text-green-700'}`}
        >
            {name}
        </span>
    );
};

export default Pill;
