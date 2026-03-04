import { useTranslation } from "react-i18next";
import { ClearCacheAndReload } from "../../commons/commonsFunctions";
import { Suspense } from "react";
import BasicButtonTag from "../button/BasicButtonGeneric";

function ErrorBoundaryInnerTag() {
  const { t } = useTranslation();
  //Metodo usato per aggiornare il sito
  const HandleReloadSite = () => {
    //Pulisce la cache ed aggiorna il sito
    ClearCacheAndReload();
  };

  //Rimuove il token
  localStorage.removeItem("jwtToken");
  
  return (
    <div>
      <h1>{t("Oops! Something went wrong.")}</h1>
      <p>{t("Please try again later.")}</p>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Suspense fallback="">
          <BasicButtonTag
            textToSee={t("Reload")}
            clickCallBack={HandleReloadSite}
          />
        </Suspense>
      </div>
    </div>
  );
}
export default ErrorBoundaryInnerTag;
