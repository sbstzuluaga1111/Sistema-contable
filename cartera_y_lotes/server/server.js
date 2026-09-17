import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

const PORT = 3001;

/* =========================================================
   RUTAS DEL SISTEMA
========================================================= */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(
  __dirname,
  "..",
  "data",
  "lotes.json"
);

/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(cors());
app.use(express.json());

/* =========================================================
   CREDENCIALES DEL SISTEMA
========================================================= */

const USUARIO_SISTEMA = "admin";
const PASSWORD_SISTEMA = "Cartera#2026!Admin";

/* =========================================================
   POST - LOGIN
========================================================= */

app.post(
  "/api/login",
  (req, res) => {

    try {

      const usuario =
        String(req.body.usuario || "").trim();

      const password =
        String(req.body.password || "");

      if (
        usuario === USUARIO_SISTEMA &&
        password === PASSWORD_SISTEMA
      ) {

        return res.json({
          autenticado: true,
          usuario: usuario,
          mensaje: "Inicio de sesión correcto"
        });
      }

      return res.status(401).json({
        autenticado: false,
        mensaje: "Usuario o contraseña incorrectos"
      });

    } catch (error) {

      console.error(
        "Error en login:",
        error
      );

      return res.status(500).json({
        autenticado: false,
        mensaje: "Error al iniciar sesión"
      });
    }
  }
);

/* =========================================================
   LEER DATOS
========================================================= */

function leerDatos() {
  if (!fs.existsSync(DATA_FILE)) {
    return {
      lotes: []
    };
  }

  const contenido = fs.readFileSync(
    DATA_FILE,
    "utf8"
  );

  if (!contenido.trim()) {
    return {
      lotes: []
    };
  }

  return JSON.parse(contenido);
}

/* =========================================================
   GUARDAR DATOS
========================================================= */

function guardarDatos(datos) {
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(
      datos,
      null,
      2
    ),
    "utf8"
  );
}

/* =========================================================
   GET - OBTENER TODOS LOS LOTES
========================================================= */

app.get(
  "/api/lotes",
  (req, res) => {
    try {
      const datos = leerDatos();

      /*
       * Compatibilidad con datos anteriores.
       *
       * Si algún lote no tiene pagos,
       * se garantiza que exista el arreglo.
       */
      datos.lotes = datos.lotes.map(
        (lote) => ({
          ...lote,

          cuotaInicial:
            Number(lote.cuotaInicial) || 0,

          cuotaMensual:
            Number(lote.cuotaMensual) || 0,

          pagos:
            Array.isArray(lote.pagos)
              ? lote.pagos
              : []
        })
      );

      res.json(
        datos.lotes
      );

    } catch (error) {

      console.error(
        "Error consultando lotes:",
        error
      );

      res.status(500).json({
        mensaje:
          "Error al consultar los lotes"
      });
    }
  }
);

/* =========================================================
   POST - CREAR LOTE
========================================================= */

app.post(
  "/api/lotes",
  (req, res) => {

    try {

      const datos = leerDatos();

      const nuevoLote = {

        id:
          Date.now(),

        manzana:
          req.body.manzana || "",

        lote:
          req.body.lote || "",

        valor:
          Number(req.body.valor) || 0,

        estado:
          req.body.estado ||
          "Disponible",

        vendedor:
          req.body.vendedor || "",

        fechaVenta:
          req.body.fechaVenta || "",

        /* =================================================
           INFORMACIÓN FINANCIERA
        ================================================= */

        cuotaInicial:
          Number(
            req.body.cuotaInicial
          ) || 0,

        fechaCuotaInicial:
          req.body.fechaCuotaInicial || "",

        cuotaMensual:
          Number(
            req.body.cuotaMensual
          ) || 0,

        /* =================================================
           HISTORIAL DE MOVIMIENTOS
        ================================================= */

        pagos: []
      };

      datos.lotes.push(
        nuevoLote
      );

      guardarDatos(
        datos
      );

      console.log(
        "Lote creado:",
        nuevoLote
      );

      res.status(201).json(
        nuevoLote
      );

    } catch (error) {

      console.error(
        "Error guardando lote:",
        error
      );

      res.status(500).json({
        mensaje:
          "Error al guardar el lote"
      });
    }
  }
);

/* =========================================================
   PUT - ACTUALIZAR LOTE
========================================================= */

