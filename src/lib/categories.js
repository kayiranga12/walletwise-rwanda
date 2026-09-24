import {
    ShoppingBasket, House, Bike, Smartphone, Zap, GraduationCap, HeartPulse, Users,
    UtensilsCrossed, Shirt, Clapperboard, HandHeart, Handshake, PiggyBank, Landmark,
    CircleEllipsis, Briefcase, Store, Laptop, Gift, Banknote, CreditCard, Coins,
    Building2, Car, Beef, TrendingUp, Receipt
} from 'lucide-react';

// The 50/30/20 buckets every expense rolls up into
export const BUCKETS = [
    { id: 'Needs', color: '#ef4444', bar: 'bg-red-500', soft: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400' },
    { id: 'Wants', color: '#f59e0b', bar: 'bg-amber-500', soft: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400' },
    { id: 'Savings', color: '#10b981', bar: 'bg-emerald-500', soft: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400' },
];

export const DEFAULT_SPLIT = { Needs: 50, Wants: 30, Savings: 20 };

// Everyday Rwandan spending, each with the bucket it usually belongs to
export const EXPENSE_CATEGORIES = [
    { id: 'food', icon: ShoppingBasket, bucket: 'Needs', color: '#16a34a' },
    { id: 'rent', icon: House, bucket: 'Needs', color: '#0ea5e9' },
    { id: 'transport', icon: Bike, bucket: 'Needs', color: '#f97316' },
    { id: 'airtime', icon: Smartphone, bucket: 'Needs', color: '#eab308' },
    { id: 'utilities', icon: Zap, bucket: 'Needs', color: '#6366f1' },
    { id: 'school', icon: GraduationCap, bucket: 'Needs', color: '#8b5cf6' },
    { id: 'health', icon: HeartPulse, bucket: 'Needs', color: '#ef4444' },
    { id: 'family', icon: Users, bucket: 'Needs', color: '#14b8a6' },
    { id: 'eating_out', icon: UtensilsCrossed, bucket: 'Wants', color: '#f43f5e' },
    { id: 'shopping', icon: Shirt, bucket: 'Wants', color: '#ec4899' },
    { id: 'entertainment', icon: Clapperboard, bucket: 'Wants', color: '#a855f7' },
    { id: 'giving', icon: HandHeart, bucket: 'Wants', color: '#d946ef' },
    { id: 'ikimina', icon: Handshake, bucket: 'Savings', color: '#059669' },
    { id: 'savings', icon: PiggyBank, bucket: 'Savings', color: '#10b981' },
    { id: 'debt', icon: Landmark, bucket: 'Savings', color: '#0891b2' },
    { id: 'other', icon: CircleEllipsis, bucket: 'Wants', color: '#6b7280' },
];

export const INCOME_CATEGORIES = [
    { id: 'salary', icon: Briefcase, color: '#16a34a' },
    { id: 'business', icon: Store, color: '#0ea5e9' },
    { id: 'freelance', icon: Laptop, color: '#8b5cf6' },
    { id: 'gift', icon: Gift, color: '#ec4899' },
    { id: 'ikimina_payout', icon: Handshake, color: '#059669' },
    { id: 'other', icon: CircleEllipsis, color: '#6b7280' },
];

// Where the money moved through
export const SOURCES = [
    { id: 'momo', icon: Smartphone, color: '#FFCC00' },
    { id: 'airtel', icon: Smartphone, color: '#E40000' },
    { id: 'cash', icon: Banknote, color: '#16a34a' },
    { id: 'bank', icon: Landmark, color: '#2563eb' },
    { id: 'card', icon: CreditCard, color: '#6b7280' },
];

export const ASSET_TYPES = [
    { id: 'Cash', icon: Banknote },
    { id: 'MobileMoney', icon: Smartphone },
    { id: 'Savings', icon: PiggyBank },
    { id: 'Ikimina', icon: Handshake },
    { id: 'Investments', icon: TrendingUp },
    { id: 'Property', icon: Building2 },
    { id: 'Vehicle', icon: Car },
    { id: 'Livestock', icon: Beef },
    { id: 'Other', icon: Coins },
];

export const LIABILITY_TYPES = [
    { id: 'Loan', icon: Landmark },
    { id: 'SaccoLoan', icon: Handshake },
    { id: 'MobileLoan', icon: Smartphone },
    { id: 'Credit', icon: CreditCard },
    { id: 'Personal', icon: Users },
    { id: 'Other', icon: Receipt },
];

export const PETS = [
    { id: 'lion', icon: '🦁' },
    { id: 'elephant', icon: '🐘' },
    { id: 'bird', icon: '🐦' },
    { id: 'fish', icon: '🐠' },
    { id: 'rabbit', icon: '🐰' },
    { id: 'turtle', icon: '🐢' },
    { id: 'butterfly', icon: '🦋' },
    { id: 'monkey', icon: '🐵' },
];

export const GOAL_COLORS = [
    { id: 'purple', bg: 'bg-purple-500', hex: '#9C27B0' },
    { id: 'pink', bg: 'bg-pink-500', hex: '#E91E63' },
    { id: 'cyan', bg: 'bg-cyan-500', hex: '#00BCD4' },
    { id: 'lemon', bg: 'bg-yellow-400', hex: '#FACC15' },
    { id: 'deepOrange', bg: 'bg-orange-600', hex: '#FF5722' },
];

const byId = (list, fallback) => (id) => list.find(x => x.id === id) || list.find(x => x.id === fallback) || list[0];
export const getExpenseCategory = byId(EXPENSE_CATEGORIES, 'other');
export const getIncomeCategory = byId(INCOME_CATEGORIES, 'other');
export const getSource = byId(SOURCES, 'cash');
export const getBucket = byId(BUCKETS, 'Needs');
export const getPet = byId(PETS, 'lion');
export const getGoalColor = byId(GOAL_COLORS, 'purple');
export const getAssetType = byId(ASSET_TYPES, 'Other');
export const getLiabilityType = byId(LIABILITY_TYPES, 'Other');

