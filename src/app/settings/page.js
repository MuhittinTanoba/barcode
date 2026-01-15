'use client';
import React from 'react';
import SettingsPage from '../components/Settings/SettingsPage';
import ProtectedRoute from '../components/ProtectedRoute';

export default function Page() {
    return (
        <ProtectedRoute allowedRoles={['admin', 'manager', 'superadmin']}>
            <SettingsPage />
        </ProtectedRoute>
    );
}
