import {
    LayoutDashboard,
    Map,
    Wallet,
    Users,
    Settings
} from 'lucide-react';

import { NavLink } from 'react-router-dom';

function Sidebar() {
    const menuItems = [
        {
            to: '/',
            label: 'Dashboard',
            icon: LayoutDashboard
        },
        {
            to: '/lotes',
            label: 'Lotes',
            icon: Map
        },
        {
            to: '/pagos',
            label: 'Pagos',
            icon: Wallet
        }
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <div className="logo-icon">
                    <Map size={24} />
                </div>

                <div>
                    <h1>Sistema</h1>
                    <span>Contable</span>
                </div>
            </div>

            <nav className="sidebar-menu">
                {menuItems.map((item) => {
                    const Icon = item.icon;

                    return (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `menu-item ${isActive ? 'active' : ''}`
                            }
                        >
                            <Icon size={20} />
                            <span>{item.label}</span>
                        </NavLink>
                    );
                })}
            </nav>
        </aside>
    );
}

export default Sidebar;