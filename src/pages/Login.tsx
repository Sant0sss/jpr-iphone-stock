import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, User, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const Login = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        username: "",
        password: "",
    });

    const VALID_USERNAME = "sealstoree2020";
    const VALID_PASSWORD = "@Seal2020";

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                navigate("/");
            }
        };
        checkSession();
    }, [navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // 1. Local Validation
        if (formData.username !== VALID_USERNAME || formData.password !== VALID_PASSWORD) {
            toast.error("Usuário ou senha incorretos");
            setLoading(false);
            return;
        }

        try {
            // 2. Supabase Auth Integration
            const email = "sealstoree2020@example.com";

            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password: formData.password,
            });

            if (signInError) {
                console.log("Sign in failed, attempting sign up...", signInError.message);

                // If sign in fails, try to sign up (Auto-provisioning the hardcoded user)
                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password: formData.password,
                });

                if (signUpError) {
                    console.error("Sign up error:", signUpError);
                    toast.error("Erro ao autenticar no Supabase. Verifique o console.");
                    setLoading(false);
                    return;
                }

                if (signUpData.session) {
                    toast.success("Usuário criado e logado com sucesso!");
                    navigate("/");
                } else if (signUpData.user) {
                    toast.info("Usuário criado. Verifique se há confirmação de email necessária.");
                    // Try to navigate anyway, hoping for the best or that session is mocked enough?
                    // But ProtectedRoute will block if no session.
                }
            } else if (data.session) {
                toast.success("Login realizado com sucesso!");
                navigate("/");
            }
        } catch (error) {
            toast.error("Erro ao processar login");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex w-full">
            {/* Left Side - Form */}
            <div className="w-full lg:w-[40%] bg-white p-8 flex items-center justify-center relative">
                <div className="w-full max-w-md space-y-8 animate-fade-in">
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-bold text-primary tracking-tight">SealStore</h1>
                        <p className="text-gray-500 font-medium">Painel de Controle</p>
                    </div>

                    <div className="bg-white p-8 rounded-2xl shadow-elegant border border-gray-100">
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="username" className="text-gray-700">Usuário</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                    <Input
                                        id="username"
                                        type="text"
                                        placeholder="Digite seu usuário"
                                        className="pl-10 h-12 rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20 transition-all font-medium"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Senha</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        className="pl-10 pr-10 h-12 rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20 transition-all font-medium"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 bg-primary hover:bg-blue-600 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-70"
                                disabled={loading}
                            >
                                {loading ? (
                                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                ) : (
                                    "Entrar no Sistema"
                                )}
                            </Button>
                        </form>
                    </div>

                    <div className="text-center">
                        <p className="text-sm text-gray-400">
                            Acesso restrito a pessoal autorizado
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side - Visuals */}
            <div className="hidden lg:flex w-[60%] bg-gradient-to-br from-primary via-blue-600 to-indigo-900 relative overflow-hidden items-center justify-center text-white p-12">
                {/* Abstract Background Shapes */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10 max-w-xl space-y-8 backdrop-blur-sm bg-white/5 p-12 rounded-3xl border border-white/10 shadow-2xl">
                    <div className="h-20 w-20 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                        <svg
                            className="h-10 w-10 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </div>

                    <h2 className="text-4xl font-bold leading-tight">
                        Gerencie seus preços com <span className="text-accent">inteligência</span>
                    </h2>

                    <p className="text-lg text-blue-100 leading-relaxed">
                        Acompanhe o mercado, ajuste estratégias e maximize seus lucros com nossa plataforma avançada de gestão para iPhone.
                    </p>

                    <div className="flex items-center gap-4 text-sm font-medium text-blue-200 pt-4">
                        <div className="flex -space-x-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-10 w-10 rounded-full border-2 border-primary bg-gray-200" />
                            ))}
                        </div>
                        <span>Usado por especialistas</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
