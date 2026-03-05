import { LogoutAPIHook } from "../../customHooks/API/Auth/logoutAPI";

function NavBarLogOut() {
  const [LogoutAPI] = LogoutAPIHook();

  const HandleLogOutOnClick = () => {
    LogoutAPI({ showLoader: true });
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        cursor: "pointer",
      }}
      onClick={HandleLogOutOnClick}
    >
      <span className="material-symbols-outlined" style={{ fontSize: "26px" }}>
        logout
      </span>
      <span style={{ marginLeft: "" }}>Sign Out</span>
    </div>
  );
}

export default NavBarLogOut;
