import React, { useState } from "react";
import { auth } from "./Firebase"; // Adjust path
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import logo from "./logo.png";
import google from "./google.png"; // Đảm bảo bạn có file này
import axios from "axios";

function RegisterPage() {
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showPopup, setShowPopup] = useState(false); // State cho popup
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      const token = await user.getIdToken();
      localStorage.setItem("authToken", token);

      await axios.post(
        `${
          process.env.REACT_APP_BASE_URL || "http://localhost:5000"
        }/api/auth/register`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      await updateProfile(user, { displayName: userName });
      setShowPopup(true); // Hiển thị popup thành công
    } catch (err) {
      console.error("Registration error:", err);
      let errorMessage = err.message;
      if (err.code === "auth/email-already-in-use") {
        errorMessage =
          "Email already in use. Please log in or use another email.";
      } else if (err.code === "auth/weak-password") {
        errorMessage = "Password should be at least 6 characters.";
      }
      setError(errorMessage);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const token = await userCredential.user.getIdToken();
      localStorage.setItem("authToken", token);

      await axios.post(
        `${
          process.env.REACT_APP_BASE_URL || "http://localhost:5000"
        }/api/auth/register`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setShowPopup(true); // Hiển thị popup thành công
    } catch (error) {
      console.error("Google Sign-in error:", error);
      setError(error.message);
    }
  };

  const closePopup = () => {
    setShowPopup(false);
    navigate("/");
  };

  return (
    <div className="w-full min-h-screen bg-[#06121e] bg-cover bg-center flex items-center justify-center p-4">
      <div className="w-full max-w-md flex flex-col justify-center px-6 py-12 rounded-2xl shadow-md border border-[#0e264073] bg-[#0e274073]">
        <div className="mx-auto w-full max-w-sm">
          <img alt="Movie City" src={logo} className="mx-auto h-12 w-auto" />
          <h2 className="mt-10 text-center text-2xl font-bold tracking-tight text-white">
            Sign Up
          </h2>
        </div>
        <div className="mt-10 mx-auto w-full max-w-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-white"
              >
                User Name
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                autoComplete="username"
                placeholder="Username"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="block w-full rounded-md bg-white px-3 py-3 text-base text-gray-900 outline-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:outline-indigo-600 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-white"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md bg-white px-3 py-3 text-base text-gray-900 outline-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:outline-indigo-600 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-white"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="new-password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md bg-white px-3 py-3 text-base text-gray-900 outline-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:outline-indigo-600 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-white"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                autoComplete="new-password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full rounded-md bg-white px-3 py-3 text-base text-gray-900 outline-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:outline-indigo-600 sm:text-sm"
              />
            </div>
            {error && (
              <p className="font-medium text-sm text-red-700">{error}</p>
            )}
            <button
              type="submit"
              className="w-full rounded-md bg-indigo-600 px-3 py-3 text-sm font-semibold text-white hover:bg-indigo-500 focus:outline-2 focus:outline-indigo-600"
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full flex justify-center items-center rounded-md bg-white px-3 py-3 text-sm font-semibold text-black hover:opacity-80 focus:outline-2 focus:outline-indigo-600"
            >
              <img src={google} alt="Google Icon" className="h-6 mr-2" />
              Sign Up with Google
            </button>
          </form>
          <p className="mt-5 text-center text-sm text-white">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/signin")}
              className="font-semibold text-indigo-500 hover:underline"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>

      {/* Popup thông báo thành công */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-[#0e274073] border border-[#0e264073] rounded-2xl p-8 shadow-lg w-full max-w-md mx-4 transform transition-all animate-fadeIn">
            <div className="text-4xl text-green-500 text-center mb-4">✔</div>
            <h3 className="text-2xl font-bold text-white text-center">
              Registration Successful!
            </h3>
            <p className="text-gray-200 text-center mt-4">
              Welcome to Movie City! Your account has been created.
            </p>
            <div className="mt-6 flex justify-center">
              <button
                onClick={closePopup}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RegisterPage;
