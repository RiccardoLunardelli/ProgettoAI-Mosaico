import { lazy, Suspense } from "react";

const NavBarElementTag = lazy(() => import("./Element/NavBarElement"));

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
            pathToLink={"/Test"}
            iconName={"material-symbols-outlined"}
            iconSpan={"home"}
            customMarginTop="15px"
            customFontSize="14px"
          />

        </div>
      </div>
    </Suspense>
  );
}

export default NavBarTag;
