
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface AdminStatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  badgeText: string;
  BadgeIcon: LucideIcon;
  variant?: 'keppel' | 'giants' | 'orange' | 'dark';
}

export const AdminStatCard: React.FC<AdminStatCardProps> = ({
  icon: Icon,
  label,
  value,
  badgeText,
  BadgeIcon,
  variant = 'keppel'
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'giants':
        return {
          bg: 'bg-white',
          iconBg: 'bg-delphi-giants/10',
          iconColor: 'text-delphi-giants',
          badgeBg: 'bg-delphi-giants/5',
          badgeColor: 'text-delphi-giants',
          shadow: 'shadow-delphi-giants/5',
          accent: 'bg-delphi-giants/5'
        };
      case 'orange':
        return {
          bg: 'bg-white',
          iconBg: 'bg-delphi-orange/10',
          iconColor: 'text-delphi-orange',
          badgeBg: 'bg-delphi-orange/5',
          badgeColor: 'text-delphi-orange',
          shadow: 'shadow-delphi-orange/5',
          accent: 'bg-delphi-orange/5'
        };
      case 'dark':
        return {
          bg: 'bg-slate-900',
          iconBg: 'bg-white/10',
          iconColor: 'text-white',
          badgeBg: 'bg-white/10',
          badgeColor: 'text-white/60',
          shadow: 'shadow-slate-900/10',
          accent: 'bg-white/5',
          textColor: 'text-white',
          labelColor: 'text-white/40'
        };
      default: // keppel
        return {
          bg: 'bg-white',
          iconBg: 'bg-delphi-keppel/10',
          iconColor: 'text-delphi-keppel',
          badgeBg: 'bg-delphi-keppel/5',
          badgeColor: 'text-delphi-keppel',
          shadow: 'shadow-delphi-keppel/5',
          accent: 'bg-delphi-keppel/5'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className={`${styles.bg} p-8 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden relative group transition-all`}>
      <div className="flex items-center gap-4 relative z-10">
        <div className={`${styles.iconBg} p-3 rounded-2xl group-hover:scale-110 transition-transform`}>
          <Icon className={`w-6 h-6 ${styles.iconColor}`} />
        </div>
        <div>
          <p className={`text-[10px] font-black ${styles.labelColor || 'text-slate-400'} uppercase tracking-widest`}>{label}</p>
          <h4 className={`text-2xl font-black ${styles.textColor || 'text-slate-900'} mt-1`}>{value}</h4>
        </div>
      </div>
      <div className={`mt-4 flex items-center gap-2 text-[10px] font-bold ${styles.badgeColor} ${styles.badgeBg} px-3 py-1 rounded-full w-fit`}>
        {variant === 'dark' && <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse mr-1" />}
        <BadgeIcon className="w-3 h-3" /> {badgeText}
      </div>
      <div className={`absolute top-0 right-0 w-24 h-24 ${styles.accent} rounded-bl-full -mr-12 -mt-12 transition-all group-hover:scale-150`} />
      {variant === 'dark' && <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-tl-full -mr-16 -mb-16 transition-all group-hover:scale-150" />}
    </div>
  );
};
