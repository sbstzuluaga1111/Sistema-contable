import { useEffect, useState } from "react";
import { obtenerLotes } from "../services/api";

function Dashboard() {
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
      console.error("Error cargando lotes:", error);
    } finally {
      setCargando(false);
    }
  }

  function formatoMoneda(valor) {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(valor || 0);
  }

  function formatoPorcentaje(valor) {
    return `${Number(valor || 0).toFixed(1)}%`;
  }

  // =========================================================
  // LOTES ACTIVOS
  // =========================================================

  const lotesActivos = lotes.filter(
    (lote) =>
      !lote.estado ||
      lote.estado === "Disponible",
  );

  // =========================================================
  // INFORMACIÓN DE CADA LOTE
  // =========================================================

  function obtenerInformacionLote(lote) {
    const valor = Number(lote.valor) || 0;

    const cuotaInicial =
      Number(lote.cuotaInicial) || 0;

    const cuotaMensual =
      Number(lote.cuotaMensual) || 0;

    const pagos = Array.isArray(lote.pagos)
      ? lote.pagos
      : [];

    const hoy = new Date();

    hoy.setHours(0, 0, 0, 0);

    // =========================================================
    // PAGOS DE CUOTAS
    // =========================================================

    const pagosCuotas = pagos.filter((pago) => {
      const tipo = String(
        pago.tipo || "cuota",
      ).toLowerCase();

      return tipo === "cuota";
    });

    // =========================================================
    // TOTAL DE PAGOS
    // =========================================================

    const totalPagos = pagos.reduce(
      (total, pago) =>
        total + (Number(pago.valor) || 0),
      0,
    );

    // =========================================================
    // TOTAL RECAUDADO
    // =========================================================

    const totalRecaudado =
      cuotaInicial + totalPagos;

    // =========================================================
    // VALOR FINANCIADO
    // =========================================================

    const valorFinanciado = Math.max(
      valor - cuotaInicial,
      0,
    );

    // =========================================================
    // NÚMERO TOTAL DE CUOTAS
    // =========================================================

    const numeroCuotas =
      cuotaMensual > 0 &&
      valorFinanciado > 0
        ? Math.ceil(
            valorFinanciado /
              cuotaMensual,
          )
        : 0;

    // =========================================================
    // SOLO CUOTAS CUYA FECHA YA LLEGÓ
    // =========================================================

    const pagosCuotasRealizados =
      pagosCuotas.filter((pago) => {
        if (!pago.fecha) {
          return true;
        }

        const fechaPago = new Date(
          pago.fecha + "T00:00:00",
        );

        fechaPago.setHours(0, 0, 0, 0);

        return fechaPago <= hoy;
      });

    const cuotasPagadas =
      pagosCuotasRealizados.length;

    // =========================================================
    // CUOTAS PENDIENTES DEL PLAN
    // =========================================================

    const cuotasPendientes = Math.max(
      numeroCuotas - cuotasPagadas,
      0,
    );

    // =========================================================
    // FECHA DE INICIO DEL CALENDARIO
    // =========================================================

    let fechaInicio = null;

    if (pagosCuotas.length > 0) {
      const fechasValidas =
        pagosCuotas
          .filter(
            (pago) => pago.fecha,
          )
          .map(
            (pago) =>
              new Date(
                pago.fecha +
                  "T00:00:00",
              ),
          )
          .sort(
            (a, b) =>
              a.getTime() -
              b.getTime(),
          );

      if (fechasValidas.length > 0) {
        fechaInicio =
          fechasValidas[0];

        fechaInicio.setHours(
          0,
          0,
          0,
          0,
        );
      }
    }

    // Si no hay pagos todavía usamos fechaCuotaInicial
    if (
      !fechaInicio &&
      lote.fechaCuotaInicial
    ) {
      fechaInicio = new Date(
        lote.fechaCuotaInicial +
          "T00:00:00",
      );

      fechaInicio.setHours(
        0,
        0,
        0,
        0,
      );
    }

    // =========================================================
    // CUOTAS QUE DEBERÍA HABER PAGADO
    // =========================================================

    let cuotasEsperadas = 0;

    if (
      cuotaMensual > 0 &&
      numeroCuotas > 0 &&
      fechaInicio
    ) {
      if (hoy >= fechaInicio) {
        let diferenciaMeses =
          (hoy.getFullYear() -
            fechaInicio.getFullYear()) *
            12 +
          (hoy.getMonth() -
            fechaInicio.getMonth());

        // Si todavía no ha llegado el día del mes,
        // la cuota de este mes todavía no se exige.
        if (
          hoy.getDate() <
          fechaInicio.getDate()
        ) {
          diferenciaMeses -= 1;
        }

        cuotasEsperadas =
          diferenciaMeses + 1;

        cuotasEsperadas = Math.max(
          cuotasEsperadas,
          0,
        );

        cuotasEsperadas = Math.min(
          cuotasEsperadas,
          numeroCuotas,
        );
      }
    }

    // =========================================================
    // DETERMINAR SI ESTÁ AL DÍA
    // =========================================================

    let loteAlDia = false;

    // Si ya terminó de pagar el lote
    if (
      valor > 0 &&
      totalRecaudado >= valor
    ) {
      loteAlDia = true;
    }

    // Si no tiene cuotas
    else if (
      cuotaMensual <= 0
    ) {
      loteAlDia =
        totalRecaudado >= valor;
    }

    // Si tiene financiación
    else {
      loteAlDia =
        cuotasPagadas >=
        cuotasEsperadas;
    }

    // =========================================================
    // VALOR FALTANTE
    // =========================================================

    const valorFaltante = Math.max(
      valor - totalRecaudado,
      0,
    );

    // =========================================================
    // PORCENTAJE DE CUMPLIMIENTO
    // =========================================================

    const porcentajeCumplimiento =
      valor > 0
        ? Math.min(
            (totalRecaudado / valor) *
              100,
            100,
          )
        : 0;

    return {
      valor,
      cuotaInicial,
      cuotaMensual,
      totalPagos,
      totalRecaudado,
      valorFinanciado,
      numeroCuotas,
      cuotasPagadas,
      cuotasPendientes,
      cuotasEsperadas,
      valorFaltante,
      porcentajeCumplimiento,
      loteAlDia,
    };
  }

  // =========================================================
  // INFORMACIÓN GENERAL DE LOTES
  // =========================================================

  const informacionLotes =
    lotesActivos.map((lote) => ({
      lote,
      informacion:
        obtenerInformacionLote(lote),
    }));

  // =========================================================
  // CARTERA GENERAL
  // =========================================================

  const valorCartera =
    informacionLotes.reduce(
      (total, item) =>
        total +
        item.informacion.valor,
      0,
    );

  const totalRecaudado =
    informacionLotes.reduce(
      (total, item) =>
        total +
        item.informacion.totalRecaudado,
      0,
    );

  const carteraPendiente =
    Math.max(
      valorCartera -
        totalRecaudado,
      0,
    );

  // =========================================================
  // LOTES AL DÍA / ATRASADOS
  // =========================================================

  const totalLotesAlDia =
    informacionLotes.filter(
      (item) =>
        item.informacion.loteAlDia,
    ).length;

  const totalLotesAtrasados =
    informacionLotes.length -
    totalLotesAlDia;

  // =========================================================
  // VENDEDORES
  // =========================================================

  const vendedores = {};

  informacionLotes.forEach((item) => {
    const lote = item.lote;
    const informacion =
      item.informacion;

    const nombreVendedor =
      String(
        lote.vendedor || "",
      ).trim() ||
      "Sin vendedor";

    const nombreLote =
      [
        String(
          lote.manzana || "",
        ).trim(),

        String(
          lote.lote || "",
        ).trim(),
      ]
        .filter(Boolean)
        .join("-") ||
      "Sin lote";

    if (!vendedores[nombreVendedor]) {
      vendedores[nombreVendedor] = {
        vendedor:
          nombreVendedor,

        lotes: [],

        lotesAlDia: 0,

        cuotaMensual: 0,

        recaudado: 0,

        faltante: 0,
      };
    }

    vendedores[
      nombreVendedor
    ].lotes.push(nombreLote);

    if (
      informacion.loteAlDia
    ) {
      vendedores[
        nombreVendedor
      ].lotesAlDia += 1;
    }

    vendedores[
      nombreVendedor
    ].cuotaMensual +=
      informacion.cuotaMensual;

    vendedores[
      nombreVendedor
    ].recaudado +=
      informacion.totalRecaudado;

    vendedores[
      nombreVendedor
    ].faltante +=
      informacion.valorFaltante;
  });

  // =========================================================
  // CARTERA POR VENDEDOR
  // =========================================================

  const carteraPorVendedor =
    Object.values(vendedores)
      .map((item) => ({
        ...item,

        parteVendedor:
          item.cuotaMensual *
          0.3,

        miCartera:
          item.cuotaMensual *
          0.7,

        cumplimiento:
          item.recaudado +
            item.faltante >
          0
            ? (item.recaudado /
                (item.recaudado +
                  item.faltante)) *
              100
            : 0,
      }))
      .sort((a, b) =>
        a.vendedor.localeCompare(
          b.vendedor,
          "es",
        ),
      );

  // =========================================================
  // TOTALES DE VENDEDORES
  // =========================================================

  const totalLotesVendedores =
    carteraPorVendedor.reduce(
      (total, item) =>
        total +
        item.lotes.length,
      0,
    );

  const totalLotesAlDiaVendedores =
    carteraPorVendedor.reduce(
      (total, item) =>
        total +
        item.lotesAlDia,
      0,
    );

  const totalCuotasVendedores =
    carteraPorVendedor.reduce(
      (total, item) =>
        total +
        item.cuotaMensual,
      0,
    );

  const totalParteVendedores =
    carteraPorVendedor.reduce(
      (total, item) =>
        total +
        item.parteVendedor,
      0,
    );

  const totalMiCarteraVendedores =
    carteraPorVendedor.reduce(
      (total, item) =>
        total +
        item.miCartera,
      0,
    );

  const totalRecaudadoVendedores =
    carteraPorVendedor.reduce(
      (total, item) =>
        total +
        item.recaudado,
      0,
    );

  const totalFaltanteVendedores =
    carteraPorVendedor.reduce(
      (total, item) =>
        total +
        item.faltante,
      0,
    );

  // =========================================================
  // CUMPLIMIENTO GENERAL
  // =========================================================

  const cumplimientoGeneral =
    valorCartera > 0
      ? Math.min(
          (totalRecaudado /
            valorCartera) *
            100,
          100,
        )
      : 0;

  // =========================================================
  // LOTES AL DÍA - DETALLE POR LOTE
  // =========================================================

  const lotesAlDiaDetalle =
    informacionLotes
      .filter(
        (item) =>
          item.informacion
            .loteAlDia,
      )
      .map((item) => {
        const lote = item.lote;
        const informacion =
          item.informacion;

        const nombreLote =
          [
            String(
              lote.manzana || "",
            ).trim(),

            String(
              lote.lote || "",
            ).trim(),
          ]
            .filter(Boolean)
            .join("-") ||
          "Sin lote";

        return {
          vendedor:
            String(
              lote.vendedor || "",
            ).trim() ||
            "Sin vendedor",

          lote: nombreLote,

          valor:
            informacion.valor,

          cuotaMensual:
            informacion.cuotaMensual,

          recaudado:
            informacion.totalRecaudado,

          faltante:
            informacion.valorFaltante,

          cumplimiento:
            informacion.porcentajeCumplimiento,
        };
      })
      .sort((a, b) =>
        a.vendedor.localeCompare(
          b.vendedor,
          "es",
        ),
      );

  // =========================================================
  // TOTALES LOTES AL DÍA
  // =========================================================

  const totalValorLotesAlDia =
    lotesAlDiaDetalle.reduce(
      (total, item) =>
        total + item.valor,
      0,
    );

  const totalCuotaMensualLotesAlDia =
    lotesAlDiaDetalle.reduce(
      (total, item) =>
        total + item.cuotaMensual,
      0,
    );

  const totalRecaudadoLotesAlDia =
    lotesAlDiaDetalle.reduce(
      (total, item) =>
        total + item.recaudado,
      0,
    );

  const totalFaltanteLotesAlDia =
    lotesAlDiaDetalle.reduce(
      (total, item) =>
        total + item.faltante,
      0,
    );

  const cumplimientoLotesAlDia =
    totalValorLotesAlDia > 0
      ? Math.min(
          (totalRecaudadoLotesAlDia /
            totalValorLotesAlDia) *
            100,
          100,
        )
      : 0;

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="dashboard">

      {/* =====================================================
          TÍTULO
      ===================================================== */}

      <div className="page-title">
        <h1>Dashboard</h1>

        <p>
          Resumen general de cartera y
          lotes
        </p>
      </div>

      {/* =====================================================
          TARJETAS
      ===================================================== */}

      <div className="dashboard-cards">

        {/* VALOR LOTES */}

        <div className="dashboard-card">
          <span className="dashboard-card-label">
            Valor de lotes registrados
          </span>

          <strong className="dashboard-card-value">
            {formatoMoneda(
              valorCartera,
            )}
          </strong>

          <span className="dashboard-card-description">
            {lotesActivos.length}{" "}
            lotes activos
          </span>
        </div>

        {/* RECAUDADO */}

        <div className="dashboard-card">
          <span className="dashboard-card-label">
            Total recaudado
          </span>

          <strong className="dashboard-card-value">
            {formatoMoneda(
              totalRecaudado,
            )}
          </strong>

          <span className="dashboard-card-description">
            Dinero recibido
          </span>
        </div>

        {/* PENDIENTE */}

        <div className="dashboard-card">
          <span className="dashboard-card-label">
            Cartera pendiente
          </span>

          <strong className="dashboard-card-value">
            {formatoMoneda(
              carteraPendiente,
            )}
          </strong>

          <span className="dashboard-card-description">
            Saldo pendiente
          </span>
        </div>

        {/* LOTES AL DÍA */}

        <div className="dashboard-card">
          <span className="dashboard-card-label">
            Lotes al día
          </span>

          <strong className="dashboard-card-value">
            {totalLotesAlDia}
          </strong>

          <span className="dashboard-card-description">
            de {lotesActivos.length}{" "}
            lotes
          </span>
        </div>

        {/* CUMPLIMIENTO */}

        <div className="dashboard-card">
          <span className="dashboard-card-label">
            Cumplimiento general
          </span>

          <strong className="dashboard-card-value">
            {formatoPorcentaje(
              cumplimientoGeneral,
            )}
          </strong>

          <span className="dashboard-card-description">
            Recaudado sobre el valor
            total
          </span>
        </div>

        {/* 30% VENDEDORES */}

        <div className="dashboard-card">
          <span className="dashboard-card-label">
            30% vendedores
          </span>

          <strong className="dashboard-card-value">
            {formatoMoneda(
              totalParteVendedores,
            )}
          </strong>

          <span className="dashboard-card-description">
            Sobre cuotas mensuales
          </span>
        </div>

        {/* 70% MÍO */}

        <div className="dashboard-card">
          <span className="dashboard-card-label">
            Mi cartera
          </span>

          <strong className="dashboard-card-value">
            {formatoMoneda(
              totalMiCarteraVendedores,
            )}
          </strong>

          <span className="dashboard-card-description">
            70% sobre cuotas mensuales
          </span>
        </div>

      </div>

      {/* =====================================================
          CARTERA POR VENDEDOR
      ===================================================== */}

      <div className="table-container">

        <div className="page-title">

          <h2>
            Cartera por vendedor
          </h2>

          <p>
            Resumen de lotes,
            cumplimiento y distribución
            de cartera por vendedor
          </p>

        </div>

        <table className="data-table vendedores-table">

          <thead>

            <tr>
              <th>Vendedor</th>

              <th>Lotes</th>

              <th>Al día</th>

              <th>Cuota mensual</th>

              <th>Recaudado</th>

              <th>Faltante</th>

              <th>Cumplimiento</th>

              <th>30% vendedor</th>

              <th>70% mío</th>
            </tr>

          </thead>

          <tbody>

            {cargando ? (

              <tr>
                <td colSpan="9">
                  Cargando...
                </td>
              </tr>

            ) : carteraPorVendedor.length ===
              0 ? (

              <tr>
                <td colSpan="9">
                  No hay vendedores
                  registrados.
                </td>
              </tr>

            ) : (

              carteraPorVendedor.map(
                (item, index) => (

                  <tr
                    key={`${item.vendedor}-${index}`}
                  >

                    <td>
                      <strong>
                        {item.vendedor}
                      </strong>
                    </td>

                    <td>
                      {item.lotes.join(
                        ", ",
                      )}
                    </td>

                    <td>
                      {item.lotesAlDia}
                    </td>

                    <td className="cartera-cuota">
                      {formatoMoneda(
                        item.cuotaMensual,
                      )}
                    </td>

                    <td className="cartera-recaudado">
                      {formatoMoneda(
                        item.recaudado,
                      )}
                    </td>

                    <td className="cartera-faltante">
                      {formatoMoneda(
                        item.faltante,
                      )}
                    </td>

                    <td>
                      <span className="cartera-cumplimiento">
                        {formatoPorcentaje(
                          item.cumplimiento,
                        )}
                      </span>
                    </td>

                    <td className="cartera-vendedor">
                      {formatoMoneda(
                        item.parteVendedor,
                      )}
                    </td>

                    <td className="cartera-mia">
                      {formatoMoneda(
                        item.miCartera,
                      )}
                    </td>

                  </tr>

                ),
              )

            )}

          </tbody>

          {!cargando &&
            carteraPorVendedor.length >
              0 && (

              <tfoot>

                <tr>

                  <th>
                    TOTAL
                  </th>

                  <th>
                    {totalLotesVendedores}
                  </th>

                  <th>
                    {
                      totalLotesAlDiaVendedores
                    }
                  </th>

                  <th>
                    {formatoMoneda(
                      totalCuotasVendedores,
                    )}
                  </th>

                  <th>
                    {formatoMoneda(
                      totalRecaudadoVendedores,
                    )}
                  </th>

                  <th>
                    {formatoMoneda(
                      totalFaltanteVendedores,
                    )}
                  </th>

                  <th>
                    {formatoPorcentaje(
                      cumplimientoGeneral,
                    )}
                  </th>

                  <th>
                    {formatoMoneda(
                      totalParteVendedores,
                    )}
                  </th>

                  <th>
                    {formatoMoneda(
                      totalMiCarteraVendedores,
                    )}
                  </th>

                </tr>

              </tfoot>

            )}

        </table>

      </div>

      {/* =====================================================
          LOTES AL DÍA - DETALLE POR LOTE
      ===================================================== */}

      <div className="table-container">

        <div className="page-title">

          <h2>
            Lotes al día
          </h2>

          <p>
            Detalle del cumplimiento
            individual de los lotes que
            actualmente se encuentran al
            día
          </p>

        </div>

        <table className="data-table lotes-al-dia-table">

          <thead>

            <tr>

              <th>
                Vendedor
              </th>

              <th>
                Lote
              </th>

              <th>
                Valor lote
              </th>

              <th>
                Cuota mensual
              </th>

              <th>
                Recaudado
              </th>

              <th>
                Faltante
              </th>

              <th>
                Cumplimiento
              </th>

            </tr>

          </thead>

          <tbody>

            {cargando ? (

              <tr>

                <td colSpan="7">
                  Cargando...
                </td>

              </tr>

            ) : lotesAlDiaDetalle.length ===
              0 ? (

              <tr>

                <td colSpan="7">
                  No hay lotes al día.
                </td>

              </tr>

            ) : (

              lotesAlDiaDetalle.map(
                (item, index) => (

                  <tr
                    key={`${item.vendedor}-${item.lote}-${index}`}
                  >

                    <td>
                      <strong>
                        {item.vendedor}
                      </strong>
                    </td>

                    <td>
                      <strong>
                        {item.lote}
                      </strong>
                    </td>

                    <td>
                      {formatoMoneda(
                        item.valor,
                      )}
                    </td>

                    <td className="cartera-cuota">
                      {formatoMoneda(
                        item.cuotaMensual,
                      )}
                    </td>

                    <td className="cartera-recaudado">
                      {formatoMoneda(
                        item.recaudado,
                      )}
                    </td>

                    <td className="cartera-faltante">
                      {formatoMoneda(
                        item.faltante,
                      )}
                    </td>

                    <td>
                      <span className="cartera-cumplimiento">
                        {formatoPorcentaje(
                          item.cumplimiento,
                        )}
                      </span>
                    </td>

                  </tr>

                ),
              )

            )}

          </tbody>

          {!cargando &&
            lotesAlDiaDetalle.length > 0 && (
              <tfoot>

                <tr>

                  <th colSpan="2">
                    TOTAL LOTES AL DÍA
                  </th>

                  <th>
                    {formatoMoneda(
                      totalValorLotesAlDia,
                    )}
                  </th>

                  <th>
                    {formatoMoneda(
                      totalCuotaMensualLotesAlDia,
                    )}
                  </th>

                  <th>
                    {formatoMoneda(
                      totalRecaudadoLotesAlDia,
                    )}
                  </th>

                  <th>
                    {formatoMoneda(
                      totalFaltanteLotesAlDia,
                    )}
                  </th>

                  <th>
                    {formatoPorcentaje(
                      cumplimientoLotesAlDia,
                    )}
                  </th>

                </tr>

              </tfoot>
            )}

        </table>

      </div>

    </div>
  );
}

export default Dashboard;