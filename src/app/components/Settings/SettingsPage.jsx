'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPrint, FaWifi, FaServer, FaCheck, FaTimes, FaSpinner, FaGlobe } from 'react-icons/fa';

const SettingsPage = () => {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Status states
    const [isOnline, setIsOnline] = useState(true);
    const [printerStatus, setPrinterStatus] = useState({
        kitchen: { status: 'unknown', message: '' },
        cashier: { status: 'unknown', message: '' }
    });
    const [testingPrinter, setTestingPrinter] = useState(null);

    // Initial load
    useEffect(() => {
        fetchSettings();
        
        // Online/Offline listeners
        if (typeof window !== 'undefined') {
            setIsOnline(navigator.onLine);
            window.addEventListener('online', () => setIsOnline(true));
            window.addEventListener('offline', () => setIsOnline(false));
        }

        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('online', () => setIsOnline(true));
                window.removeEventListener('offline', () => setIsOnline(false));
            }
        };
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/settings');
            setSettings(response.data);
        } catch (err) {
            setError('Failed to load settings');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleTestPrint = async (type) => { // type: 'kitchen' or 'cashier'
        if (testingPrinter) return;

        try {
            setTestingPrinter(type);
            setPrinterStatus(prev => ({
                ...prev,
                [type]: { status: 'testing', message: 'Sending test print...' }
            }));

            // Use the test endpoint we saw earlier: /api/printer/test
            // The existing test endpoint might require specific body or just work. 
            // Looking at route.js in previous steps, it expects orderData but calls printer.testPrint(orderData).
            // Actually printer.testPrint() in printer.js doesn't seem to use arguments much or uses default config.
            // Let's try sending a dummy structure if needed, or just empty object.
            // Wait, looking at printer.js: testPrint() { ... } takes no args or ignores them? 
            // In route.js: const orderData = await request.json(); const printed = printer.testPrint(orderData);
            // In printer.js: async testPrint() { ... const config = printerConfig.cashier; ... }
            // It seems testPrint currently hardcodes 'cashier' config. 
            // We might need to update the backend to support testing specific printers, but for now let's try the existing one.
            // If the user wants to test BOTH, we might need to modify the backend.
            // BUT, the USER REQUEST asked for "settings tab... connected printers and status".
            // I'll assume for now I can hit a new endpoint or the same one.
            // Let's assume I should probably IMPROVE the backend to support testing specific printers.
            // For this iteration, I will use /api/printer/test but I might need to make it smarter.
            // Let's try to send { printerType: type } and see if I can update the backend to handle it, 
            // OR just use what's there. The existing testPrint only tests cashier. I should probably fix that.
            
            // Re-reading printer.js: testPrint() uses printerConfig.cashier. 
            // I should probably quick-fix the backend to allow specifying the printer.
            // I'll send a POST to /api/printer/test with { type }.
            
            const response = await axios.post('/api/printer/test', {
                type: type // sending this, hoping to update backend to use it
            });

            if (response.data.success) {
                setPrinterStatus(prev => ({
                    ...prev,
                    [type]: { status: 'success', message: 'Test print successful' }
                }));
            } else {
                throw new Error(response.data.message || 'Print failed');
            }
        } catch (err) {
            setPrinterStatus(prev => ({
                ...prev,
                [type]: { status: 'error', message: err.message || 'Connection failed' }
            }));
        } finally {
            setTestingPrinter(null);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );

    if (error) return (
        <div className="p-6 text-center text-destructive">
            <h3 className="text-xl font-bold">Error</h3>
            <p>{error}</p>
            <button onClick={fetchSettings} className="mt-4 btn btn-primary">Retry</button>
        </div>
    );

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Settings</h1>
                    <p className="text-muted-foreground">System configuration and status</p>
                </div>
            </div>

            {/* System Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Internet Status */}
                <div className="bg-white rounded-xl shadow-lg border border-border p-6 flex items-start justify-between">
                    <div>
                        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                            <FaGlobe /> Internet Connection
                        </h3>
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                            {isOnline ? <FaCheck className="mr-2" /> : <FaTimes className="mr-2" />}
                            {isOnline ? 'Online' : 'Offline'}
                        </div>
                    </div>
                    <div className={`p-3 rounded-full ${isOnline ? 'bg-green-100' : 'bg-red-100'}`}>
                        <FaWifi className={`text-xl ${isOnline ? 'text-green-600' : 'text-red-600'}`} />
                    </div>
                </div>

                {/* API Status */}
                <div className="bg-white rounded-xl shadow-lg border border-border p-6 flex items-start justify-between">
                    <div>
                        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                            <FaServer /> System API
                        </h3>
                        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                            <FaCheck className="mr-2" />
                            Active v{settings?.app?.version || '1.0'}
                        </div>
                    </div>
                    <div className="p-3 rounded-full bg-blue-100">
                        <FaServer className="text-xl text-blue-600" />
                    </div>
                </div>
            </div>

            {/* Printer Configuration */}
            <div className="bg-white rounded-xl shadow-lg border border-border overflow-hidden">
                <div className="p-6 border-b border-border">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <FaPrint /> Printer Configuration
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">Manage connected printers and verify connection</p>
                </div>
                
                <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Kitchen Printer */}
                    <div className="border border-border rounded-lg p-4 bg-muted/30">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-lg">Kitchen Printer</h3>
                                <p className="text-sm text-muted-foreground">{settings?.printers?.kitchen?.printerName}</p>
                            </div>
                            <div className={`px-2 py-1 rounded text-xs font-bold ${
                                printerStatus.kitchen.status === 'success' ? 'bg-green-100 text-green-700' :
                                printerStatus.kitchen.status === 'error' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-600'
                            }`}>
                                {printerStatus.kitchen.status.toUpperCase()}
                            </div>
                        </div>
                        
                        <div className="space-y-2 text-sm mb-4">
                            <div className="flex justify-between border-b border-border/50 pb-1">
                                <span className="text-muted-foreground">Type:</span>
                                <span className="font-medium">{settings?.printers?.kitchen?.type}</span>
                            </div>
                            <div className="flex justify-between border-b border-border/50 pb-1">
                                <span className="text-muted-foreground">Character Set:</span>
                                <span className="font-medium">{settings?.printers?.kitchen?.characterSet}</span>
                            </div>
                            <div className="flex justify-between border-b border-border/50 pb-1">
                                <span className="text-muted-foreground">Width:</span>
                                <span className="font-medium">{settings?.printers?.kitchen?.width} chars</span>
                            </div>
                        </div>

                        <button 
                            onClick={() => handleTestPrint('kitchen')}
                            disabled={testingPrinter}
                            className={`w-full py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                                testingPrinter === 'kitchen' 
                                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                            }`}
                        >
                            {testingPrinter === 'kitchen' ? <FaSpinner className="animate-spin" /> : <FaPrint />}
                            Test Print
                        </button>
                        {printerStatus.kitchen.message && (
                            <p className={`text-xs mt-2 text-center ${
                                printerStatus.kitchen.status === 'error' ? 'text-destructive' : 'text-green-600'
                            }`}>
                                {printerStatus.kitchen.message}
                            </p>
                        )}
                    </div>

                    {/* Cashier Printer */}
                    <div className="border border-border rounded-lg p-4 bg-muted/30">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-lg">Cashier Printer</h3>
                                <p className="text-sm text-muted-foreground">{settings?.printers?.cashier?.printerName}</p>
                            </div>
                            <div className={`px-2 py-1 rounded text-xs font-bold ${
                                printerStatus.cashier.status === 'success' ? 'bg-green-100 text-green-700' :
                                printerStatus.cashier.status === 'error' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-600'
                            }`}>
                                {printerStatus.cashier.status.toUpperCase()}
                            </div>
                        </div>
                        
                        <div className="space-y-2 text-sm mb-4">
                            <div className="flex justify-between border-b border-border/50 pb-1">
                                <span className="text-muted-foreground">Type:</span>
                                <span className="font-medium">{settings?.printers?.cashier?.type}</span>
                            </div>
                            <div className="flex justify-between border-b border-border/50 pb-1">
                                <span className="text-muted-foreground">Character Set:</span>
                                <span className="font-medium">{settings?.printers?.cashier?.characterSet}</span>
                            </div>
                            <div className="flex justify-between border-b border-border/50 pb-1">
                                <span className="text-muted-foreground">Width:</span>
                                <span className="font-medium">{settings?.printers?.cashier?.width} chars</span>
                            </div>
                        </div>

                        <button 
                            onClick={() => handleTestPrint('cashier')}
                            disabled={testingPrinter}
                            className={`w-full py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                                testingPrinter === 'cashier' 
                                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                            }`}
                        >
                            {testingPrinter === 'cashier' ? <FaSpinner className="animate-spin" /> : <FaPrint />}
                            Test Print
                        </button>
                         {printerStatus.cashier.message && (
                            <p className={`text-xs mt-2 text-center ${
                                printerStatus.cashier.status === 'error' ? 'text-destructive' : 'text-green-600'
                            }`}>
                                {printerStatus.cashier.message}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Other Configuration (Placeholder for now) */}
            <div className="bg-white rounded-xl shadow-lg border border-border p-6">
                <h2 className="text-xl font-bold mb-4">Application Config</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                   <div className="p-3 bg-secondary/10 rounded-lg">
                        <span className="block text-muted-foreground mb-1">API URL</span>
                        <code className="bg-black/10 px-2 py-1 rounded">{settings?.app?.apiUrl}</code>
                   </div>
                   <div className="p-3 bg-secondary/10 rounded-lg">
                        <span className="block text-muted-foreground mb-1">Application Title</span>
                        <span className="font-medium">{settings?.app?.title}</span>
                   </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
