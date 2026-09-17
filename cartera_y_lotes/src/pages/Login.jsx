import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { iniciarSesion } from "../services/api";

function Login() {

  const navigate = useNavigate();

  const [usuario, setUsuario] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [cargando, setCargando] =
    useState(false);

  async function manejarLogin(e) {

    e.preventDefault();

    setError("");

    if (!usuario.trim()) {
      setError(
        "Ingrese el usuario."
      );
      return;
    }

    if (!password) {
      setError(
        "Ingrese la contraseña."
      );
      return;
    }

    try {

      setCargando(true);

      const respuesta =
        await iniciarSesion(
          usuario,
          password
        );

      if (respuesta.autenticado) {

        localStorage.setItem(
          "sesion",
          JSON.stringify({
            autenticado: true,
            usuario:
              respuesta.usuario
          })
        );

        navigate("/", {
          replace: true
        });
      }

    } catch (error) {

      if (
        error.response &&
        error.response.data &&
        error.response.data.mensaje
      ) {

        setError(
          error.response.data.mensaje
        );

      } else {

        setError(
          "No fue posible conectarse con el servidor."
        );
      }

    } finally {

      setCargando(false);
    }
  }

  return (
    <div className="login-page">

      <div className="login-container">

        <div className="login-card">

          <div className="login-header">

            <h1>
              Sistema de Cartera
            </h1>

            <p>
              Inicie sesión para continuar
            </p>

          </div>

          <form
            onSubmit={manejarLogin}
          >

            <div className="login-field">

              <label>
                Usuario
              </label>

              <input
                type="text"
                value={usuario}
                onChange={(e) =>
                  setUsuario(
                    e.target.value
                  )
                }
                placeholder="Ingrese su usuario"
                autoComplete="username"
                disabled={cargando}
              />

            </div>

            <div className="login-field">

              <label>
                Contraseña
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
                placeholder="Ingrese su contraseña"
                autoComplete="current-password"
                disabled={cargando}
              />

            </div>

            {error && (
              <div className="login-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="login-button"
              disabled={cargando}
            >

              {cargando
                ? "Ingresando..."
                : "Iniciar sesión"}

            </button>

          </form>

        </div>

      </div>

    </div>
  );
}

export default Login;