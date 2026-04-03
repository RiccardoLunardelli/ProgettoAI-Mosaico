import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  GetTemplateDetailAPIHook,
  GetTemplateIdsAPIHook,
  RunTemplateStartAPIHook,
  RunTemplateLLMAPIHook,
  GetTemplatePercentualAPIHook,
  RunTemplateFinishAPIHook,
  GetTemplateUsageAPIHook,
  GetTemplateLLMResultAPIHook,
} from "../../customHooks/API/Template/templateAPI";
import {
  GetDictionaryDetailAPIHook,
  GetDictionaryIdsAPIHook,
  GetDictionaryVersionScoreAPIHook,
} from "../../customHooks/API/Dictionary/DictionaryAPI";
import {
  GetTemplateBaseDetailAPIHook,
  GetTemplateBaseIdsAPIHook,
} from "../../customHooks/API/TemplateBase/templateBaseAPI";
import {
  GetEnrichedDetailAPIHook,
  GetEnrichedIdsAPIHook,
} from "../../customHooks/API/DeviceList/DeviceListAPI";
import {
  SetTemplateListUsageSlice,
  SetTemplatePercentualSlice,
  type TemplateListInterface,
  type TemplateListUsageInterface,
  type TemplatePercentualInterface,
} from "../../stores/slices/Base/templateListSlice";
import { SetInputSlice } from "../../stores/slices/Base/inputSlice";
import { IsValidJSON } from "../../commons/commonsFunctions";

import TemplateStepperTag from "./sections/TemplateStepper";
import TemplateValidateBannerTag from "./sections/TemplateValidateBanner";
import TemplateLoaderOverlayTag from "./sections/TemplateLoaderOverlay";
import TemplateStepDictionarySelectionTag from "./sections/TemplateStepDictionarySection";
import TemplateStepSelectionTag from "./sections/TemplateStepSelection";
import TemplateStepDeviceListEnrichedSelectionTag from "./sections/TemplateStepDeviceListEnrichedSelection";
import TemplateStepKnowledgeBaseSelectionTag from "./sections/TemplateStepKnowledgeBaseSelection";
import TemplateStepTemplateBaseSelectionTag from "./sections/TemplateStepTemplateBaseSelection";
import TemplateStepMatchingTag from "./sections/TemplateStepMatching";
import TemplateStepResultTag from "./sections/TemplateStepResult";

import {
  SetDictionaryScoreSlice,
  type DictionaryVersionScoreInterface,
  type DictionatyListInterface,
} from "../../stores/slices/Base/dictionaryListSlice";
import type { DeviceListStoreFileInterface } from "../../stores/slices/Base/deviceListSlice";
import type { KnowledgeBaseListInterface } from "../../stores/slices/Base/knowledgeBaseListSlice";
import type { TemplateBaseListInterface } from "../../stores/slices/Base/templateBaseListSlice";
import {
  GetKnowledgeBaseDetailAPIHook,
  GetKnowledgeBaseIdsAPIHook,
} from "../../customHooks/API/KnowledgeBase/knowledgeBaseAPI";

type CurrentStepNameType =
  | "Dictionary"
  | "Template"
  | "Device List"
  | "Knowledge Base"
  | "Template Base"
  | "Matching"
  | "Risultato";

interface StepOneResponseInterface {
  run_id: string;
  has_ambiguous: boolean;
  ambigouous_count: number;
}

interface ComponentStateInterface {
  currentStep: number;
  currentStepName: CurrentStepNameType;
  selected_dictionary_id: string;
  selected_dictionary_version: string;
  selected_id: string;
  selected_device_list_enriched: DeviceListStoreFileInterface | null;
  selected_knowledge_base_id: string;
  selected_template_base_id: string;
  validateOnly: boolean;
  stepOneResponse: StepOneResponseInterface | null;
  use_llm: boolean;
  checkboxValue: boolean;
  showLoader: boolean;
  llm_suggestion: null | {};
}

const inputIdList = ["LLMSuggestionPatch-Edit"];

