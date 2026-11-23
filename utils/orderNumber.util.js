export const buildOrderNumber = (sequence = 1) => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const seq = String(sequence).padStart(4, '0');
  return `US-${yyyy}${mm}${dd}-${seq}`;
};

export default { buildOrderNumber };
