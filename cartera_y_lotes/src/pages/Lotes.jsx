import { useEffect, useState } from 'react';
import { Plus, Eye, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { obtenerLotes } from '../services/api';

function Lotes() {
    const navigate = useNavigate();

    const [lotes, setLotes] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        cargarLotes();
    }, []);

    async function cargarLotes() {
        try {
            setCargando(true);

            const datos = await obtenerLotes();

            setLotes(datos);
        } catch (error) {
            console.error('Error cargando lotes:', error);
        } finally {
            setCargando(false);
        }
    }

    function formatoMoneda(valor) {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(valor || 0);
    }

    function obtenerEstado(lote) {
        if (lote.estado) {
            return lote.estado;
        }

        return 'Disponible';
    }

    return (
        <div>

            <div className="page-title page-title-with-action">

                <div>
                    <h1>Lotes</h1>

                    <p>
                        Registro y administración de lotes
                    </p>
                </div>

                <button
                    className="btn-primary"
                    onClick={() => navigate('/lotes/nuevo')}
                >
                    <Plus size={18} />
                    Nuevo lote
                </button>

            </div>

            {cargando ? (

                <div className="empty-state">
                    <p>Cargando lotes...</p>
                </div>

            ) : lotes.length === 0 ? (

                <div className="empty-state">

                    <h2>No hay lotes registrados</h2>

                    <p>
                        Comienza registrando el primer lote.
                    </p>

                    <button
                        className="btn-primary"
                        onClick={() => navigate('/lotes/nuevo')}
                    >
                        <Plus size={18} />
                        Nuevo lote
                    </button>

                </div>

            ) : (

                <div className="table-container">

                    <table className="data-table">

                        <thead>
                            <tr>
                                <th>Manzana</th>
                                <th>Lote</th>
                                <th>Valor</th>
                                <th>Estado</th>
                                <th>Vendedor</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>

                        <tbody>

                            {lotes.map((lote) => (

                                <tr key={lote.id}>

                                    <td>
                                        <strong>
                                            {lote.manzana}
                                        </strong>
                                    </td>

                                    <td>
                                        {lote.lote}
                                    </td>

                                    <td>
                                        {formatoMoneda(lote.valor)}
                                    </td>

                                    <td>
                                        <span
                                            className={
                                                obtenerEstado(lote) === 'Vendido'
                                                    ? 'badge badge-danger'
                                                    : 'badge badge-success'
                                            }
                                        >
                                            {obtenerEstado(lote)}
                                        </span>
                                    </td>

                                    <td>
                                        {lote.vendedor || '-'}
                                    </td>

                                    <td>

                                        <div className="table-actions">

                                            <button
                                                className="btn-icon"
                                                title="Ver lote"
                                                onClick={() =>
                                                    navigate(`/lotes/${lote.id}`)
                                                }
                                            >
                                                <Eye size={17} />
                                            </button>

                                            <button
                                                className="btn-icon"
                                                title="Editar lote"
                                                onClick={() =>
                                                    navigate(`/lotes/${lote.id}/editar`)
                                                }
                                            >
                                                <Pencil size={17} />
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
    );
}

export default Lotes;