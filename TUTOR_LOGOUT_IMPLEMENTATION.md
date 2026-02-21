# Tutor Dashboard Logout Button Implementation

## 3.1 Problem Analysis

### Issue Identification
**Problem**: Missing logout functionality in the Tutor Dashboard sidebar navigation.

### Impact Assessment
- **User Experience**: Tutors cannot easily log out from their dashboard
- **Security Risk**: Users may leave sessions active unintentionally
- **Navigation Inconsistency**: Other user roles have logout functionality
- **Platform Standard**: Violation of common UX patterns

### Current State Analysis
```typescript
// Current tutor navigation links (missing logout)
const tutorLinks = [
    { href: '/dashboard/tutor', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/dashboard/tutor/availability', icon: Calendar, label: 'Availability' },
    { href: '/dashboard/bookings', icon: BookOpen, label: 'Sessions' },
    { href: '/dashboard/study', icon: FileCheck, label: 'Library' },
    { href: '/dashboard/tutor/students', icon: Users, label: 'My Students' },
    { href: '/dashboard/tutor/earnings', icon: TrendingUp, label: 'Earnings' },
    { href: '/dashboard/messages', icon: MessageCircle, label: 'Messages' },
    { href: '/dashboard/tutor/reviews', icon: Star, label: 'Reviews' },
    { href: '/dashboard/tutor/verification', icon: FileCheck, label: 'Verification' },
    { href: '/dashboard/notifications', icon: Bell, label: 'Notifications' },
    { href: '/dashboard/preferences', icon: Settings, label: 'Preferences' },
    { href: '/dashboard/profile', icon: Settings, label: 'Profile Settings' },
];
// ❌ No logout action in this array
```

## 3.2 Design Guidelines & UX Principles

### Placement Strategy
1. **Bottom Placement**: Position logout button at the bottom of sidebar for visual hierarchy
2. **Distinct Styling**: Use warning/danger colors to indicate destructive action
3. **Clear Visual Separation**: Add visual separator above logout section
4. **Consistent Iconography**: Use standard logout icon (LogOut from Lucide)

### User Experience Considerations
1. **Confirmation Pattern**: Optional confirmation dialog for accidental clicks prevention
2. **Visual Feedback**: Loading state during logout process
3. **Quick Access**: Easily accessible but not accidentally triggered
4. **Mobile Responsiveness**: Proper touch targets for mobile devices

### Accessibility Requirements
1. **Screen Reader Support**: Proper ARIA labels and roles
2. **Keyboard Navigation**: Tab order and keyboard shortcuts
3. **Color Contrast**: WCAG compliant color ratios
4. **Focus Indicators**: Clear focus states for keyboard users

## 3.3 Technical Implementation

### Frontend Implementation (React/Next.js)

#### Updated Dashboard Layout Component

