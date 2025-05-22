function saveOptions(e) {
  e.preventDefault();
  browser.storage.local.set({
    preferences: {
      autoUpdateSelectedText: document.getElementById('autoUpdateSelectedText').checked,
      autoUpdateClipboard: document.getElementById('autoUpdateClipboard').checked
    }
  });
}

function restoreOptions() {
  function setCurrentChoice(result) {
    document.getElementById('autoUpdateSelectedText').checked = result.preferences?.autoUpdateSelectedText || false;
    document.getElementById('autoUpdateClipboard').checked = result.preferences?.autoUpdateClipboard || false;
  }

  function onError(error) {
    console.log(`Error: ${error}`);
  }

  let getting = browser.storage.local.get('preferences');
  getting.then(setCurrentChoice, onError);
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.querySelector('form').addEventListener('submit', saveOptions);
