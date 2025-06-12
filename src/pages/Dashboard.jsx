import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import UsuarioCard from '../components/UsuarioCard';

export default function Dashboard() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsuarios = async () => {
      const { data: session } = await supabase.auth.getSession();

      if (!session?.session) {
        navigate('/login');
        return;
      }

      const { data, error } = await supabase.from('usuarios').select('*');

      if (error) {
        console.error('Erro ao buscar usuários:', error);
      } else {
        setUsuarios(data);
      }

      setLoading(false);
    };

    fetchUsuarios();
  }, [navigate]);

  return (
    <div style={{ padding: 20 }}>
      <h2>Usuários Cadastrados</h2>
      {loading ? (
        <p>Carregando...</p>
      ) : (
        <>
          {usuarios.map((usuarios) => (
            <UsuarioCard key={usuarios.id} perfil={usuarios} />
          ))}
        </>
      )}

      <button
        style={{ marginTop: 20 }}
        onClick={() => navigate('/cadastro-usuario')}
      >
        Cadastrar Novo Usuário
      </button>
    </div>
  );
}
