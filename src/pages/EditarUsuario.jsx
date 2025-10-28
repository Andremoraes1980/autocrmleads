import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { supabase } from "../lib/supabaseClient";
import styles from "./EditarUsuario.module.css";
import PasswordInput from "../components/PasswordInput";
const API_BASE = import.meta.env.VITE_BACKEND_URL || 'https://SEU_BACKEND_AQUI';


export default function EditarUsuario() {
  const { id } = useParams();
  const isNovo = !id;
  const navigate = useNavigate();

  const [carregando, setCarregando] = useState(true);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [perfil, setPerfil] = useState("vendedor");
  const [classificados, setClassificados] = useState({
    mercadoLivre: false,
    olx: false,
    webmotors: false,
    icarros: false,
    mobiauto: false,
  });

  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const formatarNome = (str) =>
  str
    .toLowerCase()
    .split(" ")
    .map((palavra) => palavra.charAt(0).toUpperCase() + palavra.slice(1))
    .join(" ");
    const [revendaIdAtual, setRevendaIdAtual] = useState(null);

useEffect(() => {
  // carrega a revenda do usuário logado para gravar no novo usuário
  (async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return;
    const { data } = await supabase
      .from('usuarios')
      .select('revenda_id')
      .eq('id', user.id)
      .maybeSingle();
    setRevendaIdAtual(data?.revenda_id ?? null);
  })();
}, []);



  useEffect(() => {
    if (!isNovo) {
      const carregarUsuario = async () => {
        const { data, error } = await supabase
          .from("usuarios")
          .select("*")
          .eq("id", id)
          .single();

        if (!error && data) {
            setNome(formatarNome(data.nome || ""));

          setEmail(data.email || "");
          setTelefone(typeof data.telefone === "string" ? data.telefone : "");
          setAtivo(data.ativo);
          setPerfil(data.tipo || "vendedor");
          // temporariamente ignorado
          setClassificados({
            mercadoLivre: data.mercadoLivre || false,
            olx: data.olx || false,
            webmotors: data.webmotors || false,
            icarros: data.icarros || false,
            mobiauto: data.mobiauto || false,
          });
        }
        setCarregando(false);
      };
      carregarUsuario();
    } else {
      setCarregando(false);
    }
  }, [id, isNovo]);

  const handleSalvar = async () => {
    try {
      const dados = {
        nome: nome.trim(),
        email: email.trim(),
        telefone: (telefone || "").trim(),
        ativo,
        tipo: (perfil || "vendedor").trim(),
  
        // 🔹 passa o revenda_id apenas se houver (para evitar erro de RLS)
        ...(revendaIdAtual ? { revenda_id: revendaIdAtual } : {}),
  
        // 🔹 (temporariamente ignorar classificados até as colunas existirem)
        // ...classificados,
      };
  
      // 🆕 (1) Validações básicas
      if (!dados.nome) {
        alert("Informe o nome do usuário.");
        return;
      }
      if (!dados.email) {
        alert("Informe um e-mail válido.");
        return;
      }
  
      // ----------------------------------------------------------------
      // 🔹 CASO SEJA NOVO USUÁRIO
      // ----------------------------------------------------------------
      if (isNovo) {
        if (!novaSenha || !confirmarSenha) {
          alert("Informe a senha e a confirmação para criar novo usuário.");
          return;
        }
        if (novaSenha !== confirmarSenha) {
          alert("Nova senha e confirmação não coincidem.");
          return;
        }
        if (!revendaIdAtual) {
          alert("Não foi possível determinar a revenda do administrador.");
          return;
        }
  
        // 🔹 (2) Verifica se o e-mail já existe no Supabase Auth
        const { data: existingAuth, error: existingAuthErr } = await supabase.auth.signInWithPassword({
          email: dados.email,
          password: novaSenha,
        });
  
        if (existingAuth && existingAuth.user) {
          alert("Já existe um usuário cadastrado com este e-mail.");
          return;
        }
  
        // 🔹 (3) Cria o usuário no Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: dados.email,
          password: novaSenha,
        });
  
        if (authError) {
          alert(`Erro ao criar usuário (Auth): ${authError.message}`);
          console.error("[signUp][Auth error]", authError);
          return;
        }
  
        const novoUserId = authData?.user?.id;
        if (!novoUserId) {
          alert("Erro: o Supabase não retornou o ID do usuário recém-criado.");
          console.error("[signUp] Retorno inesperado:", authData);
          return;
        }
  
        // 🔹 (4) Grava na tabela `usuarios`
        const { error: perfilErr } = await supabase
          .from("usuarios")
          .upsert(
            { id: novoUserId, ...dados },
            { onConflict: "id" }
          );
  
        if (perfilErr) {
          alert(`Erro ao salvar dados do usuário: ${perfilErr.message}`);
          console.error("[perfil][upsert error]", perfilErr);
          return;
        }
  
        alert("Usuário criado com sucesso!");
      }
  
      // ----------------------------------------------------------------
      // 🔹 CASO SEJA EDIÇÃO DE USUÁRIO EXISTENTE
      // ----------------------------------------------------------------
      else {
        const { error: updateErr } = await supabase
          .from("usuarios")
          .update(dados)
          .eq("id", id);
  
        if (updateErr) {
          alert("Erro ao atualizar usuário: " + updateErr.message);
          console.error(updateErr);
          return;
        }
  
        alert("Usuário atualizado com sucesso!");
      }
  
      navigate("/usuarios");
    } catch (err) {
      alert(`Erro ao salvar: ${err?.message ?? String(err)}`);
      console.error("Erro no handleSalvar:", err);
    }
  };
  

  const handleTrocarSenha = async () => {
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      alert("Preencha todos os campos de senha.");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      alert("Nova senha e confirmação não coincidem.");
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    const userEmail = userData?.user?.email ?? email;

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: senhaAtual,
    });

    if (loginError) {
      alert("Senha atual incorreta.");
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: novaSenha,
    });

    if (updateError) {
      alert("Erro ao atualizar senha.");
      return;
    }

    alert("Senha alterada com sucesso!");
  };

  if (carregando) return <p style={{ padding: 20 }}>Carregando...</p>;

  return (
    <Layout>
      <div className={styles.scrollWrapper}>
        <div className={styles.header}>
          <h2>{isNovo ? "Adicionar Usuário" : "Editar Usuário"}</h2>
        </div>

        <form autoComplete="off" className={styles.container}>
          <input type="text" name="fakeuser" autoComplete="username" style={{ display: "none" }} />
          <input type="password" name="fakepass" autoComplete="new-password" style={{ display: "none" }} />

          <h3 className={styles.subtitulo}>Dados pessoais</h3>
          <input type="text" placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!isNovo} />
          <input type="tel" placeholder="Telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} />

          <div className={styles.statusRow}>
            <label>Status: </label>
            <label className={styles.switch}>
              <input type="checkbox" checked={ativo} onChange={() => setAtivo(!ativo)} />
              <span className={styles.slider}></span>
            </label>
            <span className={styles.statusLabel}>{ativo ? "Ativo" : "Inativo"}</span>
          </div>

          <h3 className={styles.subtitulo}>Perfil</h3>
          <div className={styles.radioGroup}>
            {["vendedor", "gerente", "admin"].map((role) => (
              <label key={role} className={styles.radioStyled}>
                <input
                  type="radio"
                  name="perfil"
                  value={role}
                  checked={perfil === role}
                  onChange={() => setPerfil(role)}
                />
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </label>
            ))}
          </div>

          <h3 className={styles.subtitulo}>Classificados Leads</h3>
          <div className={styles.checkboxGroup}>
            {Object.entries(classificados).map(([nome, valor]) => (
              <label key={nome} className={styles.checkboxStyled}>
                <input
                  type="checkbox"
                  checked={valor}
                  onChange={() =>
                    setClassificados((prev) => ({
                      ...prev,
                      [nome]: !prev[nome],
                    }))
                  }
                />
                {nome.charAt(0).toUpperCase() + nome.slice(1)}
              </label>
            ))}
          </div>

          {isNovo && (
            <>
              <h3 className={styles.subtitulo}>Senha de Acesso</h3>
              <PasswordInput
      placeholder="Senha"
      value={novaSenha}
      onChange={(e) => setNovaSenha(e.target.value)}
    />

    <PasswordInput
      placeholder="Repita a senha"
      value={confirmarSenha}
      onChange={(e) => setConfirmarSenha(e.target.value)}
    />
              
            </>
          )}

          {!isNovo && (
            <>
              <h3 className={styles.subtitulo}>Trocar Senha</h3>
              <PasswordInput 
              placeholder="Senha atual"   value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
               />
                <PasswordInput
                placeholder="Nova senha" 
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                />
                 <PasswordInput 
                 placeholder="Confirmar nova senha"
                 value={confirmarSenha}
                 onChange={(e) => setConfirmarSenha(e.target.value)}
                 />
                 
              <button type="button" className={styles.btnSalvar} onClick={handleTrocarSenha}>Trocar Senha</button>
            </>
          )}

          <button className={styles.btnSalvar} type="button" onClick={handleSalvar}>
            {isNovo ? "Criar Usuário" : "Salvar Alterações"}
          </button>
        </form>
      </div>
    </Layout>
  );
}
