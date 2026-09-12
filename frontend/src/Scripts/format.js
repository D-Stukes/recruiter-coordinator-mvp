// Scripts/format.js
// Small display-formatting helpers shared across components.

export function formatDateTime(isoString) {
  return new Date(isoString).toLocaleString();
}

export function slotOrBookedLabel(candidate) {
  if (candidate.status === 'BOOKED' && candidate.bookedSlot) {
    return formatDateTime(candidate.bookedSlot.start);
  }
  if (candidate.status === 'SLOTS_SENT' && candidate.slots?.length) {
    return `${candidate.slots.length} option(s) sent`;
  }
  return '—';
}

export function statusLabel(status) {
  return status.replace('_', ' ');
}
