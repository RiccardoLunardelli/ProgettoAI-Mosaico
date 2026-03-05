import { lazy, Suspense, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Outlet } from "react-router-dom";
import { CheckAuthAPIHook } from "../../customHooks/API/Auth/checkAuthAPI";
import { Loader } from "rsuite";
import {
  SetUserInfoSlice,
  type UserInfoInterface,
} from "../../stores/slices/Base/userInfoSlice";

export default function ProtectedRoute() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [CheckAuthAPI] = CheckAuthAPIHook();

  const authCheck: string | null = useSelector(
    (state: {
      authCheckSlice: {
        value: string | null;
      };
    }) => state.authCheckSlice.value,
  );

  //Durante la prima renderizzazione
  useEffect(() => {
    //Chiamata API per capire se è autenticato
    CheckAuthAPI({
      showLoader: true,
    });
  }, []);

  //Ogni volta che cambia authCheck
  useEffect(() => {
    //Controlla se non è loggato
    if (authCheck == "") {
      //Naviga al login
      navigate("/login");

      //Si ferma qua
      return;
    }

    //Controllo se è loggato
    if (authCheck != "") {
      //Naviga alla lista dei rapportini / interventi
      navigate("/");

      //Si ferma qua
      return;
    }
  }, [authCheck]);

  //Se non ha ancora ricevuto la risposta di authcheck
  if (authCheck == null) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",

          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Suspense fallback="">
          <Loader center />
        </Suspense>
      </div>
    );
  }

  return <Outlet />;
}
