import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from 'react-router-dom';

import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';

import Dashboard from './pages/Dashboard';
import Lotes from './pages/Lotes';
import LoteDetalle from './pages/LoteDetalle';
import NuevoLote from './pages/NuevoLote';
import EditarLote from './pages/EditarLote';
import Pagos from './pages/Pagos';

function App() {

    return (
        <BrowserRouter>

            <Routes>

                {/* LOGIN */}

                <Route
                    path="/login"
                    element={<Login />}
                />

                {/* DASHBOARD */}

                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <Dashboard />
                            </Layout>
                        </ProtectedRoute>
                    }
                />

                {/* LOTES */}

                <Route
                    path="/lotes"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <Lotes />
                            </Layout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/lotes/nuevo"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <NuevoLote />
                            </Layout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/lotes/:id/editar"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <EditarLote />
                            </Layout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/lotes/:id"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <LoteDetalle />
                            </Layout>
                        </ProtectedRoute>
                    }
                />

                {/* PAGOS */}

                <Route
                    path="/pagos"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <Pagos />
                            </Layout>
                        </ProtectedRoute>
                    }
                />

                {/* RUTA NO EXISTENTE */}

                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/"
                            replace
                        />
                    }
                />

            </Routes>

        </BrowserRouter>
    );
}

export default App;