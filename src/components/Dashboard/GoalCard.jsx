import React from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

const GoalCard = ({ goal }) => {
    const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100);

    // Map color names to Tailwind classes or hex codes (simplified)
    const colorMap = {
        purple: 'bg-purple-500',
        pink: 'bg-pink-500',
        cyan: 'bg-cyan-500',
        lemon: 'bg-yellow-400',
        deepOrange: 'bg-orange-600'
    };

    const bgColor = colorMap[goal.color_theme] || 'bg-primary';

    return (
        <Link to={`/goals/${goal.id}`} className="block">
            <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100 overflow-hidden">
                <div className={`h-2 ${bgColor}`}></div>
                <div className="p-5">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{goal.name}</h3>
                            <p className="text-sm text-gray-500">Target: {goal.target_amount.toLocaleString()} RWF</p>
                        </div>
                        {/* Pet icon placeholder */}
                        <div className={`w-10 h-10 rounded-full ${bgColor}/10 flex items-center justify-center`}>
                            {/* Could be an SVG or image based on goal.pet_avatar */}
                            <span className="text-xl">🦁</span>
                        </div>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                        <div
                            className={`h-2.5 rounded-full ${bgColor}`}
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>

                    <div className="flex justify-between text-xs text-gray-500 font-medium">
                        <span>{goal.current_amount.toLocaleString()} RWF saved</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export const AddGoalCard = () => (
    <Link to="/goals/new" className="block h-full">
        <div className="border-2 border-dashed border-gray-300 rounded-lg h-full flex flex-col items-center justify-center p-6 text-gray-400 hover:text-primary hover:border-primary hover:bg-orange-50 transition-colors duration-200">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <Plus className="w-6 h-6" />
            </div>
            <span className="font-medium">Create New Goal</span>
        </div>
    </Link>
);

export default GoalCard;
