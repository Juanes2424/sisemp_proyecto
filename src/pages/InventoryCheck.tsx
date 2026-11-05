import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { CategoryTag, KpiTile, PageHeader, Pill, Stepper, stepStyle } from '../components/ui';
import { dateRange, inventoryCheck } from '../data/logic';
import { uid, useStore } from '../data/store';
import { NotFound } from './NotFound';

export function InventoryCheck() {
  const { id } = useParams();
  const nav = useNavigate();
  const { state, update, toast } = useStore();
  const project = state.projects.find(p => p.id === id);
  const rows = project ? inventoryCheck(state, project) : [];
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(rows.filter(r => r.state === 'disponible' && r.reservedHere < r.required).map(r => r.item.id)),
  );
  if (!project) return <NotFound />;

  const n = (s: string) => rows.filter(r => r.state === s).length;
  const missing = rows.filter(r => r.shortage > 0);
  const reservable = rows.filter(r => selected.has(r.item.id) && r.state === 'disponible' && r.reservedHere < r.required);

  const toggle = (iid: string) => setSelected(s => { const c = new Set(s); c.has(iid) ? c.delete(iid) : c.add(iid); return c; });
  const allOn = rows.length > 0 && rows.every(r => selected.has(r.item.id));

  const reserve = () => {
    update(s => {
      for (const r of reservable) {
        s.reservations = s.reservations.filter(x => !(x.itemId === r.item.id && x.projectId === project.id));
        s.reservations.push({ id: uid('r'), itemId: r.item.id, projectId: project.id, qty: r.required, from: project.start, to: project.end || project.start });
        s.movements.push({ id: uid('m'), itemId: r.item.id, kind: 'reserva', label: `Reserva · ${project.name}`, date: new Date().toISOString() });
      }
    });
    toast(`${reservable.length} ítem${reservable.length === 1 ? '' : 's'} reservado${reservable.length === 1 ? '' : 's'} para ${project.name}`);
    setSelected(new Set());
  };

  const quoteMissing = () => {
    update(s => { const p = s.projects.find(x => x.id === id)!; if (p.status === 'nuevo') p.status = 'cotizacion'; });
    nav(`/proyectos/${id}/solicitud`);
  };

  return (
    <>
      <PageHeader back={`/proyectos/${id}`} backLabel="Volver al desglose"
        eyebrow={<>{project.name} · rodaje <span className="mono">{dateRange(project)}</span></>} title="Verificación de inventario" />

      <Stepper projectId={project.id} current={1} />

      <div className="kpis">
        <KpiTile icon="check" tone="green" value={n('disponible')} label="Disponibles" hint="Listos para reservar" />
        <KpiTile icon="clock" tone="amber" value={n('reservado')} label="Comprometidos en otra producción" hint="Se pueden alquilar" />
        <KpiTile icon="alert" tone="red" value={n('faltante')} label="Faltantes" hint="Se cotizan con proveedores" />
      </div>

      <section className="card" aria-label="Materiales requeridos">
        <div className="scroll-x">
          <table className="t" style={{ minWidth: 960 }}>
            <thead>
              <tr>
                <th style={{ width: 48 }}><input className="cb" type="checkbox" aria-label="Seleccionar todos" checked={allOn}
                  onChange={() => setSelected(allOn ? new Set() : new Set(rows.map(r => r.item.id)))} /></th>
                <th>Ítem</th><th>Categoría</th><th className="num">Requerido</th><th className="num">En bodega</th><th>Disponibilidad</th><th>Estado</th><th>Ubicación</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.item.id} className={`acc-${r.state === 'disponible' ? 'green' : r.state === 'reservado' ? 'amber' : 'red'}`}>
                  <td><input className="cb" type="checkbox" checked={selected.has(r.item.id)} onChange={() => toggle(r.item.id)} aria-label={`Seleccionar ${r.item.name}`} /></td>
                  <td><Link className="row-link" to={`/inventario/${r.item.id}`}>{r.item.name}</Link></td>
                  <td><CategoryTag category={r.item.category} /></td>
                  <td className="num mono">{r.required}</td>
                  <td className="num mono" style={r.state === 'faltante' ? { color: '#B42318', fontWeight: 500 } : undefined}>{r.item.qty}</td>
                  <td>
                    <span className="meter" title={`${Math.min(r.free, r.required)} de ${r.required} cubiertos con bodega`}>
                      <span className="meter-bar" aria-hidden="true">
                        {Math.min(r.free, r.required) > 0 && <i className="ok" style={{ flex: Math.min(r.free, r.required) }} />}
                        {r.shortage > 0 && <i className={r.state === 'reservado' ? 'gap-amber' : 'gap-red'} style={{ flex: r.shortage }} />}
                      </span>
                      <span>{Math.min(r.free, r.required)} de {r.required}</span>
                    </span>
                  </td>
                  <td>
                    {r.state === 'disponible' && (r.reservedHere >= r.required
                      ? <Pill tone="green">Reservado para este proyecto</Pill>
                      : <Pill tone="green">Disponible</Pill>)}
                    {r.state === 'reservado' && <Pill tone="amber">Reservado · {r.conflict}</Pill>}
                    {r.state === 'faltante' && <Pill tone="solid-red" dot={false}>Faltante: {r.shortage}</Pill>}
                  </td>
                  <td><span className="loc">{r.item.location}</span></td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={8} className="empty">El desglose no tiene materiales todavía.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="card-foot">
          <span><strong style={{ color: '#17171A', fontWeight: 600 }}>{selected.size}</strong> ítems seleccionados</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-s" type="button" disabled={reservable.length === 0} onClick={reserve}
              title={!project.start ? 'Define las fechas de rodaje en el desglose' : undefined}>
              Reservar seleccionados ({reservable.length})
            </button>
            {missing.length > 0
              ? <button className="btn btn-step" style={stepStyle(2)} type="button" onClick={quoteMissing}>Cotizar faltantes <Icon name="next" /></button>
              : <Link className="btn btn-step" style={stepStyle(3)} to={`/proyectos/${id}/comparador`}>Ir al resumen <Icon name="next" /></Link>}
          </div>
        </div>
      </section>
    </>
  );
}
