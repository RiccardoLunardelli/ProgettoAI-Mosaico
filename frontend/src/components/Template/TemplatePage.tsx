import { lazy, Suspense, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  GetTemplateDetailAPIHook,
  GetTemplateIdsAPIHook,
  RunTemplateStartAPIHook,
  RunTemplateLLMAPIHook,
  GetTemplatePercentualAPIHook,
  RunTemplateFinishAPIHook,
} from "../../customHooks/API/Template/templateAPI";
import {
  SetTemplatePercentualSlice,
  type TemplateListInterface,
  type TemplatePercentualInterface,
} from "../../stores/slices/Base/templateListSlice";
const RunsListSkeleton = lazy(() => import("../Skeleton/RunsListSkeleton"));
import "rsuite/dist/rsuite.min.css";
import { SetInputSlice } from "../../stores/slices/Base/inputSlice";
import ollamaLogo from "../../../public/logo/ollama.png";
import { IsValidJSON } from "../../commons/commonsFunctions";

const BasicButtonGenericTag = lazy(
  () => import("../button/BasicButtonGeneric"),
);

const TextareaTag = lazy(() => import("rsuite/esm/Textarea"));

const CheckboxTag = lazy(() =>
  import("rsuite").then((module) => ({ default: module.Checkbox })),
);

const Toggle = lazy(() =>
  import("rsuite").then((module) => ({ default: module.Toggle })),
);

const ProgressTag = lazy(() =>
  import("rsuite").then((module) => ({ default: module.Progress })),
);

type CurrentStepNameType = "Selezione" | "Matching" | "Risultato";

interface StepOneResponseInterface {
  run_id: string;
  has_ambiguous: boolean;
  ambigouous_count: number;
}

interface ComponentStateInterface {
  currentStep: number;
  currentStepName: CurrentStepNameType;
  selected_id: string;
  validateOnly: boolean;
  stepOneResponse: StepOneResponseInterface | null;
  use_llm: boolean;
  checkboxValue: boolean;
  showLoader: boolean;
  llm_suggestion: null | {};
}

//Usata per prendersi i valori nello Slice degli input
const inputIdList = ["LLMSuggestionPatch-Edit"];

