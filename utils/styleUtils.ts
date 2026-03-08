
export const AVATAR_COLORS = [
    { id: 'blue', name: 'Azul', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    { id: 'rose', name: 'Rosa', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
    { id: 'emerald', name: 'Verde', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    { id: 'purple', name: 'Roxo', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    { id: 'amber', name: 'Laranja', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
];

export const getAvatarColorStyles = (colorId: string) => {
    const color = AVATAR_COLORS.find(c => c.id === colorId) || AVATAR_COLORS[0];
    return `${color.bg} ${color.text} ${color.border}`;
};
