import React from 'react';

const PETS = [
    { id: 'lion', icon: '🦁', name: 'Lion' },
    { id: 'elephant', icon: '🐘', name: 'Elephant' },
    { id: 'bird', icon: '🐦', name: 'Bird' },
    { id: 'fish', icon: '🐠', name: 'Fish' },
    { id: 'rabbit', icon: '🐰', name: 'Rabbit' },
    { id: 'turtle', icon: '🐢', name: 'Turtle' },
    { id: 'butterfly', icon: '🦋', name: 'Butterfly' },
    { id: 'monkey', icon: '🐵', name: 'Monkey' },
];

const PetSelector = ({ selectedPet, onSelect }) => {
    return (
        <div className="grid grid-cols-4 gap-4">
            {PETS.map((pet) => (
                <button
                    key={pet.id}
                    type="button"
                    onClick={() => onSelect(pet.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${selectedPet === pet.id
                            ? 'border-primary bg-primary/5 shadow-md transform scale-105'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                >
                    <span className="text-3xl mb-1">{pet.icon}</span>
                    <span className="text-xs font-medium text-gray-600">{pet.name}</span>
                </button>
            ))}
        </div>
    );
};

export default PetSelector;
