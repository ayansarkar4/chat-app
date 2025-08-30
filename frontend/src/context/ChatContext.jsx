import { createContext, useState, useContext, useEffect } from "react";
import { AuthContext } from "./AuthContext.jsx";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unseenMessages, setUnseenMessages] = useState({});

  const { socket, axios, token } = useContext(AuthContext);

  // function to get all users for sidebar
  const getAllUsers = async () => {
    try {
      const { data } = await axios.get("/api/v1/messages/users", {
        headers: { token },
      });
      if (data?.success) {
        setUsers(data?.users);
        setUnseenMessages(data?.unseenMessages);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // function to get all messages for selected user
  const getMessages = async (userId) => {
    try {
      const { data } = await axios.get(`/api/v1/messages/${userId}`, {
        headers: { token },
      });
      if (data?.success) {
        setMessages(data?.messages);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // function to send message to selected user
  const sendMessage = async (messageData) => {
    try {
      const { data } = await axios.post(
        `/api/v1/messages/send/${selectedUser._id}`,
        messageData,
        {
          headers: { token },
        }
      );
      if (data?.success) {
        setMessages((prevMessages) => [...prevMessages, data?.newMessage]);
      } else {
        toast.error(data?.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // function to subscribe to messages
  const subscribedToMessages = async () => {
    if (!socket) return;

    socket.on("newMessage", (newMessage) => {
      if (selectedUser && newMessage.senderId === selectedUser._id) {
        // If chat is open → mark as seen
        newMessage.seen = true;
        setMessages((prev) => [...prev, newMessage]);

        // Mark this specific message as seen
        axios.put(
          `/api/v1/messages/mark/${newMessage._id}`,
          {},
          {
            headers: { token },
          }
        );

        // ✅ Clear unseen count
        setUnseenMessages((prev) => ({
          ...prev,
          [newMessage.senderId]: 0,
        }));
      } else {
        // If chat is not open → increase unseen count
        setUnseenMessages((prev) => ({
          ...prev,
          [newMessage.senderId]: (prev[newMessage.senderId] || 0) + 1,
        }));
      }
    });
  }; // ✅ properly closed here

  // function to unsubscribe from messages
  const unsubscribeFromMessages = () => {
    if (!socket) return;
    socket.off("newMessage");
  };

  useEffect(() => {
    subscribedToMessages();
    return () => {
      unsubscribeFromMessages();
    };
  }, [socket, selectedUser]);

  const value = {
    messages,
    setMessages,
    users,
    selectedUser,
    setSelectedUser,
    unseenMessages,
    setUnseenMessages,
    getAllUsers,
    getMessages,
    sendMessage,
    subscribedToMessages,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
