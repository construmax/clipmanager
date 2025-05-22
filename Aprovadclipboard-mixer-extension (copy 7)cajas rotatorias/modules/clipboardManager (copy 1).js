export function updateSelectedText(app) {
    browser.tabs.query({active: true, currentWindow: true}).then((tabs) => {
        if (tabs[0]) {
            browser.tabs.sendMessage(tabs[0].id, {action: "getSelectedText"}).then((response) => {
                if (response && response.selectedText) {
                    const selectedTextCheckbox = document.querySelector("#selected-text-box .include-check");
                    const selectedTextAppendCheckbox = document.querySelector("#selected-text-box .append-mode-check");
                    if (selectedTextCheckbox && selectedTextCheckbox.checked) {
                        if (selectedTextAppendCheckbox && selectedTextAppendCheckbox.checked) {
                            app.elements.selectedTextArea.value = response.selectedText + (app.elements.selectedTextArea.value ? "\n" : "") + app.elements.selectedTextArea.value;
                        } else {
                            app.elements.selectedTextArea.value = response.selectedText;
                        }
                        app.saveContent(app);
                    }
                }
            }).catch((error) => {
                console.error("Error al obtener el texto seleccionado:", error);
            });
        }
    });
}

export function updateClipboardContent(app) {
    navigator.clipboard.readText().then(text => {
        const clipboardCheckbox = document.querySelector("#clipboard-box .include-check");
        const clipboardAppendCheckbox = document.querySelector("#clipboard-box .append-mode-check");
        if (clipboardCheckbox && clipboardCheckbox.checked) {
            if (clipboardAppendCheckbox && clipboardAppendCheckbox.checked) {
                app.elements.clipboardContentArea.value = text + (app.elements.clipboardContentArea.value ? "\n" : "") + app.elements.clipboardContentArea.value;
            } else {
                app.elements.clipboardContentArea.value = text;
            }
            app.saveContent(app);
        }
    }).catch(err => {
        console.error("Failed to read clipboard contents: ", err);
    });
}
