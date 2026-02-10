import React, { useState } from 'react';
import {
    Mail, Lock, User as UserIcon, LogIn, ChevronRight,
    ArrowLeft, Send, CheckCircle2, RefreshCw, Eye, EyeOff, KeyRound, UserPlus
} from 'lucide-react';
import logo from '../assets/logo.jpg';
import { supabase } from '../supabase';
import { useApp } from '../context/AppContext';

type AuthMode = 'login' | 'register' | 'forgot';

const AuthScreen: React.FC = () => {
    const { showToast } = useApp();

    // UI State
    const [mode, setMode] = useState<AuthMode>('login');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showEmailSent, setShowEmailSent] = useState(false); // After successful registration

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);

    // Reset form when changing modes
    const switchMode = (newMode: AuthMode) => {
        setMode(newMode);
        setPassword('');
        setConfirmPassword('');
        setShowPassword(false);
        setShowConfirmPassword(false);
        setShowEmailSent(false); // Reset email sent state
    };

    // LOGIN
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !password.trim()) {
            return showToast("Email y contraseña requeridos", "error");
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });
            if (error) throw error;
            // Auth listener in AppContext handles the redirect
        } catch (error: any) {
            showToast(error.message || "Error al iniciar sesión", "error");
        } finally {
            setLoading(false);
        }
    };

    // REGISTER
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim() || !password.trim()) {
            return showToast("Email y contraseña requeridos", "error");
        }
        if (password.length < 6) {
            return showToast("La contraseña debe tener al menos 6 caracteres", "error");
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.signUp({
                email: email.trim(),
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth`,
                }
            });
            if (error) throw error;
            // Show email verification screen instead of redirecting
            setShowEmailSent(true);
        } catch (error: any) {
            console.error('Signup error:', error);
            showToast(error.message || "Error al registrarse", "error");
        } finally {
            setLoading(false);
        }
    };

    // FORGOT PASSWORD
    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) {
            return showToast("Introduce tu email", "error");
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
                redirectTo: `${window.location.origin}/auth`,
            });
            if (error) throw error;
            showToast("Se ha enviado un enlace a tu correo", "success");
            switchMode('login');
        } catch (error: any) {
            console.error('Reset password error:', error);
            showToast(error.message || "Error al enviar el enlace", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            padding: '1.5rem',
            justifyContent: 'center',
            maxWidth: '420px',
            margin: '0 auto'
        }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    margin: '0 auto 1rem',
                    boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
                    border: '1px solid var(--border-color)'
                }}>
                    <img
                        src={logo}
                        alt="CodiaTax Logo"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                </div>
                <h1 style={{
                    fontSize: '2rem',
                    fontWeight: '800',
                    letterSpacing: '-0.025em',
                    background: 'linear-gradient(135deg, var(--text-primary), var(--accent-primary))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '0.25rem'
                }}>
                    CodiaTax
                </h1>
                <p style={{ opacity: 0.5, fontSize: '0.9rem' }}>
                    {mode === 'login' ? 'Gestiona tu taxi con inteligencia' :
                        mode === 'register' ? 'Crea tu cuenta profesional' :
                            'Recupera tu acceso'}
                </p>
            </div>

            {/* Main Card */}
            <div className="card" style={{ padding: '1.5rem', borderRadius: '16px' }}>

                {showEmailSent ? (
                    // EMAIL VERIFICATION SENT VIEW
                    <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                        <div style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '24px',
                            overflow: 'hidden',
                            margin: '0 auto 1.5rem',
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                            border: '1px solid var(--border-color)',
                        }}>
                            <img
                                src={logo}
                                alt="CodiaTax Logo"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>
                        <h1 style={{
                            fontSize: '1.8rem',
                            fontWeight: '800',
                            letterSpacing: '-0.025em',
                            background: 'linear-gradient(135deg, var(--text-primary), var(--accent-primary))',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            marginBottom: '0.5rem'
                        }}>
                            CodiaTax
                        </h1>
                        <p style={{ opacity: 0.5, fontSize: '0.9rem' }}>
                            {mode === 'login' ? 'Gestiona tu taxi con inteligencia' :
                                mode === 'register' ? 'Crea tu cuenta profesional' :
                                    'Recupera tu acceso'}
                        </p>
                        <h2 style={{ fontSize: '1.3rem', marginBottom: '0.75rem' }}>
                            ¡Revisa tu correo!
                        </h2>
                        <p style={{ opacity: 0.7, fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                            Hemos enviado un enlace de verificación a:<br />
                            <strong style={{ color: 'var(--accent-primary)' }}>{email}</strong>
                        </p>
                        <div style={{
                            background: 'var(--bg-secondary)',
                            padding: '1rem',
                            borderRadius: '12px',
                            marginBottom: '1.5rem',
                            textAlign: 'left'
                        }}>
                            <p style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '8px' }}>
                                📧 1. Haz clic en el enlace del email.
                            </p>
                            <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                                🔄 2. Pulsa el botón de abajo para entrar.
                            </p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <button
                                onClick={async () => {
                                    setLoading(true);
                                    try {
                                        const { data, error } = await supabase.auth.refreshSession();
                                        console.log('Manual refresh result:', data, error);
                                        if (error) throw error;

                                        if (data.user?.confirmed_at || data.user?.email_confirmed_at) {
                                            showToast("¡Cuenta confirmada!", "success");
                                            // AppContext listener will handle the rest
                                        } else {
                                            showToast("Tu cuenta aún no está confirmada", "error");
                                        }
                                    } catch (err: any) {
                                        showToast(err.message, "error");
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                                className="btn btn-primary"
                                style={{ padding: '0.9rem', width: '100%' }}
                                disabled={loading}
                            >
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    {loading ? <RefreshCw size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                                    Ya he confirmado, entrar ahora
                                </span>
                            </button>

                            <button
                                onClick={async () => {
                                    setLoading(true);
                                    try {
                                        const { error } = await supabase.auth.resend({
                                            type: 'signup',
                                            email: email,
                                            options: {
                                                emailRedirectTo: `${window.location.origin}/auth`,
                                            }
                                        });
                                        if (error) throw error;
                                        showToast("Email de confirmación reenviado", "success");
                                    } catch (err: any) {
                                        showToast(err.message, "error");
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                                className="btn-ghost"
                                style={{ padding: '0.7rem', width: '100%', fontSize: '0.85rem' }}
                                disabled={loading}
                            >
                                No recibí nada, reenviar email
                            </button>
                        </div>

                        <p style={{ marginTop: '1.5rem', fontSize: '0.8rem' }}>
                            <button onClick={() => switchMode('login')} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', textDecoration: 'underline' }}>
                                Volver al inicio de sesión
                            </button>
                        </p>
                    </div>
                ) : mode === 'forgot' ? (
                    // FORGOT PASSWORD VIEW
                    <>
                        <button
                            onClick={() => switchMode('login')}
                            className="btn-ghost"
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1rem', padding: '8px 0' }}
                        >
                            <ArrowLeft size={18} /> Volver
                        </button>

                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <KeyRound size={48} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
                            <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>¿Olvidaste tu contraseña?</h2>
                            <p style={{ opacity: 0.6, fontSize: '0.85rem' }}>
                                Introduce tu email y te enviaremos un enlace para restablecerla.
                            </p>
                        </div>

                        <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '500' }}>Email</label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={18} style={{ position: 'absolute', left: '12px', top: '12px', opacity: 0.4 }} />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="input"
                                        placeholder="tu@email.com"
                                        style={{ paddingLeft: '40px' }}
                                        autoComplete="email"
                                        required
                                    />
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary" style={{ padding: '0.9rem' }} disabled={loading}>
                                {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                            </button>
                        </form>
                    </>
                ) : (
                    // LOGIN / REGISTER VIEW
                    <>
                        {/* Mode Toggle */}
                        <div style={{
                            display: 'flex',
                            marginBottom: '1.5rem',
                            background: 'var(--bg-secondary)',
                            borderRadius: '10px',
                            padding: '4px'
                        }}>
                            <button
                                onClick={() => switchMode('login')}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: mode === 'login' ? 'var(--bg-primary)' : 'transparent',
                                    color: mode === 'login' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    fontWeight: mode === 'login' ? '600' : '400',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: mode === 'login' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
                                }}
                            >
                                Iniciar Sesión
                            </button>
                            <button
                                onClick={() => switchMode('register')}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: mode === 'register' ? 'var(--bg-primary)' : 'transparent',
                                    color: mode === 'register' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    fontWeight: mode === 'register' ? '600' : '400',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: mode === 'register' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
                                }}
                            >
                                Registrarse
                            </button>
                        </div>

                        <form onSubmit={mode === 'login' ? handleLogin : handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {/* Email */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '500' }}>Email</label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={18} style={{ position: 'absolute', left: '12px', top: '12px', opacity: 0.4 }} />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="input"
                                        placeholder="tu@email.com"
                                        style={{ paddingLeft: '40px' }}
                                        autoComplete="email"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '500' }}>Contraseña</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', opacity: 0.4 }} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="input"
                                        placeholder="••••••••"
                                        style={{ paddingLeft: '40px', paddingRight: '40px' }}
                                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute',
                                            right: '8px',
                                            top: '8px',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: '4px',
                                            opacity: 0.5
                                        }}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password (Register only) */}
                            {mode === 'register' && (
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '500' }}>Confirmar Contraseña</label>
                                    <div style={{ position: 'relative' }}>
                                        <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', opacity: 0.4 }} />
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                            className="input"
                                            placeholder="••••••••"
                                            style={{ paddingLeft: '40px', paddingRight: '40px' }}
                                            autoComplete="new-password"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            style={{
                                                position: 'absolute',
                                                right: '8px',
                                                top: '8px',
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                padding: '4px',
                                                opacity: 0.5
                                            }}
                                        >
                                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    {password && confirmPassword && password !== confirmPassword && (
                                        <p style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '4px' }}>
                                            Las contraseñas no coinciden
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Remember Me & Forgot Password (Login only) */}
                            {mode === 'login' && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={rememberMe}
                                            onChange={e => setRememberMe(e.target.checked)}
                                            style={{ width: '16px', height: '16px' }}
                                        />
                                        Recordarme
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => switchMode('forgot')}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: 'var(--accent-primary)',
                                            cursor: 'pointer',
                                            fontSize: '0.85rem',
                                            padding: 0
                                        }}
                                    >
                                        ¿Olvidaste tu contraseña?
                                    </button>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="btn btn-primary"
                                style={{ padding: '0.9rem', marginTop: '0.5rem' }}
                                disabled={loading || (mode === 'register' && password !== confirmPassword)}
                            >
                                {loading ? (
                                    mode === 'login' ? 'Iniciando...' : 'Registrando...'
                                ) : (
                                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        {mode === 'login' ? (
                                            <>Iniciar Sesión <LogIn size={18} /></>
                                        ) : (
                                            <>Crear Cuenta <UserPlus size={18} /></>
                                        )}
                                    </span>
                                )}
                            </button>
                        </form>
                    </>
                )}
            </div>

            {/* Footer */}
            <p style={{ textAlign: 'center', fontSize: '0.7rem', opacity: 0.4, marginTop: '2rem' }}>
                CodiaTax v1.3.0 - Secure Auth
            </p>
        </div>
    );
};

export default AuthScreen;