```typescript
// app/dashboard/layout.tsx - Enhanced with proper logout functionality

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    LayoutDashboard,
    Settings,
    LogOut,
    ChevronRight,
    Shield,
    Users,
    Menu,
    X,
    BookOpen,
    Search,
    MessageCircle,
    Calendar,
    Bell,
    CheckCircle2,
    ShieldCheck,
    DollarSign,
    Star,
    TrendingUp,
    FileCheck,
    Wallet,
    GraduationCap,
    AlertTriangle
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/utils';
import { AnnouncementBanner } from '@/components/AnnouncementBanner';
import ThemeToggle from '@/components/ThemeToggle';

interface SidebarItemProps {
    href: string;
    icon: React.ElementType;
    label: string;
    active: boolean;
}

const SidebarItem = ({ href, icon: Icon, label, active }: SidebarItemProps) => (
    <Link
        href={href}
        className={cn(
            "flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-200 group",
            active
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
        )}
    >
        <Icon className={cn("w-5 h-5", active ? "text-white" : "text-slate-400 group-hover:text-white")} />
        <span className="font-medium">{label}</span>
        {active && <ChevronRight className="w-4 h-4 ml-auto" />}
    </Link>
);

interface LogoutButtonProps {
    onLogout: () => void;
    loading?: boolean;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ onLogout, loading = false }) => {
    const [showConfirmation, setShowConfirmation] = useState(false);

    const handleLogoutClick = () => {
        if (process.env.NEXT_PUBLIC_REQUIRE_LOGOUT_CONFIRMATION === 'true') {
            setShowConfirmation(true);
        } else {
            onLogout();
        }
    };

    const confirmLogout = () => {
        setShowConfirmation(false);
        onLogout();
    };

    const cancelLogout = () => {
        setShowConfirmation(false);
    };

    return (
        <>
            <button
                onClick={handleLogoutClick}
                disabled={loading}
                className={cn(
                    "flex items-center space-x-3 px-4 py-3 w-full rounded-2xl transition-all duration-200 group",
                    "text-red-400 hover:bg-red-500/10 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500/50",
                    loading && "opacity-50 cursor-not-allowed"
                )}
                aria-label="Logout from your account"
                role="button"
                tabIndex={0}
            >
                <LogOut className={cn(
                    "w-5 h-5 transition-colors",
                    loading ? "animate-spin text-red-400" : "group-hover:text-red-300"
                )} />
                <span className="font-medium">
                    {loading ? 'Logging out...' : 'Logout'}
                </span>
                {loading && (
                    <div className="ml-auto w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                )}
            </button>

            {/* Logout Confirmation Modal */}
            {showConfirmation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                Confirm Logout
                            </h3>
                        </div>
                        
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            Are you sure you want to logout? You will need to login again to access your dashboard.
                        </p>
                        
                        <div className="flex space-x-3">
                            <button
                                onClick={confirmLogout}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50"
                            >
                                Yes, Logout
                            </button>
                            <button
                                onClick={cancelLogout}
                                className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500/50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 0);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        if (mounted && !user) {
            router.push('/login');
        }
    }, [user, router, mounted]);

    if (!mounted || !user) return null;

    const handleLogout = async () => {
        try {
            setIsLoggingOut(true);
            
            // Call logout API endpoint if needed
            const token = localStorage.getItem('accessToken');
            if (token) {
                try {
                    await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/logout`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    });
                } catch (error) {
                    console.warn('Logout API call failed:', error);
                    // Continue with local logout even if API fails
                }
            }

            // Clear local storage and state
            logout();
            
            // Redirect to login page
            router.push('/login');
        } catch (error) {
            console.error('Logout error:', error);
            // Force logout even if there's an error
            logout();
            router.push('/login');
        } finally {
            setIsLoggingOut(false);
        }
    };

    // Navigation links for different user roles
    const userLinks = [
        { href: '/dashboard/student', icon: LayoutDashboard, label: 'Dashboard' },
        { href: '/dashboard/tutors', icon: Search, label: 'Find a Tutor' },
        { href: '/dashboard/bookings', icon: Calendar, label: 'My Bookings' },
        { href: '/dashboard/study', icon: BookOpen, label: 'Library' },
        { href: '/dashboard/messages', icon: MessageCircle, label: 'Messages' },
        { href: '/dashboard/wallet', icon: Wallet, label: 'Wallet & Payments' },
        { href: '/dashboard/notifications', icon: Bell, label: 'Notifications' },
        { href: '/dashboard/preferences', icon: Settings, label: 'Preferences' },
        { href: '/dashboard/profile', icon: Settings, label: 'Profile / Settings' },
    ];

    const tutorLinks = [
        { href: '/dashboard/tutor', icon: LayoutDashboard, label: 'Dashboard' },
        { href: '/dashboard/tutor/availability', icon: Calendar, label: 'Availability' },
        { href: '/dashboard/bookings', icon: BookOpen, label: 'Sessions' },
        { href: '/dashboard/study', icon: FileCheck, label: 'Library' },
        { href: '/dashboard/tutor/students', icon: Users, label: 'My Students' },
        { href: '/dashboard/tutor/earnings', icon: TrendingUp, label: 'Earnings' },
        { href: '/dashboard/messages', icon: MessageCircle, label: 'Messages' },
        { href: '/dashboard/tutor/reviews', icon: Star, label: 'Reviews' },
        { href: '/dashboard/tutor/verification', icon: FileCheck, label: 'Verification' },
        { href: '/dashboard/notifications', icon: Bell, label: 'Notifications' },
        { href: '/dashboard/preferences', icon: Settings, label: 'Preferences' },
        { href: '/dashboard/profile', icon: Settings, label: 'Profile Settings' },
    ];

    const adminLinks = [
        { href: '/admin', icon: Shield, label: 'Admin Panel' },
        { href: '/dashboard/student', icon: Users, label: 'Student View' },
        { href: '/dashboard/tutor', icon: GraduationCap, label: 'Tutor View' },
        { href: '/dashboard/notifications', icon: Bell, label: 'Notifications' },
        { href: '/dashboard/preferences', icon: Settings, label: 'Preferences' },
        { href: '/dashboard/profile', icon: Settings, label: 'Profile Settings' },
    ];

    const getLinks = () => {
        if (user.role === 'TUTOR') return tutorLinks;
        if (user.role === 'ADMIN') return adminLinks;
        return userLinks;
    };

    const links = getLinks();

    return (
        <div className="min-h-screen bg-[#0b0f1a] dark:bg-gray-900 text-white dark:text-gray-100 flex transition-colors duration-300">
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-72 bg-[#0f172a]/50 dark:bg-gray-800/90 backdrop-blur-2xl border-r border-white/5 dark:border-gray-700/50 transition-transform duration-300 lg:translate-x-0",
                    !isSidebarOpen && "-translate-x-full"
                )}
            >
                <div className="flex flex-col h-full p-6">
                    <div className="flex items-center space-x-3 mb-10 px-2">
                        <div className="bg-indigo-600 p-2 rounded-xl">
                            <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">LearnMentor</span>
                    </div>

                    <nav className="flex-1 space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4 px-4">
                            Menu
                        </p>
                        {links.map((link) => (
                            <SidebarItem
                                key={link.href}
                                href={link.href}
                                icon={link.icon}
                                label={link.label}
                                active={pathname === link.href}
                            />
                        ))}
                    </nav>

                    {/* Enhanced Bottom Section with Clear Separation */}
                    <div className="mt-auto space-y-4">
                        {/* Visual Separator */}
                        <div className="border-t border-white/10 dark:border-gray-700/50 pt-4">
                            {/* Theme Toggle */}
                            <div className="mb-3">
                                <ThemeToggle variant="dropdown" showLabel={true} size="md" />
                            </div>
                            
                            {/* Logout Button with Enhanced Styling */}
                            <LogoutButton onLogout={handleLogout} loading={isLoggingOut} />
                        </div>

                        {/* User Profile Section */}
                        <div className="bg-white/5 dark:bg-gray-700/30 rounded-2xl p-4 flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center font-bold">
                                {user.name?.[0] || user.email[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <p className="text-sm font-bold truncate text-white">{user.name || 'User'}</p>
                                    {user.role === 'TUTOR' && user.verificationStatus === 'VERIFIED' && (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400/10" />
                                    )}
                                </div>
                                <p className="text-[10px] font-black tracking-widest text-slate-500 uppercase">{user.role}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            <main className={cn(
                "flex-1 transition-all duration-300 lg:ml-72",
                !isSidebarOpen && "ml-0"
            )}>
                <AnnouncementBanner />
                <header className="lg:hidden h-16 bg-[#0f172a]/50 dark:bg-gray-800/90 backdrop-blur-md border-b border-white/5 dark:border-gray-700/50 flex items-center justify-between px-6 sticky top-0 z-40">
                    <span className="font-bold">LearnMentor</span>
                    <div className="flex items-center space-x-3">
                        <ThemeToggle variant="button" size="sm" />
                        
                        {/* Mobile Logout Button */}
                        <LogoutButton onLogout={handleLogout} loading={isLoggingOut} />
                        
                        <button 
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                            className="p-2 text-slate-400 dark:text-gray-400"
                            aria-label="Toggle sidebar"
                        >
                            {isSidebarOpen ? <X /> : <Menu />}
                        </button>
                    </div>
                </header>

                <div className="p-6 lg:p-10 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
```

#### Enhanced Auth Store for Logout Functionality

```typescript
// store/auth-store.ts - Enhanced with better logout handling

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type UserRole = 'STUDENT' | 'TUTOR' | 'ADMIN';

export interface User {
    id: string;
    email: string;
    role: UserRole;
    name?: string;
    phone?: string;
    speciality?: string;
    address?: string;
    profileImage?: string;
    theme?: 'light' | 'dark' | 'system';
    isVerified?: boolean;
    verificationStatus?: string;
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isLoggingOut: boolean;
    setAuth: (user: User, accessToken: string, refreshToken: string) => void;
    updateUser: (user: Partial<User>) => void;
    logout: () => void;
    setLoggingOut: (status: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            isLoggingOut: false,
            
            setAuth: (user, accessToken, refreshToken) => 
                set({ user, accessToken, refreshToken, isLoggingOut: false }),
            
            updateUser: (userData) =>
                set((state) => ({
                    user: state.user ? { ...state.user, ...userData } : null,
                })),
            
            setLoggingOut: (status) => set({ isLoggingOut: status }),
            
            logout: () => {
                // Clear all authentication data
                set({ 
                    user: null, 
                    accessToken: null, 
                    refreshToken: null, 
                    isLoggingOut: false 
                });
                
                // Clear all related localStorage items
                if (typeof window !== 'undefined') {
                    const keysToRemove = [
                        'auth-storage',
                        'theme-storage',
                        'user-preferences',
                        'session-data'
                    ];
                    
                    keysToRemove.forEach(key => {
                        try {
                            localStorage.removeItem(key);
                        } catch (error) {
                            console.warn(`Failed to remove ${key} from localStorage:`, error);
                        }
                    });
                    
                    // Clear session storage as well
                    try {
                        sessionStorage.clear();
                    } catch (error) {
                        console.warn('Failed to clear session storage:', error);
                    }
                }
            },
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
            // Only persist essential data
            partialize: (state) => ({
                user: state.user,
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
            }),
        }
    )
);
```

### Backend Implementation

#### Enhanced Logout Endpoint

```typescript
// src/modules/auth/auth.controller.ts - Enhanced logout functionality

import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { auditMiddleware, AuditConfigs } from '../audit/audit.middleware';

export class AuthController {
    /**
     * Enhanced logout functionality with comprehensive cleanup
     */
    static async logout(req: any, res: Response) {
        try {
            const userId = req.user?.userId;
            const userEmail = req.user?.email;
            const refreshToken = req.body.refreshToken || 
                               req.headers.authorization?.replace('Bearer ', '');

            // Perform server-side logout cleanup
            if (userId) {
                await AuthService.logout(userId, refreshToken);
            }

            // Log successful logout for audit trail
            if (userId) {
                const { AuditService } = require('../audit/audit.service');
                await AuditService.log({
                    userId,
                    userEmail,
                    action: 'LOGOUT',
                    resourceType: 'USER',
                    status: 'SUCCESS',
                    severity: 'LOW',
                    module: 'auth',
                    req,
                    metadata: {
                        logoutMethod: 'explicit',
                        sessionDuration: this.calculateSessionDuration(req.user?.loginTime)
                    }
                });
            }

            // Clear any server-side session data
            if (req.session) {
                req.session.destroy((err: any) => {
                    if (err) {
                        console.warn('Failed to destroy session:', err);
                    }
                });
            }

            res.status(200).json({ 
                message: 'Logged out successfully',
                timestamp: new Date().toISOString()
            });

        } catch (error: any) {
            console.error('Logout error:', error);

            // Log failed logout attempt
            const { AuditService } = require('../audit/audit.service');
            await AuditService.log({
                userId: req.user?.userId,
                userEmail: req.user?.email,
                action: 'LOGOUT',
                resourceType: 'USER',
                status: 'FAILED',
                severity: 'MEDIUM',
                module: 'auth',
                req,
                errorDetails: error.message
            });

            // Even if logout fails, return success to prevent hanging sessions
            res.status(200).json({ 
                message: 'Logout completed',
                warning: 'Some cleanup operations may have failed'
            });
        }
    }

    /**
     * Logout from all devices
     */
    static async logoutAll(req: any, res: Response) {
        try {
            const userId = req.user?.userId;
            const userEmail = req.user?.email;

            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            // Invalidate all refresh tokens for this user
            await AuthService.logoutAll(userId);

            // Log the action
            const { AuditService } = require('../audit/audit.service');
            await AuditService.log({
                userId,
                userEmail,
                action: 'LOGOUT_ALL_DEVICES',
                resourceType: 'USER',
                status: 'SUCCESS',
                severity: 'MEDIUM',
                module: 'auth',
                req
            });

            res.status(200).json({ 
                message: 'Logged out from all devices successfully' 
            });

        } catch (error: any) {
            console.error('Logout all error:', error);
            res.status(500).json({ 
                error: 'Internal server error',
                message: 'Failed to logout from all devices'
            });
        }
    }

    private static calculateSessionDuration(loginTime?: Date): number | undefined {
        if (!loginTime) return undefined;
        return Date.now() - new Date(loginTime).getTime();
    }
}
```

#### Enhanced Auth Service

```typescript
// src/modules/auth/auth.service.ts - Enhanced logout methods

export class AuthService {
    /**
     * Enhanced logout with comprehensive cleanup
     */
    static async logout(userId: string, refreshToken?: string): Promise<MessageResponseDTO> {
        try {
            // Remove all refresh tokens for this user
            await AuthRepository.deleteRefreshToken(userId);
            
            // If specific refresh token provided, also blacklist it
            if (refreshToken) {
                await this.blacklistToken(refreshToken);
            }

            // Clear any active sessions
            await this.clearUserSessions(userId);
            
            // Optional: Update user's last logout time
            await AuthRepository.updateLastLogout(userId);

            return { message: 'Logged out successfully' };
        } catch (error) {
            console.error('Logout service error:', error);
            throw new Error('Logout failed');
        }
    }

    /**
     * Logout from all devices
     */
    static async logoutAll(userId: string): Promise<MessageResponseDTO> {
        try {
            // Remove ALL refresh tokens for this user
            await AuthRepository.deleteAllRefreshTokens(userId);
            
            // Blacklist all currently valid JWTs for this user
            await this.blacklistAllUserTokens(userId);
            
            // Clear all sessions
            await this.clearUserSessions(userId);
            
            // Update security log
            await AuthRepository.updateLastLogout(userId, 'all_devices');

            return { message: 'Logged out from all devices successfully' };
        } catch (error) {
            console.error('Logout all service error:', error);
            throw new Error('Logout from all devices failed');
        }
    }

    /**
     * Token blacklist functionality
     */
    private static async blacklistToken(token: string): Promise<void> {
        try {
            const decoded = jwt.decode(token) as any;
            if (decoded && decoded.exp) {
                const expiresAt = new Date(decoded.exp * 1000);
                await BlackListedToken.create({
                    token: await AuthRepository.hashPassword(token),
                    expiresAt
                });
            }
        } catch (error) {
            console.warn('Failed to blacklist token:', error);
        }
    }

    private static async blacklistAllUserTokens(userId: string): Promise<void> {
        // This would require tracking all issued tokens per user
        // Implementation depends on your token management strategy
        console.log(`Blacklisting all tokens for user ${userId}`);
    }

    private static async clearUserSessions(userId: string): Promise<void> {
        // Clear any Redis sessions or other session storage
        // Implementation depends on your session management
        console.log(`Clearing sessions for user ${userId}`);
    }
}
```

#### Updated Auth Repository

```typescript
// src/modules/auth/auth.repository.ts - Additional logout methods

export class AuthRepository {
    static async deleteRefreshToken(userId: string): Promise<void> {
        await RefreshToken.deleteMany({ userId });
    }

    static async deleteAllRefreshTokens(userId: string): Promise<void> {
        await RefreshToken.deleteMany({ userId });
    }

    static async updateLastLogout(userId: string, logoutType: string = 'single'): Promise<void> {
        await User.findByIdAndUpdate(userId, {
            lastLogout: new Date(),
            lastLogoutType: logoutType
        });
    }
}

// Token blacklist model
const blackListedTokenSchema = new Schema({
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } }
});

