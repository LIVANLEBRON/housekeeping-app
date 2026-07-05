import { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase.js'


const TURNOS = [
  'Turno 1 — 6:00 AM a 2:00 PM',
  'Turno 2 — 2:00 PM a 10:00 PM',
  'Turno 3 — 10:00 PM a 6:00 AM',
]

const TALLAS = ['S', 'M', 'L', 'XL', 'XXL']

const INITIAL = {
  nombre: '',
  cedula: '',
  fechaNacimiento: '',
  direccion: '',
  telefonos: '',
  contactoEmergencia: '',
  lugarTrabajo: '',
  turno: '',
  tallaPolocher: '',
  tallaBlusa: '',
  tallaPantalon: '',
}

function FormView() {
  const [form, setForm] = useState(INITIAL)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handle = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSending(true)

    // Timeout de 12 segundos para no quedar colgado
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), 12000)
    )

    try {
      await Promise.race([
        addDoc(collection(db, 'housekeeping_respuestas'), {
          ...form,
          createdAt: serverTimestamp(),
        }),
        timeout,
      ])
      setSent(true)
    } catch (err) {
      console.error('Firebase error:', err)

      if (err.message === 'TIMEOUT') {
        setError('⏱️ La conexión tardó demasiado. Verifica que Firestore esté habilitado en Firebase Console y que las reglas permitan escritura.')
      } else if (err.code === 'permission-denied') {
        setError('🔒 Acceso denegado. Las reglas de Firestore no permiten escritura. Ve a Firebase Console → Firestore → Reglas y permite lectura/escritura.')
      } else if (err.code === 'unavailable' || err.code === 'failed-precondition') {
        setError('📡 Firestore no está disponible. Es posible que la base de datos no haya sido creada aún en Firebase Console.')
      } else {
        setError(`Error: ${err.message || 'Desconocido. Revisa la consola del navegador (F12).'}`)
      }
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="form-page">
        <div className="form-container">
          <div className="success-card">
            <div className="success-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2>¡Registro exitoso!</h2>
            <p>Gracias, tu información fue recibida correctamente.</p>
            <button className="btn-new" onClick={() => { setForm(INITIAL); setSent(false) }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Enviar otro registro
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="form-page">
      <div className="form-container">
        <div className="form-card">
          <div className="form-header">
            <div className="form-icon">🏨</div>
            <h1>Ficha de Colaborador</h1>
            <p>Housekeeping — Villa Centroamericana</p>
          </div>

          <form onSubmit={handleSubmit}>

            {/* ── Sección: Datos Personales ── */}
            <div className="section-title">
              <span className="section-icon">👤</span> Datos personales
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="nombre">Nombre completo *</label>
              <input id="nombre" name="nombre" type="text" className="form-input"
                placeholder="Ej. María González López"
                value={form.nombre} onChange={handle} required />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="cedula">Cédula *</label>
                <input id="cedula" name="cedula" type="text" className="form-input"
                  placeholder="000-0000000-0"
                  value={form.cedula} onChange={handle} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="fechaNacimiento">Fecha de nacimiento *</label>
                <input id="fechaNacimiento" name="fechaNacimiento" type="date"
                  className="form-input"
                  value={form.fechaNacimiento} onChange={handle} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="direccion">Dirección exacta *</label>
              <textarea id="direccion" name="direccion" className="form-textarea"
                placeholder="Sector, calle, número de casa..."
                rows={3}
                value={form.direccion} onChange={handle} required />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="telefonos">Teléfonos *</label>
              <input id="telefonos" name="telefonos" type="text" className="form-input"
                placeholder="Ej. 809-000-0000 / 829-000-0000"
                value={form.telefonos} onChange={handle} required />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="contactoEmergencia">
                Contacto de emergencia *
              </label>
              <input id="contactoEmergencia" name="contactoEmergencia" type="text"
                className="form-input"
                placeholder="Nombre, parentesco y teléfono"
                value={form.contactoEmergencia} onChange={handle} required />
            </div>

            {/* ── Sección: Trabajo ── */}
            <div className="section-title" style={{ marginTop: '24px' }}>
              <span className="section-icon">💼</span> Información laboral
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="lugarTrabajo">Lugar a trabajar *</label>
              <input id="lugarTrabajo" name="lugarTrabajo" type="text" className="form-input"
                placeholder="Ej. Villa Centroamericana T1"
                value={form.lugarTrabajo} onChange={handle} required />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="turno">Turno de trabajo *</label>
              <select id="turno" name="turno" className="form-select"
                value={form.turno} onChange={handle} required>
                <option value="" disabled>Selecciona el turno</option>
                {TURNOS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* ── Sección: Tallas ── */}
            <div className="section-title" style={{ marginTop: '24px' }}>
              <span className="section-icon">👕</span> Tallas de uniforme
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="tallaPolocher">
                Talla Polocher *
              </label>
              <div className="talla-group">
                {TALLAS.map((t) => (
                  <label key={t} className={`talla-option ${form.tallaPolocher === t ? 'selected' : ''}`}>
                    <input type="radio" name="tallaPolocher" value={t}
                      checked={form.tallaPolocher === t}
                      onChange={handle} required={!form.tallaPolocher} />
                    {t}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-label" style={{ marginBottom: '8px' }}>
              Tallas uniforme Ciudad Juan Bosch *
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="tallaBlusa">Blusa</label>
                <select id="tallaBlusa" name="tallaBlusa" className="form-select"
                  value={form.tallaBlusa} onChange={handle} required>
                  <option value="" disabled>Talla</option>
                  {TALLAS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="tallaPantalon">Pantalón</label>
                <select id="tallaPantalon" name="tallaPantalon" className="form-select"
                  value={form.tallaPantalon} onChange={handle} required>
                  <option value="" disabled>Talla</option>
                  {TALLAS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>



            {error && <p className="form-error">{error}</p>}

            <button type="submit" className="btn-submit" disabled={sending}>
              {sending && <span className="spinner"></span>}
              {sending ? 'Enviando...' : 'Enviar registro'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default FormView
