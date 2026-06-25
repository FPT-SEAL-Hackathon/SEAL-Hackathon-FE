import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="bg-gray-900 text-white p-4 flex justify-between items-center shadow-md">
      <div className="font-bold text-xl">
        <Link to="/">SEAL Hackathon</Link>
      </div>
      <div className="flex gap-4 items-center">
        {user ? (
          <>
            <Link to="/dashboard" className="hover:text-gray-300">Dashboard</Link>
            <Link to="/events" className="hover:text-gray-300">Events</Link>
            <span className="text-gray-400 border-l pl-4 border-gray-600">
              Welcome, {user.name || "User"}
            </span>
            <button 
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition-colors"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:text-gray-300">Login</Link>
            <Link to="/register" className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm transition-colors">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
