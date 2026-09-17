import { LogOut } from 'lucide-react';

function Header({ cerrarSesion }) {

    return (
        <header className="header">

            <div>
                <h2>Dashboard</h2>
                <p>Administración de cartera y lotes</p>
            </div>

            <div className="header-user">

                <div className="user-avatar">
                    U
                </div>

                <div className="header-user-info">
                    <strong>Administrador</strong>
                    <span>Usuario</span>
                </div>

                <button
                    type="button"
                    className="logout-button"
                    onClick={cerrarSesion}
                    title="Cerrar sesión"
                >
                    <LogOut size={18} />
                    <span>Cerrar sesión</span>
                </button>

            </div>

        </header>
    );
}

export default Header;