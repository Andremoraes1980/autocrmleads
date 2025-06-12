// src/pages/Login.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const testarSupabase = async () => {
      const { data, error } = await supabase.from("usuarios").select("*").limit(1);
      console.log("DADOS:", data);
      console.log("ERRO:", error);
    };
    testarSupabase();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro(null); // limpa erro anterior

    // 1. Autenticar com Supabase Auth
    const { data: session, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (authError) {
      console.error("Erro Supabase Auth:", authError);

      // Mensagem customizada se o email não estiver confirmado
      if (authError.message && authError.message.includes("Email not confirmed")) {
        setErro("Você precisa confirmar seu e-mail antes de entrar.");
        return;
      }

      setErro("E-mail ou senha inválidos.");
      return;
    }

    // 2. Verificar na tabela `usuarios` se está ativo
    const { data: usuario, error: usuarioErro } = await supabase
      .from("usuarios")
      .select("*")
      .eq("email", email)
      .single();

    if (usuarioErro || !usuario) {
      console.error("Erro ao buscar usuário:", usuarioErro);
      setErro("Usuário não encontrado na base de dados.");
      await supabase.auth.signOut();
      return;
    }

    if (!usuario.ativo) {
      setErro("Seu acesso está desativado. Contate o gerente.");
      await supabase.auth.signOut();
      return;
    }

    // 3. (NOVO) Verifica se tem revenda_id
    if (!usuario.revenda_id) {
      setErro("Usuário não está vinculado a uma loja/revenda. Contate o administrador.");
      await supabase.auth.signOut();
      return;
    }

    // 4. Tudo certo: salva ID + revenda_id e redireciona
    localStorage.setItem('usuario', JSON.stringify(usuario));

    navigate('/');
  };

  return (
    <div style={{ maxWidth: 400, margin: 'auto', padding: 20 }}>
      <h2>Login Vendedor</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: '100%', marginBottom: 10 }}
        />
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
          style={{ width: '100%', marginBottom: 10 }}
        />
        <button type="submit">Entrar</button>
        {erro && <p style={{ color: 'red' }}>{erro}</p>}
      </form>
    </div>
  );
}

