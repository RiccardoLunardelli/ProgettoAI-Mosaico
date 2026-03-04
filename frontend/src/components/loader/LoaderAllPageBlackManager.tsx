import { Suspense, lazy } from "react";
import { useSelector } from "react-redux";

const LoaderAllPageBlackTag = lazy(() => import("./LoaderAllPageBlack.tsx"));

//Oggetto per gestire il loader
function LoaderAllPageBlackManagerTag() {
  //Prende il valore dello Slice del Loader (se è aperto o chiuso)
  const loaderSliceValue = useSelector(
    (state: {
      loaderSlice: {
        value: boolean;
      };
    }) => state.loaderSlice.value,
  );

  return (
    <>
      {loaderSliceValue && (
        <Suspense>
          <LoaderAllPageBlackTag />
        </Suspense>
      )}
    </>
  );
}

export default LoaderAllPageBlackManagerTag;
