// src/pages/CadastroUsuario.jsx
import { useState, useEffect } from 'react'; // ✅ agora correto
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function CadastroUsuario() {
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('vendedor');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(null);
  const navigate = useNavigate();

  const formatarNome = (nome) => {
    return nome
      .toLowerCase()
      .split(" ")
      .filter(Boolean)
      .map((palavra) => palavra[0].toUpperCase() + palavra.slice(1))
      .join(" ");
  };
  

  useEffect(() => {
    const validarAdmin = async () => {
      const id = localStorage.getItem('vendedorId');
      const { data } = await supabase.from('usuarios').select('tipo').eq('id', id).single();
      if (data?.tipo !== 'admin') navigate('/');
    };
    validarAdmin();
  }, []);
  

  const handleCadastro = async (e) => {
    e.preventDefault();
    setErro(null);
    setSucesso(null);

    // Criação do usuário no Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha
    });

    if (error) {
      setErro('Erro ao criar usuário: ' + error.message);
      return;
    }

    // Inserção no banco na tabela 'usuarios'
    // Obtenha o usuário logado (admin ou gerente) e puxe o revenda_id dele!
const usuarioAtual = JSON.parse(localStorage.getItem("usuario") || "{}");

const { error: insertError } = await supabase.from('usuarios').insert([
  { 
    id: data.user.id, 
    nome, 
    tipo, 
    email,
    revenda_id: usuarioAtual.revenda_id // <- ESSA LINHA É ESSENCIAL!
  }
]);

    

    if (insertError) {
      setErro('Usuário criado, mas erro ao salvar no banco: ' + insertError.message);
      return;
    }

    setSucesso('Usuário cadastrado com sucesso!');    
    setNome('');
    setTipo('vendedor');
    setEmail('');
    setSenha('');
  };

  return (
    <div style={{ maxWidth: 400, margin: 'auto', padding: 20 }}>
      <h2>Cadastrar Novo Usuário</h2>
      <form onSubmit={handleCadastro}>
        <input
          type="text"
          placeholder="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
          style={{ width: '100%', marginBottom: 10 }}
        />
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          style={{ width: '100%', marginBottom: 10 }}
        >
          <option value="vendedor">Vendedor</option>
          <option value="admin">Administrador</option>
        </select>
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
        <button type="submit">Cadastrar</button>
      </form>

      {erro && <p style={{ color: 'red' }}>{erro}</p>}
      {sucesso && <p style={{ color: 'green' }}>{sucesso}</p>}
    </div>
  );
}
