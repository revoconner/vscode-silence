import * as vscode from 'vscode';

const SILENCED_SETTINGS: Record<string, any> = {
    // Suggestion acceptance
    "editor.acceptSuggestionOnCommitCharacter": false,
    "editor.acceptSuggestionOnEnter": "off",
    
    // Inline suggestions
    "editor.inlineSuggest.enabled": false,
    "editor.inlineSuggest.suppressSuggestions": true,
    "editor.screenReaderAnnounceInlineSuggestion": false,
    
    // Quick suggestions
    "editor.quickSuggestions": {
        "comments": "off",
        "strings": "off",
        "other": "off"
    },
    "editor.suggestOnTriggerCharacters": false,
    "editor.wordBasedSuggestions": "off",
    "editor.lightbulb.enabled": "off",
    
    // Code actions
    "editor.codeActionsOnSave": {},
    "editor.codeActionWidget.includeNearbyQuickFixes": false,
    "editor.codeActionWidget.showHeaders": false,
    "editor.snippets.codeActions.enabled": false,
    
    // Language specific
    "typescript.suggestionActions.enabled": false,
    "javascript.suggestionActions.enabled": false,
    "typescript.suggest.enabled": false,
    "javascript.suggest.enabled": false,
    "typescript.suggest.autoImports": false,
    "javascript.suggest.autoImports": false,
    
    // Parameter hints
    "editor.parameterHints.enabled": false,
    
    // Hover
    "editor.hover.enabled": false,
    
    // Snippet suggestions
    "editor.snippetSuggestions": "none",
    
    // Autocomplete widget
    "editor.suggest.preview": false,
    "editor.suggest.showMethods": false,
    "editor.suggest.showFunctions": false,
    "editor.suggest.showConstructors": false,
    "editor.suggest.showDeprecated": false,
    "editor.suggest.showFields": false,
    "editor.suggest.showVariables": false,
    "editor.suggest.showClasses": false,
    "editor.suggest.showStructs": false,
    "editor.suggest.showInterfaces": false,
    "editor.suggest.showModules": false,
    "editor.suggest.showProperties": false,
    "editor.suggest.showEvents": false,
    "editor.suggest.showOperators": false,
    "editor.suggest.showUnits": false,
    "editor.suggest.showValues": false,
    "editor.suggest.showConstants": false,
    "editor.suggest.showEnumMembers": false,
    "editor.suggest.showEnums": false,
    "editor.suggest.showKeywords": false,
    "editor.suggest.showWords": false,
    "editor.suggest.showColors": false,
    "editor.suggest.showFiles": false,
    "editor.suggest.showReferences": false,
    "editor.suggest.showFolders": false,
    "editor.suggest.showTypeParameters": false,
    "editor.suggest.showSnippets": false,
    "editor.suggest.showIssues": false,
    
    // Auto closing/formatting
    "editor.autoClosingBrackets": "never",
    "editor.autoClosingQuotes": "never",
    "editor.autoClosingComments": "never",
    "editor.autoSurround": "never",
    "editor.formatOnType": false,
    
    // HTML/CSS/JSON specific
    "html.suggest.html5": false,
    "html.autoClosingTags": false,
    "css.completion.completePropertyWithSemicolon": false,
    "css.completion.triggerPropertyValueCompletion": false,
    "json.schemaDownload.enable": false,
    
    // Emmet
    "emmet.showExpandedAbbreviation": "never",
    "emmet.showSuggestionsAsSnippets": false,
    
    // Terminal suggestions
    "terminal.integrated.suggest.enabled": false,
    "terminal.integrated.suggest.quickSuggestions": false,
    "terminal.integrated.suggest.suggestOnTriggerCharacters": false,

    // Validation/diagnostics (red underlines)
    "json.validate.enable": false,
    "javascript.validate.enable": false,
    "typescript.validate.enable": false,
    "css.validate": false,
    "scss.validate": false,
    "less.validate": false,
    "html.validate.scripts": false,
    "html.validate.styles": false,
    "yaml.validate": false,
    "xml.validation.enabled": false,
    "python.analysis.diagnosticMode": "off",
    "python.linting.enabled": false,

    // Problems panel / diagnostics
    "problems.decorations.enabled": false,
    "editor.problemsDecorationsEnabled": false
};

