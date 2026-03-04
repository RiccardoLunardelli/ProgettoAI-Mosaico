import "../../../css/color.css";
import "../../../css/mainIndex.css";

//Oggetto titolo usato nei vari input
function InputTitleTag({ title = "", otherTitleInfo = "", error = false }) {
  return (
    <div>
      <span
        style={{
          fontSize: "13px",
          fontWeight: "bold",
          color: error ? "var(--red, red)" : "",
        }}
      >
        {title}
      </span>
      {otherTitleInfo != "" && (
        <span
          style={{
            fontSize: "10px",
            color: error ? "var(--red, red)" : "",
          }}
        >
          &nbsp;
          {otherTitleInfo}
        </span>
      )}
    </div>
  );
}
export default InputTitleTag;
