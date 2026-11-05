import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { STATUS_LABEL } from '../data/logic';
import type { ProjectStatus } from '../data/types';
import { Icon, type IconName } from './Icon';

export const STATUS_TONE: Record<ProjectStatus, string> = {
  nuevo: 'gray', cotizacion: 'blue', enviado: 'amber', aprobado: 'green', rechazado: 'red',
};

export function Pill({ tone, children, dot = true }: { tone: string; children: ReactNode; dot?: boolean }) {
  return <span className={`pill tone-${tone}`}>{dot && <span className="dot" />}{children}</span>;
}

export function StatusPill({ status }: { status: ProjectStatus }) {
  return <Pill tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Pill>;
}

export function PageHeader({ eyebrow, title, back, backLabel, badge, actions }: {
  eyebrow?: ReactNode; title: string; back?: string; backLabel?: string; badge?: ReactNode; actions?: ReactNode;
}) {
  return (
    <header className="ph">
      <div className="ph-left">
        {back && <Link className="back" to={back} aria-label={backLabel ?? 'Volver'}><Icon name="back" size={18} /></Link>}
        <div className="ph-text">
          {eyebrow && <span className="ph-eyebrow">{eyebrow}</span>}
          <div className="ph-title"><h1>{title}</h1>{badge}</div>
        </div>
      </div>
      {actions && <div className="ph-actions no-print">{actions}</div>}
    </header>
  );
}

/** Each flow step has its own color so the user always knows which stage they are in. */
export const STEPS: { label: string; path: string; icon: IconName; c: string; bg: string; guide: string }[] = [
  { label: 'Desglose', path: '', icon: 'file', c: '#4F46E5', bg: '#EEF0FF',
    guide: 'Registra cada efecto por escena. El sistema sugiere el material que necesita cada efecto; ajusta las cantidades si hace falta.' },
  { label: 'Inventario', path: '/inventario', icon: 'box', c: '#0E8A7E', bg: '#E3F5F2',
    guide: 'Revisa qué hay en bodega para las fechas de rodaje. Verde: listo para reservar. Ámbar: comprometido en otra producción. Rojo: hay que conseguirlo.' },
  { label: 'Proveedores', path: '/solicitud', icon: 'truck', c: '#8B3FD9', bg: '#F3ECFD',
    guide: 'Envía una sola solicitud con los faltantes a varios proveedores a la vez. Todos responden en el mismo formato.' },
  { label: 'Comparador y aprobación', path: '/comparador', icon: 'check', c: '#D9480F', bg: '#FFEFE5',
    guide: 'Compara precios y tiempos lado a lado, completa personal y pólizas, y envía la cotización a gerencia para su aprobación.' },
];

/** CSS custom properties for a step's color, consumed by .btn-step, .step-chip, etc. */
export const stepStyle = (i: number): CSSProperties => {
  const s = STEPS[Math.min(i, STEPS.length - 1)];
  return { '--c': s.c, '--cb': s.bg } as CSSProperties;
};

export function Stepper({ projectId, current }: { projectId: string; current: number }) {
  const s = STEPS[current];
  return (
    <section className="card stepper no-print" aria-label="Flujo de cotización">
      <ol className="steps">
        {STEPS.map((st, i) => {
          const cls = i < current ? 'done' : i === current ? 'current' : '';
          return [
            i > 0 && <li key={`l${i}`} aria-hidden="true" className={`step-line ${i <= current ? 'done' : ''}`} style={stepStyle(i - 1)} />,
            <li key={st.label} className={`step ${cls}`} style={stepStyle(i)} aria-current={i === current ? 'step' : undefined}>
              <span className="step-n">{i < current ? <Icon name="check" size={13} stroke={3} /> : i + 1}</span>
              {i < current ? <Link to={`/proyectos/${projectId}${st.path}`}>{st.label}</Link> : st.label}
            </li>,
          ];
        })}
      </ol>
      <div className="guide" style={stepStyle(current)}>
        <span className="guide-ic"><Icon name={s.icon} size={18} /></span>
        <p><b>Paso {current + 1} de {STEPS.length} · {s.label}.</b> {s.guide}</p>
      </div>
    </section>
  );
}

