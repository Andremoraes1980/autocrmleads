// src/pages/Login.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState(null);
  const navigate = useNavigate();

  

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro(null);
  
    try {
      // 1) Autentica no Auth usando email + senha
      const { data: signInData, error: authError } = await supabase.auth.signInWithPassword({
        email: (email || "").trim(),
        password: (senha || "").trim(),
      });
  
      if (authError) {
        if (authError.message?.includes("Email not confirmed")) {
          setErro("Você precisa confirmar seu e-mail antes de entrar.");
        } else {
          setErro(authError.message || "E-mail ou senha inválidos.");
        }
        return;
      }
  
      // 2) Garante o userId da sessão (preferir o que veio do signIn)
      let userId = signInData?.user?.id || null;
      if (!userId) {
        const { data: udata } = await supabase.auth.getUser();
        userId = udata?.user?.id || null;
      }
      if (!userId) {
        setErro("Não foi possível obter a sessão do usuário após o login.");
        return;
      }
  
      // 3) Busca o perfil na sua tabela por ID (compatível com RLS: id = auth.uid())
      const { data: usuario, error: usuarioErro } = await supabase
        .from("usuarios")
        .select("id, nome, email, tipo, revenda_id, telefone, ativo")
        .eq("id", userId)
        .maybeSingle();
  
      if (usuarioErro) {
        console.error("Erro ao buscar usuário:", usuarioErro);
        setErro(usuarioErro.message || "Erro ao buscar usuário.");
        await supabase.auth.signOut();
        return;
      }
  
      if (!usuario) {
        setErro("Usuário autenticado, porém sem perfil cadastrado. Contate o administrador.");
        await supabase.auth.signOut();
        return;
      }
  
      if (usuario.ativo === false) {
        setErro("Seu acesso está desativado. Contate o gerente.");
        await supabase.auth.signOut();
        return;
      }
  
      if (!usuario.revenda_id) {
        setErro("Usuário não está vinculado a uma loja/revenda. Contate o administrador.");
        await supabase.auth.signOut();
        return;
      }
  
      // 4) Guarda o perfil e segue
      localStorage.setItem("usuario", JSON.stringify(usuario));
      navigate("/");
    } catch (err) {
      console.error("[login] unexpected error:", err);
      setErro(err?.message || "Erro inesperado ao entrar.");
    }
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