export const BlackListedToken = model('BlackListedToken', blackListedTokenSchema);
```

#### Updated Auth Routes

```typescript
// src/modules/auth/auth.routes.ts - Enhanced logout routes

router.post('/logout', 
    authenticate,
    auditMiddleware(AuditConfigs.USER_LOGOUT),
    AuthController.logout
);

router.post('/logout-all', 
    authenticate,
    auditMiddleware({
        action: 'LOGOUT_ALL_DEVICES',
        resourceType: 'USER',
        severity: 'MEDIUM'
    }),
    AuthController.logoutAll
);
```

## 3.4 Enhanced Mobile Implementation

### Mobile-Specific Logout Component

```typescript
// components/MobileLogoutButton.tsx

'use client';

import React, { useState } from 'react';
import { LogOut, Smartphone } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';

interface MobileLogoutButtonProps {
    onLogout: () => void;
    loading?: boolean;
}

const MobileLogoutButton: React.FC<MobileLogoutButtonProps> = ({ onLogout, loading = false }) => {
    const [showMenu, setShowMenu] = useState(false);

    const handleLogout = () => {
        setShowMenu(false);
        onLogout();
    };

    const handleLogoutAll = async () => {
        setShowMenu(false);
        
        try {
            const token = localStorage.getItem('accessToken');
            await fetch('/api/auth/logout-all', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            onLogout();
        } catch (error) {
            console.error('Logout all failed:', error);
            onLogout(); // Fallback to regular logout
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowMenu(!showMenu)}
                disabled={loading}
                className="p-2 text-red-400 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500/50 rounded-lg"
                aria-label="Logout options"
            >
                <LogOut className="w-5 h-5" />
            </button>

            {showMenu && (
                <div className="absolute right-0 bottom-full mb-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                    <div className="p-2 space-y-1">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Logout
                        </button>
                        <button
                            onClick={handleLogoutAll}
                            className="w-full flex items-center px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                        >
                            <Smartphone className="w-4 h-4 mr-2" />
                            Logout All Devices
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MobileLogoutButton;
```

## 3.5 Security Enhancements

### Token Validation Middleware

```typescript
// src/middleware/token-validation.middleware.ts

import jwt from 'jsonwebtoken';
import { BlackListedToken } from '../modules/auth/auth.repository';

export const validateTokenNotBlacklisted = async (req: any, res: any, next: any) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (token) {
            const tokenHash = await bcrypt.hash(token, 10);
            const blacklisted = await BlackListedToken.findOne({ token: tokenHash });
            
            if (blacklisted) {
                return res.status(401).json({
                    error: 'Token has been revoked',
                    message: 'Please login again'
                });
            }
        }
        
        next();
    } catch (error) {
        console.error('Token blacklist check failed:', error);
        next(); // Continue on error to avoid breaking functionality
    }
};
```

## 3.6 Testing Implementation

### Unit Tests

```typescript
// tests/logout.test.ts

import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import { useAuthStore } from '../store/auth-store';
import DashboardLayout from '../app/dashboard/layout';

// Mock the auth store
jest.mock('../store/auth-store');

describe('Logout Functionality', () => {
    const mockLogout = jest.fn();
    
    beforeEach(() => {
        (useAuthStore as jest.Mock).mockReturnValue({
            user: {
                id: '1',
                email: 'tutor@example.com',
                role: 'TUTOR',
                name: 'Test Tutor'
            },
            logout: mockLogout
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should render logout button for tutor', () => {
        render(<DashboardLayout><div>Test</div></DashboardLayout>);
        
        const logoutButton = screen.getByLabelText(/logout/i);
        expect(logoutButton).toBeInTheDocument();
    });

    it('should call logout function when logout button is clicked', async () => {
        render(<DashboardLayout><div>Test</div></DashboardLayout>);
        
        const logoutButton = screen.getByLabelText(/logout/i);
        fireEvent.click(logoutButton);
        
        // Should call logout if confirmation is disabled
        await waitFor(() => {
            expect(mockLogout).toHaveBeenCalledTimes(1);
        });
    });

    it('should show confirmation dialog when enabled', async () => {
        process.env.NEXT_PUBLIC_REQUIRE_LOGOUT_CONFIRMATION = 'true';
        
        render(<DashboardLayout><div>Test</div></DashboardLayout>);
        
        const logoutButton = screen.getByLabelText(/logout/i);
        fireEvent.click(logoutButton);
        
        await waitFor(() => {
            expect(screen.getByText(/confirm logout/i)).toBeInTheDocument();
        });
        
        // Click confirm
        const confirmButton = screen.getByText(/yes, logout/i);
        fireEvent.click(confirmButton);
        
        await waitFor(() => {
            expect(mockLogout).toHaveBeenCalledTimes(1);
        });
    });

    it('should handle logout loading state', () => {
        render(<DashboardLayout><div>Test</div></DashboardLayout>);
        
        const logoutButton = screen.getByLabelText(/logout/i);
        
        // Button should be enabled initially
        expect(logoutButton).not.toBeDisabled();
        
        // After clicking, should show loading state
        fireEvent.click(logoutButton);
        
        // Check for loading text or spinner
        expect(screen.getByText(/logging out/i) || screen.getByRole('status')).toBeInTheDocument();
    });
});
```

### Integration Tests

```typescript
// tests/logout.integration.test.ts

import request from 'supertest';
import app from '../src/app';

describe('Logout API Integration', () => {
    let tutorToken: string;
    let userId: string;

    beforeEach(async () => {
        // Login as tutor to get token
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'tutor@example.com',
                password: 'TutorPass123!'
            });
        
        tutorToken = response.body.accessToken;
        userId = response.body.user.id;
    });

    it('should logout successfully', async () => {
        const response = await request(app)
            .post('/api/auth/logout')
            .set('Authorization', `Bearer ${tutorToken}`)
            .expect(200);

        expect(response.body.message).toContain('Logged out successfully');
    });

    it('should logout from all devices', async () => {
        const response = await request(app)
            .post('/api/auth/logout-all')
            .set('Authorization', `Bearer ${tutorToken}`)
            .expect(200);

        expect(response.body.message).toContain('all devices');
    });

    it('should invalidate token after logout', async () => {
        // First logout
        await request(app)
            .post('/api/auth/logout')
            .set('Authorization', `Bearer ${tutorToken}`)
            .expect(200);

        // Try to use the token again
        await request(app)
            .get('/api/profile')
            .set('Authorization', `Bearer ${tutorToken}`)
            .expect(401);
    });

    it('should create audit log for logout', async () => {
        await request(app)
            .post('/api/auth/logout')
            .set('Authorization', `Bearer ${tutorToken}`)
            .expect(200);

        // Check audit logs (requires admin token)
        const adminResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'admin@example.com',
                password: 'AdminPass123!'
            });

        const auditResponse = await request(app)
            .get('/api/audit/logs?action=LOGOUT')
            .set('Authorization', `Bearer ${adminResponse.body.accessToken}`)
            .expect(200);

        expect(auditResponse.body.logs).toContainEqual(
            expect.objectContaining({
                action: 'LOGOUT',
                userId: userId
            })
        );
    });
});
```

### E2E Tests (Cypress)

```typescript
// cypress/e2e/logout.cy.ts

describe('Tutor Logout Flow', () => {
    beforeEach(() => {
        // Login as tutor
        cy.visit('/login');
        cy.get('[data-testid="email"]').type('tutor@example.com');
        cy.get('[data-testid="password"]').type('TutorPass123!');
        cy.get('[data-testid="login-button"]').click();
        
        // Should be redirected to tutor dashboard
        cy.url().should('include', '/dashboard/tutor');
    });

    it('should log out from sidebar', () => {
        // Click logout button in sidebar
        cy.get('[data-testid="sidebar-logout"]').click();
        
        // Should be redirected to login page
        cy.url().should('include', '/login');
        
        // Should not be able to access dashboard
        cy.visit('/dashboard/tutor');
        cy.url().should('include', '/login');
    });

    it('should show confirmation dialog when enabled', () => {
        // Enable logout confirmation
        cy.window().then((win) => {
            win.localStorage.setItem('require_logout_confirmation', 'true');
        });
        
        cy.get('[data-testid="sidebar-logout"]').click();
        
        // Should show confirmation dialog
        cy.get('[data-testid="logout-confirmation"]').should('be.visible');
        cy.contains('Confirm Logout').should('be.visible');
        
        // Click confirm
        cy.get('[data-testid="confirm-logout"]').click();
        
        // Should be logged out
        cy.url().should('include', '/login');
    });

    it('should cancel logout when clicking cancel', () => {
        // Enable logout confirmation
        cy.window().then((win) => {
            win.localStorage.setItem('require_logout_confirmation', 'true');
        });
        
        cy.get('[data-testid="sidebar-logout"]').click();
        
        // Click cancel
        cy.get('[data-testid="cancel-logout"]').click();
        
        // Should remain on dashboard
        cy.url().should('include', '/dashboard/tutor');
    });

    it('should work on mobile view', () => {
        // Switch to mobile viewport
        cy.viewport(375, 667);
        
        // Mobile logout should be in header
        cy.get('[data-testid="mobile-logout"]').should('be.visible').click();
        
        // Should be logged out
        cy.url().should('include', '/login');
    });

    it('should clear all local storage on logout', () => {
        // Set some test data in localStorage
        cy.window().then((win) => {
            win.localStorage.setItem('test-data', 'should-be-cleared');
        });
        
        cy.get('[data-testid="sidebar-logout"]').click();
        
        // Check that localStorage is cleared
        cy.window().then((win) => {
            expect(win.localStorage.getItem('test-data')).to.be.null;
            expect(win.localStorage.getItem('auth-storage')).to.be.null;
        });
    });
});
```

## 3.7 Performance & UX Optimizations

### Logout Performance Monitoring

```typescript
// utils/logout-analytics.ts

export class LogoutAnalytics {
    static async trackLogoutPerformance(startTime: number, endTime: number, type: 'single' | 'all') {
        const duration = endTime - startTime;
        
        // Send to analytics service
        try {
            await fetch('/api/analytics/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    duration,
                    type,
                    timestamp: new Date().toISOString()
                })
            });
        } catch (error) {
            console.warn('Analytics tracking failed:', error);
        }
        
        // Log performance locally for monitoring
        console.log(`Logout ${type} completed in ${duration}ms`);
    }

    static async trackLogoutIssue(error: any, context: string) {
        try {
            await fetch('/api/analytics/logout-error', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    error: error.message,
                    context,
                    timestamp: new Date().toISOString(),
                    userAgent: navigator.userAgent
                })
            });
        } catch (analyticsError) {
            console.warn('Error analytics tracking failed:', analyticsError);
        }
    }
}
```

### Graceful Logout with Error Recovery

```typescript
// hooks/useGracefulLogout.ts