// Settings for extensions that may not be installed
const OPTIONAL_EXTENSION_SETTINGS: Record<string, { extensionId: string; settings: Record<string, any> }> = {
    copilot: {
        extensionId: "github.copilot",
        settings: {
            "github.copilot.enable": { "*": false },
            "github.copilot.editor.enableAutoCompletions": false
        }
    },
    cpptools: {
        extensionId: "ms-vscode.cpptools",
        settings: {
            "C_Cpp.errorSquiggles": "disabled",
            "C_Cpp.autocomplete": "disabled",
            "C_Cpp.suggestSnippets": false
        }
    },
    pylance: {
        extensionId: "ms-python.vscode-pylance",
        settings: {
            "python.analysis.diagnosticMode": "off",
            "python.analysis.typeCheckingMode": "off"
        }
    }
};

const LANGUAGES = [
    "javascript", "typescript", "javascriptreact", "typescriptreact",
    "python", "java", "c", "cpp", "csharp", "go", "rust", "ruby",
    "php", "swift", "kotlin", "scala", "html", "css", "scss", "less",
    "json", "jsonc", "yaml", "xml", "markdown", "plaintext", "sql",
    "shellscript", "powershell", "dockerfile", "vue", "svelte",
    "asm", "cobol", "fortran", "fortran-modern", "lisp", "scheme", "clojure"
];

let savedSettings: Map<string, any> = new Map();
let isDisabled = false;

async function tryUpdate(config: vscode.WorkspaceConfiguration, key: string, value: any, target: vscode.ConfigurationTarget): Promise<boolean> {
    try {
        await config.update(key, value, target);
        return true;
    } catch {
        return false;
    }
}

async function disableSuggestions() {
    const config = vscode.workspace.getConfiguration();
    savedSettings.clear();

    for (const [key, value] of Object.entries(SILENCED_SETTINGS)) {
        const current = config.inspect(key);
        savedSettings.set(key, current?.globalValue);
        await tryUpdate(config, key, value, vscode.ConfigurationTarget.Global);
    }

    // Handle optional extension settings (only if extension is installed)
    for (const [, extConfig] of Object.entries(OPTIONAL_EXTENSION_SETTINGS)) {
        const extension = vscode.extensions.getExtension(extConfig.extensionId);
        if (extension) {
            for (const [key, value] of Object.entries(extConfig.settings)) {
                const current = config.inspect(key);
                savedSettings.set(key, current?.globalValue);
                await tryUpdate(config, key, value, vscode.ConfigurationTarget.Global);
            }
        }
    }

    for (const lang of LANGUAGES) {
        const key = `[${lang}]`;
        const current = config.inspect(key);
        savedSettings.set(key, current?.globalValue);
        
        await tryUpdate(config, key, {
            ...(current?.globalValue as object || {}),
            "editor.quickSuggestions": {
                "comments": "off",
                "strings": "off",
                "other": "off"
            },
            "editor.suggest.showWords": false,
            "editor.suggestOnTriggerCharacters": false,
            "editor.parameterHints.enabled": false,
            "editor.inlineSuggest.enabled": false,
            "editor.hover.enabled": false
        }, vscode.ConfigurationTarget.Global);
    }

    isDisabled = true;
    vscode.window.showInformationMessage('Silence: All suggestions disabled');
}

async function enableSuggestions() {
    const config = vscode.workspace.getConfiguration();

    for (const [key, value] of savedSettings.entries()) {
        if (value === undefined) {
            await tryUpdate(config, key, undefined, vscode.ConfigurationTarget.Global);
        } else {
            await tryUpdate(config, key, value, vscode.ConfigurationTarget.Global);
        }
    }

    savedSettings.clear();
    isDisabled = false;
    vscode.window.showInformationMessage('Silence: Suggestions restored');
}

async function toggleSuggestions() {
    if (isDisabled) {
        await enableSuggestions();
    } else {
        await disableSuggestions();
    }
}

export function activate(context: vscode.ExtensionContext) {
    isDisabled = context.globalState.get('isDisabled', false);
    const saved = context.globalState.get<[string, any][]>('savedSettings', []);
    savedSettings = new Map(saved);

    context.subscriptions.push(
        vscode.commands.registerCommand('silence.disable', async () => {
            await disableSuggestions();
            await context.globalState.update('isDisabled', true);
            await context.globalState.update('savedSettings', [...savedSettings.entries()]);
        }),

        vscode.commands.registerCommand('silence.enable', async () => {
            await enableSuggestions();
            await context.globalState.update('isDisabled', false);
            await context.globalState.update('savedSettings', []);
        }),

        vscode.commands.registerCommand('silence.toggle', async () => {
            await toggleSuggestions();
            await context.globalState.update('isDisabled', isDisabled);
            await context.globalState.update('savedSettings', isDisabled ? [...savedSettings.entries()] : []);
        })
    );
}

export function deactivate() {}