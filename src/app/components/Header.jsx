'use client'
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import appConfig from '../config';

const Header = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated()) {
    return null; // Don't show header if not authenticated
  }

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary">{appConfig.title}</h1>
        <Navbar />
      </div>
    </header>
  );
};

export default Header;
