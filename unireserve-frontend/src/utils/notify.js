import toast from 'react-hot-toast';

export const notifySuccess = (message) => {
  toast.success(message, {
    duration: 4000,
    position: 'top-right',
  });
};

export const notifyError = (message) => {
  toast.error(message, {
    duration: 5000,
    position: 'top-right',
  });
};

export const notifyInfo = (message) => {
  toast(message, {
    duration: 4000,
    position: 'top-right',
    icon: 'ℹ️',
  });
};