function TemplatePageTag() {
  const [GetTemplateIdsAPI] = GetTemplateIdsAPIHook();
  const [GetTemplateDetailAPI] = GetTemplateDetailAPIHook();
  const [RunTemplateStartAPI] = RunTemplateStartAPIHook();
  const [RunTemplateLLMAPI] = RunTemplateLLMAPIHook();
  const [GetTemplatePercentualAPI] = GetTemplatePercentualAPIHook();
  const [RunTemplateFinishAPI] = RunTemplateFinishAPIHook();

  const dispatch = useDispatch();

  const [componentState, setComponentState] = useState<ComponentStateInterface>(
    {
      currentStep: 1,
      currentStepName: "Selezione",
      selected_id: "",
      validateOnly: false,
      stepOneResponse: null,
      use_llm: false,
      checkboxValue: false,
      showLoader: false,
      llm_suggestion: null,
    },
  );

  const inputSliceValue: {
    "LLMSuggestionPatch-Edit": string;
  } = useSelector((state: any) => {
    return Object.keys(state.inputSlice.value).reduce(
      function (accumulator: any, currentValue: any) {
        if (inputIdList.includes(currentValue)) {
          accumulator[currentValue] = state.inputSlice.value[currentValue];
        }
        return accumulator;
      },
      {
        "LLMSuggestionPatch-Edit": "",
      },
    );
  });

  const templateListSlice: {
    value: TemplateListInterface[];
    detail: any;
    percentual: TemplatePercentualInterface;
  } = useSelector(
    (state: {
      templateListSlice: {
        value: TemplateListInterface[];
        detail: any;
        percentual: TemplatePercentualInterface;
      };
    }) => state.templateListSlice,
  );

  const HandleSelectIdOnClick = (singleId: string) => {
    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        selected_id: singleId,
      };
    });
  };

  const HandleNextStepOneOnClick = () => {
    if (!componentState.selected_id) return;

    RunTemplateStartAPI({
      data: {
        id: componentState?.selected_id ?? "",
      },
      showLoader: true,
      showToast: true,
      saveResponse: false,
      EndCallback(returnValue) {
        const parsedReturnValue = JSON.parse(returnValue?.message ?? "");
        setComponentState((previousStateVal: ComponentStateInterface) => {
          return {
            ...previousStateVal,
            stepOneResponse: {
              run_id: parsedReturnValue?.run_id ?? "",
              has_ambiguous: parsedReturnValue?.has_ambiguous ?? false,
              ambigouous_count: parsedReturnValue?.ambiguous_count ?? 0,
            },
          };
        });
      },
    });
  };

  const HandleChangeStepAndName = (
    currentStep: number,
    currentStepName: CurrentStepNameType,
  ) => {
    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        currentStep,
        currentStepName,
      };
    });
  };

  const HandleGeneratePatchLLM = () => {
    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        showLoader: true,
        llm_suggestion: null,
      };
    });

    dispatch(SetTemplatePercentualSlice({ percent: 0 }));

    RunTemplateLLMAPI({
      data: {
        run_id: componentState.stepOneResponse?.run_id ?? "",
      },
      showLoader: false,
      showToast: false,
      EndCallback(returnValue) {
        let parsed: any = null;

        try {
          parsed = JSON.parse(returnValue?.message ?? "{}");

          if (typeof parsed === "string") {
            parsed = JSON.parse(parsed);
          }
        } catch (err) {
          console.error("Errore parsing LLM patch", err);
          parsed = null;
        }

        setComponentState((prev) => ({
          ...prev,
          llm_suggestion: parsed,
          showLoader: false,
        }));

        dispatch(
          SetInputSlice({
            id: "LLMSuggestionPatch-Edit",
            value: parsed ? JSON.stringify(parsed, null, 2) : "",
          }),
        );
      },
    });
  };

  const GetStepStyle = (stepNumber: number) => {
    const isCompleted = componentState.currentStep > stepNumber;
    const isCurrent = componentState.currentStep === stepNumber;

    return {
      backgroundColor: isCompleted
        ? "#22c55e"
        : isCurrent
          ? "#2563eb"
          : "#e5e7eb",
      color: isCompleted || isCurrent ? "#fff" : "#6b7280",
    };
  };

  const HandleExecuteRunOnClick = () => {
    if (isPatchRequired && !isPatchJsonValid) return;

    const selectedTemplate = (templateListSlice?.value ?? []).find(
      (item) => item.id === componentState.selected_id,
    );

    RunTemplateFinishAPI({
      showLoader: true,
      showToast: true,
      data: {
        run_id: componentState.stepOneResponse?.run_id ?? "",
        template_name: selectedTemplate?.name ?? "",
        validate_only: componentState.validateOnly,
        apply_llm: componentState.checkboxValue,
        llm_patch_actions: isPatchRequired ? JSON.parse(llmPatchValue) : {},
      },
      EndCallback(returnValue) {
        console.log("Finish callback:", returnValue);
      },
    });
  };

  useEffect(() => {
    if (!componentState.showLoader || componentState.llm_suggestion) return;

    const interval = setInterval(() => {
      GetTemplatePercentualAPI({
        showLoader: false,
        data: {
          id: componentState.stepOneResponse?.run_id ?? "",
        },
        saveResponse: true,
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [
    componentState.showLoader,
    componentState.stepOneResponse?.run_id,
    componentState.llm_suggestion,
  ]);

  useEffect(() => {
    const percent = templateListSlice?.percentual?.percent ?? 0;

    if (componentState.showLoader && percent === 100) {
      setComponentState((prev) => ({
        ...prev,
        showLoader: false,
      }));
    }
  }, [templateListSlice?.percentual?.percent, componentState.showLoader]);

  useEffect(() => {
    GetTemplateIdsAPI({ showLoader: true, saveResponse: true });
    dispatch(SetTemplatePercentualSlice({ percent: 0 }));
  }, []);

  useEffect(() => {
    if (componentState.selected_id == "") return;
    GetTemplateDetailAPI({
      data: {
        id: componentState.selected_id,
      },
      showLoader: true,
      saveResponse: true,
      EndCallback() {},
    });
  }, [componentState.selected_id]);

  const mainCardWidth = "35vw";
  const mainCardMinWidth = "520px";
  const contentWidth = "80%";
  const infoCardHeight = "300px";
  const listCardHeight = "260px";
  const footerWidth = "80%";

  const llmPatchValue = inputSliceValue["LLMSuggestionPatch-Edit"] ?? "";

  const isPatchRequired =
    componentState.use_llm && componentState.checkboxValue;

  const isPatchJsonValid = !isPatchRequired || IsValidJSON(llmPatchValue);

  const isRunDisabled =
    !componentState.stepOneResponse?.run_id ||
    !componentState.selected_id ||
    (isPatchRequired && !isPatchJsonValid);

  return (
    <>
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          filter: componentState.showLoader ? "blur(2px)" : "none",
          pointerEvents: componentState.showLoader ? "none" : "auto",
          userSelect: componentState.showLoader ? "none" : "auto",
          transition: "filter 0.2s ease",
        }}
      >
        {/* Div sopra */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            padding: "20px",
            boxSizing: "border-box",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          {/* Step 1 */}
          <div
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              ...GetStepStyle(1),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 600,
              fontSize: "14px",
              marginLeft: "30px",
            }}
          >
            1
          </div>

          <span
            className="material-symbols-outlined"
            style={{ margin: "0 8px", opacity: 0.5 }}
          >
            chevron_right
          </span>

          {/* Step 2 */}
          <div
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              ...GetStepStyle(2),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            2
          </div>

          <span
            className="material-symbols-outlined"
            style={{ margin: "0 8px", opacity: 0.5 }}
          >
            chevron_right
          </span>

          {/* Step 3 */}
          <div
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              ...GetStepStyle(3),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            3
          </div>

          {/* Label */}
          <span
            style={{
              marginLeft: "12px",
              fontSize: "14px",
              color: "#6b7280",
            }}
          >
            {componentState.currentStepName}
          </span>
        </div>

        {/* Div sotto */}
        <div
          style={{
            display: "flex",
            width: "100%",
            padding: "20px",
            boxSizing: "border-box",
          }}
        >
          <div style={{ marginLeft: "30px", width: "100%" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginLeft: "10px",
                width: "100%",
              }}
            >
              {/* Banner globale Validate Only visibile in tutti gli step */}
              {componentState.validateOnly ? (
                <div
                  style={{
                    backgroundColor: "#fff9e6",
                    width: contentWidth,
                    minWidth: mainCardMinWidth,
                    height: "35px",
                    borderRadius: "8px",
                    border: "1px solid #f5dead",
                    display: "flex",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    marginBottom: "14px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "20px",
                      marginLeft: "20px",
                      opacity: "0.4",
                      userSelect: "none",
                    }}
                    className="material-symbols-outlined"
                  >
                    warning
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      opacity: "0.8",
                      marginLeft: "10px",
                    }}
                  >
                    Modalità Validate Only attiva — Nessuna modifica verrà
                    salvata
                  </span>
                </div>
              ) : (
                <></>
              )}

              {/* Se sono allo step 1 */}
              {componentState.currentStep == 1 ? (
                <>
                  {/* Card */}
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
                        Template
                      </span>

                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          overflow: "auto",
                          marginTop: "10px",
                        }}
                      >
                        {(templateListSlice?.value ?? []).length > 0 ? (
                          <>
                            {(templateListSlice?.value ?? []).map(
                              (singleId: TemplateListInterface) => {
                                const isSelected =
                                  componentState.selected_id ===
                                  (singleId.id ?? "");

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
                                      HandleSelectIdOnClick(singleId.id);
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
                            Nessun template trovato
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Preview template */}
                  {templateListSlice?.detail &&
                  componentState.selected_id !== "" ? (
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
                          {JSON.stringify(templateListSlice.detail, null, 2)}
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
                        {/* Toggle validate Only */}
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

                          <Toggle
                            checked={componentState?.validateOnly ?? false}
                            onChange={(val: boolean) => {
                              setComponentState(
                                (previousStateVal: ComponentStateInterface) => {
                                  return {
                                    ...previousStateVal,
                                    validateOnly: val,
                                  };
                                },
                              );
                            }}
                          />
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <BasicButtonGenericTag
                            textToSee="Esegui matching"
                            disabledButton={componentState.selected_id == ""}
                            clickCallBack={() => {
                              HandleChangeStepAndName(2, "Matching");
                              HandleNextStepOneOnClick();
                            }}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {componentState.selected_id !== "" && (
                        <RunsListSkeleton />
                      )}
                    </>
                  )}
                </>
              ) : (
                <></>
              )}

              {/* Se sono allo step 2 */}
              {componentState.currentStep == 2 ? (
                <>
                  {/* Card */}
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
                            {componentState.stepOneResponse?.ambigouous_count ??
                              0}
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
                              checked={componentState.use_llm}
                              onChange={(e: boolean) => {
                                setComponentState(
                                  (
                                    previousStateVal: ComponentStateInterface,
                                  ) => {
                                    return {
                                      ...previousStateVal,
                                      use_llm: e,
                                    };
                                  },
                                );
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

                        {componentState.use_llm ? (
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
                                    clickCallBack={HandleGeneratePatchLLM}
                                  />
                                </Suspense>
                              </div>
                            </div>
                            {componentState.llm_suggestion ? (
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
                                      value={
                                        inputSliceValue[
                                          "LLMSuggestionPatch-Edit"
                                        ] ?? ""
                                      }
                                      onChange={(e: any) => {
                                        dispatch(
                                          SetInputSlice({
                                            id: "LLMSuggestionPatch-Edit",
                                            value: e,
                                          }),
                                        );
                                      }}
                                    />
                                  </Suspense>
                                </div>
                                <div style={{ display: "flex" }}>
                                  <CheckboxTag
                                    checked={componentState.checkboxValue}
                                    onChange={() => {
                                      setComponentState(
                                        (
                                          previousStateVal: ComponentStateInterface,
                                        ) => {
                                          return {
                                            ...previousStateVal,
                                            checkboxValue:
                                              !componentState.checkboxValue,
                                          };
                                        },
                                      );
                                    }}
                                  >
                                    Applica questa patch
                                  </CheckboxTag>
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
                      <BasicButtonGenericTag
                        textToSee="Avanti al risultato"
                        clickCallBack={() => {
                          HandleChangeStepAndName(3, "Risultato");
                        }}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <></>
              )}

              {/* Se sono allo step 3 */}
              {componentState.currentStep == 3 ? (
                <>
                  {/* Card */}
                  <div
                    style={{
                      backgroundColor: "#ffffff",
                      borderRadius: "8px",
                      padding: "10px",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                      boxSizing: "border-box",
                      width: contentWidth,
                      minWidth: mainCardMinWidth,
                      minHeight: "240px",
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
                      }}
                    >
                      <span style={{ fontSize: "20px", fontWeight: 600 }}>
                        Esegui Run
                      </span>

                      <div
                        style={{
                          width: "100%",
                          marginTop: "18px",
                          backgroundColor: "#eef4ff",
                          border: "1px solid #bcd0ee",
                          borderRadius: "4px",
                          padding: "8px 12px",
                          boxSizing: "border-box",
                          fontSize: "14px",
                          color: "#2563eb",
                        }}
                      >
                        # Run ID:{" "}
                        {componentState.stepOneResponse?.run_id ?? "-"}
                      </div>

                      <div
                        style={{
                          marginTop: "16px",
                          display: "flex",
                          justifyContent: "flex-start",
                          width: "100%",
                        }}
                      >
                        <BasicButtonGenericTag
                          textToSee="Esegui Run"
                          disabledButton={isRunDisabled}
                          clickCallBack={() => {
                            HandleExecuteRunOnClick();
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <></>
              )}
            </div>
          </div>
        </div>
      </div>

      {componentState.showLoader && !componentState.llm_suggestion ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(255, 255, 255, 0.30)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "all",
          }}
        >
          <div
            style={{
              minWidth: "320px",
              padding: "24px 28px",
              borderRadius: "16px",
              backgroundColor: "rgba(255,255,255,0.92)",
              boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <img
              src={ollamaLogo}
              style={{
                width: "70px",
                height: "70px",
                objectFit: "contain",
              }}
            />

            <span
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "#374151",
              }}
            >
              Risoluzione ambiguità...
            </span>
            <div className="thinking-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>

            <div style={{ width: "240px" }}>
              <Suspense fallback="">
                <ProgressTag
                  percent={templateListSlice?.percentual?.percent ?? 0}
                  showInfo={true}
                />
              </Suspense>
            </div>
          </div>
        </div>
      ) : (
        <></>
      )}
    </>
  );
}

export default TemplatePageTag;
