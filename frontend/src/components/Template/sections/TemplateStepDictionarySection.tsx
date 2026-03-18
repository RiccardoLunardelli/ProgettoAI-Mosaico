import { lazy, Suspense } from "react";
import type { DictionaryVersionScoreInterface } from "../../../stores/slices/Base/dictionaryListSlice";

const RunsListSkeleton = lazy(() => import("../../Skeleton/RunsListSkeleton"));
const BasicButtonGenericTag = lazy(
  () => import("../../button/BasicButtonGeneric"),
);

interface DictionaryListInterface {
  id: string;
  name: string;
  version: string;
}

interface TemplateStepDictionarySelectionTagPropsInterface {
  selectedDictionaryId: string;
  dictionaryList: DictionaryListInterface[];
  dictionaryDetail: any;
  dictionaryScore: DictionaryVersionScoreInterface;
  mainCardWidth: string;
  mainCardMinWidth: string;
  contentWidth: string;
  infoCardHeight: string;
  listCardHeight: string;
  footerWidth: string;
  onSelectDictionaryId: (singleId: string, singleVersion: string) => void;
  onNext: () => void;
}

function TemplateStepDictionarySelectionTag({
  selectedDictionaryId,
  dictionaryList,
  dictionaryDetail,
  dictionaryScore,
  onSelectDictionaryId,
  onNext,
}: TemplateStepDictionarySelectionTagPropsInterface) {


  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      {/* SINISTRA */}
      <div
        style={{
          width: "50%",
          height: "100%",
          minHeight: 0,
          padding: "24px 20px 20px 24px",
          boxSizing: "border-box",
          borderRight: "1px solid #e5e7eb",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            padding: "18px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
            boxSizing: "border-box",
            height: "260px",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <span style={{ fontSize: "20px", fontWeight: 600 }}>Dictionary</span>

          <div
            style={{
              width: "100%",
              marginTop: "12px",
              flex: 1,
              minHeight: 0,
              overflow: "auto",
            }}
          >
            {(dictionaryList ?? []).length > 0 ? (
              <>
                {(dictionaryList ?? []).map((singleId: DictionaryListInterface) => {
                  const isSelected =
                    selectedDictionaryId === String(singleId.id ?? "");

                  return (
                    <div
                      key={`${singleId.id}`}
                      className={`HoverTransform ${isSelected ? "RunSelected" : ""}`}
                      style={{
                        borderRadius: "8px",
                        padding: "8px 10px",
                        width: "100%",
                        cursor: "pointer",
                        fontSize: "13px",
                        color: "var(--black)",
                        marginTop: "8px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        boxSizing: "border-box",
                      }}
                      onClick={() => {
                        onSelectDictionaryId(singleId.id, singleId.version);
                      }}
                    >
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: 500,
                        }}
                      >
                        {singleId.name}
                      </span>
                    </div>
                  );
                })}
              </>
            ) : (
              <span style={{ opacity: "60%" }}>Nessun dictionary trovato</span>
            )}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            opacity: "0.5",
            fontSize: "14px",
            flexShrink: 0,
          }}
        >
          Preview dictionary
        </div>

        <div
          style={{
            backgroundColor: "#f3f5f7",
            borderRadius: "8px",
            padding: "10px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
            boxSizing: "border-box",
            flex: 1,
            minHeight: 0,
            overflow: "auto",
          }}
        >
          {dictionaryDetail && selectedDictionaryId !== "" ? (
            <pre
              style={{
                margin: 0,
                textAlign: "left",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontSize: "13px",
                width: "100%",
              }}
            >
              {JSON.stringify(dictionaryDetail, null, 2)}
            </pre>
          ) : selectedDictionaryId !== "" ? (
            <Suspense fallback="">
              <RunsListSkeleton />
            </Suspense>
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: "0.6",
                fontSize: "14px",
              }}
            >
              Seleziona una dictionary
            </div>
          )}
        </div>
      </div>

      {/* DESTRA */}
      <div
        style={{
          width: "50%",
          height: "100%",
          minHeight: 0,
          padding: "24px 24px 20px 20px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            opacity: "0.5",
            fontSize: "14px",
            flexShrink: 0,
          }}
        >
          Statistiche version
        </div>

        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            padding: "14px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
            boxSizing: "border-box",
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              backgroundColor: "#f8fafc",
              borderRadius: "8px",
              padding: "10px 14px",
              flex: 1,
              minWidth: "160px",
            }}
          >
            <div style={{ fontSize: "12px", opacity: "0.6" }}>
              Average score
            </div>
            <div style={{ fontSize: "20px", fontWeight: 700 }}>
              {dictionaryScore?.avg_score ?? "-"}
            </div>
          </div>

          <div
            style={{
              backgroundColor: "#f8fafc",
              borderRadius: "8px",
              padding: "10px 14px",
              flex: 1,
              minWidth: "160px",
            }}
          >
            <div style={{ fontSize: "12px", opacity: "0.6" }}>
              Numero template
            </div>
            <div style={{ fontSize: "20px", fontWeight: 700 }}>
              {dictionaryScore?.templates?.length ?? 0}
            </div>
          </div>

          <div
            style={{
              backgroundColor: "#f8fafc",
              borderRadius: "8px",
              padding: "10px 14px",
              width: "100%",
            }}
          >
            <div style={{ fontSize: "12px", opacity: "0.6" }}>
              Dictionary version
            </div>
            <div style={{ fontSize: "16px", fontWeight: 700 }}>
              {dictionaryScore?.dictionary_version ?? "-"}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            opacity: "0.5",
            fontSize: "14px",
            flexShrink: 0,
          }}
        >
          Template collegati
        </div>

        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            padding: "10px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
            boxSizing: "border-box",
            flex: 1,
            minHeight: 0,
            overflow: "auto",
          }}
        >
          {(dictionaryScore?.templates ?? []).length > 0 ? (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "13px",
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "10px",
                      borderBottom: "1px solid #e5e7eb",
                      whiteSpace: "nowrap",
                      position: "sticky",
                      top: 0,
                      backgroundColor: "#ffffff",
                    }}
                  >
                    Template
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "10px",
                      borderBottom: "1px solid #e5e7eb",
                      whiteSpace: "nowrap",
                      position: "sticky",
                      top: 0,
                      backgroundColor: "#ffffff",
                      display: "flex",
                      justifyContent: "center"
                    }}
                  >
                    Score
                  </th>
                </tr>
              </thead>

              <tbody>
                {(dictionaryScore?.templates ?? []).map((singleTemplate) => {
                  return (
                    <tr key={singleTemplate.run_id}>
                      <td
                        style={{
                          padding: "10px",
                          borderBottom: "1px solid #f1f5f9",
                          verticalAlign: "top",
                          display: "flex",
                          marginLeft: "10px"
                        }}
                      >
                        {singleTemplate.template ?? "-"}
                      </td>

                      <td
                        style={{
                          padding: "10px",
                          borderBottom: "1px solid #f1f5f9",
                          verticalAlign: "top",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {singleTemplate.score ?? "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div
              style={{
                padding: "12px",
                fontSize: "13px",
                opacity: "0.6",
              }}
            >
              Nessun template associato a questa dictionary version
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            flexShrink: 0,
          }}
        >
          <Suspense fallback="">
            <BasicButtonGenericTag
              textToSee="Avanti ai template"
              disabledButton={selectedDictionaryId == ""}
              clickCallBack={onNext}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

export default TemplateStepDictionarySelectionTag;