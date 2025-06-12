// src/components/ProtectedRoute.jsx

import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import Layout from "./Layout";

export default function ProtectedRoute({ children, role = null }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        const { user } = session;
        const { data, error } = await supabase
          .from("usuarios")
          .select("tipo")
          .eq("id", user.id)
          .single();

        if (!error && data) {
          setUserRole(data.tipo);
          setAuthenticated(true);
        }
      }

      setLoading(false);
    };

    checkSession();
  }, []);

  if (loading) return null;
  if (!authenticated) return <Navigate to="/login" />;
  if (role && userRole !== role) return <Navigate to="/" />;

  return <Layout>{children}</Layout>;
}
