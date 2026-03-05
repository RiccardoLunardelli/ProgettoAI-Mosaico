import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import { lazy, Suspense, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { LoginAPIHook } from "../../customHooks/API/Auth/loginAPI.ts";
import { ResultTypeEnum } from "../../commons/commonsEnums.tsx";
import { useMediaQuery } from "react-responsive";
import { widthMaxMobile } from "../../commons/commonsVariables.tsx";
import { SetInputSlice } from "../../stores/slices/Base/inputSlice.ts";
import { SetUserInfoSlice, type UserInfoInterface } from "../../stores/slices/Base/userInfoSlice.ts";

const BasicButtonTag = lazy(() => import("../button/BasicButtonGeneric.tsx"));

const TextInputTitleTag = lazy(() => import("../input/TextInputTitle"));
const PasswordInputTitleTag = lazy(() => import("../input/PasswordInputTitle"));

//Pagina Login
function LoginTag() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [LoginAPI] = LoginAPIHook();

  //Metodo per avere un oggetto con i valori degli input
  const inputSliceValue = useSelector(
    (state: {
      inputSlice: {
        value: any;
      };
    }) => {
      //Per ogni chiave dello Slice degli input
      return Object.keys(state.inputSlice.value).reduce(
        function (
          accumulator: {
            Email: string;
            Password: string;
          },
          currentValue: string
        ) {
          //Controllo se questa chiave mi serve
          if (
            (currentValue == "Login-Email" ||
              currentValue == "Login-Password") &&
            currentValue.split("-").length > 1
          ) {
            //Salvo il valore
            (accumulator as any)[currentValue.split("-")[1]] =
              state.inputSlice.value[currentValue];
          }
          return accumulator;
        },
        {
          Email: "",
          Password: "",
        }
      );
    }
  );


  //Usate per indicare sia siamo da mobile, tablet o pc
  const isMobile = useMediaQuery({ maxWidth: widthMaxMobile });

  const ResetInputValue = () => {
    dispatch(
      SetInputSlice({
        id: "Login-Email",
        value: "",
      })
    );
    dispatch(
      SetInputSlice({
        id: "Login-Password",
        value: "",
      })
    );
  };

  useEffect(() => {
    ResetInputValue();
  }, []);

  //Metodo eseguito al click del bottone "Login"
  const HandleLogInClick = () => {
    //Controllo nome vuoto
    if (inputSliceValue.Email.replaceAll(" ", "") == "") {
      toast.error(t("VoidEmailField"));
      return;
    }
    //Controllo password vuoto
    if (inputSliceValue.Password.replaceAll(" ", "") == "") {
      toast.error(t("VoidPasswordField"));
      return;
    }

    //CHIAMATA API
    LoginAPI({
      data: {
        email: inputSliceValue.Email,
        password: inputSliceValue.Password,
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

        console.log("infoUser", returnValue?.message)

  

        // dispatch(SetUserInfoSlice())
        //Se si è loggato
        navigate("/");
      },
    });
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
                inputSliceValue.Email.replaceAll(" ", "") == "" ||
                inputSliceValue.Password.replaceAll(" ", "") == ""
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
              HandleLogInClick();
            }}
          >
            <div
              style={{
                marginTop: "5%",
                color: "var(--mainTextColor)",
              }}
            >
              <TextInputTitleTag
                idInput="Login-Email"
                title={t("Email")}
              />
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
              <div
                id="Login-LoginButton"
                role="none"
                onClick={HandleLogInClick}
              >
                <Suspense fallback="">
                  <BasicButtonTag
                    textToSee="Login"
                    disabledButton={
                      inputSliceValue.Email.replaceAll(" ", "") == "" ||
                      inputSliceValue.Password.replaceAll(" ", "") == ""
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
