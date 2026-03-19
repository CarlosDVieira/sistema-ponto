import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario,   setUsuario]   = useState(null);
  const [carregando, setCarregando] = useState(true);

  // Restaura sessão do localStorage ao abrir
  useEffect(() => {
    const token = localStorage.getItem('pf_token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      api.get('/auth/me')
        .then(r => setUsuario(r.data))
        .catch(() => { localStorage.removeItem('pf_token'); })
        .finally(() => setCarregando(false));
    } else {
      setCarregando(false);
    }
  }, []);

  const login = useCallback(async (email, senha) => {
    const { data } = await api.post('/auth/login', { email, senha });
    localStorage.setItem('pf_token', data.token);
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setUsuario(data.usuario);
    return data.usuario;
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.removeItem('pf_token');
    delete api.defaults.headers.common['Authorization'];
    setUsuario(null);
  }, []);

  // Atualiza dados do usuário localmente (ex: após trocar foto)
  const atualizarUsuario = useCallback((dados) => {
    setUsuario(prev => ({ ...prev, ...dados }));
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, carregando, login, logout, atualizarUsuario }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
