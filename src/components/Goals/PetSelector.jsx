import React from 'react';
import { useTranslation } from 'react-i18next';
import { PETS } from '../../lib/categories';

const PetSelector = ({ selectedPet, onSelect }) => {
    const { t } = useTranslation();
    return (
        <div className="grid grid-cols-4 gap-3">
            {PETS.map((pet) => (
                <button
                    key={pet.id}
                    type="button"
                    onClick={() => onSelect(pet.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${selectedPet === pet.id
                            ? 'border-primary bg-primary/5 shadow-md scale-105'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                        }`}
                >
                    <span className="text-3xl mb-1">{pet.icon}</span>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{t(`pets.${pet.id}`)}</span>
                </button>
            ))}
        </div>
    );
};

export default PetSelector;
