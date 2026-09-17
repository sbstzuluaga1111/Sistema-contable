import { useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { crearLote } from '../services/api';

function NuevoLote() {
    const navigate = useNavigate();

    const [formulario, setFormulario] = useState({
        manzana: '',
        lote: '',
        valor: '',
        estado: 'Disponible',
        vendedor: '',
        fechaVenta: ''
    });

    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');

    function manejarCambio(e) {
        const { name, value } = e.target;

        setFormulario({
            ...formulario,
            [name]: value
        });
    }

    async function guardarLote(e) {
        e.preventDefault();

        setError('');

        if (!formulario.manzana.trim()) {
            setError('Debe ingresar la manzana.');
            return;
        }

        if (!formulario.lote.trim()) {
            setError('Debe ingresar el número del lote.');
            return;
        }

        if (!formulario.valor || Number(formulario.valor) <= 0) {
            setError('Debe ingresar un valor de venta válido.');
            return;
        }

        try {
            setGuardando(true);

            await crearLote({
                manzana: formulario.manzana.trim(),
                lote: formulario.lote.trim(),
                valor: Number(formulario.valor),
                estado: formulario.estado,
                vendedor: formulario.vendedor.trim(),
                fechaVenta: formulario.fechaVenta
            });

            navigate('/lotes');

        } catch (error) {
            console.error('Error guardando lote:', error);

            setError(
                'No fue posible guardar el lote. Verifique que el servidor esté funcionando.'
            );
        } finally {
            setGuardando(false);
        }
    }

    return (
        <div>

            <div className="page-title">

                <button
                    className="back-button"
                    onClick={() => navigate('/lotes')}
                >
                    <ArrowLeft size={18} />
                    Volver a lotes
                </button>

                <h1>Nuevo lote</h1>

                <p>
                    Registre la información del lote.
                </p>

            </div>

            <form
                className="form-card"
                onSubmit={guardarLote}
            >

                <div className="form-section">

                    <h2>Información del lote</h2>

                    <div className="form-grid">

                        <div className="form-group">

                            <label htmlFor="manzana">
                                Manzana
                            </label>

                            <input
                                type="text"
                                id="manzana"
                                name="manzana"
                                value={formulario.manzana}
                                onChange={manejarCambio}
                                placeholder="Ej. C"
                            />

                        </div>

                        <div className="form-group">

                            <label htmlFor="lote">
                                Número de lote
                            </label>

                            <input
                                type="text"
                                id="lote"
                                name="lote"
                                value={formulario.lote}
                                onChange={manejarCambio}
                                placeholder="Ej. 14"
                            />

                        </div>

                        <div className="form-group">

                            <label htmlFor="valor">
                                Valor de venta
                            </label>

                            <input
                                type="number"
                                id="valor"
                                name="valor"
                                value={formulario.valor}
                                onChange={manejarCambio}
                                placeholder="Ej. 12000000"
                                min="0"
                                step="1"
                            />

                        </div>

                        <div className="form-group">

                            <label htmlFor="estado">
                                Estado
                            </label>

                            <select
                                id="estado"
                                name="estado"
                                value={formulario.estado}
                                onChange={manejarCambio}
                            >
                                <option value="Disponible">
                                    Disponible
                                </option>

                                <option value="Vendido">
                                    Vendido
                                </option>
                            </select>

                        </div>

                    </div>

                </div>

                <div className="form-section">

                    <h2>Información de venta</h2>

                    <div className="form-grid">

                        <div className="form-group">

                            <label htmlFor="vendedor">
                                Vendedor
                            </label>

                            <input
                                type="text"
                                id="vendedor"
                                name="vendedor"
                                value={formulario.vendedor}
                                onChange={manejarCambio}
                                placeholder="Nombre del vendedor"
                            />

                        </div>

                        <div className="form-group">

                            <label htmlFor="fechaVenta">
                                Fecha de venta
                            </label>

                            <input
                                type="date"
                                id="fechaVenta"
                                name="fechaVenta"
                                value={formulario.fechaVenta}
                                onChange={manejarCambio}
                            />

                        </div>

                    </div>

                </div>

                {error && (
                    <div className="form-error">
                        {error}
                    </div>
                )}

                <div className="form-actions">

                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => navigate('/lotes')}
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={guardando}
                    >
                        <Save size={18} />

                        {guardando
                            ? 'Guardando...'
                            : 'Guardar lote'
                        }
                    </button>

                </div>

            </form>

        </div>
    );
}

export default NuevoLote;