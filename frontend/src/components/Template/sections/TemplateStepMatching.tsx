import { lazy, Suspense } from "react";
import ollamaLogo from "../../../../public/logo/ollama.png"

const BasicButtonGenericTag = lazy(
  () => import("../../button/BasicButtonGeneric"),
);
const TextareaTag = lazy(() => import("rsuite/esm/Textarea"));
const CheckboxTag = lazy(() =>
  import("rsuite").then((module) => ({ default: module.Checkbox })),
);
const Toggle = lazy(() =>
  import("rsuite").then((module) => ({ default: module.Toggle })),
);

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
  contentWidth,
  mainCardMinWidth,
  footerWidth,
  onToggleUseLLM,
  onGeneratePatchLLM,
  onPatchChange,
  onToggleApplyPatch,
  onNext,
}: TemplateStepMatchingTagPropsInterface) {
  return (
    <>
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "8px",
          padding: "10px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
          boxSizing: "border-box",
          width: contentWidth,
          minWidth: mainCardMinWidth,
          minHeight: "560px",
          display: "flex",
          justifyContent: "flex-start",
          height: "700px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            margin: "10px",
            alignItems: "flex-start",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <img
              src={ollamaLogo}
              style={{
                width: "40px",
                height: "40px",
              }}
            />
            <span
              style={{
                fontSize: "20px",
                fontWeight: 600,
                marginLeft: "5px",
              }}
            >
              Modello LLM
            </span>
          </div>

          <div
            style={{
              width: "100%",
              marginTop: "14px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
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
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: "18px",
                    color: "#f97316",
                  }}
                >
                  warning
                </span>
                Ambiguità trovate
              </div>

              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#ea580c",
                }}
              >
                {stepOneResponse?.ambigouous_count ?? 0}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
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
                }}
              >
                Usa LLM per risolvere le ambiguità
              </span>
            </div>

            {useLLM ? (
              <>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                    width: "100%",
                  }}
                >
                  <div>
                    <Suspense fallback="">
                      <BasicButtonGenericTag
                        textToSee="Genera patch LLM"
                        clickCallBack={onGeneratePatchLLM}
                      />
                    </Suspense>
                  </div>
                </div>

                {llmSuggestion ? (
                  <>
                    <div
                      style={{
                        width: "100%",
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
                        }}
                      >
                        PATCH LLM PROPOSTE (MODIFICABILE)
                      </span>

                      <Suspense fallback="">
                        <TextareaTag
                          style={{
                            width: "100%",
                            borderRadius: "8px",
                            border: "1px solid #d1d5db",
                            padding: "12px",
                            boxSizing: "border-box",
                            fontSize: "13px",
                            fontFamily: "monospace",
                            backgroundColor: "#f9fafb",
                          }}
                          minHeight="300px"
                          minWidth="600px"
                          value={llmPatchValue}
                          onChange={(e: any) => {
                            onPatchChange(e);
                          }}
                        />
                      </Suspense>
                    </div>

                    <div style={{ display: "flex" }}>
                      <Suspense fallback="">
                        <CheckboxTag
                          checked={checkboxValue}
                          onChange={onToggleApplyPatch}
                        >
                          Applica questa patch
                        </CheckboxTag>
                      </Suspense>
                    </div>
                  </>
                ) : (
                  <></>
                )}
              </>
            ) : (
              <></>
            )}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          width: footerWidth,
          minWidth: mainCardMinWidth,
          marginTop: "18px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
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
    </>
  );
}

export default TemplateStepMatchingTag;