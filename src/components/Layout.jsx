import { Outlet } from 'react-router-dom';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';

export default function Layout() {
  return (
    <div className="app">
      <LeftSidebar />
      <main className="main-content">
        <Outlet />
      </main>
      <RightSidebar />
    </div>
  );
}