app.put(
  "/api/lotes/:id",
  (req, res) => {

    try {

      const datos = leerDatos();

      const id =
        String(req.params.id);

      console.log(
        "Actualizando lote:",
        id
      );

      console.log(
        "Datos recibidos:",
        req.body
      );

      const indice =
        datos.lotes.findIndex(
          (lote) =>
            String(lote.id) === id
        );

      if (indice === -1) {

        return res.status(404).json({
          mensaje:
            "Lote no encontrado"
        });
      }

      const loteActual =
        datos.lotes[indice];

      const loteActualizado = {

        ...loteActual,

        manzana:
          req.body.manzana !== undefined
            ? req.body.manzana
            : loteActual.manzana,

        lote:
          req.body.lote !== undefined
            ? req.body.lote
            : loteActual.lote,

        valor:
          req.body.valor !== undefined
            ? Number(req.body.valor)
            : Number(loteActual.valor) || 0,

        estado:
          req.body.estado !== undefined
            ? req.body.estado
            : loteActual.estado,

        vendedor:
          req.body.vendedor !== undefined
            ? req.body.vendedor
            : loteActual.vendedor,

        fechaVenta:
          req.body.fechaVenta !== undefined
            ? req.body.fechaVenta
            : loteActual.fechaVenta,

        cuotaInicial:
          req.body.cuotaInicial !== undefined
            ? Number(req.body.cuotaInicial) || 0
            : Number(
                loteActual.cuotaInicial
              ) || 0,

        fechaCuotaInicial:
          req.body.fechaCuotaInicial !== undefined
            ? req.body.fechaCuotaInicial
            : loteActual.fechaCuotaInicial || "",

        cuotaMensual:
          req.body.cuotaMensual !== undefined
            ? Number(req.body.cuotaMensual) || 0
            : Number(
                loteActual.cuotaMensual
              ) || 0,

        /*
         * MUY IMPORTANTE:
         *
         * Nunca reemplazamos los pagos
         * desde este endpoint.
         *
         * Así actualizar la financiación
         * no elimina el historial.
         */
        pagos:
          Array.isArray(loteActual.pagos)
            ? loteActual.pagos
            : []
      };

      datos.lotes[indice] =
        loteActualizado;

      guardarDatos(
        datos
      );

      console.log(
        "Lote actualizado:",
        loteActualizado
      );

      res.json(
        loteActualizado
      );

    } catch (error) {

      console.error(
        "Error actualizando lote:",
        error
      );

      res.status(500).json({
        mensaje:
          "Error al actualizar el lote"
      });
    }
  }
);

/* =========================================================
   POST - REGISTRAR / ACTUALIZAR CUOTA INICIAL
========================================================= */

/* =========================================================
   POST - REGISTRAR / ACTUALIZAR CUOTA INICIAL
   También configura la cuota mensual
========================================================= */

app.post(
  "/api/lotes/:id/inicial",
  (req, res) => {

    try {

      const datos = leerDatos();

      const id =
        String(req.params.id);

      console.log(
        "Registrando cuota inicial:",
        id
      );

      console.log(
        "Datos inicial:",
        req.body
      );

      const indice =
        datos.lotes.findIndex(
          (lote) =>
            String(lote.id) === id
        );

      if (indice === -1) {

        return res.status(404).json({
          mensaje:
            "Lote no encontrado"
        });
      }

      const lote =
        datos.lotes[indice];

      /* =====================================================
         VALIDAR VALOR DE CUOTA INICIAL
      ===================================================== */

      if (
        req.body.valor === undefined ||
        req.body.valor === ""
      ) {

        return res.status(400).json({
          mensaje:
            "El valor de la cuota inicial es obligatorio"
        });
      }

      const valor =
        Number(req.body.valor);

      /*
       * La cuota inicial puede ser 0.
       */
      if (isNaN(valor)) {

        return res.status(400).json({
          mensaje:
            "El valor de la cuota inicial no es válido"
        });
      }

      if (valor < 0) {

        return res.status(400).json({
          mensaje:
            "La cuota inicial no puede ser negativa"
        });
      }


      /* =====================================================
         VALIDAR FECHA
      ===================================================== */

      const fecha =
        req.body.fecha;

      if (!fecha) {

        return res.status(400).json({
          mensaje:
            "La fecha de la cuota inicial es obligatoria"
        });
      }


      /* =====================================================
         VALIDAR VALOR DEL LOTE
      ===================================================== */

      const valorLote =
        Number(lote.valor) || 0;

      if (valor > valorLote) {

        return res.status(400).json({
          mensaje:
            "La cuota inicial no puede ser mayor al valor del lote"
        });
      }


      /* =====================================================
         VALIDAR CUOTA MENSUAL
      ===================================================== */

      if (
        req.body.cuotaMensual === undefined ||
        req.body.cuotaMensual === ""
      ) {

        return res.status(400).json({
          mensaje:
            "El valor de la cuota mensual es obligatorio"
        });
      }

      const cuotaMensual =
        Number(req.body.cuotaMensual);

      if (isNaN(cuotaMensual)) {

        return res.status(400).json({
          mensaje:
            "El valor de la cuota mensual no es válido"
        });
      }

      if (cuotaMensual <= 0) {

        return res.status(400).json({
          mensaje:
            "La cuota mensual debe ser mayor a cero"
        });
      }


      /* =====================================================
         GUARDAR INFORMACIÓN FINANCIERA
      ===================================================== */

      lote.cuotaInicial =
        valor;

      lote.fechaCuotaInicial =
        fecha;

      lote.cuotaMensual =
        cuotaMensual;


      /* =====================================================
         GARANTIZAR HISTORIAL
      ===================================================== */

      if (
        !Array.isArray(lote.pagos)
      ) {

        lote.pagos = [];
      }


      /* =====================================================
         GUARDAR LOTE
      ===================================================== */

      datos.lotes[indice] =
        lote;

      guardarDatos(
        datos
      );


      /* =====================================================
         LOG
      ===================================================== */

      console.log(
        "Cuota inicial y cuota mensual registradas:",
        {
          valorInicial: valor,
          fechaInicial: fecha,
          cuotaMensual: cuotaMensual
        }
      );


      /* =====================================================
         RESPUESTA
      ===================================================== */

      res.status(200).json({

        mensaje:
          "Cuota inicial y cuota mensual registradas correctamente",

        lote:
          lote

      });

    } catch (error) {

      console.error(
        "Error registrando cuota inicial:",
        error
      );

      res.status(500).json({
        mensaje:
          "Error al registrar la cuota inicial"
      });
    }
  }
);

