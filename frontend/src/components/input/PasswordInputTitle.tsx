import { lazy, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { SetInputSlice } from "../../stores/slices/Base/inputSlice"

const PasswordInputTitleGenericTag = lazy(() =>
  import("./GenericInput/PasswordInputTitleGeneric"),
);

function PasswordInputTitleTag({
  idInput = "",
  title = "",
  otherTitleInfo = "",
  startValue = "",
  error = false,
}) {
  const dispatch = useDispatch();

  const actInputValue = useSelector((state: any) => {
    if (!Object.hasOwn(state.inputSlice.value, idInput)) {
      return "";
    }
    return state.inputSlice.value[idInput];
  });

  const HandleChangeValueInput = (value: string = "") => {
    dispatch(
      SetInputSlice({
        id: idInput,
        value: value,
      }),
    );
  };

  //Solo la prima volta
  useEffect(() => {
    //Controllo di sicurezza
    if (startValue == "") {
      return;
    }

    //Imposta il valore di partenza
    HandleChangeValueInput(startValue);
  }, []);
  return (
    <PasswordInputTitleGenericTag
      idInput={idInput}
      title={title}
      otherTitleInfo={otherTitleInfo}
      OnChange={HandleChangeValueInput}
      value={actInputValue}
      error={error}
    />
  );
}

export default PasswordInputTitleTag;
