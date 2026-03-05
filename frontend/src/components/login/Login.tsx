import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import { lazy, Suspense, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { LoginAPIHook } from "../../customHooks/API/Auth/loginAPI.ts";
import { ResultTypeEnum } from "../../commons/commonsEnums.tsx";
import { useMediaQuery } from "react-responsive";
import { widthMaxMobile } from "../../commons/commonsVariables.tsx";
import { SetInputSlice } from "../../stores/slices/Base/inputSlice.ts";

const BasicButtonTag = lazy(() => import("../button/BasicButtonGeneric.tsx"));

const TextInputTitleTag = lazy(() => import("../input/TextInputTitle"));
const PasswordInputTitleTag = lazy(() => import("../input/PasswordInputTitle"));

//Usata per prendersi i valori nello Slice degli input
const inputIdList = [
  "Login-Email",
  "Login-Password",
  "Register-Email",
  "Register-Password",
  "Register-Name",
];

//Pagina Login
function LoginTag() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [LoginAPI] = LoginAPIHook();

  const [registerMode, SetRegisterMode] = useState(false)

  //Metodo per avere un oggetto con i valori degli input
  const inputSliceValue: {
    "Login-Email": string;
    "Login-Password": string;
    "Register-Email": string;
    "Register-Password": string;
    "Register-Name": string;
  } = useSelector((state: any) => {
    //Per ogni chiave dello Slice degli input
    return Object.keys(state.inputSlice.value).reduce(
      function (accumulator: any, currentValue: any) {
        //Controllo se questa chiave mi serve
        if (inputIdList.includes(currentValue)) {
          //Se passa tutti i controlli, salvo il valore
          accumulator[currentValue] = state.inputSlice.value[currentValue];
        }
        return accumulator;
      },
      {
        "Login-Email": "",
        "Login-Password": "",
        "Register-Email": "",
        "Register-Password": "",
        "Register-Name": "",
      },
    );
  });

  //Usate per indicare sia siamo da mobile, tablet o pc
  const isMobile = useMediaQuery({ maxWidth: widthMaxMobile });

  const ResetInputValue = () => {
    dispatch(
      SetInputSlice({
        id: "Login-Email",
        value: "",
      }),
    );
    dispatch(
      SetInputSlice({
        id: "Login-Password",
        value: "",
      }),
    );
    dispatch(
      SetInputSlice({
        id: "Register-Name",
        value: "",
      }),
    );dispatch(
      SetInputSlice({
        id: "Register-Email",
        value: "",
      }),
    );dispatch(
      SetInputSlice({
        id: "Register-Password",
        value: "",
      }),
    );
    
  };

  useEffect(() => {
    ResetInputValue();
  }, []);

  //Metodo eseguito al click del bottone "Login"
  const HandleLogInClick = () => {
    //Controllo nome vuoto
    if (inputSliceValue["Login-Email"].replaceAll(" ", "") == "") {
      toast.error(t("VoidEmailField"));
      return;
    }
    //Controllo password vuoto
    if (inputSliceValue["Login-Password"].replaceAll(" ", "") == "") {
      toast.error(t("VoidPasswordField"));
      return;
    }

    //CHIAMATA API
    LoginAPI({
      data: {
        email: inputSliceValue["Login-Email"],
        password: inputSliceValue["Login-Password"],
      },
      showLoader: true,
      EndCallback(returnValue) {
        console.debug(returnValue);
        //Controllo di sicurezza
        if (
          (returnValue?.result ?? ResultTypeEnum.Error) == ResultTypeEnum.Error
        ) {
          toast.error(t("Login-Error"));

          return;
        }

        //Se si è loggato
        navigate("/");
      },
    });
  };
  
  //Metodo eseguito al click del bottone "Login"
  const HandleRegisterClick = () => {
    //Controllo nome vuoto
    if (inputSliceValue["Register-Name"].replaceAll(" ", "") == "") {
      toast.error(t("VoidNameField"));
      return;
    }
    //Controllo email vuoto
    if (inputSliceValue["Register-Email"].replaceAll(" ", "") == "") {
      toast.error(t("VoidEmailField"));
      return;
    }//Controllo password vuoto
    if (inputSliceValue["Register-Password"].replaceAll(" ", "") == "") {
      toast.error(t("VoidPasswordField"));
      return;
    }

    //CHIAMATA API
    //TODO CHIMATA REGISTER
  };

  return (
    <div
      style={{
        minWidth: "100%",
        width: "100%",
        maxWidth: "100%",

        minHeight: "100%",
        height: "100%",
        maxHeight: "100%",

        display: "flex",

        flexDirection: "column",
        alignItems: "center",

        backgroundColor: "var(--mainBackgroundColor)",
      }}
    >
      <div
        style={{
          display: "flex",

          flexDirection: "column",

          marginTop: "3%",
        }}
      >
        <img
          alt="Logo"
          style={{
            height: "75px",
          }}
        />
      </div>
      <div
        className="CardVoidContainer"
        style={{
          minWidth: isMobile ? "80%" : "25%",

          minHeight: isMobile ? "60%" : "40%",

          marginTop: isMobile ? "10%" : "1.5%",
        }}
      >
        <div
          style={{
            minWidth: "90%",
            width: "90%",
            maxWidth: "90%",

            minHeight: "90%",
            height: "90%",
            maxHeight: "90%",

            padding: "5% 5%",

            display: "flex",

            flexDirection: "column",
          }}
          role="none"
          onKeyUp={(ev: any) => {
            //Controlla se può accettare o no il tasto invio
            if (
              inputSliceValue["Login-Email"].replaceAll(" ", "") == "" ||
              inputSliceValue["Login-Password"].replaceAll(" ", "") == ""
            ) {
              return;
            }
            //Controlla che ci sia la proprietà keyCode
            if (!Object.hasOwn(ev, "keyCode")) {
              return;
            }
            //Controlla che il keyCode sia l'invio
            if (ev.keyCode != 13) {
              return;
            }
            //Esegue l'azione del click del bottone "Login"
            if(!registerMode) {
              HandleLogInClick();
            } else {
              HandleRegisterClick();
            }
            
          }}
        >
          <div
            style={{
              marginTop: "5%",
              color: "var(--mainTextColor)",
            }}
          >
            <TextInputTitleTag idInput="Login-Email" title={t("Email")} />
          </div>
          <div
            style={{
              marginTop: isMobile ? "10%" : "5%",
              color: "var(--mainTextColor)",
            }}
          >
            <PasswordInputTitleTag
              idInput={"Login-Password"}
              title={t("Password")}
            />
          </div>

          <div
            style={{
              marginTop: isMobile ? "10%" : "5%",

              display: "flex",
              justifyContent: "center",
            }}
          >
            <div id="Login-LoginButton" role="none" onClick={HandleLogInClick}>
              <Suspense fallback="">
                <BasicButtonTag
                  textToSee="Login"
                  disabledButton={
                    inputSliceValue["Login-Email"].replaceAll(" ", "") == "" ||
                    inputSliceValue["Login-Password"].replaceAll(" ", "") == ""
                  }
                  isFill={true}
                />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginTag;
