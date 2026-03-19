import api from './axios';

// ── AUTH ──────────────────────────────────────────────────
export const authAPI = {
  login:        (email, senha)    => api.post('/auth/login', { email, senha }),
  logout:       ()                => api.post('/auth/logout'),
  me:           ()                => api.get('/auth/me'),
  alterarSenha: (dados)           => api.put('/auth/senha', dados),
};

// ── EMPRESAS ──────────────────────────────────────────────
export const empresasAPI = {
  listar:   ()        => api.get('/empresas'),
  buscar:   (id)      => api.get(`/empresas/${id}`),
  criar:    (dados)   => api.post('/empresas', dados),
  atualizar:(id, dados) => api.put(`/empresas/${id}`, dados),
  excluir:  (id)      => api.delete(`/empresas/${id}`),
  uploadLogo:(id, file) => {
    const form = new FormData();
    form.append('logo', file);
    return api.post(`/empresas/${id}/logo`, form);
  },
};

// ── USUÁRIOS ──────────────────────────────────────────────
export const usuariosAPI = {
  listar:   (params) => api.get('/usuarios', { params }),
  buscar:   (id)     => api.get(`/usuarios/${id}`),
  criar:    (dados)  => api.post('/usuarios', dados),
  atualizar:(id, dados) => api.put(`/usuarios/${id}`, dados),
  excluir:  (id)     => api.delete(`/usuarios/${id}`),
  uploadFoto:(id, file) => {
    const form = new FormData();
    form.append('foto', file);
    return api.post(`/usuarios/${id}/foto`, form);
  },
};

// ── DEPARTAMENTOS ─────────────────────────────────────────
export const deptosAPI = {
  listar:   ()            => api.get('/departamentos'),
  criar:    (nome)        => api.post('/departamentos', { nome }),
  atualizar:(id, nome)    => api.put(`/departamentos/${id}`, { nome }),
  excluir:  (id)          => api.delete(`/departamentos/${id}`),
};

// ── PONTO ─────────────────────────────────────────────────
export const pontoAPI = {
  registrar: ()  => api.post('/ponto/registrar'),
  hoje:      ()  => api.get('/ponto/hoje'),
  status:    ()  => api.get('/ponto/status'),
  online:    ()  => api.get('/ponto/online'),
};

// ── RELATÓRIOS ────────────────────────────────────────────
export const relatoriosAPI = {
  meu:          (mes)        => api.get('/relatorios/meu', { params: { mes } }),
  departamento: (mes, depto) => api.get('/relatorios/departamento', { params: { mes, depto } }),
  empresa:      (mes)        => api.get('/relatorios/empresa', { params: { mes } }),
  exportarCSV:  (mes)        => api.get('/relatorios/exportar', {
    params: { mes },
    responseType: 'blob',
  }),
};
