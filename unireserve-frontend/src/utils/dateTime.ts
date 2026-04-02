export const formatSlotTime = (slotDate: string, time: string) => {
  return new Date(`${slotDate}T${time}`).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatSlotDateTime = (slotDate: string, time: string) => {
  return new Date(`${slotDate}T${time}`).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};
