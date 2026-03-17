import { lazy, Suspense } from "react";
import type { TemplateListInterface } from "../../../stores/slices/Base/templateListSlice";

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
  mainCardWidth,
  mainCardMinWidth,
  contentWidth,
  infoCardHeight,
  listCardHeight,
  footerWidth,
  nextButtonText = "Avanti",
  onSelectId,
  onToggleValidateOnly,
  onNext,
}: TemplateStepSelectionTagPropsInterface) {
  return (
    <>
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "8px",
          padding: "10px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
          boxSizing: "border-box",
          width: mainCardWidth,
          minWidth: mainCardMinWidth,
          height: listCardHeight,
          minHeight: "260px",
          display: "flex",
          justifyContent: "flex-start",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            margin: "10px",
            alignItems: "flex-start",
            width: "100%",
            height: "100%",
          }}
        >
          <span style={{ fontSize: "20px", fontWeight: 600 }}>Template</span>

          <div
            style={{
              width: "100%",
              height: "100%",
              overflow: "auto",
              marginTop: "10px",
            }}
          >
            {(templateList ?? []).length > 0 ? (
              <>
                {(templateList ?? []).map((singleId: TemplateListInterface) => {
                  const isSelected = selectedId === (singleId.id ?? "");

                  return (
                    <div
                      key={`${singleId.id}`}
                      className={`HoverTransform ${isSelected ? "RunSelected" : ""}`}
                      style={{
                        borderRadius: "8px",
                        padding: "6px 10px",
                        width: "95%",
                        cursor: "pointer",
                        fontSize: "13px",
                        color: "var(--black)",
                        marginTop: "8px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                      onClick={() => {
                        onSelectId(singleId.id);
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
              <span style={{ opacity: "60%" }}>Nessun template trovato</span>
            )}
          </div>
        </div>
      </div>

      {templateDetail && selectedId !== "" ? (
        <>
          <div
            style={{
              marginTop: "20px",
              display: "flex",
              opacity: "50%",
              width: contentWidth,
              minWidth: mainCardMinWidth,
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
              width: contentWidth,
              minWidth: mainCardMinWidth,
              height: infoCardHeight,
              minHeight: "300px",
              display: "flex",
              justifyContent: "flex-start",
              overflow: "auto",
            }}
          >
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
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              width: footerWidth,
              minWidth: mainCardMinWidth,
              marginTop: "18px",
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

            <div
              style={{
                display: "flex",
                alignItems: "center",
              }}
            >
              <Suspense fallback="">
                <BasicButtonGenericTag
                  textToSee={nextButtonText}
                  disabledButton={selectedId == ""}
                  clickCallBack={onNext}
                />
              </Suspense>
            </div>
          </div>
        </>
      ) : (
        <>{selectedId !== "" && <RunsListSkeleton />}</>
      )}
    </>
  );
}

export default TemplateStepSelectionTag;