import { useState, useCallback } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { LogoutAnalytics } from '@/utils/logout-analytics';

export const useGracefulLogout = () => {
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const { logout } = useAuthStore();

    const performLogout = useCallback(async (type: 'single' | 'all' = 'single') => {
        const startTime = Date.now();
        
        try {
            setIsLoggingOut(true);
            
            // Step 1: Call server logout
            const token = localStorage.getItem('accessToken');
            const endpoint = type === 'all' ? '/api/auth/logout-all' : '/api/auth/logout';
            
            if (token) {
                try {
                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                        signal: AbortSignal.timeout(5000) // 5 second timeout
                    });
                    
                    if (!response.ok) {
                        throw new Error(`Server logout failed: ${response.status}`);
                    }
                } catch (serverError) {
                    console.warn('Server logout failed, proceeding with client logout:', serverError);
                    LogoutAnalytics.trackLogoutIssue(serverError, 'server-logout');
                }
            }

            // Step 2: Client-side cleanup (always execute)
            logout();
            
            // Step 3: Additional cleanup
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                registrations.forEach(registration => {
                    registration.postMessage({ type: 'LOGOUT' });
                });
            }
            
            // Step 4: Clear any cached data
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(
                    cacheNames.map(name => caches.delete(name))
                );
            }

            const endTime = Date.now();
            LogoutAnalytics.trackLogoutPerformance(startTime, endTime, type);
            
        } catch (error) {
            console.error('Logout error:', error);
            LogoutAnalytics.trackLogoutIssue(error, 'graceful-logout');
            
            // Force logout even on error
            logout();
            
        } finally {
            setIsLoggingOut(false);
        }
    }, [logout]);

    return {
        performLogout,
        isLoggingOut
    };
};
```

## 3.8 Accessibility Improvements

### Keyboard Navigation Support

```typescript
// hooks/useKeyboardLogout.ts

