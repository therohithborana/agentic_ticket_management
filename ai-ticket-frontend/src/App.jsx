import { Outlet } from "react-router-dom";
import Navbar from "./components/navbar";

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      <Navbar />
      <main className="pt-4">
        <Outlet />
      </main>
    </div>
  );
} 