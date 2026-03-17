import { lazy, Suspense } from "react";

const RunsListSkeleton = lazy(() => import("../../Skeleton/RunsListSkeleton"));
const BasicButtonGenericTag = lazy(
  () => import("../../button/BasicButtonGeneric"),
);

interface TemplateBaseListInterface {
  id: string;
  name: string;
}

interface TemplateStepTemplateBaseSelectionTagPropsInterface {
  selectedTemplateBaseId: string;
  templateBaseList: TemplateBaseListInterface[];
  templateBaseDetail: any;
  mainCardWidth: string;
  mainCardMinWidth: string;
  contentWidth: string;
  infoCardHeight: string;
  listCardHeight: string;
  footerWidth: string;
  onSelectTemplateBaseId: (singleId: string) => void;
  onNext: () => void;
}

function TemplateStepTemplateBaseSelectionTag({
  selectedTemplateBaseId,
  templateBaseList,
  templateBaseDetail,
  mainCardWidth,
  mainCardMinWidth,
  contentWidth,
  infoCardHeight,
  listCardHeight,
  footerWidth,
  onSelectTemplateBaseId,
  onNext,
}: TemplateStepTemplateBaseSelectionTagPropsInterface) {
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
          <span style={{ fontSize: "20px", fontWeight: 600 }}>
            Template Base
          </span>

          <div
            style={{
              width: "100%",
              height: "100%",
              overflow: "auto",
              marginTop: "10px",
            }}
          >
            {(templateBaseList ?? []).length > 0 ? (
              <>
                {(templateBaseList ?? []).map(
                  (singleId: TemplateBaseListInterface) => {
                    const isSelected =
                      selectedTemplateBaseId === (singleId.id ?? "");

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
                          onSelectTemplateBaseId(singleId.id);
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
                  },
                )}
              </>
            ) : (
              <span style={{ opacity: "60%" }}>
                Nessuna template base trovata
              </span>
            )}
          </div>
        </div>
      </div>

      {templateBaseDetail && selectedTemplateBaseId !== "" ? (
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
            Preview template base
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
              {JSON.stringify(templateBaseDetail, null, 2)}
            </pre>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "flex-end",
              width: footerWidth,
              minWidth: mainCardMinWidth,
              marginTop: "18px",
            }}
          >
            <Suspense fallback="">
              <BasicButtonGenericTag
                textToSee="Avanti al matching"
                disabledButton={selectedTemplateBaseId == ""}
                clickCallBack={onNext}
              />
            </Suspense>
          </div>
        </>
      ) : (
        <>{selectedTemplateBaseId !== "" && <RunsListSkeleton />}</>
      )}
    </>
  );
}

export default TemplateStepTemplateBaseSelectionTag;