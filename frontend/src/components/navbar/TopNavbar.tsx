import { useNavigate } from "react-router-dom";
import { lazy } from "react";
import { useDispatch, useSelector } from "react-redux";
import { SetCurrentPathSlice } from "../../stores/slices/Base/currentPath";

const NavBarLogOut = lazy(() => import("./NavBarLogOut"));
const NavbarUserInfoTag = lazy(() => import("./NavbarUserInfo"));

function TopNavbar() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const currentPathSlice: { value: string | null } = useSelector(
    (state: { currentPathSlice: { value: string | null } }) =>
      state.currentPathSlice,
  );

  const isThisAdminPath =
    currentPathSlice.value === "User Management" ||
    currentPathSlice.value === "Client Management" ||
    currentPathSlice.value === "Store Management" ||
    currentPathSlice.value === "Store Devices Management" ||
    currentPathSlice.value === "Artifact Management" ||
    currentPathSlice.value === "Config Management" ||
    currentPathSlice.value === "Graph" ||
    currentPathSlice.value === "Create Template";

  const isAdminRootPath = currentPathSlice.value === "Admin";

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

        {isAdminRootPath ? (
          <div
            style={{
              marginLeft: "15px",
              display: "flex",
              alignItems: "center",
            }}
          >
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
                fontWeight: 500,
              }}
            >
              Admin
            </span>
          </div>
        ) : isThisAdminPath ? (
          <div
            style={{
              marginLeft: "15px",
              display: "flex",
              alignItems: "center",
            }}
          >
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
                fontWeight: 500,
                cursor: "pointer",
              }}
              onClick={() => {
                navigate("/Admin");
                dispatch(SetCurrentPathSlice("Admin"));
              }}
            >
              Admin
            </span>

            <span
              className="material-symbols-outlined"
              style={{
                fontSize: "12px",
                color: "var(--black)",
                opacity: "50%",
                marginLeft: "12px",
              }}
            >
              arrow_forward_ios
            </span>

            <span
              style={{
                marginLeft: "12px",
                color: "var(--black)",
                fontSize: "14px",
                opacity: "0.75",
              }}
            >
              {currentPathSlice.value}
            </span>
          </div>
        ) : currentPathSlice.value ? (
          <div
            style={{
              marginLeft: "15px",
              display: "flex",
              alignItems: "center",
            }}
          >
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
                fontWeight: 500,
                cursor: "pointer",
              }}
              onClick={() => {
                navigate("/");
                dispatch(SetCurrentPathSlice(null));
              }}
            >
              Home
            </span>

            <span
              className="material-symbols-outlined"
              style={{
                fontSize: "12px",
                color: "var(--black)",
                opacity: "50%",
                marginLeft: "12px",
              }}
            >
              arrow_forward_ios
            </span>

            <span
              style={{
                marginLeft: "12px",
                color: "var(--black)",
                fontSize: "14px",
                opacity: "0.75",
              }}
            >
              {currentPathSlice.value}
            </span>
          </div>
        ) : (
          <></>
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "15px",
          fontWeight: 500,
          color: "#477dda",
        }}
      >
        <NavbarUserInfoTag />
        <NavBarLogOut />
      </div>
    </div>
  );
}

export default TopNavbar;
