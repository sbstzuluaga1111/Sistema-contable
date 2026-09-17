import { useEffect, useState } from 'react';
import { ArrowLeft, Pencil } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { obtenerLotes } from '../services/api';

function LoteDetalle() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [lote, setLote] = useState(null);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        cargarLote();
    }, [id]);

    async function cargarLote() {
        try {
            setCargando(true);

            const lotes = await obtenerLotes();

            const loteEncontrado = lotes.find(
                (item) => String(item.id) === String(id)
            );

            setLote(loteEncontrado || null);

        } catch (error) {
            console.error('Error cargando lote:', error);
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

    if (cargando) {
        return (
            <div className="empty-state">
                <p>Cargando información del lote...</p>
            </div>
        );
    }

    if (!lote) {
        return (
            <div className="empty-state">

                <h2>Lote no encontrado</h2>

                <button
                    className="btn-primary"
                    onClick={() => navigate('/lotes')}
                >
                    Volver a lotes
                </button>

            </div>
        );
    }

    return (
        <div>

            <div className="page-title page-title-with-action">

                <div>

                    <button
                        className="back-button"
                        onClick={() => navigate('/lotes')}
                    >
                        <ArrowLeft size={18} />
                        Volver a lotes
                    </button>

                    <h1>
                        Lote {lote.lote}
                    </h1>

                    <p>
                        Manzana {lote.manzana}
                    </p>

                </div>

                <button
                    className="btn-primary"
                    onClick={() =>
                        navigate(`/lotes/${lote.id}/editar`)
                    }
                >
                    <Pencil size={18} />
                    Editar lote
                </button>

            </div>

            <div className="detail-grid">

                <div className="detail-card">

                    <span>Manzana</span>

                    <strong>
                        {lote.manzana}
                    </strong>

                </div>

                <div className="detail-card">

                    <span>Lote</span>

                    <strong>
                        {lote.lote}
                    </strong>

                </div>

                <div className="detail-card">

                    <span>Valor de venta</span>

                    <strong>
                        {formatoMoneda(lote.valor)}
                    </strong>

                </div>

                <div className="detail-card">

                    <span>Estado</span>

                    <strong>
                        {lote.estado || 'Disponible'}
                    </strong>

                </div>

            </div>

            <div className="detail-section">

                <h2>Información de venta</h2>

                <div className="detail-information">

                    <div>
                        <span>Vendedor</span>
                        <strong>
                            {lote.vendedor || 'Sin vendedor'}
                        </strong>
                    </div>

                    <div>
                        <span>Fecha de venta</span>
                        <strong>
                            {lote.fechaVenta || 'Sin registrar'}
                        </strong>
                    </div>

                </div>

            </div>

        </div>
    );
}

export default LoteDetalle;