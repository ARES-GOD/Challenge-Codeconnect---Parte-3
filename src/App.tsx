import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useState } from "react";
import styled from "styled-components";

import BarraLateral from "./components/BarraLateral/BarraLateral";
import Home from "./pages/Home";
import Feed from "./pages/Feed";
import Share from "./pages/Share";
import Perfil from "./pages/Perfil";
import SobreNosotros from "./pages/SobreNosotros";
import Login from "./pages/Login";       // página que renderiza <Authentication initialMode="login" .../>
import Register from "./pages/Register"; // página que renderiza <Authentication initialMode="register" .../>
import ProjectDetail from "./pages/ProjectDetail";

const MainContainer = styled.main`
background-color: #00090E;
  display: flex;
  gap: 24px;
  padding:56px;
`;

// Layout privado (barra lateral + contenido)
function PrivateLayout() {
  return (
    <div className="min-h-screen bg-gray-100">
      <MainContainer>
        <BarraLateral />
        <Outlet /> {/* aquí se renderizan las pantallas hijas */}
      </MainContainer>
    </div>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <Routes>
      {/* públicas */}
      <Route
        path="/login"
        element={<Login onLogin={() => setIsAuthenticated(true)} />}
      />
      <Route
        path="/register"
        element={<Register onLogin={() => setIsAuthenticated(true)} />}
      />

      {/* privadas */}
      {isAuthenticated ? (
        <Route element={<PrivateLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/share" element={<Share />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/sobreNosotros" element={<SobreNosotros />} />
          <Route path="/project/:projectId" element={<ProjectDetail />} />
        </Route>
      ) : (
        // Si no está autenticado, redirige todo a /login
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
}
