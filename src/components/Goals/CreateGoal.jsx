import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { db, addToSyncQueue } from '../../lib/db';
import useStore from '../../store/useStore';
import PetSelector from './PetSelector';

const COLORS = [
    { id: 'purple', bg: 'bg-purple-500', hex: '#9C27B0' },
    { id: 'pink', bg: 'bg-pink-500', hex: '#E91E63' },
    { id: 'cyan', bg: 'bg-cyan-500', hex: '#00BCD4' },
    { id: 'lemon', bg: 'bg-yellow-400', hex: '#FFEB3B' },
    { id: 'deepOrange', bg: 'bg-orange-600', hex: '#FF5722' },
];

const CreateGoal = () => {
    const navigate = useNavigate();
    const { user } = useStore();
    const [formData, setFormData] = useState({
        name: '',
        target_amount: '',
        deadline: '',
        pet_avatar: 'lion',
        color_theme: 'purple',
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) return;

        const newGoal = {
            id: uuidv4(),
            user_id: user.id,
            name: formData.name,
            target_amount: parseFloat(formData.target_amount),
            current_amount: 0,
            deadline: formData.deadline || null,
            pet_avatar: formData.pet_avatar,
            color_theme: formData.color_theme,
            is_completed: false,
            created_at: new Date().toISOString(),
            synced: false
        };

        try {
            // 1. Save to local Dexie DB
            await db.goals.add(newGoal);

            // 2. Queue for Sync
            await addToSyncQueue('goals', 'INSERT', newGoal);

            // 3. Navigate back to Dashboard
            navigate('/');
        } catch (error) {
            console.error('Failed to create goal:', error);
            alert('Failed to create goal. Please try again.');
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Goal</h1>

            <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Goal Name</label>
                    <input
                        type="text"
                        required
                        placeholder="e.g., School Fees, Dream Bike"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Target Amount (RWF)</label>
                    <input
                        type="number"
                        required
                        min="1"
                        placeholder="50000"
                        value={formData.target_amount}
                        onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pick a Color Theme</label>
                    <div className="flex space-x-4">
                        {COLORS.map((color) => (
                            <button
                                key={color.id}
                                type="button"
                                onClick={() => setFormData({ ...formData, color_theme: color.id })}
                                className={`w-10 h-10 rounded-full ${color.bg} ${formData.color_theme === color.id ? 'ring-4 ring-offset-2 ring-gray-300 scale-110' : ''
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Choose Your Pet Avatar</label>
                    <PetSelector
                        selectedPet={formData.pet_avatar}
                        onSelect={(pet) => setFormData({ ...formData, pet_avatar: pet })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Deadline (Optional)</label>
                    <input
                        type="date"
                        value={formData.deadline}
                        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                    />
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-md font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-primary text-white rounded-md font-bold shadow-md hover:bg-orange-600 transition-colors"
                    >
                        Create Goal
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateGoal;
