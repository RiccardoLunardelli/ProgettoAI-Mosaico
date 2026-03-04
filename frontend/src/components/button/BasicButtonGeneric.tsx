import { memo } from "react";
import "../../css/BasicButton.css";

interface BasicButtonTagProps {
  textToSee: string;
  disabledButton?: boolean;
  isFill?: boolean;
  clickCallBack?: () => void; 
  type?: "button" | "submit" | "reset";
  style?: any;
}

const BasicButtonTag = memo(function BasicButtonTag({
  textToSee,
  disabledButton = false,
  isFill = false,
  clickCallBack,
  type = "button",
  style,
}: BasicButtonTagProps) {
  return (
    <button
      type={type}
      disabled={disabledButton}
      onClick={clickCallBack}
      className={`basic-button ${isFill ? "fill" : "outline"}`}
      style={style}
    >
      {textToSee}
    </button>
  );
});

export default BasicButtonTag;