import { lazy, Suspense } from "react";
import { Outlet } from "react-router-dom";

import TopNavbar from "../navbar/TopNavbar";

const ErrorBoundaryTag = lazy(() => import("../error/ErrorBoundary"));
const APICallFirstRenderManagerTag = lazy(
  () => import("./APICallFirstRenderManager"),
);

function CommonLayoutTag() {
  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",

          width: "100vw",
          height: "100vh",
        }}
      >
        <TopNavbar />

        <div
          style={{
            width: "100%",
            height: "100%",
            overflow: "auto",
          }}
        >
          <Suspense fallback="">
            <ErrorBoundaryTag>
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
