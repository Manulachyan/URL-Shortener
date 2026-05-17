import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { authApi } from "../api";
import { useAuthStore } from "../store";

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const { setAuth, logout: storeLogout } = useAuthStore();
  const navigate = useNavigate();

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await authApi.login(email, password);
      setAuth(data.user, data.accessToken, data.refreshToken);
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const data = await authApi.register(name, email, password);
      setAuth(data.user, data.accessToken, data.refreshToken);
      toast.success("Account created! Welcome aboard 🎉");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    storeLogout();
    toast.success("Logged out");
    navigate("/");
  };

  return { login, register, logout, loading };
}; 