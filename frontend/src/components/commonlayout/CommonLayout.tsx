import { lazy, Suspense, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import { useDispatch, useSelector } from "react-redux";

import { useMediaQuery } from "react-responsive";

import { widthMaxMobile } from "../../commons/commonsVariables.tsx";
import type { UserInfoInterface } from "../../stores/slices/Base/userInfoSlice.ts";

const ErrorBoundaryTag = lazy(() => import("../error/ErrorBoundary.tsx"));

const NavBarTag = lazy(() => import("../navbar/NavBar"));
const APICallFirstRenderManagerTag = lazy(
  () => import("./APICallFirstRenderManager.tsx"),
);

//Oggetto che gestisce l'App. Comprende la navbar e la parte Outlet centrale
function CommonLayoutTag() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  const userInfoSlice: {
    value: UserInfoInterface;
  } = useSelector(
    (state: {
      userInfoSlice: {
        value: UserInfoInterface;
      };
    }) => state.userInfoSlice,
  );

  //Usate per indicare sia siamo da mobile, tablet o pc
  const isMobile = useMediaQuery({ maxWidth: widthMaxMobile });

  //Metodo per tornare alla Home, cliccando il Logo nella fascia a sinistra
  const HandleLogoClick = () => {
    navigate("/");
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "row",

          minWidth: "100vw",
          width: "100vw",
          maxWidth: "100vw",

          minHeight: "100vh",
          height: "100vh",
          maxHeight: "100vh",
        }}
        id="MainDiv"
      >
        {/* Se è da pc o tablet */}
        {!isMobile ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",

              userSelect: "none",

              minWidth: "16vw",
              width: "16vw",
              maxWidth: "16vw",
            }}
          >
            <div
              id="MainLogoMenu"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",

                minWidth: "100%",
                width: "100%",
                maxWidth: "100%",

                minHeight: "48px",
              }}
            >
              <div
                style={{
                  cursor: "pointer",

                  display: "flex",
                  alignItems: "center",
                  margin: "7px 10px",
                }}
                onClick={HandleLogoClick}
                role="none"
              >
                <span
                  className="material-symbols-outlined"
                  style={{ color: "var(--white)", fontSize: "30px" }}
                >
                  account_circle
                </span>
                <span style={{ color: "var(--white)", fontSize: "10px", marginLeft: "10px" }}>
                  {userInfoSlice?.value?.email ?? ""}
                </span>
              </div>
            </div>
            <Suspense>
              <div
                style={{
                  display: "flex",

                  width: "100%",
                  minWidth: "100%",
                  maxWidth: "100%",

                  height: "100%",

                  overflow: "auto",
                }}
              >
                <NavBarTag />
              </div>
            </Suspense>
          </div>
        ) : (
          <></>
        )}

        <div
          id="OutletParentDiv"
          style={{
            minWidth: isMobile ? "100vw" : "84vw",
            width: isMobile ? "100vw" : "84vw",
            maxWidth: isMobile ? "100vw" : "84vw",

            overflow: "auto",
          }}
        >
          <Suspense fallback="">
            <ErrorBoundaryTag>
              {/* Zona dove viene caricato il contenuto della pagina */}
              <Outlet />
            </ErrorBoundaryTag>
          </Suspense>
        </div>
      </div>

      <Suspense fallback="">
        <APICallFirstRenderManagerTag />
      </Suspense>
    </>
  );
}

export default CommonLayoutTag;
