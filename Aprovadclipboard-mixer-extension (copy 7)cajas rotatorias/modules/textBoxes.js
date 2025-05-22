export function createTextBox(app, index, text = "", checked = true, singleUse = false, append = false, height = "", name = `Texto ${index}`) {
    const container = document.createElement("div");
    container.className = "text-box";
    container.innerHTML = `
        <div class="box-header">
            <input type="text" class="box-name" value="${name}">
            <div class="box-controls">
                <button class="paste-btn" title="Pegar">P</button>
                <button class="clear-btn" title="Borrar">B</button>
                <input type="checkbox" class="include-check" ${checked ? "checked" : ""} title="Incluir">
                <input type="checkbox" class="single-use-check" ${singleUse ? "checked" : ""} title="Un solo uso">
                <input type="checkbox" class="append-mode-check" ${append ? "checked" : ""} title="Modo Append">
            </div>
        </div>
        <textarea placeholder="Texto ${index}">${text}</textarea>
    `;
    app.elements.dynamicBoxes.appendChild(container);

    const textarea = container.querySelector("textarea");
    const checkbox = container.querySelector(".include-check");
    const singleUseCheckbox = container.querySelector(".single-use-check");
    const appendModeCheckbox = container.querySelector(".append-mode-check");
    const pasteBtn = container.querySelector(".paste-btn");
    const clearBtn = container.querySelector(".clear-btn");
    const nameInput = container.querySelector(".box-name");

    if (height) {
        textarea.style.height = height;
    }

    textarea.addEventListener("input", () => app.saveContent());
    checkbox.addEventListener("change", () => app.saveContent());
    singleUseCheckbox.addEventListener("change", () => app.saveContent());
    appendModeCheckbox.addEventListener("change", () => app.saveContent());
    nameInput.addEventListener("change", () => app.saveContent());

    pasteBtn.addEventListener("click", async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (appendModeCheckbox.checked) {
                textarea.value += "\n" + text;
            } else {
                textarea.value = text;
            }
            app.saveContent();
        } catch (err) {
            console.error("Failed to read clipboard contents: ", err);
        }
    });

    clearBtn.addEventListener("click", () => {
        textarea.value = "";
        app.saveContent();
    });

    app.setupDragAndDrop(container);

    app.state.textareas.push(textarea);
    app.state.checkboxes.push(checkbox);
    app.state.singleUseCheckboxes.push(singleUseCheckbox);
    app.state.appendModeCheckboxes.push(appendModeCheckbox);
    app.state.nameInputs.push(nameInput);
}

export function setupDragAndDrop(element, app) {
    // Implementar lógica para arrastrar y soltar
}
