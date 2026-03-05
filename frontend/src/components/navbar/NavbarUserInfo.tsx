import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useSelector } from "react-redux";
import type { UserInfoInterface } from "../../stores/slices/Base/userInfoSlice";
import { useNavigate } from "react-router-dom";

function NavbarUserInfoTag() {

  const navigate = useNavigate();

  const userInfoSlice: { value: UserInfoInterface } = useSelector(
    (state: { userInfoSlice: { value: UserInfoInterface } }) =>
      state.userInfoSlice,
  );

  

  return (
    <DropdownMenu.Root>
      {/* Trigger: div cliccabile */}
      <DropdownMenu.Trigger asChild>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "5px 10px",
            borderRadius: "8px",
            cursor: "pointer",
            userSelect: "none",
            transition: "background 0.2s",
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "28px", color: "#477dda" }}
          >
            account_circle
          </span>
          <span style={{ fontSize: "13px", color: "#477dda" }}>
            {userInfoSlice?.value?.email ?? ""}
          </span>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "18px", color: "#477dda" }}
          >
            expand_more
          </span>
        </div>
      </DropdownMenu.Trigger>

      {/* Contenuto dropdown */}
      <DropdownMenu.Content
        sideOffset={5}
        align="end"
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
          minWidth: "160px",
          padding: "5px 0",
        }}
      >
        <DropdownMenu.Item
          style={{
            padding: "10px 15px",
            cursor: "pointer",
            color: "#477dda",
            fontSize: "14px",
            transition: "background 0.2s",
          }}
          onClick={() => navigate("/home")}
        >
          Le mie run
        </DropdownMenu.Item>
        <DropdownMenu.Item
          style={{
            padding: "10px 15px",
            cursor: "pointer",
            color: "#477dda",
            fontSize: "14px",
            transition: "background 0.2s",
          }}
          onClick={() => navigate("/")}
        >
          Settings
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}

export default NavbarUserInfoTag;
