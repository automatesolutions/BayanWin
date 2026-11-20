export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatCurrency = (amount) => {
  if (!amount) return 'N/A';
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0
  }).format(amount);
};

export const formatNumber = (num) => {
  if (num === null || num === undefined) return 'N/A';
  return new Intl.NumberFormat('en-US').format(num);
};


/** "Updated just now", "Updated 4 min ago", "Updated 2 h ago" from a Unix time in seconds. */
export const formatUpdatedAgo = (epochSeconds, now = Date.now()) => {
  if (!epochSeconds) return null;
  const mins = Math.floor((now - epochSeconds * 1000) / 60000);
  if (mins < 1) return 'Updated just now';
  if (mins < 60) return `Updated ${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Updated ${hours} h ago`;
  return `Updated ${Math.floor(hours / 24)} d ago`;
};
