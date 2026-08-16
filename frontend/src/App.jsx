import { useState } from 'react'
import FirstPage from "./pages/FirstPage"
import { createBrowserRouter, RouterProvider, Link, Outlet, Navigate } from "react-router-dom";
// import Useparams from "./components/Useparams"; 
import { useNavigate } from "react-router-dom";
import LoginPage from './pages/LoginPage';
import './App.css'
import RegisterPage from './pages/RegisterPage';




const router = createBrowserRouter([
  {
    path: "/",
    element: <FirstPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
]);
function App() {
  const [count, setCount] = useState(0)

  return (
    <div>
        <RouterProvider router={router} />
    </div>
  )
}

export default App