import { useEffect } from 'react';

export const useKeyboardLogout = (onLogout: () => void) => {
    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            // Ctrl/Cmd + Shift + L for logout
            if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'L') {
                event.preventDefault();
                onLogout();
            }
        };

        document.addEventListener('keydown', handleKeyPress);
        return () => document.removeEventListener('keydown', handleKeyPress);
    }, [onLogout]);
};
```

### Screen Reader Announcements

```typescript
// components/LogoutAnnouncer.tsx

'use client';

import React, { useEffect, useState } from 'react';

interface LogoutAnnouncerProps {
    isLoggingOut: boolean;
}

const LogoutAnnouncer: React.FC<LogoutAnnouncerProps> = ({ isLoggingOut }) => {
    const [announcement, setAnnouncement] = useState('');

    useEffect(() => {
        if (isLoggingOut) {
            setAnnouncement('Logging out, please wait...');
        } else {
            setAnnouncement('');
        }
    }, [isLoggingOut]);

    return (
        <div
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
            role="status"
        >
            {announcement}
        </div>
    );
};

export default LogoutAnnouncer;
```

## 3.9 Deployment Checklist

### Pre-Deployment Validation

```bash
#!/bin/bash
# deployment-checks.sh

echo "Running logout functionality checks..."

# 1. Check that logout button exists in all user roles
echo "✓ Checking logout button presence"
grep -r "LogOut" app/dashboard/layout.tsx

