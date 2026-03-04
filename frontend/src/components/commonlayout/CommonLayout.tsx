import { lazy, Suspense, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import { useDispatch, useSelector } from "react-redux";

import { useMediaQuery } from "react-responsive";

import { widthMaxMobile } from "../../commons/commonsVariables.tsx";

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
                  margin: "7px 10px",
                }}
                onClick={HandleLogoClick}
                role="none"
              >
                <img
                  alt="Logo"
                  src=""
                  loading="lazy"
                  style={{
                    //minWidth: "120px",
                    //width: "120px",
                    //maxWidth: "120px",

                    minHeight: "30px",
                    height: "30px",
                    maxHeight: "30px",
                  }}
                />
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
      </div>

      <Suspense fallback="">
        <APICallFirstRenderManagerTag />
      </Suspense>
    </>
  );
}

export default CommonLayoutTag;
