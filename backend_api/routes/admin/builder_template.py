from backend_api.schemas.template_properties import ContinuosReadsProps, ParametersProps, CommandsProps

def builder(payload, section):
    # costruisce properties e values per sezione

    reads = payload
    has_alias = any(r.Alias is not None and str(r.Alias).strip() != "" for r in reads)

    if section == "continuosReads":
        props = ContinuosReadsProps.properties_continuosreads_with_alias() if has_alias else ContinuosReadsProps.properties_continuosreads_without_alias()

        values = {}
        for r in reads:
            if not r.NameVariable:
                continue 

            values[r.NameVariable] = ContinuosReadsProps.build_continuos_read(
                r.Enable,
                r.MultiLanguageDescription,
                r.TroubleSettings,
                r.Name,
                r.Alias,
                r.Description,
                r.Type,
                r.Measurement,
                r.ShowIndexPage,
                r.HTMLViewEnable,
                r.HTMLViewCategory,
                r.HTMLViewIndexPosition,
                r.HTMLMaskValue,
            )

    elif section == "parameters":
        props = ParametersProps.properties_parameters_with_alias() if has_alias else ParametersProps.properties_parameters_without_alias()

        values = {}
        for r in reads:
            if not r.NameVariable:
                continue 

            values[r.NameVariable] = ParametersProps.build_parameters(
                r.Label,
                r.Category,
                r.Default,
                r.Visibility,
                r.AccessLevel,
                r.AccessWriteLevel,
                r.Enable,
                r.MultiLanguageDescription,
                r.TroubleSettings,
                r.Name,
                r.Alias,
                r.Description,
                r.Type,
                r.Measurement,
                r.ShowIndexPage,
                r.HTMLViewEnable,
                r.HTMLViewCategory,
                r.HTMLViewIndexPosition,
                r.HTMLMaskValue,
            )

    elif section == "commands":
        props = CommandsProps.commands_parameters_with_alias() if has_alias else CommandsProps.commands_parameters_without_alias()

        values = {}
        for r in reads:
            if not r.NameVariable:
                continue 
                
            values[r.NameVariable] = CommandsProps.build_commands(
                r.ValueCommand,
                r.AccessWriteLevel,
                r.Enable,
                r.MultiLanguageDescription,
                r.TroubleSettings,
                r.Name,
                r.Alias,
                r.Description,
                r.Type,
                r.Measurement,
                r.ShowIndexPage,
                r.HTMLViewEnable,
                r.HTMLViewCategory,
                r.HTMLViewIndexPosition,
                r.HTMLMaskValue,
            )

    return props, values