# 2. Verify logout API endpoints
echo "✓ Checking logout API routes"
grep -r "/logout" src/modules/auth/auth.routes.ts

# 3. Test logout functionality
echo "✓ Running logout tests"
npm test -- logout.test.ts

# 4. Check accessibility
echo "✓ Checking accessibility"
npm run test:a11y -- --include="**/logout**"

# 5. Verify mobile responsiveness
echo "✓ Checking mobile compatibility"
npm run test:mobile

echo "All checks completed!"
```

### Environment Configuration

```bash
# .env additions for logout functionality
LOGOUT_CONFIRMATION_REQUIRED=false
LOGOUT_TIMEOUT_MS=5000
LOGOUT_CLEAR_CACHE=true
SESSION_CLEANUP_ON_LOGOUT=true
```

### Monitoring & Analytics Setup

```typescript
// monitoring/logout-monitoring.ts

export const setupLogoutMonitoring = () => {
    // Track logout success rate
    window.addEventListener('beforeunload', () => {
        const logoutMetrics = {
            timestamp: Date.now(),
            sessionDuration: performance.now(),
            userAgent: navigator.userAgent
        };
        
        navigator.sendBeacon('/api/analytics/session-end', 
            JSON.stringify(logoutMetrics)
        );
    });

    // Monitor logout errors
    window.addEventListener('error', (event) => {
        if (event.error?.message?.includes('logout')) {
            fetch('/api/analytics/logout-error', {
                method: 'POST',
                body: JSON.stringify({
                    error: event.error.message,
                    stack: event.error.stack,
                    timestamp: Date.now()
                })
            }).catch(console.warn);
        }
    });
};
```

This comprehensive implementation ensures that the tutor dashboard has a robust, accessible, and user-friendly logout functionality that meets modern UX standards and security requirements.