const mainCardWidth = "25vw";
const mainCardMinWidth = "800px";
const contentWidth = "80%";
const infoCardHeight = "200px";
const listCardHeight = "260px";
const footerWidth = "80%";

function TemplatePageTag() {
  const [GetTemplateIdsAPI] = GetTemplateIdsAPIHook();
  const [GetTemplateDetailAPI] = GetTemplateDetailAPIHook();
  const [RunTemplateStartAPI] = RunTemplateStartAPIHook();
  const [RunTemplateLLMAPI] = RunTemplateLLMAPIHook();
  const [GetTemplatePercentualAPI] = GetTemplatePercentualAPIHook();
  const [RunTemplateFinishAPI] = RunTemplateFinishAPIHook();
  const [GetTemplateUsageAPI] = GetTemplateUsageAPIHook();
  const [GetTemplateLLMResultAPI] = GetTemplateLLMResultAPIHook();

  const [GetDictionaryIdsAPI] = GetDictionaryIdsAPIHook();
  const [GetDictionaryDetailAPI] = GetDictionaryDetailAPIHook();
  const [GetDictionaryVersionScoreAPI] = GetDictionaryVersionScoreAPIHook();

  const [GetEnrichedIdsAPI] = GetEnrichedIdsAPIHook();
  const [GetEnrichedDetailAPI] = GetEnrichedDetailAPIHook();

  const [GetKnowledgeBaseIdsAPI] = GetKnowledgeBaseIdsAPIHook();
  const [GetKnowledgeBaseDetailAPI] = GetKnowledgeBaseDetailAPIHook();

  const [GetTemplateBaseIdsAPI] = GetTemplateBaseIdsAPIHook();
  const [GetTemplateBaseDetailAPI] = GetTemplateBaseDetailAPIHook();

  const dispatch = useDispatch();

  const [componentState, setComponentState] = useState<ComponentStateInterface>(
    {
      currentStep: 1,
      currentStepName: "Dictionary",
      selected_dictionary_id: "",
      selected_dictionary_version: "",
      selected_id: "",
      selected_device_list_enriched: null,
      selected_knowledge_base_id: "",
      selected_template_base_id: "",
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
    usage: TemplateListUsageInterface[];
  } = useSelector(
    (state: {
      templateListSlice: {
        value: TemplateListInterface[];
        detail: any;
        percentual: TemplatePercentualInterface;
        usage: TemplateListUsageInterface[];
      };
    }) => state.templateListSlice,
  );

  const dictionaryListSlice: {
    value: DictionatyListInterface[];
    detail: any;
    score: DictionaryVersionScoreInterface;
  } = useSelector(
    (state: {
      dictionaryListSlice: {
        value: DictionatyListInterface[];
        detail: any;
        score: DictionaryVersionScoreInterface;
      };
    }) => state.dictionaryListSlice,
  );

  const deviceListListSlice: {
    enrichedValue: DeviceListStoreFileInterface[];
    enrichedDetail: any;
  } = useSelector(
    (state: {
      deviceListListSlice: {
        enrichedValue: DeviceListStoreFileInterface[];
        enrichedDetail: any;
      };
    }) => state.deviceListListSlice,
  );

  const knowledgeBaseListSlice: {
    value: KnowledgeBaseListInterface[];
    detail: any;
  } = useSelector(
    (state: {
      knowledgeBaseListSlice: {
        value: KnowledgeBaseListInterface[];
        detail: any;
      };
    }) => state.knowledgeBaseListSlice,
  );

  const templateBaseListSlice: {
    value: TemplateBaseListInterface[];
    detail: any;
  } = useSelector(
    (state: {
      templateBaseListSlice: {
        value: TemplateBaseListInterface[];
        detail: any;
      };
    }) => state.templateBaseListSlice,
  );

  const llmPatchValue = inputSliceValue["LLMSuggestionPatch-Edit"] ?? "";

  const isPatchRequired =
    componentState.use_llm && componentState.checkboxValue;

  const isPatchJsonValid = !isPatchRequired || IsValidJSON(llmPatchValue);

  const selectedDeviceContextId =
    (componentState.selected_device_list_enriched as any)?.id ?? "";

  const isRunDisabled =
    !componentState.stepOneResponse?.run_id ||
    !componentState.selected_dictionary_id ||
    !componentState.selected_id ||
    !componentState.selected_device_list_enriched ||
    !componentState.selected_knowledge_base_id ||
    !componentState.selected_template_base_id ||
    !selectedDeviceContextId ||
    (isPatchRequired && !isPatchJsonValid);

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

  const HandleSelectDictionaryIdOnClick = (
    singleId: string,
    singleVersion: string,
  ) => {
    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        selected_dictionary_id: singleId,
        selected_dictionary_version: singleVersion,
      };
    });
  };

  const HandleSelectIdOnClick = (singleId: string) => {
    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        selected_id: singleId,
      };
    });
  };

  const HandleSelectDeviceListEnrichedOnClick = (
    selectedItem: DeviceListStoreFileInterface,
  ) => {
    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        selected_device_list_enriched: selectedItem,
      };
    });
  };

  const HandleSelectKnowledgeBaseIdOnClick = (singleId: string) => {
    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        selected_knowledge_base_id: singleId,
      };
    });
  };

  const HandleSelectTemplateBaseIdOnClick = (singleId: string) => {
    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        selected_template_base_id: singleId,
      };
    });
  };

  const HandleStartMatchingOnClick = () => {
    if (!componentState.selected_dictionary_id) return;
    if (!componentState.selected_id) return;
    if (!componentState.selected_device_list_enriched) return;
    if (!componentState.selected_knowledge_base_id) return;
    if (!componentState.selected_template_base_id) return;
    if (!selectedDeviceContextId) return;

    RunTemplateStartAPI({
      data: {
        id: componentState.selected_id ?? "",
        dictionary_id: componentState.selected_dictionary_id ?? "",
        kb_id: componentState.selected_knowledge_base_id ?? "",
        template_base_id: componentState.selected_template_base_id ?? "",
        device_context_id: selectedDeviceContextId,
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
      EndCallback() {},
    });
  };

  const HandleExecuteRunOnClick = () => {
    if (isPatchRequired && !isPatchJsonValid) return;

    RunTemplateFinishAPI({
      showLoader: true,
      showToast: true,
      data: {
        run_id: componentState.stepOneResponse?.run_id ?? "",
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
      GetTemplateLLMResultAPI({
        showLoader: false,
        data: { run_id: componentState.stepOneResponse?.run_id ?? "" },
        saveResponse: false,
        EndCallback(returnValue) {
          setComponentState((prev) => ({
            ...prev,
            llm_suggestion: returnValue?.message,
            showLoader: false,
          }));

          dispatch(
            SetInputSlice({
              id: "LLMSuggestionPatch-Edit",
              value: JSON.stringify(returnValue?.message, null, 2),
            }),
          );
        },
      });

      setComponentState((prev) => ({
        ...prev,
        showLoader: false,
      }));
    }
  }, [templateListSlice?.percentual?.percent, componentState.showLoader]);

  useEffect(() => {
    GetDictionaryIdsAPI({ showLoader: true, saveResponse: true });
    GetTemplateIdsAPI({ showLoader: true, saveResponse: true });
    GetEnrichedIdsAPI({ showLoader: true, saveResponse: true });
    GetKnowledgeBaseIdsAPI({ showLoader: true, saveResponse: true });
    GetTemplateBaseIdsAPI({ showLoader: true, saveResponse: true });
    dispatch(SetTemplatePercentualSlice({ percent: 0 }));
    dispatch(SetDictionaryScoreSlice(null));
    dispatch(SetTemplateListUsageSlice(null));
  }, []);

  useEffect(() => {
    if (componentState.selected_dictionary_id == "") return;

    GetDictionaryDetailAPI({
      data: {
        id: componentState.selected_dictionary_id,
      },
      showLoader: true,
      saveResponse: true,
    });

    GetDictionaryVersionScoreAPI({
      saveResponse: true,
      showLoader: true,
      data: {
        version: componentState.selected_dictionary_version,
      },
    });
  }, [componentState.selected_dictionary_id]);

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

    GetTemplateUsageAPI({
      saveResponse: true,
      showLoader: true,
      data: {
        id: componentState.selected_id,
      },
    });
  }, [componentState.selected_id]);

  useEffect(() => {
    if (!componentState.selected_device_list_enriched) return;

    GetEnrichedDetailAPI({
      data: {
        store:
          (componentState.selected_device_list_enriched as any)?.store ?? "",
        dl: (componentState.selected_device_list_enriched as any)?.file ?? "",
      },
      showLoader: true,
      saveResponse: true,
      EndCallback() {},
    });
  }, [componentState.selected_device_list_enriched]);

  useEffect(() => {
    if (componentState.selected_knowledge_base_id == "") return;

    GetKnowledgeBaseDetailAPI({
      data: {
        id: componentState.selected_knowledge_base_id,
      },
      showLoader: true,
      saveResponse: true,
      EndCallback() {},
    });
  }, [componentState.selected_knowledge_base_id]);

  useEffect(() => {
    if (componentState.selected_template_base_id == "") return;

    GetTemplateBaseDetailAPI({
      data: {
        id: componentState.selected_template_base_id,
      },
      showLoader: true,
      saveResponse: true,
      EndCallback() {},
    });
  }, [componentState.selected_template_base_id]);

  const RenderCurrentStep = () => {
    switch (componentState.currentStep) {
      case 1:
        return (
          <TemplateStepDictionarySelectionTag
            selectedDictionaryId={componentState.selected_dictionary_id}
            dictionaryList={dictionaryListSlice?.value ?? []}
            dictionaryDetail={dictionaryListSlice?.detail}
            dictionaryScore={dictionaryListSlice?.score}
            mainCardWidth={mainCardWidth}
            mainCardMinWidth={mainCardMinWidth}
            contentWidth={contentWidth}
            infoCardHeight={infoCardHeight}
            listCardHeight={listCardHeight}
            footerWidth={footerWidth}
            onSelectDictionaryId={HandleSelectDictionaryIdOnClick}
            onNext={() => {
              HandleChangeStepAndName(2, "Template");
            }}
          />
        );

      case 2:
        return (
          <TemplateStepSelectionTag
            selectedId={componentState.selected_id}
            validateOnly={componentState.validateOnly}
            templateUsage={templateListSlice?.usage ?? []}
            templateList={templateListSlice?.value ?? []}
            templateDetail={templateListSlice?.detail}
            mainCardWidth={mainCardWidth}
            mainCardMinWidth={mainCardMinWidth}
            contentWidth={contentWidth}
            infoCardHeight={infoCardHeight}
            listCardHeight={listCardHeight}
            footerWidth={footerWidth}
            nextButtonText="Avanti ai device list"
            onSelectId={HandleSelectIdOnClick}
            onToggleValidateOnly={(val: boolean) => {
              setComponentState((previousStateVal: ComponentStateInterface) => {
                return {
                  ...previousStateVal,
                  validateOnly: val,
                };
              });
            }}
            onNext={() => {
              HandleChangeStepAndName(3, "Device List");
            }}
          />
        );

      case 3:
        return (
          <TemplateStepDeviceListEnrichedSelectionTag
            selectedDeviceListEnriched={
              componentState.selected_device_list_enriched
            }
            deviceListEnrichedList={deviceListListSlice?.enrichedValue ?? []}
            deviceListEnrichedDetail={deviceListListSlice?.enrichedDetail}
            mainCardWidth={mainCardWidth}
            mainCardMinWidth={mainCardMinWidth}
            contentWidth={contentWidth}
            infoCardHeight={infoCardHeight}
            listCardHeight={listCardHeight}
            footerWidth={footerWidth}
            onSelectDeviceListEnriched={HandleSelectDeviceListEnrichedOnClick}
            onNext={() => {
              HandleChangeStepAndName(4, "Knowledge Base");
            }}
          />
        );

      case 4:
        return (
          <TemplateStepKnowledgeBaseSelectionTag
            selectedKnowledgeBaseId={componentState.selected_knowledge_base_id}
            knowledgeBaseList={knowledgeBaseListSlice?.value ?? []}
            knowledgeBaseDetail={knowledgeBaseListSlice?.detail}
            mainCardWidth={mainCardWidth}
            mainCardMinWidth={mainCardMinWidth}
            contentWidth={contentWidth}
            infoCardHeight={infoCardHeight}
            listCardHeight={listCardHeight}
            footerWidth={footerWidth}
            onSelectKnowledgeBaseId={HandleSelectKnowledgeBaseIdOnClick}
            onNext={() => {
              HandleChangeStepAndName(5, "Template Base");
            }}
          />
        );

      case 5:
        return (
          <TemplateStepTemplateBaseSelectionTag
            selectedTemplateBaseId={componentState.selected_template_base_id}
            templateBaseList={templateBaseListSlice?.value ?? []}
            templateBaseDetail={templateBaseListSlice?.detail}
            mainCardWidth={mainCardWidth}
            mainCardMinWidth={mainCardMinWidth}
            contentWidth={contentWidth}
            infoCardHeight={infoCardHeight}
            listCardHeight={listCardHeight}
            footerWidth={footerWidth}
            onSelectTemplateBaseId={HandleSelectTemplateBaseIdOnClick}
            onNext={() => {
              HandleStartMatchingOnClick();
              HandleChangeStepAndName(6, "Matching");
            }}
          />
        );

      case 6:
        return (
          <TemplateStepMatchingTag
            stepOneResponse={componentState.stepOneResponse}
            useLLM={componentState.use_llm}
            llmSuggestion={componentState.llm_suggestion}
            checkboxValue={componentState.checkboxValue}
            llmPatchValue={llmPatchValue}
            contentWidth={contentWidth}
            mainCardMinWidth={mainCardMinWidth}
            footerWidth={footerWidth}
            onToggleUseLLM={(value: boolean) => {
              setComponentState((previousStateVal: ComponentStateInterface) => {
                return {
                  ...previousStateVal,
                  use_llm: value,
                };
              });
            }}
            onGeneratePatchLLM={HandleGeneratePatchLLM}
            onPatchChange={(value: string) => {
              dispatch(
                SetInputSlice({
                  id: "LLMSuggestionPatch-Edit",
                  value,
                }),
              );
            }}
            onToggleApplyPatch={() => {
              setComponentState((previousStateVal: ComponentStateInterface) => {
                return {
                  ...previousStateVal,
                  checkboxValue: !previousStateVal.checkboxValue,
                };
              });
            }}
            onNext={() => {
              HandleChangeStepAndName(7, "Risultato");
            }}
          />
        );

      case 7:
        return (
          <TemplateStepResultTag
            runId={componentState.stepOneResponse?.run_id ?? ""}
            isRunDisabled={isRunDisabled}
            contentWidth={contentWidth}
            mainCardMinWidth={mainCardMinWidth}
            onExecuteRun={HandleExecuteRunOnClick}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          overflow: "hidden",
          filter: componentState.showLoader ? "blur(2px)" : "none",
          pointerEvents: componentState.showLoader ? "none" : "auto",
          userSelect: componentState.showLoader ? "none" : "auto",
          transition: "filter 0.2s ease",
        }}
      >
        <TemplateStepperTag
          currentStep={componentState.currentStep}
          currentStepName={componentState.currentStepName}
        />

        <div
          style={{
            width: "100%",
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <TemplateValidateBannerTag
            validateOnly={componentState.validateOnly}
            contentWidth="100%"
            mainCardMinWidth="0px"
          />

          <div
            style={{
              width: "100%",
              flex: 1,
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            {RenderCurrentStep()}
          </div>
        </div>
      </div>

      <TemplateLoaderOverlayTag
        show={componentState.showLoader && !componentState.llm_suggestion}
        percent={templateListSlice?.percentual?.percent ?? 0}
      />
    </>
  );
}

export default TemplatePageTag;
