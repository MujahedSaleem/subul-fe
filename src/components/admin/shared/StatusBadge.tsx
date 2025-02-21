import React from 'react';

interface StatusBadgeProps {
  status: 'New' | 'Pending' | 'Confirmed' | 'Active' | 'Inactive' | 'Draft';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'New':
        return {
          bg: 'bg-gradient-to-r from-emerald-400/10 to-emerald-500/10',
          text: 'text-emerald-700',
          ring: 'ring-emerald-500/20',
          label: 'جديد'
        };
      case 'Pending':
        return {
          bg: 'bg-gradient-to-r from-amber-400/10 to-amber-500/10',
          text: 'text-amber-700',
          ring: 'ring-amber-500/20',
          label: 'قيد الانتظار'
        };
      case 'Draft':
        return {
          bg: 'bg-gradient-to-r from-amber-400/10 to-amber-500/10',
          text: 'text-amber-700',
          ring: 'ring-amber-500/20',
          label: 'مسودة'
        };
      case 'Confirmed':
        return {
          bg: 'bg-gradient-to-r from-sky-400/10 to-sky-500/10',
          text: 'text-sky-700',
          ring: 'ring-sky-500/20',
          label: 'مؤكد'
        };
      case 'Active':
        return {
          bg: 'bg-gradient-to-r from-emerald-400/10 to-emerald-500/10',
          text: 'text-emerald-700',
          ring: 'ring-emerald-500/20',
          label: 'نشط'
        };
      case 'Inactive':
        return {
          bg: 'bg-gradient-to-r from-slate-400/10 to-slate-500/10',
          text: 'text-slate-700',
          ring: 'ring-slate-500/20',
          label: 'غير نشط'
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-slate-400/10 to-slate-500/10',
          text: 'text-slate-700',
          ring: 'ring-slate-500/20',
          label: status
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span className={`
      inline-flex items-center rounded-full px-3 py-1
      text-xs font-medium
      ${config.bg}
      ${config.text}
      ring-1 ring-inset ${config.ring}
      shadow-sm
    `}>
      {config.label}
    </span>
  );
};

export default StatusBadge;