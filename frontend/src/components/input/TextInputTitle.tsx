import { lazy } from "react";
import { useDispatch, useSelector } from "react-redux";
import { InputCaseEnum } from "../../commons/commonsEnums";
import { SetInputSlice } from "../../stores/slices/Base/inputSlice";

const TextInputTitleGenericTag = lazy(() =>
  import("./GenericInput/TextInputTitleGeneric"),
);

const defaultHeight: string | undefined = undefined;

function TextInputTitleTag({
  idInput = "",
  title = "",
  otherTitleInfo = "",
  placeholder = "",
  inputCase = InputCaseEnum.Insentive,
  disabled = false,
  height = defaultHeight,
  error = false,
}) {
  const dispatch = useDispatch();

  //Valore attuale dell'input
  const actInputValue = useSelector((state: any) => {
    if (!Object.hasOwn(state.inputSlice.value, idInput)) {
      return "";
    }
    return state.inputSlice.value[idInput];
  });

  //Metodo per andare a settare il valore nello slice
  const HandleChangeValueInput = (inputValue: string = "") => {
    dispatch(
      SetInputSlice({
        id: idInput,
        value: inputValue,
      }),
    );
  };
  return (
    <TextInputTitleGenericTag
      idInput={idInput}
      title={title}
      otherTitleInfo={otherTitleInfo}
      inputCase={inputCase}
      placeholder={placeholder}
      disabled={disabled}
      OnChange={HandleChangeValueInput}
      value={actInputValue}
      height={height}
      error={error}
    />
  );
}

export default TextInputTitleTag;
