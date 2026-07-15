export const formatDate = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

export const formatTime = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${min}`;
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '—';
  return `${formatDate(dateString)} ${formatTime(dateString)}`;
};
