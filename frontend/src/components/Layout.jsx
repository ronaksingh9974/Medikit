import { NavLink, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiShoppingCart,
  FiClock,
  FiPhone,
  FiUser,
  FiMenu,
} from "react-icons/fi";

const items = [
  ["/dashboard", "Dashboard", FiHome],
  ["/medicines", "Medicines", FiShoppingCart],
  ["/reminders", "Reminders", FiClock],
  ["/emergency", "Emergency", FiPhone],
  ["/profile", "Profile", FiUser],
];
export function Header({ onMenu }) {
  const go = useNavigate();
  return (
    <header>
      <button
        className="menu-btn"
        onClick={onMenu}
        aria-label="Open navigation"
      >
        <FiMenu />
      </button>
      <NavLink to="/" className="brand">
        ✚ Medkit.com
      </NavLink>
      <nav>
        <NavLink to="/">Home</NavLink>
        <NavLink to="/medicines">Medicines</NavLink>
        <NavLink to="/about">About us</NavLink>
      </nav>
      <button
        className="profile-dot"
        aria-label="Open user options"
        onClick={() => go("/profile")}
      >
        <FiUser />
      </button>
    </header>
  );
}
export function Sidebar({ open, onClose }) {
  return (
    <aside className={open ? "sidebar open" : "sidebar"}>
      <div className="mobile-close">
        <button onClick={onClose}>Close ×</button>
      </div>
      {items.map(([to, label, Icon]) =>
        to === "#" ? (
          <a
            href="#placeholder"
            key={label}
            onClick={(e) => e.preventDefault()}
          >
            <Icon />
            {label}
          </a>
        ) : (
          <NavLink key={label} to={to} onClick={onClose}>
            <Icon />
            {label}
          </NavLink>
        ),
      )}
    </aside>
  );
}
export function AppShell({ children, open, onClose }) {
  return (
    <>
      <Sidebar open={open} onClose={onClose} />
      <main className="app-main">{children}</main>
    </>
  );
}
