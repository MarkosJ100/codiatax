import React, { useState } from 'react';
import {
    Mail, Lock, User as UserIcon, LogIn, ChevronRight,
    ArrowLeft, Send, CheckCircle2, RefreshCw, Eye, EyeOff, KeyRound, UserPlus, Info
} from 'lucide-react';
import logo from '../assets/logo.jpg';
import { supabase } from '../supabase';
import { useUI } from '../context/UIContext';
import { motion, AnimatePresence } from 'framer-motion';

type AuthMode = 'login' | 'register' | 'forgot' | 'verify';

const AuthScreen: React.FC = () => {
    const { showToast } = useUI();

    // UI State
    const [mode, setMode] = useState<AuthMode>('login');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);

    // Reset form when changing modes
    const switchMode = (newMode: AuthMode) => {
        setMode(newMode);
        setPassword('');
        setConfirmPassword('');
        setShowPassword(false);
        setShowConfirmPassword(false);
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
        if (password !== confirmPassword) {
            return showToast("Las contraseñas no coinciden", "error");
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
            setMode('verify');
        } catch (error: any) {
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
            showToast("Enlace enviado", "success");
            setMode('login');
        } catch (error: any) {
            showToast(error.message || "Error al enviar el enlace", "error");
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        width: '100%',
        padding: '0.85rem 1rem',
        paddingLeft: '2.75rem',
        borderRadius: '16px',
        backgroundColor: 'var(--bg-input)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-light)',
        transition: 'all 0.2s',
        fontSize: '0.95rem',
        fontWeight: '600'
    };

    const labelStyle = {
        display: 'block',
        marginBottom: '6px',
        fontSize: '0.75rem',
        fontWeight: '850',
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '2rem 1.5rem',
            maxWidth: '450px',
            margin: '0 auto',
            background: 'var(--bg-main)'
        }}>
            {/* Logo area */}
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                <motion.div 
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '24px',
                        overflow: 'hidden',
                        margin: '0 auto 1.25rem',
                        boxShadow: 'var(--shadow-premium)',
                        border: '2px solid white'
                    }}
                >
                    <img src={logo} alt="CodiaTax" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </motion.div>
                <motion.h1 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ fontSize: '2.25rem', fontWeight: '950', letterSpacing: '-0.04em', margin: 0, color: 'var(--text-primary)' }}
                >
                    Codia<span style={{ color: 'var(--accent-primary)' }}>Tax</span>
                </motion.h1>
                <p style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem', marginTop: '4px' }}>
                    {mode === 'login' ? 'Tu herramienta digital para el taxi' : 
                     mode === 'register' ? 'Crea tu cuenta profesional' : 
                     mode === 'verify' ? 'Casi listo...' : 'Recuperar acceso'}
                </p>
            </div>

            <motion.div 
                layout
                style={{
                    background: 'var(--bg-card)',
                    borderRadius: '32px',
                    padding: '1.75rem',
                    boxShadow: 'var(--shadow-premium)',
                    border: '1px solid var(--border-light)'
                }}
            >
                <AnimatePresence mode='wait'>
                    {mode === 'verify' ? (
                        <motion.div 
                            key="verify"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            style={{ textAlign: 'center' }}
                        >
                            <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                <Mail size={32} />
                            </div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '900', marginBottom: '0.5rem' }}>¡Verifica tu email!</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
                                Hemos enviado un enlace a <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>. Pulsa en el enlace para activar tu cuenta.
                            </p>
                            <button 
                                onClick={() => setMode('login')}
                                style={{ width: '100%', padding: '1rem', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '16px', fontWeight: '900', cursor: 'pointer', boxShadow: '0 8px 16px -4px rgba(250, 204, 21, 0.4)' }}
                            >
                                Volver al Inicio
                            </button>
                        </motion.div>
                    ) : mode === 'forgot' ? (
                        <motion.div
                            key="forgot"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <button onClick={() => setMode('login')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: '800', marginBottom: '1.25rem', padding: 0 }}><ArrowLeft size={18} /> Volver</button>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '900', marginBottom: '1rem' }}>Restablecer contraseña</h2>
                            <form onSubmit={handleForgotPassword}>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={labelStyle as any}>Tu Email</label>
                                    <div style={{ position: 'relative' }}>
                                        <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle as any} placeholder="nombre@ejemplo.com" required />
                                    </div>
                                </div>
                                <button type="submit" disabled={loading} style={{ width: '100%', padding: '1rem', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '16px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    {loading ? <RefreshCw size={20} className="animate-spin" /> : <>Enviar enlace <Send size={18} /></>}
                                </button>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="auth"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            {/* Toggle */}
                            <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: '14px', padding: '4px', marginBottom: '1.75rem' }}>
                                <button onClick={() => setMode('login')} style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: 'none', background: mode === 'login' ? 'var(--bg-card)' : 'transparent', color: mode === 'login' ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: '900', fontSize: '0.85rem', cursor: 'pointer', boxShadow: mode === 'login' ? 'var(--shadow-premium)' : 'none', transition: 'all 0.2s' }}>Entrar</button>
                                <button onClick={() => setMode('register')} style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: 'none', background: mode === 'register' ? 'var(--bg-card)' : 'transparent', color: mode === 'register' ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: '900', fontSize: '0.85rem', cursor: 'pointer', boxShadow: mode === 'register' ? 'var(--shadow-premium)' : 'none', transition: 'all 0.2s' }}>Registrarse</button>
                            </div>

                            <form onSubmit={mode === 'login' ? handleLogin : handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div>
                                    <label style={labelStyle as any}>Email</label>
                                    <div style={{ position: 'relative' }}>
                                        <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle as any} placeholder="tu@email.com" required />
                                    </div>
                                </div>

                                <div>
                                    <label style={labelStyle as any}>Contraseña</label>
                                    <div style={{ position: 'relative' }}>
                                        <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                                        <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} style={inputStyle as any} placeholder="••••••••" required />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                                    </div>
                                </div>

                                {mode === 'register' && (
                                    <div>
                                        <label style={labelStyle as any}>Confirmar</label>
                                        <div style={{ position: 'relative' }}>
                                            <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                                            <input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={inputStyle as any} placeholder="••••••••" required />
                                            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>{showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                                        </div>
                                    </div>
                                )}

                                {mode === 'login' && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)' }} /> Recordarme
                                        </label>
                                        <button type="button" onClick={() => setMode('forgot')} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: '850', cursor: 'pointer' }}>¿Olvidaste la clave?</button>
                                    </div>
                                )}

                                <button type="submit" disabled={loading} style={{ width: '100%', padding: '1.15rem', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '20px', fontSize: '1.1rem', fontWeight: '950', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 12px 24px -10px rgba(250, 204, 21, 0.4)', marginTop: '0.5rem' }}>
                                    {loading ? <RefreshCw size={24} className="animate-spin" /> : mode === 'login' ? <>Entrar <LogIn size={20} /></> : <>Crear cuenta <UserPlus size={20} /></>}
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-muted)', background: 'var(--bg-card)', padding: '10px 20px', borderRadius: '16px', border: '1px solid var(--border-light)', width: 'fit-content', margin: '0 auto' }}>
                    <Info size={16} />
                    <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>Inicia sesión para sincronizar tus datos</span>
                </div>
            </div>

            <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', opacity: 0.5 }}>CodiaTax Pro v1.3.1 • Premium Edition</p>
        </div>
    );
};

export default AuthScreen;
