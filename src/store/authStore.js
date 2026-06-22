import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('txt_token'),
  setAuth: (user, token) => {
    localStorage.setItem('txt_token', token);
    set({ user, token });
  },
  setUser: (user) => set({ user }),
  logout: () => {
    localStorage.removeItem('txt_token');
    set({ user: null, token: null });
  },
}));

export default useAuthStore;
