import { useNavigate } from "react-router-dom";
import { lazy } from "react";
import { useDispatch, useSelector } from "react-redux";
import { SetCurrentPathSlice } from "../../stores/slices/Base/currentPath";

const NavBarLogOut = lazy(() => import("./NavBarLogOut"));
const NavbarUserInfoTag = lazy(() => import("./NavbarUserInfo"));

function TopNavbar() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const currentPathSlice: { value: string } = useSelector(
    (state: { currentPathSlice: { value: string } }) => state.currentPathSlice,
  );

  const isThisAdAdminPath = currentPathSlice.value == "User Management";

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
      <div style={{ display: "flex", alignItems: "center" }}>
        <div
          style={{
            fontSize: "18px",
            fontWeight: 700,
            color: "#477dda",
            cursor: "pointer",
            userSelect: "none",
          }}
          onClick={() => {
            navigate("/");
            dispatch(SetCurrentPathSlice(null));
          }}
        >
          Semantic AI Mapper
        </div>
        {/* Current Path */}
        {currentPathSlice.value ? (
          <>
            <div style={{ marginLeft: "15px" }}>
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: "12px",
                  color: "var(--black)",
                  opacity: "50%",
                }}
              >
                arrow_forward_ios
              </span>
              <span
                style={{
                  marginLeft: "12px",
                  color: "var(--black)",
                  fontSize: "14px",
                  cursor: isThisAdAdminPath ? "pointer" : undefined,
                }}
                onClick={() => {
                  if (isThisAdAdminPath) {
                    navigate("/Admin");
                    dispatch(SetCurrentPathSlice("Admin"))
                  }
                  return;
                }}
              >
                {currentPathSlice.value}
              </span>
            </div>
          </>
        ) : (
          <></>
        )}
      </div>
      {/* LEFT: Logo / Titolo */}

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
