browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getSelectedText") {
        sendResponse({selectedText: window.getSelection().toString()});
    }
    return true;
});
