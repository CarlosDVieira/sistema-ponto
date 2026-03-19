import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
dayjs.locale('pt-br');

export function formatarData(str) {
  if (!str) return '—';
  return dayjs(str).format('DD/MM/YYYY');
}

export function formatarHoras(min, comSinal = false) {
  if (min === null || min === undefined) return '—';
  const sinal = min >= 0 ? (comSinal ? '+' : '') : '-';
  const abs   = Math.abs(min);
  return `${sinal}${Math.floor(abs/60)}h ${String(abs%60).padStart(2,'0')}m`;
}

export function mesAtual() {
  return dayjs().format('YYYY-MM');
}

export function nomeMes(str) {
  return dayjs(str + '-01').format('MMMM [de] YYYY');
}

export function roleBadge(role) {
  return { master:'👑 Master', admin:'🛡️ Admin', supervisor:'👔 Supervisor', user:'👤 Usuário' }[role] || '👤';
}

export function roleClass(role) {
  return { master:'master', admin:'admin', supervisor:'supervisor', user:'user' }[role] || 'user';
}

export function downloadCSV(blob, mes) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href    = url;
  a.download = `relatorio_${mes}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function fotoUrl(foto) {
  if (!foto) return null;
  if (foto.startsWith('http') || foto.startsWith('data:')) return foto;
  return foto; // path relativo servido pelo Nginx/Node
}
