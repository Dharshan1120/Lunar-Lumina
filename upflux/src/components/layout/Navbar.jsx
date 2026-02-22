import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../../services/firebase";

function Navbar() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <nav>
      <Link to="/">Home</Link>
      {" | "}

      {user ? (
        <>
            <Link to="/dashboard">Dashboard</Link>
          {" | "}
          <Link to="/quiz">Take Quiz</Link>
          {" | "}
          <Link to="/history">History</Link>
          {" | "}
          <button onClick={handleLogout}>Logout</button>
        </>
      ) : (
        <Link to="/login">Login</Link>
      )}
    </nav>
  );
}

export default Navbar;
