import { Navigate } from "react-router-dom";

function ProtectedRoute({
  children
}) {

  const sesion =
    localStorage.getItem(
      "sesion"
    );

  if (!sesion) {

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  try {

    const datos =
      JSON.parse(sesion);

    if (
      !datos.autenticado
    ) {

      localStorage.removeItem(
        "sesion"
      );

      return (
        <Navigate
          to="/login"
          replace
        />
      );
    }

  } catch (error) {

    localStorage.removeItem(
      "sesion"
    );

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return children;
}

export default ProtectedRoute;