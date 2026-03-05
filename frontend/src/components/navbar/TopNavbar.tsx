import { useNavigate } from "react-router-dom";
import { lazy } from "react";
import Logo from "../../../public/logo/unnamed-Photoroom.png";

const NavBarLogOut = lazy(() => import("./NavBarLogOut"));
const NavbarUserInfoTag = lazy(() => import("./NavbarUserInfo"));

function TopNavbar() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        width: "100%",
        height: "60px",

        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",

        background: "#ffffff",
        color: "#477dda",

        borderBottom: "1px solid #e5e7eb",

        position: "relative",
        padding: "0 50px",
        boxSizing: "border-box",
      }}
    >
      {/* LEFT: Logo / Titolo */}
      <div
        style={{
          fontSize: "18px",
          fontWeight: 700,
          color: "#477dda",
          cursor: "pointer",
          userSelect: "none",
        }}
        onClick={() => navigate("/")}
      >
        Semantic AI Mapper
      </div>

      {/* RIGHT: User + Logout */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "15px",
          fontWeight: 500,
          color: "#477dda",
        }}
      >
        {/* User info */}
        <NavbarUserInfoTag />

        {/* Logout */}
        <NavBarLogOut />
      </div>
    </div>
  );
}

export default TopNavbar;
