import { lazy, Suspense } from "react";
import { Outlet } from "react-router-dom";

const ErrorBoundaryTag = lazy(() => import("../error/ErrorBoundary.tsx"));
const CommonLayoutInnerComponentTag = lazy(
  () => import("./CommonLayoutInnerComponent.tsx")
);

//Wrapper master dell'App
function MasterCommonLayoutTag() {
  return (
    <>
      <ErrorBoundaryTag>
        {/* Zona dove viene caricato il contenuto della pagina */}
        <Outlet />
      </ErrorBoundaryTag>

      <Suspense fallback="">
        <CommonLayoutInnerComponentTag />
      </Suspense>
    </>
  );
}

export default MasterCommonLayoutTag;
