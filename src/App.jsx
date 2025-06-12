import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import Login from "./pages/Login";
import CadastroUsuario from "./pages/CadastroUsuario";
import ProtectedRoute from "./components/ProtectedRoute";
import Conversa from "./pages/Conversa";
import Usuarios from "./pages/Usuarios";
import EditarUsuario from "./pages/EditarUsuario";
import FrasesProntasAdmin from "./pages/FrasesProntasAdmin";
import Configuracoes from "./pages/Configuracoes";
import "./App.css";
import MlAuth from "./pages/MlAuth";

function App() {
  const usuarioAtual = JSON.parse(localStorage.getItem("usuario") || "{}");
  return (
    <Router>
      <Routes>
        {/* ROTA PÚBLICA */}
        <Route path="/login" element={<Login />} />

        {/* ROTAS PROTEGIDAS */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/usuarios"
          element={
            <ProtectedRoute role="admin">
              <Usuarios />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cadastro-usuario"
          element={
            <ProtectedRoute role="admin">
              <CadastroUsuario />
            </ProtectedRoute>
          }
        />

        {/* ROTA PARA CRIAR NOVO USUÁRIO */}
        <Route
          path="/usuario/novo"
          element={
            <ProtectedRoute role="admin">
              <EditarUsuario />
            </ProtectedRoute>
          }
        />

        {/* ROTA PARA EDITAR USUÁRIO EXISTENTE */}
        <Route
          path="/usuario/:id"
          element={
            <ProtectedRoute role="admin">
              <EditarUsuario />
            </ProtectedRoute>
          }
        />

        <Route
          path="/frases-prontas"
          element={
            <ProtectedRoute role="admin">
              <FrasesProntasAdmin />
            </ProtectedRoute>
          }
        />
        <Route path="/ml-auth" element={<MlAuth />} />


        <Route path="/configuracoes" element={<Configuracoes />} />

        <Route
          path="/conversa/:id"
          element={
            <ProtectedRoute>
              <Conversa />
            </ProtectedRoute>
          }
        />

      </Routes>
    </Router>
  );
}

export default App;
