import { lazy, Suspense } from "react";

const NavBarElementTag = lazy(() => import("./Element/NavBarElement"));
const NavBarLogOut = lazy(() => import("./NavBarLogOut"));

function NavBarTag() {
  return (
    <Suspense fallback={""}>
      <div
        id="MainMenu"
        style={{
          display: "flex",

          minWidth: "100%",
          width: "100%",
          maxWidth: "100%",

          minHeight: "100%",
          height: "100%",
          maxHeight: "100%",
        }}
      >
        <div
          style={{
            display: "flex",

            flexDirection: "column",

            alignItems: "flex-start",
            justifyContent: "flex-start",

            margin: "0px 20px",

            minWidth: "calc(100% - 40px)",
            width: "calc(100% - 40px)",
            maxWidth: "calc(100% - 40px)",
          }}
        >
          <NavBarElementTag
            nameToDraw={"Home"}
            pathToLink={"/Home"}
            iconName={"material-symbols-outlined"}
            iconSpan={"home"}
            customMarginTop="15px"
            customFontSize="14px"
          />
          <NavBarElementTag
            nameToDraw={"Test"}
            pathToLink={"/Home"}
            iconName={"material-symbols-outlined"}
            iconSpan={"menu"}
            customMarginTop="15px"
            customFontSize="14px"
          />
          <NavBarElementTag
            nameToDraw={"Test"}
            pathToLink={"/Home"}
            iconName={"material-symbols-outlined"}
            iconSpan={"menu"}
            customMarginTop="15px"
            customFontSize="14px"
          />
          <div
            style={{
              marginTop: "auto",
              paddingTop: "5px",
              paddingBottom: "5px",

              width: "100%",

              display: "flex",
              justifyContent: "flex-start",
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <NavBarLogOut />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Suspense>
  );
}

export default NavBarTag;
