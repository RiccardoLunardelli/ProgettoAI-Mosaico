import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { InputCaseEnum } from "../../../commons/commonsEnums"

import "../../../css/textInput.css"
import "../../../css/color.css";
import "../../../css/mainIndex.css";

const InputTitleTag = lazy(() => import("./InputTitle"));

//Variabili di default
const anyNullVar: any = null;

//Interfaccia dello stato di questo componente
interface ComponentStateInterface {
  //Valore attuale
  currentValue: string;
  //Indica se è visibile o no la password
  isHidden: boolean;
}

function PasswordInputTitleGenericTag({
  idInput = "",
  title = "",
  otherTitleInfo = "",
  placeholder = "",
  inputCase = InputCaseEnum.Insentive,
  disabled = false,

  OnChange = anyNullVar,
  value = "",

  error = false
}) {
  //Ref del div che contiene l'input
  const inputRef = useRef<any>(null);

  //Variabile per gestire gli state presenti in questo componente
  const [componentState, setComponentState] = useState<ComponentStateInterface>(
    {
      currentValue: value,
      isHidden: true,
    }
  );

  //useEffect collegato a value
  useEffect(() => {
    //Imposta la variabile usata per il valore attuale
    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        currentValue: value,
      };
    });
  }, [value]);

  //Al cambio del valore
  const HandleChangeValueInput = (event: { target: any }) => {
    //Nuovo valore dell'input
    let inputValue = event.target.value;
    switch (inputCase) {
      case InputCaseEnum.Lower: {
        inputValue = inputValue.toLowerCase();
        break;
      }
      case InputCaseEnum.Upper: {
        inputValue = inputValue.toUpperCase();
        break;
      }
    }

    //Chiama la callback
    OnChange(inputValue);

    //Imposta la variabile usata per il valore attuale
    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        currentValue: inputValue,
      };
    });

    //Prende la posizione attuale del cursore
    const cursorIndex: number | null = event.target?.selectionStart;

    //Controllo di sicurezza
    if (cursorIndex == null || inputRef.current == null) {
      return;
    }

    //Esegue il metodo per rimettere il valore impostato
    inputRef.current.setSelectionRange(cursorIndex, cursorIndex);
  };

  //Metodo quando cambia la visibilità della password
  const HandlerVisibilityPasswordChange = () => {
    //Controllo di sicurezza
    if (disabled) {
      return;
    }

    //Imposta la variabile usata per isHidden
    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        isHidden: !componentState.isHidden,
      };
    });
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        justifyContent: "flex-start",
        alignItems: "flex-start",
      }}
    >
      <Suspense fallback="">
        <InputTitleTag title={title} otherTitleInfo={otherTitleInfo} error={error}/>
      </Suspense>
      <div
        className={`passwordInputContainer ${disabled ? "inputDisabled" : ""} ${error ? "inputError": ""}`}
      >
        <input
          type={componentState.isHidden ? "password" : "text"}
          id={idInput}
          placeholder={placeholder}
          value={componentState.currentValue}
          onInput={HandleChangeValueInput}
          ref={inputRef}
          autoComplete="off"
          disabled={disabled}
        />
        <div
          className="showPasswordIcon"
          onClick={HandlerVisibilityPasswordChange}
          onKeyDown={HandlerVisibilityPasswordChange}
          role="none"
        >
          {componentState.isHidden ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="16px"
              viewBox="0 -960 960 960"
              width="16px"
              fill="#666666"
            >
              <path d="M792-56 624-222q-35 11-70.5 16.5T480-200q-151 0-269-83.5T40-500q21-53 53-98.5t73-81.5L56-792l56-56 736 736-56 56ZM480-320q11 0 20.5-1t20.5-4L305-541q-3 11-4 20.5t-1 20.5q0 75 52.5 127.5T480-320Zm292 18L645-428q7-17 11-34.5t4-37.5q0-75-52.5-127.5T480-680q-20 0-37.5 4T408-664L306-766q41-17 84-25.5t90-8.5q151 0 269 83.5T920-500q-23 59-60.5 109.5T772-302ZM587-486 467-606q28-5 51.5 4.5T559-574q17 18 24.5 41.5T587-486Z" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="16px"
              viewBox="0 -960 960 960"
              width="16px"
              fill="#666666"
            >
              <path d="M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-146 0-266-81.5T40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200Z" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}

export default PasswordInputTitleGenericTag;
