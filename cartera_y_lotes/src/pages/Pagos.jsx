import { useEffect, useState } from "react";
import {
  Wallet,
  CheckCircle,
  AlertCircle,
  Plus,
  X,
  Save,
  Trash2,
  History,
  Coins,
} from "lucide-react";
import {
  obtenerLotes,
  actualizarLote,
  registrarInicial,
  registrarPago,
  eliminarPago,
} from "../services/api";
function Pagos() {
  const [lotes, setLotes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [loteSeleccionado, setLoteSeleccionado] = useState(null);
  const [mostrarFinanciacion, setMostrarFinanciacion] = useState(false);
  const [mostrarInicial, setMostrarInicial] = useState(false);
  const [mostrarCuota, setMostrarCuota] = useState(false);
  const [mostrarAbono, setMostrarAbono] = useState(false);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [financiacion, setFinanciacion] = useState({
    cuotaInicial: "",
    fechaCuotaInicial: "",
    cuotaMensual: "",
  });
  const [nuevoPago, setNuevoPago] = useState({ fecha: "", valor: "" });
  const [nuevaInicial, setNuevaInicial] = useState({
      fecha: "",
      valor: "",
      cuotaMensual: "",
    });
  /* ===================================================== CARGAR LOTES ===================================================== */ useEffect(() => {
    cargarLotes();
  }, []);
  async function cargarLotes() {
    try {
      setCargando(true);
      const datos = await obtenerLotes();
      setLotes(datos);
      return datos;
    } catch (error) {
      console.error("Error cargando lotes:", error);
      return [];
    } finally {
      setCargando(false);
    }
  }
  /* ===================================================== FORMATO MONEDA ===================================================== */ function formatoMoneda(
    valor,
  ) {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(valor || 0);
  }
  /* ===================================================== FORMATO FECHA ===================================================== */ function formatoFecha(
    fecha,
  ) {
    if (!fecha) {
      return "-";
    }
    const partes = fecha.split("-");
    if (partes.length !== 3) {
      return fecha;
    }
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  /* ===================================================== INFORMACIÓN FINANCIERA ===================================================== */ function calcularInformacionPago(
    lote,
  ) {
    const valor = Number(lote.valor) || 0;
    const cuotaInicial = Number(lote.cuotaInicial) || 0;
    const cuotaMensual = Number(lote.cuotaMensual) || 0;
    const pagos = Array.isArray(lote.pagos) ? lote.pagos : [];
    /* * ================================================= * SEPARAR CUOTAS Y ABONOS * ================================================= */ const pagosCuotas =
      pagos.filter((pago) => !pago.tipo || pago.tipo === "cuota");
    const pagosAbonos = pagos.filter((pago) => pago.tipo === "abono");
    /* * ================================================= * TOTAL DE CUOTAS PAGADAS * ================================================= */ const totalPagosCuotas =
      pagosCuotas.reduce((total, pago) => total + (Number(pago.valor) || 0), 0);
    /* * ================================================= * TOTAL DE ABONOS EXTRAORDINARIOS * ================================================= */ const totalAbonosAdicionales =
      pagosAbonos.reduce((total, pago) => total + (Number(pago.valor) || 0), 0);
    /* * ================================================= * TOTAL ABONADO * * Inicial * + * Cuotas * + * Abonos * ================================================= */ const totalAbonado =
      cuotaInicial + totalPagosCuotas + totalAbonosAdicionales;
    /* * ================================================= * SALDO * ================================================= */ const saldoPendiente =
      Math.max(valor - totalAbonado, 0);
    /* * ================================================= * VALOR FINANCIADO * ================================================= */ const valorFinanciado =
      Math.max(valor - cuotaInicial, 0);
    /* * ================================================= * NÚMERO TOTAL DE CUOTAS * ================================================= */ let numeroCuotas = 0;
    if (cuotaMensual > 0 && valorFinanciado > 0) {
      numeroCuotas = Math.ceil(valorFinanciado / cuotaMensual);
    }
    /* * ================================================= * CUOTAS PAGADAS * * IMPORTANTE: * * Ya NO calculamos: * * floor(total / cuotaMensual) * * Ahora contamos los movimientos * reales registrados como cuota. * ================================================= */ let cuotasPagadas =
      pagosCuotas.length;
    cuotasPagadas = Math.min(cuotasPagadas, numeroCuotas);
    /* * ================================================= * CUOTAS RESTANTES * ================================================= */ const cuotasRestantes =
      Math.max(numeroCuotas - cuotasPagadas, 0);
    /* * ================================================= * ÚLTIMA CUOTA * * Los abonos extraordinarios NO * modifican la fecha de la próxima cuota. * ================================================= */ let ultimaCuota =
      null;
    if (pagosCuotas.length > 0) {
      const cuotasOrdenadas = [...pagosCuotas].sort((a, b) =>
        String(a.fecha).localeCompare(String(b.fecha)),
      );
      ultimaCuota = cuotasOrdenadas[cuotasOrdenadas.length - 1];
    }
    /* * ================================================= * PRÓXIMA FECHA DE CUOTA * ================================================= */ let proximaFecha =
      null;
    const fechaBase = ultimaCuota ? ultimaCuota.fecha : lote.fechaCuotaInicial;
    if (fechaBase && cuotaMensual > 0 && cuotasRestantes > 0) {
      const fecha = new Date(`${fechaBase}T00:00:00`);
      fecha.setMonth(fecha.getMonth() + 1);
      proximaFecha = fecha.toISOString().split("T")[0];
    }
    /* * ================================================= * ESTADO * ================================================= */ let estadoPago =
      "Sin pagos";
    if (saldoPendiente <= 0) {
      estadoPago = "Pagado";
    } else if (pagosCuotas.length === 0) {
      estadoPago = "Sin pagos";
    } else {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const fechaProxima = proximaFecha
        ? new Date(`${proximaFecha}T00:00:00`)
        : null;
      if (fechaProxima && fechaProxima < hoy) {
        estadoPago = "Pendiente";
      } else {
        estadoPago = "Al día";
      }
    }
    return {
      valor,
      cuotaInicial,
      cuotaMensual,
      valorFinanciado,
      numeroCuotas,
      cuotasPagadas,
      cuotasRestantes,
      totalPagosCuotas,
      totalAbonosAdicionales,
      totalAbonado,
      saldoPendiente,
      pagosCuotas,
      pagosAbonos,
      ultimaCuota,
      proximaFecha,
      estadoPago,
    };
  }
  /* ===================================================== INFORMACIÓN GENERAL ===================================================== */ const lotesActivos =
    lotes.filter((lote) => !lote.estado || lote.estado !== "Vendido");
  const informacionLotes = lotesActivos.map((lote) => ({
    lote,
    pago: calcularInformacionPago(lote),
  }));
  const totalLotes = informacionLotes.length;
  const lotesAlDia = informacionLotes.filter(
    (item) => item.pago.estadoPago === "Al día",
  ).length;
  const lotesPendientes = informacionLotes.filter(
    (item) => item.pago.estadoPago === "Pendiente",
  ).length;
  const lotesSinPago = informacionLotes.filter(
    (item) => item.pago.estadoPago === "Sin pagos",
  ).length;
  const totalAbonado = informacionLotes.reduce(
    (total, item) => total + item.pago.totalAbonado,
    0,
  );
  const saldoPendiente = informacionLotes.reduce(
  (total, item) => total + item.pago.saldoPendiente,
  0,
);
const totalEsperadoPorMes = informacionLotes.reduce(
  (total, item) => {
    const saldo = Number(item.pago.saldoPendiente) || 0;
    const cuotaMensual = Number(item.pago.cuotaMensual) || 0;

    if (saldo > 0 && cuotaMensual > 0) {
      return total + cuotaMensual;
    }

    return total;
  },
  0,
);
  /* ===================================================== ABRIR CONFIGURACIÓN ===================================================== */ function abrirFinanciacion(
    lote,
  ) {
    setLoteSeleccionado(lote);
    setError("");
    setFinanciacion({
      cuotaInicial:
        lote.cuotaInicial !== undefined ? String(lote.cuotaInicial) : "",
      fechaCuotaInicial: lote.fechaCuotaInicial || "",
      cuotaMensual:
        lote.cuotaMensual !== undefined ? String(lote.cuotaMensual) : "",
    });
    setMostrarFinanciacion(true);
  }
  /* ===================================================== ABRIR INICIAL ===================================================== */ function abrirInicial(lote) {
  setLoteSeleccionado(lote);
  setError("");

  setNuevaInicial({
    fecha:
      lote.fechaCuotaInicial ||
      new Date().toISOString().split("T")[0],

    valor:
      lote.cuotaInicial !== undefined
        ? String(lote.cuotaInicial)
        : "",

    cuotaMensual:
      lote.cuotaMensual !== undefined
        ? String(lote.cuotaMensual)
        : "",
  });

  setMostrarInicial(true);
}
  /* ===================================================== ABRIR CUOTA ===================================================== */ function abrirCuota(
    lote,
  ) {
    setLoteSeleccionado(lote);
    setError("");
    setNuevoPago({
      fecha: new Date().toISOString().split("T")[0],
      valor: lote.cuotaMensual ? String(lote.cuotaMensual) : "",
    });
    setMostrarCuota(true);
  }
  /* ===================================================== ABRIR ABONO ===================================================== */ function abrirAbono(
    lote,
  ) {
    setLoteSeleccionado(lote);
    setError("");
    setNuevoPago({ fecha: new Date().toISOString().split("T")[0], valor: "" });
    setMostrarAbono(true);
  }
  /* ===================================================== ABRIR HISTORIAL ===================================================== */ function abrirHistorial(
    lote,
  ) {
    setLoteSeleccionado(lote);
    setError("");
    setMostrarHistorial(true);
  }
  /* ===================================================== CERRAR MODALES ===================================================== */ function cerrarVentanas() {
    setMostrarFinanciacion(false);
    setMostrarInicial(false);
    setMostrarCuota(false);
    setMostrarAbono(false);
    setMostrarHistorial(false);
    setLoteSeleccionado(null);
    setError("");
  }
  /* ===================================================== CAMBIOS FINANCIACIÓN ===================================================== */ function manejarCambioFinanciacion(
    e,
  ) {
    const { name, value } = e.target;
    setFinanciacion({ ...financiacion, [name]: value });
  }
  /* ===================================================== CAMBIOS PAGO ===================================================== */ function manejarCambioPago(
    e,
  ) {
    const { name, value } = e.target;
    setNuevoPago({ ...nuevoPago, [name]: value });
  }
  /* ===================================================== CAMBIOS INICIAL ===================================================== */ function manejarCambioInicial(
    e,
  ) {
    const { name, value } = e.target;
    setNuevaInicial({ ...nuevaInicial, [name]: value });
  }
  /* ===================================================== GUARDAR FINANCIACIÓN ===================================================== */ async function guardarFinanciacion(
    e,
  ) {
    e.preventDefault();
    setError("");
    const cuotaInicial = Number(financiacion.cuotaInicial) || 0;
    const cuotaMensual = Number(financiacion.cuotaMensual) || 0;
    if (financiacion.cuotaInicial === "") {
      setError("Debe ingresar la cuota inicial.");
      return;
    }
    if (!financiacion.fechaCuotaInicial) {
      setError("Debe ingresar la fecha de la cuota inicial.");
      return;
    }
    if (financiacion.cuotaMensual === "") {
      setError("Debe ingresar la cuota mensual.");
      return;
    }
    if (cuotaInicial < 0) {
      setError("La cuota inicial no puede ser negativa.");
      return;
    }
    if (cuotaMensual <= 0) {
      setError("La cuota mensual debe ser mayor a cero.");
      return;
    }
    if (cuotaInicial > Number(loteSeleccionado.valor)) {
      setError("La cuota inicial no puede ser mayor al valor del lote.");
      return;
    }
    try {
      setGuardando(true);
      await actualizarLote(loteSeleccionado.id, {
        cuotaInicial: cuotaInicial,
        fechaCuotaInicial: financiacion.fechaCuotaInicial,
        cuotaMensual: cuotaMensual,
      });
      await cargarLotes();
      cerrarVentanas();
    } catch (error) {
      console.error("Error guardando financiación:", error);
      setError("No fue posible guardar la información de financiación.");
    } finally {
      setGuardando(false);
    }
  }
  /* ===================================================== GUARDAR INICIAL ===================================================== */ /* =====================================================
   GUARDAR INICIAL
===================================================== */
async function guardarInicial(e) {
  e.preventDefault();
  setError("");

  const valor = Number(nuevaInicial.valor);
  const cuotaMensual = Number(nuevaInicial.cuotaMensual);

  /* =====================================================
     VALIDAR VALOR INICIAL
  ===================================================== */

  if (nuevaInicial.valor === "") {
    setError("Debe ingresar el valor de la cuota inicial.");
    return;
  }

  if (isNaN(valor)) {
    setError("El valor de la cuota inicial no es válido.");
    return;
  }

  if (valor < 0) {
    setError("La cuota inicial no puede ser negativa.");
    return;
  }

  /* =====================================================
     VALIDAR FECHA
  ===================================================== */

  if (!nuevaInicial.fecha) {
    setError("Debe seleccionar la fecha de la cuota inicial.");
    return;
  }

  /* =====================================================
     VALIDAR CUOTA MENSUAL
  ===================================================== */

  if (nuevaInicial.cuotaMensual === "") {
    setError("Debe ingresar el valor de la cuota mensual.");
    return;
  }

  if (isNaN(cuotaMensual)) {
    setError("El valor de la cuota mensual no es válido.");
    return;
  }

  if (cuotaMensual <= 0) {
    setError("La cuota mensual debe ser mayor a cero.");
    return;
  }

  /* =====================================================
     VALIDAR CONTRA VALOR DEL LOTE
  ===================================================== */

  if (valor > Number(loteSeleccionado.valor)) {
    setError(
      "La cuota inicial no puede ser mayor al valor del lote."
    );
    return;
  }

  try {
    setGuardando(true);

    console.log("Registrando cuota inicial:", {
      id: loteSeleccionado.id,
      fecha: nuevaInicial.fecha,
      valor: valor,
      cuotaMensual: cuotaMensual,
    });

    /* =====================================================
       GUARDAR INICIAL + CUOTA MENSUAL
       EN UNA SOLA PETICIÓN
    ===================================================== */

    const respuesta = await registrarInicial(
      loteSeleccionado.id,
      {
        fecha: nuevaInicial.fecha,
        valor: valor,
        cuotaMensual: cuotaMensual,
      }
    );

    console.log(
      "Respuesta registrar inicial:",
      respuesta
    );

    /* =====================================================
       RECARGAR LOTES
    ===================================================== */

    const datos = await cargarLotes();

    const loteActualizado = datos.find(
      (item) =>
        String(item.id) ===
        String(loteSeleccionado.id)
    );

    if (loteActualizado) {
      setLoteSeleccionado(loteActualizado);
    } else if (respuesta && respuesta.lote) {
      setLoteSeleccionado(respuesta.lote);
    }

    /* =====================================================
       CERRAR MODAL
    ===================================================== */

    setMostrarInicial(false);

  } catch (error) {
    console.error(
      "Error registrando cuota inicial:",
      error
    );

    console.error(
      "Respuesta del servidor:",
      error.response
    );

    console.error(
      "Datos del servidor:",
      error.response?.data
    );

    setError(
      error.response?.data?.mensaje ||
      error.message ||
      "No fue posible registrar la cuota inicial."
    );

  } finally {
    setGuardando(false);
  }
}
  /* ===================================================== GUARDAR CUOTA / ABONO ===================================================== */ async function guardarMovimiento(
    e,
    tipo,
  ) {
    e.preventDefault();
    setError("");
    const valor = Number(nuevoPago.valor) || 0;
    if (!nuevoPago.fecha) {
      setError("Debe seleccionar la fecha.");
      return;
    }
    if (valor <= 0) {
      setError("El valor debe ser mayor a cero.");
      return;
    }
    const informacion = calcularInformacionPago(loteSeleccionado);
    if (informacion.saldoPendiente <= 0) {
      setError("Este lote ya se encuentra completamente pagado.");
      return;
    }
    if (valor > informacion.saldoPendiente) {
      setError("El pago no puede ser mayor al saldo pendiente.");
      return;
    }
    /* * Si es cuota, verificar que * exista una cuota mensual configurada. */ if (
      tipo === "cuota" &&
      informacion.cuotaMensual <= 0
    ) {
      setError("Primero debe configurar la cuota mensual.");
      return;
    }
    try {
      setGuardando(true);
      const respuesta = await registrarPago(loteSeleccionado.id, {
        fecha: nuevoPago.fecha,
        valor: valor,
        tipo: tipo,
      });
      /* * Actualizar inmediatamente * el lote del modal. */ if (
        respuesta.lote
      ) {
        setLoteSeleccionado(respuesta.lote);
      }
      const datos = await cargarLotes();
      const loteActualizado = datos.find(
        (item) => String(item.id) === String(loteSeleccionado.id),
      );
      if (loteActualizado) {
        setLoteSeleccionado(loteActualizado);
      }
      setNuevoPago({
        fecha: new Date().toISOString().split("T")[0],
        valor: tipo === "cuota" ? String(informacion.cuotaMensual) : "",
      });
      if (tipo === "cuota") {
        setMostrarCuota(false);
      } else {
        setMostrarAbono(false);
      }
    } catch (error) {
      console.error("Error registrando movimiento:", error);
      setError(
        error.response?.data?.mensaje ||
          "No fue posible registrar el movimiento.",
      );
    } finally {
      setGuardando(false);
    }
  }
  /* ===================================================== BORRAR PAGO ===================================================== */ async function borrarPago(
    lote,
    pago,
  ) {
    const tipo = pago.tipo === "abono" ? "abono" : "cuota";
    const confirmar = window.confirm(
      `¿Desea eliminar el ${tipo} de ${formatoMoneda(pago.valor)} realizado el ${formatoFecha(pago.fecha)}?`,
    );
    if (!confirmar) {
      return;
    }
    try {
      setGuardando(true);
      const respuesta = await eliminarPago(lote.id, pago.id);
      /* * Utilizar directamente la respuesta * del backend. */ if (
        respuesta.lote
      ) {
        setLoteSeleccionado(respuesta.lote);
      }
      const datos = await cargarLotes();
      const loteActualizado = datos.find(
        (item) => String(item.id) === String(lote.id),
      );
      if (loteActualizado) {
        setLoteSeleccionado(loteActualizado);
      }
    } catch (error) {
      console.error("Error eliminando pago:", error);
      alert("No fue posible eliminar el movimiento.");
    } finally {
      setGuardando(false);
    }
  }
  /* ===================================================== RENDER ===================================================== */ return (
    <div>
      {" "}
      <div className="page-title">
        {" "}
        <h1> Pagos </h1>{" "}
        <p> Control de cuotas, abonos y pagos de los lotes </p>{" "}
      </div>{" "}
      {/* ================================================= TARJETAS ================================================= */}{" "}
<div className="dashboard-cards">
  <div className="dashboard-card">
    <span>Lotes registrados</span>
    <strong>
      {cargando ? "..." : totalLotes}
    </strong>
  </div>

  <div className="dashboard-card">
    <span>Al día</span>
    <strong>
      {cargando ? "..." : lotesAlDia}
    </strong>
  </div>

  <div className="dashboard-card">
    <span>Pendientes</span>
    <strong>
      {cargando ? "..." : lotesPendientes}
    </strong>
  </div>

  <div className="dashboard-card">
    <span>Saldo pendiente</span>
    <strong>
      {cargando ? "..." : formatoMoneda(saldoPendiente)}
    </strong>
  </div>

  <div className="dashboard-card">
    <span>Total esperado por mes</span>
    <strong>
      {cargando ? "..." : formatoMoneda(totalEsperadoPorMes)}
    </strong>
  </div>
</div>{" "}
      {/* ================================================= TABLA ================================================= */}{" "}
      <div className="table-container payment-table-container">
        {" "}
        <table className="data-table payment-table">
          {" "}
          <thead>
            {" "}
            <tr>
              {" "}
              <th> Manzana </th> <th> Lote </th> <th> Vendedor </th>{" "}
              <th> Valor </th> <th> C. Inicial </th> <th> Fecha inicial </th>{" "}
              <th> C. Mensual </th> <th> Cuotas </th> <th> Pagadas </th>{" "}
              <th> Restantes </th> <th> Abonos </th> <th> Total abonado </th>{" "}
              <th> Saldo </th> <th> Próxima cuota </th> <th> Estado </th>{" "}
              <th> Acciones </th>{" "}
            </tr>{" "}
          </thead>{" "}
          <tbody>
            {" "}
            {cargando ? (
              <tr>
                {" "}
                <td
                  colSpan="16"
                  style={{ textAlign: "center", padding: "40px" }}
                >
                  {" "}
                  Cargando pagos...{" "}
                </td>{" "}
              </tr>
            ) : informacionLotes.length === 0 ? (
              <tr>
                {" "}
                <td
                  colSpan="16"
                  style={{ textAlign: "center", padding: "40px" }}
                >
                  {" "}
                  No hay lotes registrados.{" "}
                </td>{" "}
              </tr>
            ) : (
              informacionLotes.map(({ lote, pago }) => (
                <tr key={lote.id}>
                  {" "}
                  <td>
                    {" "}
                    <strong> {lote.manzana} </strong>{" "}
                  </td>{" "}
                  <td> {lote.lote} </td> <td> {lote.vendedor || "-"} </td>{" "}
                  <td> {formatoMoneda(lote.valor)} </td>{" "}
                  <td> {formatoMoneda(pago.cuotaInicial)} </td>{" "}
                  <td> {formatoFecha(lote.fechaCuotaInicial)} </td>{" "}
                  <td> {formatoMoneda(pago.cuotaMensual)} </td>{" "}
                  <td> {pago.numeroCuotas} </td>{" "}
                  <td>
                    {" "}
                    <strong> {pago.cuotasPagadas} </strong>{" "}
                  </td>{" "}
                  <td> {pago.cuotasRestantes} </td>{" "}
                  <td> {formatoMoneda(pago.totalAbonosAdicionales)} </td>{" "}
                  <td> {formatoMoneda(pago.totalAbonado)} </td>{" "}
                  <td>
                    {" "}
                    <strong> {formatoMoneda(pago.saldoPendiente)} </strong>{" "}
                  </td>{" "}
                  <td> {formatoFecha(pago.proximaFecha)} </td>{" "}
                  <td>
                    {" "}
                    {pago.estadoPago === "Pagado" && (
                      <span className="badge badge-success">
                        {" "}
                        <CheckCircle
                          size={14}
                          style={{ marginRight: "5px" }}
                        />{" "}
                        Pagado{" "}
                      </span>
                    )}{" "}
                    {pago.estadoPago === "Al día" && (
                      <span className="badge badge-info">
                        {" "}
                        <Wallet size={14} style={{ marginRight: "5px" }} /> Al
                        día{" "}
                      </span>
                    )}{" "}
                    {pago.estadoPago === "Pendiente" && (
                      <span className="badge badge-danger">
                        {" "}
                        <AlertCircle
                          size={14}
                          style={{ marginRight: "5px" }}
                        />{" "}
                        Pendiente{" "}
                      </span>
                    )}{" "}
                    {pago.estadoPago === "Sin pagos" && (
                      <span className="badge badge-warning">
                        {" "}
                        <AlertCircle
                          size={14}
                          style={{ marginRight: "5px" }}
                        />{" "}
                        Sin pagos{" "}
                      </span>
                    )}{" "}
                  </td>{" "}
                  <td>
                    {" "}
                    <div className="payment-actions">
                      {" "}
                      <button
                        type="button"
                        className="payment-action-btn payment-action-initial"
                        title="Registrar cuota inicial"
                        onClick={() => abrirInicial(lote)}
                      >
                        {" "}
                        <Wallet size={17} /> <span> Inicial </span>{" "}
                      </button>{" "}
                      <button
                        type="button"
                        className="payment-action-btn payment-action-cuota"
                        title="Registrar cuota mensual"
                        onClick={() => abrirCuota(lote)}
                      >
                        {" "}
                        <Plus size={17} /> <span> Cuota </span>{" "}
                      </button>{" "}
                      <button
                        type="button"
                        className="payment-action-btn payment-action-abono"
                        title="Registrar abono extraordinario"
                        onClick={() => abrirAbono(lote)}
                      >
                        {" "}
                        <Coins size={17} /> <span> Abono </span>{" "}
                      </button>{" "}
                      <button
                        type="button"
                        className="payment-action-btn payment-action-history"
                        title="Ver historial"
                        onClick={() => abrirHistorial(lote)}
                      >
                        {" "}
                        <History size={17} /> <span> Historial </span>{" "}
                      </button>{" "}
                    </div>{" "}
                  </td>{" "}
                </tr>
              ))
            )}{" "}
          </tbody>{" "}
        </table>{" "}
      </div>{" "}
      {/* ================================================= RESUMEN ================================================= */}{" "}
      {!cargando && informacionLotes.length > 0 && (
        <div className="detail-section" style={{ marginTop: "24px" }}>
          {" "}
          <h2> Resumen de pagos </h2>{" "}
          <div className="detail-information">
            {" "}
            <div>
              {" "}
              <span> Total abonado </span>{" "}
              <strong> {formatoMoneda(totalAbonado)} </strong>{" "}
            </div>{" "}
            <div>
              {" "}
              <span> Saldo pendiente </span>{" "}
              <strong> {formatoMoneda(saldoPendiente)} </strong>{" "}
            </div>{" "}
            <div>
              {" "}
              <span> Lotes al día </span> <strong> {lotesAlDia} </strong>{" "}
            </div>{" "}
            <div>
              {" "}
              <span> Sin cuotas </span> <strong> {lotesSinPago} </strong>{" "}
            </div>{" "}
          </div>{" "}
        </div>
      )}{" "}
      {/* ================================================= MODAL CONFIGURAR FINANCIACIÓN ================================================= */}{" "}
      {mostrarFinanciacion && loteSeleccionado && (
        <div className="modal-overlay" onClick={cerrarVentanas}>
          {" "}
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            {" "}
            <div className="modal-header">
              {" "}
              <div>
                {" "}
                <h2> Configurar financiación </h2>{" "}
                <p>
                  {" "}
                  Lote {loteSeleccionado.manzana} - {loteSeleccionado.lote}{" "}
                </p>{" "}
              </div>{" "}
              <button className="btn-icon" onClick={cerrarVentanas}>
                {" "}
                <X size={18} />{" "}
              </button>{" "}
            </div>{" "}
            <form onSubmit={guardarFinanciacion}>
              {" "}
              <div className="modal-body">
                {" "}
                <div className="payment-summary">
                  {" "}
                  <div>
                    {" "}
                    <span> Valor del lote </span>{" "}
                    <strong>
                      {" "}
                      {formatoMoneda(loteSeleccionado.valor)}{" "}
                    </strong>{" "}
                  </div>{" "}
                </div>{" "}
                <div className="form-group">
                  {" "}
                  <label> Cuota inicial </label>{" "}
                  <input
                    type="number"
                    name="cuotaInicial"
                    value={financiacion.cuotaInicial}
                    onChange={manejarCambioFinanciacion}
                    min="0"
                    step="1"
                    placeholder="Ej. 4000000"
                  />{" "}
                </div>{" "}
                <div className="form-group">
                  {" "}
                  <label> Fecha de la cuota inicial </label>{" "}
                  <input
                    type="date"
                    name="fechaCuotaInicial"
                    value={financiacion.fechaCuotaInicial}
                    onChange={manejarCambioFinanciacion}
                  />{" "}
                </div>{" "}
                <div className="form-group">
                  {" "}
                  <label> Cuota mensual </label>{" "}
                  <input
                    type="number"
                    name="cuotaMensual"
                    value={financiacion.cuotaMensual}
                    onChange={manejarCambioFinanciacion}
                    min="1"
                    step="1"
                    placeholder="Ej. 500000"
                  />{" "}
                </div>{" "}
                {error && <div className="form-error"> {error} </div>}{" "}
              </div>{" "}
              <div className="modal-footer">
                {" "}
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={cerrarVentanas}
                >
                  {" "}
                  Cancelar{" "}
                </button>{" "}
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={guardando}
                >
                  {" "}
                  <Save size={18} />{" "}
                  {guardando ? "Guardando..." : "Guardar financiación"}{" "}
                </button>{" "}
              </div>{" "}
            </form>{" "}
          </div>{" "}
        </div>
      )}{" "}
      {/* ================================================= MODAL CUOTA INICIAL ================================================= */}{" "}
      {mostrarInicial && loteSeleccionado && (
        <div className="modal-overlay" onClick={cerrarVentanas}>
          {" "}
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            {" "}
            <div className="modal-header">
              {" "}
              <div>
                {" "}
                <h2> Registrar cuota inicial </h2>{" "}
                <p>
                  {" "}
                  Lote {loteSeleccionado.manzana} - {loteSeleccionado.lote}{" "}
                </p>{" "}
              </div>{" "}
              <button className="btn-icon" onClick={cerrarVentanas}>
                {" "}
                <X size={18} />{" "}
              </button>{" "}
            </div>{" "}
            <form onSubmit={guardarInicial}>
              {" "}
              <div className="modal-body">
                {" "}
                <div className="payment-summary">
                  {" "}
                  <div>
                    {" "}
                    <span> Valor del lote </span>{" "}
                    <strong>
                      {" "}
                      {formatoMoneda(loteSeleccionado.valor)}{" "}
                    </strong>{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <span> Saldo actual </span>{" "}
                    <strong>
                      {" "}
                      {formatoMoneda(
                        calcularInformacionPago(loteSeleccionado)
                          .saldoPendiente,
                      )}{" "}
                    </strong>{" "}
                  </div>{" "}
                </div>{" "}
                <div className="form-group">
                  {" "}
                  <label> Valor de la cuota inicial </label>{" "}
                  <input
                    type="number"
                    name="valor"
                    value={nuevaInicial.valor}
                    onChange={manejarCambioInicial}
                    min="0"
                    step="1"
                    placeholder="Ej. 4000000"
                  />{" "}
                </div>{" "}
                <div className="form-group">
                  {" "}
                  <label> Fecha de la cuota inicial </label>{" "}
                  <input
                    type="date"
                    name="fecha"
                    value={nuevaInicial.fecha}
                    onChange={manejarCambioInicial}
                  />{" "}
                </div>{" "}
                <div className="form-group">
  <label>Cuota mensual</label>
  <input
    type="number"
    name="cuotaMensual"
    value={nuevaInicial.cuotaMensual}
    onChange={manejarCambioInicial}
    min="1"
    step="1"
    placeholder="Ej. 500000"
  />
  <small className="form-help">
    Valor que se cobrará en cada cuota mensual.
  </small>
</div>
                {error && <div className="form-error"> {error} </div>}{" "}
              </div>{" "}
              <div className="modal-footer">
                {" "}
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={cerrarVentanas}
                >
                  {" "}
                  Cancelar{" "}
                </button>{" "}
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={guardando}
                >
                  {" "}
                  <Save size={18} />{" "}
                  {guardando ? "Guardando..." : "Registrar inicial"}{" "}
                </button>{" "}
              </div>{" "}
            </form>{" "}
          </div>{" "}
        </div>
      )}{" "}
      {/* ================================================= MODAL CUOTA MENSUAL ================================================= */}{" "}
      {mostrarCuota && loteSeleccionado && (
        <div className="modal-overlay" onClick={cerrarVentanas}>
          {" "}
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            {" "}
            <div className="modal-header">
              {" "}
              <div>
                {" "}
                <h2> Registrar cuota mensual </h2>{" "}
                <p>
                  {" "}
                  Lote {loteSeleccionado.manzana} - {loteSeleccionado.lote}{" "}
                </p>{" "}
              </div>{" "}
              <button className="btn-icon" onClick={cerrarVentanas}>
                {" "}
                <X size={18} />{" "}
              </button>{" "}
            </div>{" "}
            <form onSubmit={(e) => guardarMovimiento(e, "cuota")}>
              {" "}
              <div className="modal-body">
                {" "}
                {(() => {
                  const informacion = calcularInformacionPago(loteSeleccionado);
                  return (
                    <>
                      {" "}
                      <div className="payment-summary">
                        {" "}
                        <div>
                          {" "}
                          <span> Cuota mensual </span>{" "}
                          <strong>
                            {" "}
                            {formatoMoneda(informacion.cuotaMensual)}{" "}
                          </strong>{" "}
                        </div>{" "}
                        <div>
                          {" "}
                          <span> Cuotas pagadas </span>{" "}
                          <strong> {informacion.cuotasPagadas} </strong>{" "}
                        </div>{" "}
                        <div>
                          {" "}
                          <span> Cuotas restantes </span>{" "}
                          <strong> {informacion.cuotasRestantes} </strong>{" "}
                        </div>{" "}
                        <div>
                          {" "}
                          <span> Saldo </span>{" "}
                          <strong>
                            {" "}
                            {formatoMoneda(informacion.saldoPendiente)}{" "}
                          </strong>{" "}
                        </div>{" "}
                      </div>{" "}
                      <div className="form-group">
                        {" "}
                        <label> Fecha de la cuota </label>{" "}
                        <input
                          type="date"
                          name="fecha"
                          value={nuevoPago.fecha}
                          onChange={manejarCambioPago}
                        />{" "}
                      </div>{" "}
                      <div className="form-group">
                        {" "}
                        <label> Valor de la cuota </label>{" "}
                        <input
                          type="number"
                          name="valor"
                          value={nuevoPago.valor}
                          onChange={manejarCambioPago}
                          min="1"
                          step="1"
                          placeholder="Ej. 500000"
                        />{" "}
                      </div>{" "}
                      {error && (
                        <div className="form-error"> {error} </div>
                      )}{" "}
                    </>
                  );
                })()}{" "}
              </div>{" "}
              <div className="modal-footer">
                {" "}
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={cerrarVentanas}
                >
                  {" "}
                  Cancelar{" "}
                </button>{" "}
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={guardando}
                >
                  {" "}
                  <Save size={18} />{" "}
                  {guardando ? "Guardando..." : "Registrar cuota"}{" "}
                </button>{" "}
              </div>{" "}
            </form>{" "}
          </div>{" "}
        </div>
      )}{" "}
      {/* ================================================= MODAL ABONO ================================================= */}{" "}
      {mostrarAbono && loteSeleccionado && (
        <div className="modal-overlay" onClick={cerrarVentanas}>
          {" "}
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            {" "}
            <div className="modal-header">
              {" "}
              <div>
                {" "}
                <h2> Registrar abono </h2>{" "}
                <p>
                  {" "}
                  Abono extraordinario · Lote {loteSeleccionado.manzana} -{" "}
                  {loteSeleccionado.lote}{" "}
                </p>{" "}
              </div>{" "}
              <button className="btn-icon" onClick={cerrarVentanas}>
                {" "}
                <X size={18} />{" "}
              </button>{" "}
            </div>{" "}
            <form onSubmit={(e) => guardarMovimiento(e, "abono")}>
              {" "}
              <div className="modal-body">
                {" "}
                {(() => {
                  const informacion = calcularInformacionPago(loteSeleccionado);
                  return (
                    <>
                      {" "}
                      <div className="payment-summary">
                        {" "}
                        <div>
                          {" "}
                          <span> Saldo actual </span>{" "}
                          <strong>
                            {" "}
                            {formatoMoneda(informacion.saldoPendiente)}{" "}
                          </strong>{" "}
                        </div>{" "}
                        <div>
                          {" "}
                          <span> Total abonado </span>{" "}
                          <strong>
                            {" "}
                            {formatoMoneda(informacion.totalAbonado)}{" "}
                          </strong>{" "}
                        </div>{" "}
                      </div>{" "}
                      <div className="form-group">
                        {" "}
                        <label> Fecha del abono </label>{" "}
                        <input
                          type="date"
                          name="fecha"
                          value={nuevoPago.fecha}
                          onChange={manejarCambioPago}
                        />{" "}
                      </div>{" "}
                      <div className="form-group">
                        {" "}
                        <label> Valor del abono </label>{" "}
                        <input
                          type="number"
                          name="valor"
                          value={nuevoPago.valor}
                          onChange={manejarCambioPago}
                          min="1"
                          step="1"
                          placeholder="Ej. 1000000"
                        />{" "}
                      </div>{" "}
                      {error && (
                        <div className="form-error"> {error} </div>
                      )}{" "}
                    </>
                  );
                })()}{" "}
              </div>{" "}
              <div className="modal-footer">
                {" "}
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={cerrarVentanas}
                >
                  {" "}
                  Cancelar{" "}
                </button>{" "}
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={guardando}
                >
                  {" "}
                  <Save size={18} />{" "}
                  {guardando ? "Guardando..." : "Registrar abono"}{" "}
                </button>{" "}
              </div>{" "}
            </form>{" "}
          </div>{" "}
        </div>
      )}{" "}
      {/* ================================================= MODAL HISTORIAL ================================================= */}{" "}
      {mostrarHistorial && loteSeleccionado && (
        <div className="modal-overlay" onClick={cerrarVentanas}>
          {" "}
          <div
            className="modal-card modal-large"
            onClick={(e) => e.stopPropagation()}
          >
            {" "}
            <div className="modal-header">
              {" "}
              <div>
                {" "}
                <h2> Historial de pagos </h2>{" "}
                <p>
                  {" "}
                  Lote {loteSeleccionado.manzana} - {loteSeleccionado.lote}{" "}
                </p>{" "}
              </div>{" "}
              <button className="btn-icon" onClick={cerrarVentanas}>
                {" "}
                <X size={18} />{" "}
              </button>{" "}
            </div>{" "}
            <div className="modal-body">
              {" "}
              {(() => {
                const informacion = calcularInformacionPago(loteSeleccionado);
                const movimientos = Array.isArray(loteSeleccionado.pagos)
                  ? [...loteSeleccionado.pagos].sort((a, b) =>
                      String(b.fecha).localeCompare(String(a.fecha)),
                    )
                  : [];
                return (
                  <>
                    {" "}
                    <div className="payment-summary">
                      {" "}
                      <div>
                        {" "}
                        <span> Cuota inicial </span>{" "}
                        <strong>
                          {" "}
                          {formatoMoneda(informacion.cuotaInicial)}{" "}
                        </strong>{" "}
                      </div>{" "}
                      <div>
                        {" "}
                        <span> Cuotas pagadas </span>{" "}
                        <strong> {informacion.cuotasPagadas} </strong>{" "}
                      </div>{" "}
                      <div>
                        {" "}
                        <span> Abonos </span>{" "}
                        <strong>
                          {" "}
                          {formatoMoneda(
                            informacion.totalAbonosAdicionales,
                          )}{" "}
                        </strong>{" "}
                      </div>{" "}
                      <div>
                        {" "}
                        <span> Saldo </span>{" "}
                        <strong>
                          {" "}
                          {formatoMoneda(informacion.saldoPendiente)}{" "}
                        </strong>{" "}
                      </div>{" "}
                    </div>{" "}
                    <div className="payment-history">
                      {" "}
                      <h3> Movimientos </h3>{" "}
                      {movimientos.length === 0 ? (
                        <p> No hay cuotas ni abonos registrados. </p>
                      ) : (
                        <table className="data-table payment-table">
                          {" "}
                          <thead>
                            {" "}
                            <tr>
                              {" "}
                              <th> Fecha </th> <th> Tipo </th> <th> Valor </th>{" "}
                              <th> Acción </th>{" "}
                            </tr>{" "}
                          </thead>{" "}
                          <tbody>
                            {" "}
                            {movimientos.map((pago) => (
                              <tr key={pago.id}>
                                {" "}
                                <td> {formatoFecha(pago.fecha)} </td>{" "}
                                <td>
                                  {" "}
                                  {pago.tipo === "abono" ? (
                                    <span className="badge badge-info">
                                      {" "}
                                      Abono{" "}
                                    </span>
                                  ) : (
                                    <span className="badge badge-success">
                                      {" "}
                                      Cuota{" "}
                                    </span>
                                  )}{" "}
                                </td>{" "}
                                <td>
                                  {" "}
                                  <strong>
                                    {" "}
                                    {formatoMoneda(pago.valor)}{" "}
                                  </strong>{" "}
                                </td>{" "}
                                <td>
                                  {" "}
                                  <button
                                    type="button"
                                    className="btn-icon"
                                    title="Eliminar movimiento"
                                    onClick={() =>
                                      borrarPago(loteSeleccionado, pago)
                                    }
                                    disabled={guardando}
                                  >
                                    {" "}
                                    <Trash2 size={16} />{" "}
                                  </button>{" "}
                                </td>{" "}
                              </tr>
                            ))}{" "}
                          </tbody>{" "}
                        </table>
                      )}{" "}
                    </div>{" "}
                  </>
                );
              })()}{" "}
            </div>{" "}
          </div>{" "}
        </div>
      )}{" "}
    </div>
  );
}
export default Pagos;
