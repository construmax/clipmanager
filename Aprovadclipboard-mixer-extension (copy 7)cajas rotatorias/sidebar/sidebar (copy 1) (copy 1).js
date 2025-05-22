document.addEventListener('DOMContentLoaded', function() {
  const allBoxes = document.getElementById('all-boxes');
  const dynamicBoxes = document.getElementById('dynamic-boxes');
  const combineButton = document.getElementById('combineBtn');
  const selectedTextArea = document.getElementById('selected-text');
  const clipboardContentArea = document.getElementById('clipboard-content');
  const profileSelector = document.getElementById('profile-selector');
  const renameProfileBtn = document.getElementById('renameProfileBtn');
  let textareas = [];
  let checkboxes = [];
  let singleUseCheckboxes = [];
  let appendModeCheckboxes = [];
  let currentProfile = 'default';

  // Tamaño actual de las cajas:
  // width: calc(100% - 30px)
  // min-height: 60px
  // El ancho se ajusta automáticamente al espacio disponible
  // La altura mínima es de 60px, pero se puede aumentar

  function createTextBox(index, text = '', checked = true, singleUse = false, append = false, height = '') {
    const container = document.createElement('div');
    container.className = 'text-container';
    container.draggable = true;
    container.innerHTML = `
      <div class="textarea-wrapper">
        <textarea id="text${index}" placeholder="Texto ${index}">${text}</textarea>
        <div class="button-checkbox">
          <button class="paste-btn" data-index="${index}" title="Pegar">P</button>
          <button class="clear-btn" data-index="${index}" title="Borrar">B</button>
          <input type="checkbox" id="check${index}" ${checked ? 'checked' : ''}>
          <input type="checkbox" class="single-use" title="Un solo uso" ${singleUse ? 'checked' : ''}>
          <input type="checkbox" class="append-mode" title="Modo Append" ${append ? 'checked' : ''}>
        </div>
      </div>
    `;
    dynamicBoxes.appendChild(container);

    const textarea = container.querySelector('textarea');
    const checkbox = container.querySelector('input[type="checkbox"]:not(.single-use):not(.append-mode)');
    const singleUseCheckbox = container.querySelector('.single-use');
    const appendModeCheckbox = container.querySelector('.append-mode');
    const pasteBtn = container.querySelector('.paste-btn');
    const clearBtn = container.querySelector('.clear-btn');

    if (height) {
      textarea.style.height = height;
    }

    textarea.addEventListener('input', saveContent);
    checkbox.addEventListener('change', saveContent);
    singleUseCheckbox.addEventListener('change', saveContent);
    appendModeCheckbox.addEventListener('change', saveContent);
    textarea.addEventListener('mouseup', saveTextareaHeight);
    pasteBtn.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (appendModeCheckbox.checked) {
          textarea.value += '\n' + text;
        } else {
          textarea.value = text;
        }
        saveContent();
      } catch (err) {
        console.error('Failed to read clipboard contents: ', err);
      }
    });
    clearBtn.addEventListener('click', () => {
      textarea.value = '';
      saveContent();
    });

    setupDragAndDrop(container);

    textareas.push(textarea);
    checkboxes.push(checkbox);
    singleUseCheckboxes.push(singleUseCheckbox);
    appendModeCheckboxes.push(appendModeCheckbox);
  }

  function setupDragAndDrop(element) {
    element.addEventListener('dragstart', dragStart);
    element.addEventListener('dragover', dragOver);
    element.addEventListener('drop', drop);
    element.addEventListener('dragend', dragEnd);
  }

  function dragStart(e) {
    e.target.closest('.text-container').classList.add('dragging');
  }

  function dragOver(e) {
    e.preventDefault();
    const draggingElement = document.querySelector('.dragging');
    const currentElement = e.target.closest('.text-container');
    if (draggingElement !== currentElement) {
      const rect = currentElement.getBoundingClientRect();
      const next = (e.clientY - rect.top) / (rect.bottom - rect.top) > 0.5;
      if (next) {
        allBoxes.insertBefore(draggingElement, currentElement.nextSibling);
      } else {
        allBoxes.insertBefore(draggingElement, currentElement);
      }
    }
  }

  function drop(e) {
    e.preventDefault();
  }

  function dragEnd(e) {
    e.target.closest('.text-container').classList.remove('dragging');
    updateOrder();
  }

  function updateOrder() {
    const order = Array.from(allBoxes.children).map(child => child.id || child.querySelector('textarea').id);
    browser.storage.local.set({ [`order_${currentProfile}`]: order });
  }

  function saveContent() {
    const boxes = textareas.map((textarea, index) => ({
      text: textarea.value,
      checked: checkboxes[index].checked,
      singleUse: singleUseCheckboxes[index].checked,
      append: appendModeCheckboxes[index].checked,
      height: textarea.style.height
    }));

    const profileData = {
      boxes,
      selectedText: selectedTextArea.value,
      clipboardContent: clipboardContentArea.value
    };

    browser.storage.local.set({ [currentProfile]: profileData });
    updateOrder();
  }

  function saveTextareaHeight() {
    saveContent();
  }

  function loadBoxes() {
    browser.storage.local.get([currentProfile, `order_${currentProfile}`, 'boxCount']).then(result => {
      const profileData = result[currentProfile] || {};
      const order = result[`order_${currentProfile}`] || [];
      const boxCount = result.boxCount || 3;
      
      dynamicBoxes.innerHTML = '';
      textareas = [];
      checkboxes = [];
      singleUseCheckboxes = [];
      appendModeCheckboxes = [];

      for (let i = 0; i < boxCount; i++) {
        const box = profileData.boxes && profileData.boxes[i] ? profileData.boxes[i] : {};
        createTextBox(i + 1, box.text, box.checked, box.singleUse, box.append, box.height);
      }

      if (order.length > 0) {
        order.forEach(id => {
          const element = document.getElementById(id) || document.querySelector(`#${id}`).closest('.text-container');
          if (element) {
            allBoxes.appendChild(element);
          }
        });
      }

      selectedTextArea.value = profileData.selectedText || '';
      clipboardContentArea.value = profileData.clipboardContent || '';
    });
  }

  let lastSelectedText = '';
  let lastClipboardContent = '';

  function updateSelectedText() {
    browser.tabs.query({active: true, currentWindow: true}).then((tabs) => {
      if (tabs[0]) {
        browser.tabs.sendMessage(tabs[0].id, {action: "getSelectedText"}).then((response) => {
          if (response && response.selectedText && response.selectedText !== lastSelectedText) {
            lastSelectedText = response.selectedText;
            const selectedTextCheckbox = document.querySelector('#include-selected');
            const selectedTextAppendCheckbox = document.querySelector('#selected-text-container .append-mode');
            if (selectedTextCheckbox && selectedTextCheckbox.checked) {
              if (selectedTextAppendCheckbox && selectedTextAppendCheckbox.checked) {
                selectedTextArea.value = response.selectedText + (selectedTextArea.value ? '\n' : '') + selectedTextArea.value;
              } else {
                selectedTextArea.value = response.selectedText;
              }
              saveContent();
            }
          }
        }).catch((error) => {
          console.error("Error al obtener el texto seleccionado:", error);
        });
      }
    });
  }

  function updateClipboardContent() {
    navigator.clipboard.readText().then(text => {
      if (text && text !== lastClipboardContent) {
        lastClipboardContent = text;
        const clipboardCheckbox = document.querySelector('#include-clipboard');
        const clipboardAppendCheckbox = document.querySelector('#clipboard-content-container .append-mode');
        if (clipboardCheckbox && clipboardCheckbox.checked) {
          if (clipboardAppendCheckbox && clipboardAppendCheckbox.checked) {
            clipboardContentArea.value = text + (clipboardContentArea.value ? '\n' : '') + clipboardContentArea.value;
          } else {
            clipboardContentArea.value = text;
          }
          saveContent();
        }
      }
    }).catch(err => {
      console.error('Failed to read clipboard contents: ', err);
    });
  }

  function combineInformation() {
    const allTextareas = Array.from(allBoxes.querySelectorAll('textarea'));
    const allCheckboxes = Array.from(allBoxes.querySelectorAll('input[type="checkbox"]:not(.single-use):not(.append-mode)'));
    const allSingleUseCheckboxes = Array.from(allBoxes.querySelectorAll('.single-use'));
    
    const combinedText = allTextareas
      .filter((textarea, index) => allCheckboxes[index].checked)
      .map(textarea => textarea.value)
      .join('\n');

    navigator.clipboard.writeText(combinedText);

    // Limpiar cajas de un solo uso
    allTextareas.forEach((textarea, index) => {
      if (allSingleUseCheckboxes[index].checked && allCheckboxes[index].checked) {
        textarea.value = '';
      }
    });

    saveContent();
  }

  combineButton.addEventListener('click', combineInformation);

  // Actualizar el texto seleccionado y el contenido del portapapeles cada 2 segundos
  setInterval(() => {
    updateSelectedText();
    updateClipboardContent();
  }, 2000);

  setupDragAndDrop(document.getElementById('selected-text-container'));
  setupDragAndDrop(document.getElementById('clipboard-content-container'));

  profileSelector.addEventListener('change', (e) => {
    if (e.target.value === 'new') {
      const newProfileName = prompt('Ingrese el nombre del nuevo perfil:');
      if (newProfileName) {
        createNewProfile(newProfileName);
      } else {
        profileSelector.value = currentProfile;
      }
    } else {
      currentProfile = e.target.value;
      loadBoxes();
    }
  });

  renameProfileBtn.addEventListener('click', () => {
    const newName = prompt('Ingrese el nuevo nombre para el perfil actual:', currentProfile);
    if (newName && newName !== currentProfile) {
      renameProfile(currentProfile, newName);
    }
  });

  function createNewProfile(name) {
    browser.storage.local.get('profiles').then(result => {
      const profiles = result.profiles || ['default'];
      if (!profiles.includes(name)) {
        profiles.push(name);
        browser.storage.local.set({ profiles }).then(() => {
          currentProfile = name;
          loadProfiles();
          loadBoxes();
        });
      } else {
        alert('Ya existe un perfil con ese nombre.');
        profileSelector.value = currentProfile;
      }
    });
  }

  function renameProfile(oldName, newName) {
    browser.storage.local.get(['profiles', oldName]).then(result => {
      const profiles = result.profiles || ['default'];
      const index = profiles.indexOf(oldName);
      if (index !== -1) {
        profiles[index] = newName;
        const profileData = result[oldName];
        browser.storage.local.remove(oldName).then(() => {
          browser.storage.local.set({ 
            profiles, 
            [newName]: profileData 
          }).then(() => {
            currentProfile = newName;
            loadProfiles();
          });
        });
      }
    });
  }

  function loadProfiles() {
    browser.storage.local.get('profiles').then(result => {
      const profiles = result.profiles || ['default'];
      profileSelector.innerHTML = profiles.map(profile => 
        `<option value="${profile}">${profile}</option>`
      ).join('') + '<option value="new">Añadir nuevo perfil</option>';
      profileSelector.value = currentProfile;
    });
  }

  loadProfiles();
  loadBoxes();

  // Escuchar mensajes del background script
  browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "combineInformation") {
      combineInformation();
    }
  });

  // Añadir funcionalidad de borrado para las cajas de texto seleccionado y portapapeles
  document.querySelector('#selected-text-container .clear-btn').addEventListener('click', () => {
    selectedTextArea.value = '';
    saveContent();
  });

  document.querySelector('#clipboard-content-container .clear-btn').addEventListener('click', () => {
    clipboardContentArea.value = '';
    saveContent();
  });
});
