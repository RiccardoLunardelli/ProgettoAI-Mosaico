import { lazy, Suspense, useEffect, useRef, useState } from "react";

import "../../../css/textInput.css"
import "../../../css/color.css";
import "../../../css/mainIndex.css";
import { InputCaseEnum } from "../../../commons/commonsEnums";

const InputTitleTag = lazy(() => import("./InputTitle"));

//Variabili di default
const anyNullVar: any = null;
const defaultHeight: string | undefined = undefined;

function TextInputTitleGenericTag({
  idInput = "",
  title = "",
  otherTitleInfo = "",
  placeholder = "",
  inputCase = InputCaseEnum.Insentive,
  disabled = false,

  OnChange = anyNullVar,
  value = "",

  customColor = "",
  height = defaultHeight,

  error = false
}) {
  //Ref del div che contiene l'input
  const inputRef = useRef<any>(null);

  //State usato per gestire il valore attuale
  const [currentValue, setCurrentValue] = useState<string>(value);

  //useEffect collegato a value
  useEffect(() => {
    //Imposta il nuovo valore nello state
    setCurrentValue(value);
  }, [value]);

  //Al cambio del valore
  const HandleChangeValueInput = (event: { target: any }) => {
    //Nuovo valore
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

    //Imposta il nuovo valore nello state
    setCurrentValue(inputValue);

    //Prende la posizione attuale del cursore
    const cursorIndex: number | null = event.target?.selectionStart;

    //Controllo di sicurezza
    if (cursorIndex == null || inputRef.current == null) {
      return;
    }

    //Esegue il metodo per rimettere il valore impostato
    inputRef.current.setSelectionRange(cursorIndex, cursorIndex);
  };
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        justifyContent: "flex-start",
        alignItems: "flex-start",

        height: height,
      }}
    >
      <Suspense>
        <InputTitleTag title={title} otherTitleInfo={otherTitleInfo} error={error}/>
      </Suspense>
      <div
        className={`textInputContainer ${error ? "inputError": ""}`}
        style={{
          height: height,
        }}
      >
        <input
          style={{
            color: customColor != "" ? customColor : undefined,
          }}
          type="text"
          id={idInput}
          placeholder={placeholder}
          value={currentValue}
          onInput={HandleChangeValueInput}
          disabled={disabled}
          ref={inputRef}
          autoComplete="off"
        />
      </div>
    </div>
  );
}

export default TextInputTitleGenericTag;
