import axios from "axios";
import { createContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:2000";
axios.defaults.baseURL = backendUrl;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);

  // Check if user is authenticated
  const checkAuth = async () => {
    try {
      const { data } = await axios.get("/api/v1/users/check", {
        headers: { token }, // send token in headers
      });
      if (data?.success) {
        setAuthUser(data?.user);
        connectSocket(data?.user);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  //login
  const login = async (state, credentials) => {
    try {
      const { data } = await axios.post(`/api/v1/users/${state}`, credentials, {
        headers: { token },
      });
      if (data?.success) {
        setToken(data?.token);
        setAuthUser(data?.userData);
        connectSocket(data?.userData);
        toast.success(data?.message);
        localStorage.setItem("token", data?.token);
      }
      return data;
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };
  // Logout user and remove token from localStorage
  const logOut = () => {
    if (socket) socket?.disconnect();

    localStorage.removeItem("token");
    setToken(null);
    setOnlineUsers([]);
    axios.defaults.headers.common["token"] = null;
    setAuthUser(null);
    toast.success("Logged Out Successfully!");
  };

  //update user profile
  const updateProfile = async (formData) => {
    try {
      const { data } = await axios.put(
        "/api/v1/users/update-profile",
        formData,
        {
          headers: { token },
        }
      );
      if (data?.success) {
        setAuthUser(data?.user);
        toast.success(data?.message);
      }
      return data;
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // Connect to socket
  const connectSocket = (userData) => {
    if (!userData || socket?.connected) return;
    const newSocket = io(backendUrl, {
      query: { userId: userData._id },
    });
    newSocket.connect();
    setSocket(newSocket);

    newSocket.on("getOnlineUsers", (userIds) => {
      setOnlineUsers(userIds);
    });
  };

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
      checkAuth();
    }
  }, [token]);

  const value = {
    axios,
    authUser,
    onlineUsers,
    socket,
    token,
    setToken,
    setAuthUser,
    login,
    logOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
