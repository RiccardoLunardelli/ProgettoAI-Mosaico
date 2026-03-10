import { lazy, StrictMode, Suspense, type JSX } from "react";
import { createRoot } from "react-dom/client";

// @ts-ignore
import "rsuite/Toggle/styles/index.css";
import "./css/index.css";
import "./css/App.css";
import "./css/googleMaterialIcons.css";
import "./css/color.css";
import "./css/textInput.css";
import "./css/animation.css";
import "./css/mainIndex.css";

import ErrorBoundaryInnerTag from "./components/error/ErrorBoundaryInner";
import ErrorBoundaryTag from "./components/error/ErrorBoundary";
import { Provider } from "react-redux";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import { authCheckSliceReducer } from "./stores/slices/Auth/authCheckSlice";
import { inputSliceReducer } from "./stores/slices/Base/inputSlice";
import { userInfoSliceReducer } from "./stores/slices/Base/userInfoSlice";
import { loaderSliceReducer } from "./stores/slices/Base/loaderSlice";
import { runsListSliceReducer } from "./stores/slices/Base/runsListSlice";
import { currentPathSliceReducer } from "./stores/slices/Base/currentPath";
import { knowledgeBaseListSliceReducer } from "./stores/slices/Base/knowledgeBaseListSlice";
import { templateBaseListSliceReducer } from "./stores/slices/Base/templateBaseListSlice";
import { dictionaryListSliceReducer } from "./stores/slices/Base/dictionaryListSlice";
import { deviceListListSliceReducer } from "./stores/slices/Base/deviceListSlice";
import { templateListSliceReducer } from "./stores/slices/Base/templateListSlice";

const HomePageTag = lazy(() => import("./components/Home/HomePage"));
const TemplatePageTag = lazy(
  () => import("./components/Template/TemplatePage"),
);
const DeviceListPageTag = lazy(
  () => import("./components/deviceList/DeviceListPage"),
);
const DictionaryPageTag = lazy(
  () => import("./components/dictionary/DictionaryPage"),
);
const TemplateBasePageTag = lazy(
  () => import("./components/TemplateBase/TemplateBasePage"),
);
const KnowledgeBasePageTag = lazy(
  () => import("./components/knowledgebase/KnowledgeBasePage"),
);
const RunsListTag = lazy(() => import("./components/listRuns/RunsList"));
const CommonLayoutTag = lazy(
  () => import("./components/commonlayout/CommonLayout"),
);
const MasterCommonLayoutTag = lazy(
  () => import("./components/commonlayout/MasterCommonLayout"),
);
const ProtectedRoute = lazy(
  () => import("./components/protectedRoute/ProtectedRoute"),
);
const LoginTag = lazy(() => import("./components/login/Login"));

let childrenRouterArr: any = [
  //Home
  {
    path: "/",
    element: (
      <Suspense fallback="">
        <HomePageTag />
      </Suspense>
    ),
    errorElement: <ErrorBoundaryInnerTag />,
  }, //Home
  {
    path: "/Home",
    element: (
      <Suspense fallback="">
        <HomePageTag />
      </Suspense>
    ),
    errorElement: <ErrorBoundaryInnerTag />,
  },
  {
    path: "/Runs",
    element: (
      <Suspense fallback="">
        <RunsListTag />
      </Suspense>
    ),
    errorElement: <ErrorBoundaryInnerTag />,
  },
  {
    path: "/KnowledgeBase",
    element: (
      <Suspense fallback="">
        <KnowledgeBasePageTag />
      </Suspense>
    ),
    errorElement: <ErrorBoundaryInnerTag />,
  },
  {
    path: "/TemplateBase",
    element: (
      <Suspense fallback="">
        <TemplateBasePageTag />
      </Suspense>
    ),
    errorElement: <ErrorBoundaryInnerTag />,
  },
  {
    path: "/Dictionary",
    element: (
      <Suspense fallback="">
        <DictionaryPageTag />
      </Suspense>
    ),
    errorElement: <ErrorBoundaryInnerTag />,
  },
  {
    path: "/DeviceList",
    element: (
      <Suspense fallback="">
        <DeviceListPageTag />
      </Suspense>
    ),
    errorElement: <ErrorBoundaryInnerTag />,
  },
  {
    path: "/Template",
    element: (
      <Suspense fallback="">
        <TemplatePageTag />
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
        path: "/Login",
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
      runsListSlice: runsListSliceReducer,
      currentPathSlice: currentPathSliceReducer,
      knowledgeBaseListSlice: knowledgeBaseListSliceReducer,
      templateBaseListSlice: templateBaseListSliceReducer,
      dictionaryListSlice: dictionaryListSliceReducer,
      deviceListListSlice: deviceListListSliceReducer,
      templateListSlice: templateListSliceReducer,
    },
    devTools:
      (import.meta.env.VITE_DEBUG_DEVTOOLS?.toString()?.toLowerCase() ?? "") ==
      "true",
    middleware: (getDefaultMiddleware) => getDefaultMiddleware(),
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