/** Effect type -> color, icon and department. */
const EFFECT_META: Record<string, { icon: IconName; c: string; bg: string; dept: string }> = {
  'Explosión': { icon: 'burst', c: '#BE123C', bg: '#FFE4E8', dept: 'Efectos especiales' },
  'Fuego': { icon: 'flame', c: '#C2410C', bg: '#FFEDD5', dept: 'Efectos especiales' },
  'Humo': { icon: 'cloud', c: '#475569', bg: '#E8EDF3', dept: 'Efectos especiales' },
  'Caída (stunt)': { icon: 'fall', c: '#1D4ED8', bg: '#DFE9FE', dept: 'Stunts / rigging' },
};

export function EffectTag({ effect, showDept }: { effect: string; showDept?: boolean }) {
  const m = EFFECT_META[effect] ?? { icon: 'bolt' as IconName, c: '#3F3F46', bg: '#F1F1EF', dept: '' };
  return (
    <span className="fx-wrap">
      <span className="fx" style={{ '--c': m.c, '--cb': m.bg } as CSSProperties}><Icon name={m.icon} size={14} />{effect}</span>
      {showDept && m.dept && <span className="fx-dept">{m.dept}</span>}
    </span>
  );
}

const CATEGORY_META: Record<string, { c: string; bg: string }> = {
  'Efectos': { c: '#C2410C', bg: '#FFEDD5' },
  'Seguridad': { c: '#0369A1', bg: '#E0F2FE' },
  'Stunts / rigging': { c: '#4338CA', bg: '#E0E7FF' },
};

export function CategoryTag({ category }: { category: string }) {
  if (!category) return <span className="dim">—</span>;
  const m = CATEGORY_META[category] ?? { c: '#3F3F46', bg: '#F1F1EF' };
  return <span className="cat" style={{ '--c': m.c, '--cb': m.bg } as CSSProperties}>{category}</span>;
}

/** Colored KPI tile; becomes a toggle button when onClick is given. */
export function KpiTile({ icon, tone, value, label, hint, active, onClick }: {
  icon: IconName; tone: string; value: number; label: string; hint?: string; active?: boolean; onClick?: () => void;
}) {
  const body = (
    <>
      <span className={`kpi-ic tone-${tone}`}><Icon name={icon} size={20} /></span>
      <span className="kpi-text"><b>{value}</b><span>{label}</span>{hint && <small>{hint}</small>}</span>
    </>
  );
  return onClick
    ? <button type="button" className={`card kpi kpi-${tone} ${active ? 'on' : ''}`} aria-pressed={active} onClick={onClick}>{body}</button>
    : <div className={`card kpi kpi-${tone}`}>{body}</div>;
}

/** Full-width colored notice: what is happening with this record and what to do. */
export function Banner({ tone, icon, title, children }: { tone: string; icon: IconName; title: string; children?: ReactNode }) {
  return (
    <div className={`banner banner-${tone}`} role="status">
      <Icon name={icon} size={20} style={{ flex: 'none' }} />
      <div><b>{title}</b>{children && <p>{children}</p>}</div>
    </div>
  );
}

/** Native <dialog> wrapper. */
export function Dialog({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return <dialog ref={ref} className="dlg" onClose={onClose}>{open && children}</dialog>;
}

export function MoneyInput({ id, value, onChange, label }: { id?: string; value: number; onChange: (n: number) => void; label?: string }) {
  return (
    <input id={id} className="in mono" inputMode="numeric" aria-label={label}
      value={value ? value.toLocaleString('es-CO') : ''} placeholder="0"
      onChange={e => onChange(Number(e.target.value.replace(/\D/g, '')) || 0)} />
  );
}
