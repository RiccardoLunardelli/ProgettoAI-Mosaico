import { memo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { DefaultFunctionVar } from "../../../commons/commonsVariables";

//Valore di opacità custom de default della scritta
const customFontOpacityDefault: string | undefined = undefined;

//Oggetto Singola voce di menu
const NavBarElementTag = memo(function NavBarElementTag({
  //Nome visualizzato
  nameToDraw = "",
  //Path
  pathToLink = "",
  //Grandezza custom del font del testo
  customFontSize = "11px",
  //Custom Margin Top
  customMarginTop = "0px",
  //Custom Tooltip
  customTooltip = "",
  //Nome CSS Icona
  iconName = "",
  //Nome Icona
  iconSpan = "",
  //Indica se la voce è selezionata
  startSelected = false,
  //Indica se fa riferimento ad un link esterno
  externalLink = false,
  //Apertura link con target _blank
  targetBlank = false,
  //Valore di opacità custom della scritta
  customFontOpacity = customFontOpacityDefault,
  //Indica se deve eseguire o no l'azione al click
  disabled = false,
  //Metodo che esegue al click
  onClick = DefaultFunctionVar,

  //Informazioni per il badge, se serve
  customBadgeText = "",
  customBadgeBackgroundColor = "",
  customBadgeTextColor = "",
}: {
  nameToDraw?: string;
  pathToLink?: string;
  customFontSize?: string;
  customMarginTop?: string;
  customTooltip?: string;
  iconName?: string;
  iconSpan?: string;
  startSelected?: boolean;
  externalLink?: boolean;
  targetBlank?: boolean;
  customFontOpacity?: string;
  disabled?: boolean;
  onClick?: () => void;

  customBadgeText?: string;
  customBadgeBackgroundColor?: string;
  customBadgeTextColor?: string;
}) {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  //Metodo eseguito al click
  const HandleLinkClick = (event: any) => {
    //Controllo se è disabilitato
    if (disabled) {
      event.preventDefault();

      try {
        onClick();
      } catch (error) {
        console.log(error);
      }

      return;
    }

    try {
      onClick();
    } catch (error) {
      console.log(error);
    }
  };

  //Controllo nome da scrivere
  let nameToDrawTranslate: string = nameToDraw;
  try {
    nameToDrawTranslate = t(nameToDraw);
  } catch (errorMessage: unknown) {
    console.log([errorMessage]);
  }

  return (
    <Link
      id={`NavBarElement-${pathToLink}`}
      to={pathToLink}
      state={{
        fromNavbar: true,
      }}
      onClick={HandleLinkClick}
      data-testid="Test-LinkConnection"
      target={targetBlank ? "_blank" : undefined}
      title={customTooltip}
      style={{
        color:
          //Se selezionato, viene colorato
          startSelected ? "var(--navBarSelectedColor)" : undefined,

        marginTop: customMarginTop,

        minWidth: "100%",
        width: "100%",
        maxWidth: "100%",

        display: "flex",

        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "flex",

          justifyContent: "flex-start",
          alignItems: "flex-start",

          width: customBadgeText == "" ? "100%" : "calc(100% - 18px)",
        }}
      >
        {iconName != "" && (
          <div
            style={{
              marginRight: "15px",

              height: "24px",
              display: "flex",
              alignItems: "center"
            }}
          >
            <span
              style={{
                fontSize: "20px",
                marginLeft: "-3px",

                opacity: customFontOpacity,
              }}
              className={iconName}
            >
              {iconSpan}
            </span>
          </div>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            width: iconName == "" ? "100%" : "calc(100% - 15px)",
            height: "24px",
          }}
        >
          <span
            style={{
              fontSize: customFontSize,

              opacity: customFontOpacity,

              marginLeft: iconName == "" ? "15px" : undefined,

              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}

            title={nameToDrawTranslate}
          >
            {nameToDrawTranslate}
          </span>
        </div>
      </div>

      {customBadgeText != "" ? (
        <div
          style={{
            borderRadius: "15px",
            backgroundColor: customBadgeBackgroundColor,

            minWidth: "18px",
            height: "18px",
            padding: parseInt(customBadgeText) > 99 ? "2px 8px" : "2px 0px",

            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <span
            style={{
              color: customBadgeTextColor,

              fontSize: "9px",
              fontStyle: "normal",
              fontWeight: "700",
              lineHeight: "normal",
            }}
          >
            {customBadgeText}
          </span>
        </div>
      ) : (
        <></>
      )}
    </Link>
  );
});

export default NavBarElementTag;
