import { Outlet } from 'react-router-dom';
import { Footer } from './Footer';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function AppShell() {
  return (
    <div className="shell">
      <Sidebar />
      <div className="shell__content">
        <Header />
        <main className="main-content">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}
