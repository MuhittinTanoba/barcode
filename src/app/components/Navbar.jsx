'use client'
import React, { useState, useEffect, useRef } from 'react'
import { useOrderStatus } from '../context/OrderStatusContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Link from 'next/link';
import axios from 'axios';
import appConfig from '../config';

function Navbar() {
    const { activeOrdersCount } = useOrderStatus();
    const { user, logout, isManager, isAuthenticated } = useAuth();
    const { t, language, switchLanguage } = useLanguage();
    const [clockLoading, setClockLoading] = useState(false);
    const [clockMessage, setClockMessage] = useState('');
    const [showManagementMenu, setShowManagementMenu] = useState(false);
    const [activeSession, setActiveSession] = useState(null);
    const [elapsedTime, setElapsedTime] = useState('');
    const dropdownRef = useRef(null);

    const checkActiveSession = async () => {
        // Market POS simplification: Disable employee session checking
        return;
        /*
        if (!user?._id) return;
        try {
            // Check past 48 hours to cover overnight shifts
            const today = new Date();
            const pastDate = new Date(today);
            pastDate.setDate(pastDate.getDate() - 2);
            
            const startDate = pastDate.toISOString().split('T')[0];
            const endDate = today.toISOString().split('T')[0];
            
            // Direct API call since we are restructuring
            // Also checking if user._id is valid before making call
            const response = await axios.get(`/api/employees/${user._id}/workhours`, {
                params: { startDate, endDate }
            });
            
            const sessions = response.data;
            if (Array.isArray(sessions)) {
                 // Sort by date desc just in case, though we act on find
                 const current = sessions.find(s => s.clockIn && !s.clockOut);
                 setActiveSession(current || null);
                 
                 // Immediate update of timer text
                 if (current && current.clockIn) {
                     updateTimerText(current.clockIn);
                 }
            }
        } catch (e) {
            console.error("Failed to check active session", e);
        }
        */
    };

    const updateTimerText = (startTime) => {
        const now = new Date();
        const start = new Date(startTime);
        const diff = now - start;
        
        if (diff < 0) {
            setElapsedTime('0m');
            return;
        }

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        
        if (hours > 0) {
            setElapsedTime(`${hours}h ${mins}m`);
        } else {
            setElapsedTime(`${mins}m`);
        }
    };

    useEffect(() => {
        if (user?._id) {
            checkActiveSession();
        }
    }, [user]);

    useEffect(() => {
        if (!activeSession?.clockIn) {
            setElapsedTime('');
            return;
        }

        updateTimerText(activeSession.clockIn);
        const interval = setInterval(() => {
            updateTimerText(activeSession.clockIn);
        }, 60000); // Update every minute

        return () => clearInterval(interval);
    }, [activeSession]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowManagementMenu(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
      <nav className="flex items-center justify-between">
        {/* Left side - Main navigation */}
        <div className="flex items-center space-x-6">
          <Link 
            href="/" 
            className="text-muted-foreground hover:text-primary font-medium transition-colors duration-200 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('menu')}
          </Link>
          

          
          
          
          <Link 
            href="/orders-history" 
            className="text-muted-foreground hover:text-primary font-medium transition-colors duration-200 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {t('orderHistory')}
          </Link>

          <Link 
            href="/analytics" 
            className="text-muted-foreground hover:text-primary font-medium transition-colors duration-200 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {t('analytics')}
          </Link>

          <div className="flex items-center ml-4 space-x-2 border-l pl-4">
            <button 
                onClick={() => switchLanguage('en')}
                className={`text-xs px-2 py-1 rounded ${language === 'en' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-primary'}`}
            >
                EN
            </button>
            <button 
                onClick={() => switchLanguage('tr')}
                className={`text-xs px-2 py-1 rounded ${language === 'tr' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-primary'}`}
            >
                TR
            </button>
          </div>
        </div>

        {/* Right side - Management dropdown and user info */}
        <div className="flex items-center space-x-4">
          {isManager() && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowManagementMenu(!showManagementMenu)}
                className="text-muted-foreground hover:text-primary font-medium transition-colors duration-200 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary/50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {t('management')}
                <svg className={`w-4 h-4 transition-transform ${showManagementMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showManagementMenu && (
                 <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-border py-2 z-50">
                   <Link 
                     href="/management" 
                     className="flex items-center gap-3 px-4 py-2 text-muted-foreground hover:bg-secondary/50 hover:text-primary transition-colors"
                     onClick={() => setShowManagementMenu(false)}
                   >
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                     </svg>
                     {t('productsCategories')}
                   </Link>
                   <div className="border-t border-border my-1"></div>
                   <Link 
                     href="/settings" 
                     className="flex items-center gap-3 px-4 py-2 text-muted-foreground hover:bg-secondary/50 hover:text-primary transition-colors"
                     onClick={() => setShowManagementMenu(false)}
                   >
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                     </svg>
                     {t('settings')}
                   </Link>
                 </div>
               )}
            </div>
          )}

          {/* Clock In/Out for any authenticated employee */}

          {/* User Info and Logout */}
          {isAuthenticated() && (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-foreground">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user?.role} • {user?.position}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="text-muted-foreground hover:text-destructive transition-colors duration-200 flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/50"
                title={t('signOut')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </nav>
    );
}

export default Navbar