/* =========================================================
   POST - REGISTRAR PAGO / CUOTA / ABONO
========================================================= */

app.post(
  "/api/lotes/:id/pago",
  (req, res) => {

    try {

      const datos = leerDatos();

      const id =
        String(req.params.id);

      console.log(
        "Registrando movimiento para lote:",
        id
      );

      console.log(
        "Datos del movimiento:",
        req.body
      );

      const indice =
        datos.lotes.findIndex(
          (lote) =>
            String(lote.id) === id
        );

      if (indice === -1) {

        return res.status(404).json({
          mensaje:
            "Lote no encontrado"
        });
      }

      const lote =
        datos.lotes[indice];

      /*
       * Validar fecha.
       */
      if (!req.body.fecha) {

        return res.status(400).json({
          mensaje:
            "La fecha del pago es obligatoria"
        });
      }

      /*
       * Validar valor.
       */
      const valor =
        Number(req.body.valor);

      if (
        req.body.valor === undefined ||
        req.body.valor === "" ||
        valor <= 0
      ) {

        return res.status(400).json({
          mensaje:
            "El valor del pago debe ser mayor a cero"
        });
      }

      /*
       * Tipo de movimiento.
       *
       * Permitimos:
       *
       * cuota
       * abono
       *
       * Si no llega tipo, por compatibilidad
       * se considera cuota.
       */
      const tipo =
        req.body.tipo === "abono"
          ? "abono"
          : "cuota";

      /*
       * Asegurar historial.
       */
      if (
        !Array.isArray(lote.pagos)
      ) {
        lote.pagos = [];
      }

      /*
       * Crear movimiento.
       */
      const nuevoPago = {

        id:
          Date.now(),

        fecha:
          req.body.fecha,

        valor:
          valor,

        tipo:
          tipo
      };

      /*
       * Agregar al historial.
       */
      lote.pagos.push(
        nuevoPago
      );

      /*
       * Guardar.
       */
      datos.lotes[indice] =
        lote;

      guardarDatos(
        datos
      );

      console.log(
        "Movimiento registrado:",
        nuevoPago
      );

      res.status(201).json({

        mensaje:
          tipo === "abono"
            ? "Abono registrado correctamente"
            : "Cuota registrada correctamente",

        pago:
          nuevoPago,

        lote:
          lote

      });

    } catch (error) {

      console.error(
        "Error registrando pago:",
        error
      );

      res.status(500).json({
        mensaje:
          "Error al registrar el pago"
      });
    }
  }
);

/* =========================================================
   DELETE - ELIMINAR PAGO / CUOTA / ABONO
========================================================= */

app.delete(
  "/api/lotes/:id/pago/:pagoId",
  (req, res) => {

    try {

      const datos =
        leerDatos();

      const id =
        String(req.params.id);

      const pagoId =
        String(req.params.pagoId);

      const indice =
        datos.lotes.findIndex(
          (lote) =>
            String(lote.id) === id
        );

      if (indice === -1) {

        return res.status(404).json({
          mensaje:
            "Lote no encontrado"
        });
      }

      const lote =
        datos.lotes[indice];

      if (
        !Array.isArray(lote.pagos)
      ) {
        lote.pagos = [];
      }

      const cantidadAntes =
        lote.pagos.length;

      lote.pagos =
        lote.pagos.filter(
          (pago) =>
            String(pago.id) !== pagoId
        );

      if (
        lote.pagos.length ===
        cantidadAntes
      ) {

        return res.status(404).json({
          mensaje:
            "Pago no encontrado"
        });
      }

      datos.lotes[indice] =
        lote;

      guardarDatos(
        datos
      );

      console.log(
        "Movimiento eliminado:",
        pagoId
      );

      res.json({

        mensaje:
          "Movimiento eliminado correctamente",

        lote:
          lote

      });

    } catch (error) {

      console.error(
        "Error eliminando pago:",
        error
      );

      res.status(500).json({
        mensaje:
          "Error al eliminar el pago"
      });
    }
  }
);

/* =========================================================
   SERVIDOR
========================================================= */

app.listen(
  PORT,
  () => {

    console.log(
      "========================================"
    );

    console.log(
      `Servidor ejecutándose en http://localhost:${PORT}`
    );

    console.log(
      "API de lotes disponible"
    );

    console.log(
      "API de cuota inicial disponible"
    );

    console.log(
      "API de cuotas y abonos disponible"
    );

    console.log(
      "========================================"
    );
  }
);