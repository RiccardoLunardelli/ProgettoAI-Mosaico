import { lazy, Suspense } from "react";
import ollamaLogo from "../../../../public/logo/ollama.png";

const BasicButtonGenericTag = lazy(
  () => import("../../button/BasicButtonGeneric"),
);

const CheckboxTag = lazy(() =>
  import("rsuite").then((module) => ({ default: module.Checkbox })),
);
const Toggle = lazy(() =>
  import("rsuite").then((module) => ({ default: module.Toggle })),
);

const MonacoEditorTag = lazy(() => import("@monaco-editor/react"));

interface StepOneResponseInterface {
  run_id: string;
  has_ambiguous: boolean;
  ambigouous_count: number;
}

interface TemplateStepMatchingTagPropsInterface {
  stepOneResponse: StepOneResponseInterface | null;
  useLLM: boolean;
  llmSuggestion: null | {};
  checkboxValue: boolean;
  llmPatchValue: string;
  contentWidth: string;
  mainCardMinWidth: string;
  footerWidth: string;
  onToggleUseLLM: (value: boolean) => void;
  onGeneratePatchLLM: () => void;
  onPatchChange: (value: string) => void;
  onToggleApplyPatch: () => void;
  onNext: () => void;
}

function TemplateStepMatchingTag({
  stepOneResponse,
  useLLM,
  llmSuggestion,
  checkboxValue,
  llmPatchValue,
  onToggleUseLLM,
  onGeneratePatchLLM,
  onPatchChange,
  onToggleApplyPatch,
  onNext,
}: TemplateStepMatchingTagPropsInterface) {
  return (
    <div
      style={{
        width: "100%",
        minHeight: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "16px",
        boxSizing: "border-box",
        overflow: "auto"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "900px",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
        }}
      >
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            padding: "16px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
            boxSizing: "border-box",
            width: "100%",
            minWidth: 0,
            minHeight: "560px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "stretch",
              width: "100%",
              minWidth: 0,
            }}
          >
            {/* HEADER */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                minWidth: 0,
              }}
            >
              <img
                src={ollamaLogo}
                style={{
                  width: "40px",
                  height: "40px",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: "20px",
                  fontWeight: 600,
                  marginLeft: "8px",
                  minWidth: 0,
                  wordBreak: "break-word",
                }}
              >
                Modello LLM
              </span>
            </div>

            {/* CONTENUTO */}
            <div
              style={{
                width: "100%",
                minWidth: 0,
                marginTop: "14px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              {/* WARNING */}
              <div
                style={{
                  width: "100%",
                  backgroundColor: "#fff7ed",
                  border: "1px solid #fed7aa",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  boxSizing: "border-box",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#9a3412",
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: "18px",
                      color: "#f97316",
                      flexShrink: 0,
                    }}
                  >
                    warning
                  </span>
                  <span
                    style={{
                      wordBreak: "break-word",
                    }}
                  >
                    Ambiguità trovate
                  </span>
                </div>

                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#ea580c",
                    flexShrink: 0,
                  }}
                >
                  {stepOneResponse?.ambigouous_count ?? 0}
                </span>
              </div>

              {/* TOGGLE */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                  minWidth: 0,
                }}
              >
                <Suspense fallback="">
                  <Toggle
                    checked={useLLM}
                    onChange={(e: boolean) => {
                      onToggleUseLLM(e);
                    }}
                  />
                </Suspense>

                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 500,
                    minWidth: 0,
                    wordBreak: "break-word",
                  }}
                >
                  Usa LLM per risolvere le ambiguità
                </span>
              </div>

              {/* LLM SECTION */}
              {useLLM && (
                <>
                  <Suspense fallback="">
                    <BasicButtonGenericTag
                      textToSee="Genera patch LLM"
                      clickCallBack={onGeneratePatchLLM}
                    />
                  </Suspense>

                  {llmSuggestion && (
                    <>
                      <div
                        style={{
                          width: "100%",
                          minWidth: 0,
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "13px",
                            opacity: "0.7",
                            marginBottom: "8px",
                            fontWeight: 500,
                            wordBreak: "break-word",
                          }}
                        >
                          PATCH LLM PROPOSTE (MODIFICABILE)
                        </span>

                        <div
                          style={{
                            width: "100%",
                            maxWidth: "100%",
                            minWidth: 0,
                            height: "300px",
                            borderRadius: "8px",
                            overflow: "hidden",
                            border: "1px solid #d1d5db",
                            backgroundColor: "#f9fafb",
                            boxSizing: "border-box",
                          }}
                        >
                          <Suspense fallback="">
                            <MonacoEditorTag
                              key={useLLM && llmSuggestion ? "llm-editor-open" : "llm-editor-closed"}
                              height="300px"
                              width="100%"
                              defaultLanguage="json"
                              theme="vs-light"
                              value={llmPatchValue}
                              onChange={(value) => {
                                onPatchChange(value ?? "");
                              }}
                              options={{
                                minimap: { enabled: false },
                                fontSize: 13,
                                wordWrap: "on",
                                automaticLayout: true,
                                scrollBeyondLastLine: false,
                                formatOnPaste: true,
                                formatOnType: true,
                              }}
                            />
                          </Suspense>
                        </div>
                      </div>

                      <Suspense fallback="">
                        <CheckboxTag
                          checked={checkboxValue}
                          onChange={onToggleApplyPatch}
                        >
                          Applica questa patch
                        </CheckboxTag>
                      </Suspense>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            width: "100%",
            minWidth: 0,
            marginTop: "18px",
          }}
        >
          <Suspense fallback="">
            <BasicButtonGenericTag
              textToSee="Avanti al risultato"
              clickCallBack={onNext}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

export default TemplateStepMatchingTag;