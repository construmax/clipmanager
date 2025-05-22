export function saveContent(app) {
    const boxes = Array.from(app.elements.allBoxes.querySelectorAll(".text-box")).map(box => ({
        text: box.querySelector("textarea").value,
        checked: box.querySelector(".include-check").checked,
        singleUse: box.querySelector(".single-use-check").checked,
        append: box.querySelector(".append-mode-check").checked,
        name: box.querySelector(".box-name").value,
        height: box.querySelector("textarea").style.height
    }));

    const profileData = {
        boxes,
        selectedText: app.elements.selectedTextArea.value,
        clipboardContent: app.elements.clipboardContentArea.value
    };

    browser.storage.local.set({ [app.state.currentProfile]: profileData });
    updateOrder(app);
}

export function loadBoxes(app) {
    browser.storage.local.get([app.state.currentProfile, `order_${app.state.currentProfile}`, "boxCount"]).then(result => {
        const profileData = result[app.state.currentProfile] || {};
        const order = result[`order_${app.state.currentProfile}`] || [];
        const boxCount = result.boxCount || 3;
        
        app.elements.dynamicBoxes.innerHTML = "";

        if (profileData.boxes) {
            profileData.boxes.forEach((box, index) => {
                app.createTextBox(app, index + 1, box.text, box.checked, box.singleUse, box.append, box.height, box.name);
            });
        } else {
            for (let i = 0; i < boxCount; i++) {
                app.createTextBox(app, i + 1);
            }
        }

        if (order.length > 0) {
            order.forEach(id => {
                const element = document.getElementById(id) || document.querySelector(`#${id}`);
                if (element) {
                    app.elements.dynamicBoxes.appendChild(element);
                }
            });
        }

        app.elements.selectedTextArea.value = profileData.selectedText || "";
        app.elements.clipboardContentArea.value = profileData.clipboardContent || "";
    });
}

export function updateOrder(app) {
    const order = Array.from(app.elements.dynamicBoxes.children).map(child => child.id || child.querySelector("textarea").id);
    browser.storage.local.set({ [`order_${app.state.currentProfile}`]: order });
}
