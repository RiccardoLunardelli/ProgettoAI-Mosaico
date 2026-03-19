import { lazy, Suspense } from "react";
import type {
  TemplateListInterface,
  TemplateListUsageInterface,
} from "../../../stores/slices/Base/templateListSlice";

const RunsListSkeleton = lazy(() => import("../../Skeleton/RunsListSkeleton"));
const BasicButtonGenericTag = lazy(
  () => import("../../button/BasicButtonGeneric"),
);
const Toggle = lazy(() =>
  import("rsuite").then((module) => ({ default: module.Toggle })),
);

interface TemplateStepSelectionTagPropsInterface {
  selectedId: string;
  validateOnly: boolean;
  templateList: TemplateListInterface[];
  templateDetail: any;
  templateUsage: TemplateListUsageInterface[] | null;
  mainCardWidth: string;
  mainCardMinWidth: string;
  contentWidth: string;
  infoCardHeight: string;
  listCardHeight: string;
  footerWidth: string;
  nextButtonText?: string;
  onSelectId: (singleId: string) => void;
  onToggleValidateOnly: (value: boolean) => void;
  onNext: () => void;
}

function TemplateStepSelectionTag({
  selectedId,
  validateOnly,
  templateList,
  templateDetail,
  templateUsage,
  nextButtonText = "Avanti",
  onSelectId,
  onToggleValidateOnly,
  onNext,
}: TemplateStepSelectionTagPropsInterface) {
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
          <span style={{ fontSize: "20px", fontWeight: 600 }}>Template</span>

          <div
            style={{
              width: "100%",
              marginTop: "12px",
              flex: 1,
              minHeight: 0,
              overflow: "auto",
            }}
          >
            {(templateList ?? []).length > 0 ? (
              <>
                {(templateList ?? []).map((singleTemplate: TemplateListInterface) => {
                  const isSelected = selectedId === String(singleTemplate.id ?? "");

                  return (
                    <div
                      key={`${singleTemplate.id}`}
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
                        onSelectId(singleTemplate.id);
                      }}
                    >
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: 500,
                        }}
                      >
                        {singleTemplate.name}
                      </span>
                    </div>
                  );
                })}
              </>
            ) : (
              <span style={{ opacity: "60%" }}>Nessun template trovato</span>
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
          Preview template
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
          {templateDetail && selectedId !== "" ? (
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
              {JSON.stringify(templateDetail, null, 2)}
            </pre>
          ) : selectedId !== "" ? (
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
              Seleziona un template
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
          Informazioni template
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
              Numero utilizzi
            </div>
            <div style={{ fontSize: "20px", fontWeight: 700 }}>
              {templateUsage?.length ?? 0}
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
              Versione template
            </div>
            <div style={{ fontSize: "20px", fontWeight: 700 }}>
              {(templateList ?? []).find((singleTemplate) => singleTemplate.id === selectedId)
                ?.version ?? "-"}
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
              Template selezionato
            </div>
            <div style={{ fontSize: "16px", fontWeight: 700 }}>
              {(templateList ?? []).find((singleTemplate) => singleTemplate.id === selectedId)
                ?.name ?? "-"}
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
          Utilizzi collegati
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
          {(templateUsage ?? []).length > 0 ? (
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
                      backgroundColor: "#ffffff",
                    }}
                  >
                    Client
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "10px",
                      borderBottom: "1px solid #e5e7eb",
                      whiteSpace: "nowrap",
                      backgroundColor: "#ffffff",
                    }}
                  >
                    Store
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "10px",
                      borderBottom: "1px solid #e5e7eb",
                      whiteSpace: "nowrap",
                      backgroundColor: "#ffffff",
                    }}
                  >
                    Device
                  </th>
                </tr>
              </thead>

              <tbody>
                {(templateUsage ?? []).map((singleUsage, index) => {
                  return (
                    <tr
                      key={`${singleUsage.template_id}-${singleUsage.client_id}-${singleUsage.store_id}-${singleUsage.device_id}-${index}`}
                    >
                      <td
                        style={{
                          padding: "10px",
                          borderBottom: "1px solid #f1f5f9",
                          verticalAlign: "top",
                        }}
                      >
                        {singleUsage.client_name ?? "-"}
                      </td>

                      <td
                        style={{
                          padding: "10px",
                          borderBottom: "1px solid #f1f5f9",
                          verticalAlign: "top",
                        }}
                      >
                        {singleUsage.store_name ?? "-"}
                      </td>

                      <td
                        style={{
                          padding: "10px",
                          borderBottom: "1px solid #f1f5f9",
                          verticalAlign: "top",
                        }}
                      >
                        <div>{singleUsage.device_description ?? "-"}</div>
                        <div style={{ fontSize: "11px", opacity: "0.6", marginTop: "2px" }}>
                          {singleUsage.device_hd_plc ?? "-"}
                        </div>
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
              Nessun utilizzo associato a questo template
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
            gap: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <span
              style={{
                marginBottom: "4px",
                fontWeight: 500,
                fontSize: "15px",
              }}
            >
              Validate Only
            </span>

            <Suspense fallback="">
              <Toggle
                checked={validateOnly}
                onChange={(val: boolean) => {
                  onToggleValidateOnly(val);
                }}
              />
            </Suspense>
          </div>

          <Suspense fallback="">
            <BasicButtonGenericTag
              textToSee={nextButtonText}
              disabledButton={selectedId == ""}
              clickCallBack={onNext}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

export default TemplateStepSelectionTag;