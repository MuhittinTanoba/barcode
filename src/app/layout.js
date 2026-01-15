import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { OrderProvider } from './context/OrderContext';
import { CartProvider } from './context/CartContext';
import { OrderStatusProvider } from './context/OrderStatusContext';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';

import Navbar from './components/Navbar';
import appConfig from './config';
import Header from './components/Header';
import { KeyboardProvider } from './context/KeyboardContext';
import VirtualKeyboard from './components/VirtualKeyboard';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Boss POS - Restaurant Management System",
  description: "Professional Point of Sale system for restaurants",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <LanguageProvider>
            <KeyboardProvider>
              <OrderProvider>
                <CartProvider>
                  <OrderStatusProvider>
                    <div className="min-h-screen bg-background text-foreground">
                      <Header />
                      <main>
                        {children}
                      </main>
                      <VirtualKeyboard />
                    </div>
                  </OrderStatusProvider>
                </CartProvider>
              </OrderProvider>
            </KeyboardProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
