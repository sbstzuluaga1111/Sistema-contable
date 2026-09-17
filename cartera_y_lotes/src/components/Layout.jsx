
import Sidebar from './Sidebar';
import Header from './Header';

function Layout({ children }) {

    function cerrarSesion() {

        localStorage.removeItem(
            'sesion'
        );

        window.location.href =
            '/login';
    }

    return (
        <div className="app-layout">

            <Sidebar />

            <div className="main-content">

                <Header
                    cerrarSesion={
                        cerrarSesion
                    }
                />

                <main className="page-content">
                    {children}
                </main>

            </div>

        </div>
    );
}

export default Layout;