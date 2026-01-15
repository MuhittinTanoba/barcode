'use client'
import Management from '../components/Management/Management';
import ProtectedRoute from '../components/ProtectedRoute';

export default function ManagementPage() {
  return (
    <ProtectedRoute permission="management">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Management />
      </div>
    </ProtectedRoute>
  );
}
