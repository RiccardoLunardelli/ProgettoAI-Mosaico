import { useDispatch, useSelector } from "react-redux";
import type { UserInfoInterface } from "../../stores/slices/Base/userInfoSlice";
import { useNavigate } from "react-router-dom";
import { SetCurrentPathSlice } from "../../stores/slices/Base/currentPath";

function HomePageTag() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const userInfoSlice: { value: UserInfoInterface } = useSelector(
    (state: { userInfoSlice: { value: UserInfoInterface } }) =>
      state.userInfoSlice,
  );

  function HandleNavigateCardOnClick(path: string, pathName: string) {
    navigate(path);

    dispatch(SetCurrentPathSlice(pathName));
  }

  return (
    <div
      style={{
        backgroundColor: "#f9fafb",
        height: "100%",
        width: "100%",
      }}
    >
      {/* Benventuo */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            marginLeft: "50px",
            marginTop: "25px",
          }}
        >
          <span style={{ fontSize: "23px", fontWeight: 600 }}>
            Benvenuto, {userInfoSlice?.value?.name ?? ""}
          </span>
          <span style={{ opacity: "65%", fontSize: "18px" }}>
            Seleziona una sezione
          </span>
        </div>
      </div>
      {/* Lista Card sezione */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "20px",
          width: "100%",
          marginTop: "20px",
          paddingLeft: "50px",
          paddingRight: "50px",
          boxSizing: "border-box",
        }}
      >
        {/* Dictionary */}
        <div
          style={{
            borderRadius: "10px",
            height: "180px",
            padding: "15px",
            display: "flex",
            flexDirection: "column",
          }}
          className="HoverTransform"
          onClick={() =>
            HandleNavigateCardOnClick("Dictionary", "Dictionary")
          }
        >
          {/* Icona + testo */}
          <div
            style={{
              marginLeft: "10px",
              marginTop: "8px",
              height: "80px",
              width: "60px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {/* Icona */}
            <div
              style={{
                height: "60px",
                width: "60px",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "40px", color: "#3268c5", zIndex: 1 }}
              >
                dictionary
              </span>

              <div
                style={{
                  position: "absolute",
                  height: "100%",
                  width: "100%",
                  backgroundColor: "#477dda",
                  opacity: "0.2",
                  borderRadius: "6px",
                }}
              />
            </div>
          </div>
          {/* Testo sotto icona */}
          <div
            style={{
              marginLeft: "10px",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            <span
              style={{
                fontSize: "20px",
                fontWeight: 500,
                color: "var(--black)",
              }}
            >
              Dictionary
            </span>
            <span
              style={{
                fontSize: "14px",
                fontWeight: 400,
                color: "var(--black)",
                opacity: 0.6,
                marginTop: "4px",
              }}
            >
              Gestisci e aggiorna dizionari semantici
            </span>
          </div>
        </div>
        {/* Knowledge Base */}
        <div
          style={{
            borderRadius: "10px",
            height: "180px",
            padding: "15px",
            display: "flex",
            flexDirection: "column",
          }}
          className="HoverTransform"
          onClick={() =>
            HandleNavigateCardOnClick("KnowledgeBase", "Knowledge Base")
          }
        >
          {/* Icona + testo */}
          <div
            style={{
              marginLeft: "10px",
              marginTop: "8px",
              height: "80px",
              width: "60px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {/* Icona */}
            <div
              style={{
                height: "60px",
                width: "60px",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "40px", color: "#3268c5", zIndex: 1 }}
              >
                psychology
              </span>

              <div
                style={{
                  position: "absolute",
                  height: "100%",
                  width: "100%",
                  backgroundColor: "#477dda",
                  opacity: "0.2",
                  borderRadius: "6px",
                }}
              />
            </div>
          </div>
          {/* Testo sotto icona */}
          <div
            style={{
              marginLeft: "10px",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            <span
              style={{
                fontSize: "20px",
                fontWeight: 500,
                color: "var(--black)",
              }}
            >
              Knowledge Base
            </span>
            <span
              style={{
                fontSize: "14px",
                fontWeight: 400,
                color: "var(--black)",
                opacity: 0.6,
                marginTop: "4px",
              }}
            >
              Versioni della knowledge base
            </span>
          </div>
        </div>
        {/* Template */}
        <div
          style={{
            borderRadius: "10px",
            height: "180px",
            padding: "15px",
            display: "flex",
            flexDirection: "column",
          }}
          className="HoverTransform"
        >
          {/* Icona + testo */}
          <div
            style={{
              marginLeft: "10px",
              marginTop: "8px",
              height: "80px",
              width: "60px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {/* Icona */}
            <div
              style={{
                height: "60px",
                width: "60px",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "40px", color: "#3268c5", zIndex: 1 }}
              >
                article
              </span>

              <div
                style={{
                  position: "absolute",
                  height: "100%",
                  width: "100%",
                  backgroundColor: "#477dda",
                  opacity: "0.2",
                  borderRadius: "6px",
                }}
              />
            </div>
          </div>
          {/* Testo sotto icona */}
          <div
            style={{
              marginLeft: "10px",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            <span
              style={{
                fontSize: "20px",
                fontWeight: 500,
                color: "var(--black)",
              }}
            >
              Template
            </span>
            <span
              style={{
                fontSize: "14px",
                fontWeight: 400,
                color: "var(--black)",
                opacity: 0.6,
                marginTop: "4px",
              }}
            >
              Matching e run su template
            </span>
          </div>
        </div>
        {/* Template Base */}
        <div
          style={{
            borderRadius: "10px",
            height: "180px",
            padding: "15px",
            display: "flex",
            flexDirection: "column",
          }}
          className="HoverTransform"
          onClick={() =>
            HandleNavigateCardOnClick("TemplateBase", "Template Base")
          }
        >
          {/* Icona + testo */}
          <div
            style={{
              marginLeft: "10px",
              marginTop: "8px",
              height: "80px",
              width: "60px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {/* Icona */}
            <div
              style={{
                height: "60px",
                width: "60px",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "40px", color: "#3268c5", zIndex: 1 }}
              >
                find_in_page
              </span>

              <div
                style={{
                  position: "absolute",
                  height: "100%",
                  width: "100%",
                  backgroundColor: "#477dda",
                  opacity: "0.2",
                  borderRadius: "6px",
                }}
              />
            </div>
          </div>
          {/* Testo sotto icona */}
          <div
            style={{
              marginLeft: "10px",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            <span
              style={{
                fontSize: "20px",
                fontWeight: 500,
                color: "var(--black)",
              }}
            >
              Template Base
            </span>
            <span
              style={{
                fontSize: "14px",
                fontWeight: 400,
                color: "var(--black)",
                opacity: 0.6,
                marginTop: "4px",
              }}
            >
              Base template per i run
            </span>
          </div>
        </div>
        {/* Device List */}
        <div
          style={{
            borderRadius: "10px",
            height: "180px",
            padding: "15px",
            display: "flex",
            flexDirection: "column",
          }}
          className="HoverTransform"
          onClick={() =>
            HandleNavigateCardOnClick("DeviceList", "Device List")
          }
        >
          {/* Icona + testo */}
          <div
            style={{
              marginLeft: "10px",
              marginTop: "8px",
              height: "80px",
              width: "60px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {/* Icona */}
            <div
              style={{
                height: "60px",
                width: "60px",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "40px", color: "#3268c5", zIndex: 1 }}
              >
                store
              </span>

              <div
                style={{
                  position: "absolute",
                  height: "100%",
                  width: "100%",
                  backgroundColor: "#477dda",
                  opacity: "0.2",
                  borderRadius: "6px",
                }}
              />
            </div>
          </div>
          {/* Testo sotto icona */}
          <div
            style={{
              marginLeft: "10px",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            <span
              style={{
                fontSize: "20px",
                fontWeight: 500,
                color: "var(--black)",
              }}
            >
              Device List
            </span>
            <span
              style={{
                fontSize: "14px",
                fontWeight: 400,
                color: "var(--black)",
                opacity: 0.6,
                marginTop: "4px",
              }}
            >
              Liste dispositivi per store
            </span>
          </div>
        </div>
        {/* Cronologia */}
        <div
          style={{
            borderRadius: "10px",
            height: "180px",
            padding: "15px",
            display: "flex",
            flexDirection: "column",
          }}
          className="HoverTransform"
        >
          {/* Icona + testo */}
          <div
            style={{
              marginLeft: "10px",
              marginTop: "8px",
              height: "80px",
              width: "60px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {/* Icona */}
            <div
              style={{
                height: "60px",
                width: "60px",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "40px", color: "#3268c5", zIndex: 1 }}
              >
                history
              </span>

              <div
                style={{
                  position: "absolute",
                  height: "100%",
                  width: "100%",
                  backgroundColor: "#477dda",
                  opacity: "0.2",
                  borderRadius: "6px",
                }}
              />
            </div>
          </div>
          {/* Testo sotto icona */}
          <div
            style={{
              marginLeft: "10px",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            <span
              style={{
                fontSize: "20px",
                fontWeight: 500,
                color: "var(--black)",
              }}
            >
              History
            </span>
            <span
              style={{
                fontSize: "14px",
                fontWeight: 400,
                color: "var(--black)",
                opacity: 0.6,
                marginTop: "4px",
              }}
            >
              History delle operazioni svolte
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePageTag;
