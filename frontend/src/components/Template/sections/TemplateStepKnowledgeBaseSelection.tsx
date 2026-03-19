import { lazy, Suspense } from "react";

const RunsListSkeleton = lazy(() => import("../../Skeleton/RunsListSkeleton"));
const BasicButtonGenericTag = lazy(
  () => import("../../button/BasicButtonGeneric"),
);

interface KnowledgeBaseListInterface {
  id: string;
  name: string;
}

interface TemplateStepKnowledgeBaseSelectionTagPropsInterface {
  selectedKnowledgeBaseId: string;
  knowledgeBaseList: KnowledgeBaseListInterface[];
  knowledgeBaseDetail: any;
  mainCardWidth: string;
  mainCardMinWidth: string;
  contentWidth: string;
  infoCardHeight: string;
  listCardHeight: string;
  footerWidth: string;
  onSelectKnowledgeBaseId: (singleId: string) => void;
  onNext: () => void;
}

function TemplateStepKnowledgeBaseSelectionTag({
  selectedKnowledgeBaseId,
  knowledgeBaseList,
  knowledgeBaseDetail,
  mainCardWidth,
  mainCardMinWidth,
  contentWidth,
  infoCardHeight,
  listCardHeight,
  footerWidth,
  onSelectKnowledgeBaseId,
  onNext,
}: TemplateStepKnowledgeBaseSelectionTagPropsInterface) {
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
          marginLeft: "30px",
          marginTop: "30px"
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
            Knowledge Base
          </span>

          <div
            style={{
              width: "100%",
              height: "100%",
              overflow: "auto",
              marginTop: "10px",
            }}
          >
            {(knowledgeBaseList ?? []).length > 0 ? (
              <>
                {(knowledgeBaseList ?? []).map(
                  (singleId: KnowledgeBaseListInterface) => {
                    const isSelected =
                      selectedKnowledgeBaseId === (singleId.id ?? "");

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
                          onSelectKnowledgeBaseId(singleId.id);
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
                Nessuna knowledge base trovata
              </span>
            )}
          </div>
        </div>
      </div>

      {knowledgeBaseDetail && selectedKnowledgeBaseId !== "" ? (
        <>
          <div
            style={{
              marginTop: "20px",
              display: "flex",
              opacity: "50%",
              width: contentWidth,
              minWidth: mainCardMinWidth,
              marginLeft: "30px",
            }}
          >
            Preview knowledge base
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
              marginLeft: "30px",
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
              {JSON.stringify(knowledgeBaseDetail, null, 2)}
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
                textToSee="Avanti alla template base"
                disabledButton={selectedKnowledgeBaseId == ""}
                clickCallBack={onNext}
              />
            </Suspense>
          </div>
        </>
      ) : (
        <>{selectedKnowledgeBaseId !== "" && <RunsListSkeleton />}</>
      )}
    </>
  );
}

export default TemplateStepKnowledgeBaseSelectionTag;