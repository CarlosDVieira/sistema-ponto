// Estado da sessão (sem banco de dados)
let usuarios = [];
let usuarioAtual = null;
let registros = [];
let estadoPonto = 'livre'; // 'livre', 'trabalhando', 'encerrado'

// ---------- UTILIDADES ----------

function irPara(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function toast(msg, tipo = '') {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.className = `toast ${tipo}`;
  setTimeout(() => el.classList.add('show'), 10);
  setTimeout(() => el.classList.remove('show'), 3000);
}

function agora() {
  return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ---------- RELÓGIO ----------

function atualizarRelogio() {
  const el = document.getElementById('relogio');
  if (el) el.textContent = agora();
}
setInterval(atualizarRelogio, 1000);

function atualizarData() {
  const el = document.getElementById('data-hoje');
  if (!el) return;
  const hoje = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  });
  el.textContent = hoje.charAt(0).toUpperCase() + hoje.slice(1);
}

// ---------- CADASTRO ----------

function cadastrar() {
  const nome = document.getElementById('cad-nome').value.trim();
  const cargo = document.getElementById('cad-cargo').value.trim();
  const matricula = document.getElementById('cad-matricula').value.trim();

  if (!nome || !cargo || !matricula) {
    toast('Preencha todos os campos!', 'error');
    return;
  }

  const jaExiste = usuarios.find(u => u.matricula === matricula);
  if (jaExiste) {
    toast('Matrícula já cadastrada!', 'error');
    return;
  }

  usuarios.push({ nome, cargo, matricula });
  toast(`Bem-vindo, ${nome}! ✅`, 'success');
  setTimeout(() => irPara('screen-login'), 1200);
}

// ---------- LOGIN ----------

function login() {
  const matricula = document.getElementById('login-matricula').value.trim();

  if (!matricula) {
    toast('Informe sua matrícula!', 'error');
    return;
  }

  const usuario = usuarios.find(u => u.matricula === matricula);
  if (!usuario) {
    toast('Matrícula não encontrada!', 'error');
    return;
  }

  usuarioAtual = usuario;
  registros = [];
  estadoPonto = 'livre';

  document.getElementById('user-nome-top').textContent = `${usuario.nome} — ${usuario.cargo}`;
  atualizarData();
  atualizarRelogio();
  atualizarHistorico();
  atualizarBotoes();

  toast(`Olá, ${usuario.nome}! 👋`, 'success');
  irPara('screen-ponto');
}

// ---------- PONTO ----------

function registrarPonto(tipo) {
  if (!usuarioAtual) return;

  const hora = agora();
  registros.push({ tipo, hora });

  if (tipo === 'entrada') {
    estadoPonto = 'trabalhando';
    toast(`Entrada registrada às ${hora} ✅`, 'success');
  } else {
    estadoPonto = 'encerrado';
    toast(`Saída registrada às ${hora} 👋`, 'success');
  }

  atualizarHistorico();
  atualizarBotoes();
}

function atualizarBotoes() {
  const badge  = document.getElementById('status-badge');
  const btnEnt = document.getElementById('btn-entrada');
  const btnSai = document.getElementById('btn-saida');

  badge.className = 'status-badge';

  if (estadoPonto === 'livre') {
    badge.textContent = 'Sem registro hoje';
    btnEnt.disabled = false;
    btnSai.disabled = true;
  } else if (estadoPonto === 'trabalhando') {
    badge.textContent = '● Trabalhando';
    badge.classList.add('trabalhando');
    btnEnt.disabled = true;
    btnSai.disabled = false;
  } else {
    badge.textContent = 'Expediente encerrado';
    badge.classList.add('encerrado');
    btnEnt.disabled = true;
    btnSai.disabled = true;
  }
}

function atualizarHistorico() {
  const lista = document.getElementById('historico-lista');
  if (registros.length === 0) {
    lista.innerHTML = '<p class="vazio">Nenhum registro ainda.</p>';
    return;
  }

  lista.innerHTML = registros.map(r => `
    <div class="registro-item">
      <span class="reg-tipo ${r.tipo}">${r.tipo === 'entrada' ? '▶ Entrada' : '■ Saída'}</span>
      <span class="reg-hora">${r.hora}</span>
    </div>
  `).join('');
}

// ---------- SAIR ----------

function sair() {
  usuarioAtual = null;
  registros = [];
  estadoPonto = 'livre';
  document.getElementById('login-matricula').value = '';
  irPara('screen-login');
}
