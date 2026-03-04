import { lazy, Suspense } from "react";

import { ToastContainer } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";

const LoaderAllPageBlackManagerTag = lazy(
  () => import("../loader/LoaderAllPageBlackManager.tsx"),
);


//Oggetto per i componenti esterni, presenti in CommonLayout
function CommonLayoutInnerComponentTag() {

  return (
    <>
      <ToastContainer
        position="top-right"
        //position="top-center"
        autoClose={7000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable={false}
        pauseOnHover
        theme="light"
        stacked
      />
      <div>
        {/* Modale Edit Scheda di Rete */}
        {/*<Suspense fallback="">
          <EditSchedeReteManagerTag />
        </Suspense>*/}

        {/* Loader */}
        <Suspense fallback="">
          <LoaderAllPageBlackManagerTag />
        </Suspense>
      </div>
    </>
  );
}

export default CommonLayoutInnerComponentTag;
