interface StatusBadgeProps {
  status: 'pending' | 'simulated' | 'approved' | 'rejected';
}

const config = {
  pending: {
    label: 'Pendiente',
    bg: 'bg-amber-500/15',
    text: 'text-amber-400',
    dot: 'bg-amber-400',
    animate: true,
  },
  simulated: {
    label: 'Simulada',
    bg: 'bg-cyan-500/15',
    text: 'text-cyan-400',
    dot: 'bg-cyan-400',
    animate: false,
  },
  approved: {
    label: 'Aprobada',
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
    animate: false,
  },
  rejected: {
    label: 'Rechazada',
    bg: 'bg-red-500/15',
    text: 'text-red-400',
    dot: 'bg-red-400',
    animate: false,
  },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const c = config[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${c.dot} ${c.animate ? 'animate-pulse-dot' : ''}`}
      />
      {c.label}
    </span>
  );
}
