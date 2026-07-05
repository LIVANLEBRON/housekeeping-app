import { useState, useEffect, useCallback } from 'react'
import {
  collection, getDocs, query, orderBy,
  deleteDoc, doc
} from 'firebase/firestore'
import { db } from '../firebase.js'
import * as XLSX from 'xlsx'

const TURNO_SHORT = (t) => {
  if (!t) return '—'
  if (t.includes('T1') || t.includes('Turno 1') || t.includes('6:00')) return 'T1'
  if (t.includes('T2') || t.includes('Turno 2') || t.includes('2:00 PM')) return 'T2'
  if (t.includes('T3') || t.includes('Turno 3') || t.includes('10:00')) return 'T3'
  return t
}

const turnoClass = (t) => {
  const s = TURNO_SHORT(t)
  if (s === 'T1') return 't1'
  if (s === 'T2') return 't2'
  if (s === 'T3') return 't3'
  return ''
}

const formatTs = (date) => {
  if (!date) return '—'
  return date.toLocaleDateString('es-DO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const formatBirth = (str) => {
  if (!str) return '—'
  const [y, m, d] = str.split('-')
  if (!y) return str
  return `${d}/${m}/${y}`
}

/* ══════════════════════════════════════
   Modal de detalle de un colaborador
══════════════════════════════════════ */
function DetailModal({ record, onClose }) {
  if (!record) return null
  const turno = TURNO_SHORT(record.turno)
  const cls = turnoClass(record.turno)

  const rows = [
    ['Nombre completo', record.nombre],
    ['Cédula', record.cedula],
    ['Fecha de nacimiento', formatBirth(record.fechaNacimiento)],
    ['Dirección', record.direccion],
    ['Teléfonos', record.telefonos],
    ['Contacto de emergencia', record.contactoEmergencia],
    ['Lugar a trabajar', record.lugarTrabajo],
    ['Turno', record.turno],
    ['Talla Polocher', record.tallaPolocher],
    ['Talla Blusa (CJB)', record.tallaBlusa],
    ['Talla Pantalón (CJB)', record.tallaPantalon],
    ['Fecha de envío', formatTs(record.createdAt)],
  ]

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className={`turno-badge ${cls}`}>{turno}</span>
            <h2 className="modal-name">{record.nombre}</h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>
        <div className="modal-body">
          {rows.map(([label, value]) => (
            <div className="detail-row" key={label}>
              <span className="detail-label">{label}</span>
              <span className="detail-value">{value || '—'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════
   AdminView principal
══════════════════════════════════════ */
function AdminView({ onLogout }) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    try {
      const q = query(collection(db, 'housekeeping_respuestas'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      setRecords(snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate?.() || null,
      })))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  /* Filtrado */
  const filtered = records.filter((r) => {
    const matchTurno = filter === 'ALL' || TURNO_SHORT(r.turno) === filter
    const q = search.toLowerCase()
    const matchSearch = !q ||
      r.nombre?.toLowerCase().includes(q) ||
      r.cedula?.toLowerCase().includes(q) ||
      r.lugarTrabajo?.toLowerCase().includes(q)
    return matchTurno && matchSearch
  })

  const count = (t) => records.filter((r) => TURNO_SHORT(r.turno) === t).length

  /* Eliminar */
  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este registro?')) return
    setDeleting(id)
    try {
      await deleteDoc(doc(db, 'housekeeping_respuestas', id))
      setRecords((prev) => prev.filter((r) => r.id !== id))
      if (selected?.id === id) setSelected(null)
    } catch (e) { console.error(e) }
    finally { setDeleting(null) }
  }

  /* Excel Export */
  const exportExcel = () => {
    const wb = XLSX.utils.book_new()
    const sheets = [
      { key: 'T1', name: 'Listado de Colaboradores VC T1' },
      { key: 'T2', name: 'Listado de Colaboradores VC T2' },
      { key: 'T3', name: 'Listado de Colaboradores VC T3' },
    ]
    sheets.forEach(({ key, name }) => {
      const data = records.filter((r) => TURNO_SHORT(r.turno) === key).map((r) => ({
        'Nombre completo': r.nombre || '',
        'Cédula': r.cedula || '',
        'Fecha de nacimiento': formatBirth(r.fechaNacimiento),
        'Dirección': r.direccion || '',
        'Teléfonos': r.telefonos || '',
        'Contacto de emergencia': r.contactoEmergencia || '',
        'Lugar a trabajar': r.lugarTrabajo || '',
        'Turno': r.turno || '',
        'Talla Polocher': r.tallaPolocher || '',
        'Talla Blusa (CJB)': r.tallaBlusa || '',
        'Talla Pantalón (CJB)': r.tallaPantalon || '',
        'Fecha de envío': formatTs(r.createdAt),
      }))
      if (data.length === 0) data.push({})
      const ws = XLSX.utils.json_to_sheet(data)
      ws['!cols'] = [
        { wch: 28 }, { wch: 16 }, { wch: 18 }, { wch: 34 },
        { wch: 22 }, { wch: 36 }, { wch: 28 }, { wch: 28 },
        { wch: 14 }, { wch: 16 }, { wch: 18 }, { wch: 22 },
      ]
      XLSX.utils.book_append_sheet(wb, ws, name)
    })
    XLSX.writeFile(wb, 'Colaboradores_Housekeeping_VC.xlsx')
  }

  return (
    <div className="admin-page">
      {selected && <DetailModal record={selected} onClose={() => setSelected(null)} />}

      {/* ── Header ── */}
      <header className="admin-header">
        <div className="admin-header-inner">
          <div className="admin-title">
            <div className="admin-title-icon">📋</div>
            <div>
              <h1>Supervisión de Colaboradores</h1>
              <p>Housekeeping — Villa Centroamericana</p>
            </div>
          </div>
          <div className="admin-actions">
            {onLogout && (
              <button className="btn-logout" onClick={onLogout} title="Cerrar sesión">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Salir
              </button>
            )}
            <button className="btn-refresh" onClick={fetchRecords} title="Recargar">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
              </svg>
              Recargar
            </button>
            <button className="btn-export" onClick={exportExcel} disabled={records.length === 0}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Exportar Excel
            </button>
          </div>
        </div>
      </header>

      {/* ── Stats ── */}
      <div className="stats-bar">
        {['T1', 'T2', 'T3'].map((t, i) => {
          const emojis = ['🌅', '☀️', '🌙']
          const labels = ['T1 · 6am–2pm', 'T2 · 2pm–10pm', 'T3 · 10pm–6am']
          return (
            <div className="stat-card" key={t}>
              <div className={`stat-icon ${t.toLowerCase()}`}>{emojis[i]}</div>
              <div className="stat-info">
                <h3>{count(t)}</h3>
                <p>{labels[i]}</p>
              </div>
            </div>
          )
        })}
        <div className="stat-card">
          <div className="stat-icon total">👥</div>
          <div className="stat-info">
            <h3>{records.length}</h3>
            <p>Total colaboradores</p>
          </div>
        </div>
      </div>

      {/* ── Filtros ── */}
      <div className="filter-section">
        <div className="filter-row">
          <div className="filter-tabs">
            {['ALL', 'T1', 'T2', 'T3'].map((t) => (
              <button
                key={t}
                className={`filter-tab ${filter === t ? `active ${t !== 'ALL' ? t.toLowerCase() : ''}` : ''}`}
                onClick={() => setFilter(t)}
              >
                {t === 'ALL' ? 'Todos' : t === 'T1' ? '🌅 T1' : t === 'T2' ? '☀️ T2' : '🌙 T3'}
              </button>
            ))}
          </div>
          <div className="search-box">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Buscar por nombre, cédula o lugar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch('')}>✕</button>
            )}
          </div>
        </div>
      </div>

      {/* ── Tabla ── */}
      <div className="table-section">
        <div className="table-card">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner" />
              <p>Cargando registros...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <h3>Sin registros</h3>
              <p>No se encontraron colaboradores con ese filtro.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nombre</th>
                    <th>Cédula</th>
                    <th>Turno</th>
                    <th>Lugar</th>
                    <th>Teléfonos</th>
                    <th>Talla Polo</th>
                    <th>Fecha envío</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => (
                    <tr key={r.id} className="table-row-hover">
                      <td className="row-num">{i + 1}</td>
                      <td>
                        <button
                          className="name-btn"
                          onClick={() => setSelected(r)}
                          title="Ver ficha completa"
                        >
                          {r.nombre || '—'}
                        </button>
                      </td>
                      <td>{r.cedula || '—'}</td>
                      <td>
                        <span className={`turno-badge ${turnoClass(r.turno)}`}>
                          {TURNO_SHORT(r.turno)}
                        </span>
                      </td>
                      <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.lugarTrabajo || '—'}
                      </td>
                      <td>{r.telefonos || '—'}</td>
                      <td>
                        {r.tallaPolocher
                          ? <span className="talla-badge">{r.tallaPolocher}</span>
                          : '—'}
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--surface-400)' }}>
                        {formatTs(r.createdAt)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="action-btn view"
                            onClick={() => setSelected(r)}
                            title="Ver ficha"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                              stroke="currentColor" strokeWidth="2"
                              strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </button>
                          <button
                            className="action-btn delete"
                            onClick={() => handleDelete(r.id)}
                            disabled={deleting === r.id}
                            title="Eliminar"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                              stroke="currentColor" strokeWidth="2"
                              strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                              <path d="M10 11v6M14 11v6" />
                              <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="records-count">
          {filtered.length} registro{filtered.length !== 1 ? 's' : ''} mostrado{filtered.length !== 1 ? 's' : ''}
          {records.length !== filtered.length ? ` de ${records.length} total` : ''}
        </p>
      </div>
    </div>
  )
}

export default AdminView
