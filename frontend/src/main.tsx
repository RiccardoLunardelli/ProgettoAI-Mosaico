import { lazy, StrictMode, Suspense, type JSX } from "react";
import { createRoot } from "react-dom/client";

// @ts-ignore
import "rsuite/Toggle/styles/index.css";
import "./css/index.css";
import "./css/App.css";
import "./css/googleMaterialIcons.css";
import "./css/color.css";
import "./css/tab.css";
import "./css/table.css";
import "./css/textInput.css";
import "./css/pulseDot.css";
import "./css/animation.css";
import "./css/card.css";

import ErrorBoundaryInnerTag from "./components/error/ErrorBoundaryInner";
import ErrorBoundaryTag from "./components/error/ErrorBoundary";
import { Provider } from "react-redux";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import { authCheckSliceReducer } from "./stores/slices/Auth/authCheckSlice";
import { inputSliceReducer } from "./stores/slices/Base/inputSlice";
import { userInfoSliceReducer } from "./stores/slices/Base/userInfoSlice";
import { loaderSliceReducer } from "./stores/slices/Base/loaderSlice";

const HomeTag = lazy(() => import("./components/Home/Home"));
const CommonLayoutTag = lazy(
  () => import("./components/commonlayout/CommonLayout"),
);
const MasterCommonLayoutTag = lazy(
  () => import("./components/commonlayout/MasterCommonLayout"),
);
const ProtectedRoute = lazy(
  () => import("./components/protectedRoute/ProtectedRoute"),
);
const LoginTag = lazy(
  () => import("./components/login/Login"),
);

let childrenRouterArr: any = [
  //Lista dispositivi
  {
    path: "/",
    element: <span>test</span>,
    errorElement: <ErrorBoundaryInnerTag />,
  },
  //Lista dispositivi
  {
    path: "/Home",
    element: (
      <Suspense fallback="">
        <HomeTag />
      </Suspense>
    ),
    errorElement: <ErrorBoundaryInnerTag />,
  },
];

const protectedChildrenArr: any[] = [
  {
    element: (
      <Suspense fallback="">
        <ErrorBoundaryTag>
          <Suspense>
            <CommonLayoutTag />
          </Suspense>
        </ErrorBoundaryTag>
      </Suspense>
    ),
    children: childrenRouterArr,
  },
];

//Viene inizializzato il layout comune
//Nell'Outlet di CommonLayoutTag verrà mostrata la pagina relativa in base al path
const router = createBrowserRouter([
  {
    element: (
      <Suspense fallback="">
        <ErrorBoundaryTag>
          <MasterCommonLayoutTag />
        </ErrorBoundaryTag>
      </Suspense>
    ),
    children: [
      {
        element: (
          <Suspense fallback="">
            <ErrorBoundaryTag>
              <Suspense fallback="">
                <ProtectedRoute />
              </Suspense>
            </ErrorBoundaryTag>
          </Suspense>
        ),
        children: protectedChildrenArr,
      },

      {
        path: "/login",
        element: (
          <Suspense fallback="">
            <ErrorBoundaryTag>
              <Suspense fallback="">
                <LoginTag />
              </Suspense>
            </ErrorBoundaryTag>
          </Suspense>
        ),
      },
    ],
  },
]);

//Metodo per creare la root in maniera sicura
function SecureRoot(): JSX.Element {
  //Crea lo store redux qua al volo
  const reduxStore = configureStore({
    reducer: {
      authCheckSlice: authCheckSliceReducer,
      loaderSlice: loaderSliceReducer,
      inputSlice: inputSliceReducer,
      userInfoSlice: userInfoSliceReducer,
    },
    devTools:
      (import.meta.env.VITE_DEBUG_DEVTOOLS?.toString()?.toLowerCase() ?? "") ==
      "true",
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware()
  });

  return (
    <StrictMode>
      <Provider store={reduxStore}>
        <RouterProvider router={router} />
      </Provider>
    </StrictMode>
  );
}

createRoot(document.getElementById("root")!).render(<SecureRoot />);
