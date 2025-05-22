document.addEventListener('DOMContentLoaded', function() {
    const app = {
        elements: {
            profileSelector: document.getElementById('profile-selector'),
            renameProfileBtn: document.getElementById('rename-profile-btn'),
            combineBtn: document.getElementById('combine-btn'),
            addBoxBtn: document.getElementById('add-box-btn'),
            selectedTextBox: document.getElementById('selected-text-box'),
            clipboardBox: document.getElementById('clipboard-box'),
            dynamicBoxes: document.getElementById('dynamic-boxes'),
            contentArea: document.getElementById('content-area'),
            settingsBtn: document.getElementById('settings-btn'),
            settingsModal: document.getElementById('settings-modal'),
            saveSettingsBtn: document.getElementById('save-settings'),
            closeSettingsBtn: document.getElementById('close-settings'),
            darkModeToggle: document.getElementById('dark-mode-toggle'),
            addFixedBoxBtn: document.getElementById('add-fixed-box-btn'),
            addRotatingBoxBtn: document.getElementById('add-rotating-box-btn'),
            copyLogsBtn: document.getElementById('copy-logs-btn'),
            logContainer: document.createElement('div')
        },
        state: {
            currentProfile: 'default',
            preferences: {},
            lastSelectedText: '',
            lastClipboardContent: '',
            rotatingContent: ['Tarea 1', 'Tarea 2', 'Tarea 3']
        },
        log: function(message, level = 'info') {
            const logEntry = document.createElement('p');
            logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${level.toUpperCase()}: ${message}`;
            logEntry.className = `log-${level}`;
            this.elements.logContainer.appendChild(logEntry);
            console.log(`[${level.toUpperCase()}] ${message}`);
        }
    };

    function initApp() {
        app.log('Initializing app');
        document.body.appendChild(app.elements.logContainer);
        app.elements.logContainer.style.cssText = 'position: fixed; bottom: 0; left: 0; right: 0; max-height: 100px; overflow-y: auto; background: rgba(0,0,0,0.7); color: white; font-family: monospace; z-index: 1000;';
        loadProfiles();
        loadPreferences();
        loadContent();
        setupEventListeners();
        startPeriodicUpdates();
    }

    function setupEventListeners() {
        app.log('Setting up event listeners');
        
        addListener(app.elements.profileSelector, 'change', handleProfileChange);
        addListener(app.elements.renameProfileBtn, 'click', handleProfileRename);
        addListener(app.elements.combineBtn, 'click', combineContent);
        addListener(app.elements.addBoxBtn, 'click', () => addNewTextBox());
        addListener(app.elements.settingsBtn, 'click', openSettings);
        addListener(app.elements.saveSettingsBtn, 'click', saveSettings);
        addListener(app.elements.closeSettingsBtn, 'click', closeSettings);
        addListener(app.elements.darkModeToggle, 'change', toggleDarkMode);
        addListener(app.elements.addFixedBoxBtn, 'click', () => addFixedBox('Contenido fijo'));
        addListener(app.elements.addRotatingBoxBtn, 'click', () => addRotatingBox());
        addListener(app.elements.copyLogsBtn, 'click', copyLogs);
        
        document.querySelectorAll('.clear-btn').forEach(btn => {
            addListener(btn, 'click', function() {
                this.closest('.text-box').querySelector('textarea').value = '';
                saveContent();
            });
        });

        document.querySelectorAll('.paste-btn').forEach(btn => {
            addListener(btn, 'click', function() {
                const textarea = this.closest('.text-box').querySelector('textarea');
                const appendMode = this.closest('.text-box').querySelector('.append-mode-check').checked;
                pasteSelectedText(textarea, appendMode);
            });
        });

        document.querySelectorAll('.append-mode-check, .copy-check, .no-copy-check').forEach(checkbox => {
            addListener(checkbox, 'change', saveContent);
        });

        document.querySelectorAll('.box-title').forEach(title => {
            addListener(title, 'change', saveContent);
        });
    }

    function addListener(element, event, handler) {
        if (element) {
            element.addEventListener(event, handler);
            app.log(`Added ${event} listener to ${element.id || element.className}`);
        } else {
            app.log(`Failed to add ${event} listener: element not found`, 'error');
        }
    }

    function loadProfiles() {
        app.log('Loading profiles');
        browser.storage.local.get('profiles').then(result => {
            const profiles = result.profiles || ['default'];
            app.elements.profileSelector.innerHTML = profiles.map(profile => 
                `<option value="${profile}">${profile}</option>`
            ).join('') + '<option value="new">Añadir nuevo perfil</option>';
            app.elements.profileSelector.value = app.state.currentProfile;
        }).catch(error => app.log("Error loading profiles: " + error, 'error'));
    }

    function handleProfileChange(e) {
        app.log('Profile change handled');
        if (e.target.value === 'new') {
            const newProfileName = prompt('Ingrese el nombre del nuevo perfil:');
            if (newProfileName) {
                createNewProfile(newProfileName);
            } else {
                e.target.value = app.state.currentProfile;
            }
        } else {
            app.state.currentProfile = e.target.value;
            loadContent();
        }
    }

    function handleProfileRename() {
        app.log('Profile rename handled');
        const newName = prompt('Ingrese el nuevo nombre para el perfil actual:', app.state.currentProfile);
        if (newName && newName !== app.state.currentProfile) {
            renameProfile(app.state.currentProfile, newName);
        }
    }

    function createNewProfile(name) {
        app.log('Creating new profile: ' + name);
        browser.storage.local.get('profiles').then(result => {
            const profiles = result.profiles || ['default'];
            if (!profiles.includes(name)) {
                profiles.push(name);
                browser.storage.local.set({ profiles }).then(() => {
                    app.state.currentProfile = name;
                    loadProfiles();
                    loadContent();
                });
            } else {
                alert('Ya existe un perfil con ese nombre.');
                app.elements.profileSelector.value = app.state.currentProfile;
            }
        }).catch(error => app.log("Error creating new profile: " + error, 'error'));
    }

    function renameProfile(oldName, newName) {
        app.log('Renaming profile from ' + oldName + ' to ' + newName);
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
                        app.state.currentProfile = newName;
                        loadProfiles();
                    });
                });
            }
        }).catch(error => app.log("Error renaming profile: " + error, 'error'));
    }

    function loadContent() {
        app.log('Loading content for profile: ' + app.state.currentProfile);
        browser.storage.local.get(app.state.currentProfile).then(result => {
            const profileData = result[app.state.currentProfile] || {};
            app.elements.selectedTextBox.querySelector('textarea').value = profileData.selectedText || '';
            app.elements.clipboardBox.querySelector('textarea').value = profileData.clipboardContent || '';
            
            app.elements.dynamicBoxes.innerHTML = '';
            if (profileData.dynamicBoxes) {
                profileData.dynamicBoxes.forEach(boxData => {
                    if (boxData.isFixed) {
                        addFixedBox(boxData.content);
                    } else if (boxData.isRotating) {
                        addRotatingBox(boxData.content);
                    } else {
                        addNewTextBox(boxData.title, boxData.content);
                    }
                });
            }
        }).catch(error => app.log("Error loading content: " + error, 'error'));
    }

    function saveContent() {
        app.log('Saving content for profile: ' + app.state.currentProfile);
        const contentToSave = {
            selectedText: app.elements.selectedTextBox.querySelector('textarea').value,
            clipboardContent: app.elements.clipboardBox.querySelector('textarea').value,
            dynamicBoxes: Array.from(app.elements.dynamicBoxes.querySelectorAll('.text-box')).map(box => ({
                title: box.querySelector('.box-title').value,
                content: box.querySelector('textarea').value,
                isFixed: box.dataset.fixed === 'true',
                isRotating: box.dataset.rotating === 'true'
            }))
        };
        browser.storage.local.set({ [app.state.currentProfile]: contentToSave })
            .catch(error => app.log("Error saving content: " + error, 'error'));
    }

    function combineContent() {
        app.log('Combining content');
        let combinedText = '';
        const selectedText = app.elements.selectedTextBox.querySelector('textarea').value;
        const clipboardText = app.elements.clipboardBox.querySelector('textarea').value;
        if (selectedText) combinedText += selectedText + '\n';
        if (clipboardText) combinedText += clipboardText + '\n';
        document.querySelectorAll('.text-box').forEach(box => {
            const copyCheck = box.querySelector('.copy-check');
            const noCopyCheck = box.querySelector('.no-copy-check');
            if (copyCheck && copyCheck.checked && (!noCopyCheck || !noCopyCheck.checked)) {
                const textarea = box.querySelector('textarea');
                combinedText += textarea.value + '\n';
            }
        });
        navigator.clipboard.writeText(combinedText.trim()).then(() => {
            app.log('Content combined and copied to clipboard');
            alert('Contenido combinado y copiado al portapapeles');
        }).catch(err => {
            app.log('Error copying to clipboard: ' + err, 'error');
            alert('Error al copiar al portapapeles. Por favor, inténtalo de nuevo.');
        });
    }

    function addNewTextBox(title = 'Nueva caja', content = '', isFixed = false, isRotating = false) {
        app.log('Adding new text box');
        const newBox = document.createElement('div');
        newBox.className = 'text-box';
        newBox.dataset.fixed = isFixed;
        newBox.dataset.rotating = isRotating;
        newBox.innerHTML = `
            <input type="text" class="box-title" value="${title}" ${isFixed || isRotating ? 'readonly' : ''}>
            <textarea>${content}</textarea>
            <div class="controls">
                <button class="paste-btn">P</button>
                <button class="clear-btn">B</button>
                <input type="checkbox" class="append-mode-check">
                <input type="checkbox" class="copy-check">
                <input type="checkbox" class="no-copy-check">
            </div>
        `;
        app.elements.dynamicBoxes.appendChild(newBox);
        setupEventListeners();
        saveContent();
    }

    function addFixedBox(content = 'Contenido fijo') {
        addNewTextBox('Caja Fija', content, true, false);
    }

    function addRotatingBox() {
        const index = app.state.preferences.rotatingBoxIndex || 0;
        addNewTextBox('Caja Rotatoria', app.state.rotatingContent[index], false, true);
        app.state.preferences.rotatingBoxIndex = (index + 1) % app.state.rotatingContent.length;
        savePreferences();
    }

    function updateSelectedText() {
        app.log('Updating selected text');
        browser.tabs.query({active: true, currentWindow: true}).then((tabs) => {
            if (tabs[0]) {
                browser.tabs.sendMessage(tabs[0].id, {action: "getSelectedText"})
                    .then((response) => {
                        if (response && response.selectedText && response.selectedText !== app.state.lastSelectedText) {
                            app.state.lastSelectedText = response.selectedText;
                            const textarea = app.elements.selectedTextBox.querySelector('textarea');
                            const appendMode = app.elements.selectedTextBox.querySelector('.append-mode-check').checked;
                            if (appendMode) {
                                textarea.value += (textarea.value ? '\n' : '') + response.selectedText;
                            } else {
                                textarea.value = response.selectedText;
                            }
                            saveContent();
                        }
                    })
                    .catch(error => {
                        app.log("Error getting selected text: " + error, 'error');
                        if (error.message.includes('could not establish connection')) {
                            app.log("Connection to content script failed. This is normal if you're not on a web page.", 'warn');
                        }
                    });
            }
        }).catch(error => app.log("Error querying tabs: " + error, 'error'));
    }

    function updateClipboardContent() {
        app.log('Updating clipboard content');
        navigator.clipboard.readText().then(text => {
            if (text !== app.state.lastClipboardContent) {
                app.state.lastClipboardContent = text;
                const textarea = app.elements.clipboardBox.querySelector('textarea');
                const appendMode = app.elements.clipboardBox.querySelector('.append-mode-check').checked;
                if (appendMode) {
                    textarea.value += (textarea.value ? '\n' : '') + text;
                } else {
                    textarea.value = text;
                }
                saveContent();
            }
        }).catch(error => app.log("Error reading clipboard: " + error, 'error'));
    }

    function startPeriodicUpdates() {
        app.log('Starting periodic updates');
        setInterval(() => {
            updateSelectedText();
            updateClipboardContent();
        }, 2000);
    }

    function pasteSelectedText(targetTextarea, appendMode) {
        app.log('Pasting selected text');
        const selectedText = app.elements.selectedTextBox.querySelector('textarea').value;
        if (appendMode) {
            targetTextarea.value += (targetTextarea.value ? '\n' : '') + selectedText;
        } else {
            targetTextarea.value = selectedText;
        }
        saveContent();
    }

    function openSettings() {
        app.log('Opening settings');
        if (app.elements.settingsModal) {
            app.elements.settingsModal.style.display = 'block';
        } else {
            app.log('Settings modal not found', 'error');
        }
    }

    function closeSettings() {
        app.log('Closing settings');
        if (app.elements.settingsModal) {
            app.elements.settingsModal.style.display = 'none';
        } else {
            app.log('Settings modal not found', 'error');
        }
    }

    function saveSettings() {
        app.log('Saving settings');
        savePreferences();
        closeSettings();
    }

    function toggleDarkMode() {
        app.log('Toggling dark mode');
        document.body.classList.toggle('dark-mode');
        app.state.preferences.darkMode = document.body.classList.contains('dark-mode');
        savePreferences();
    }

    function loadPreferences() {
        app.log('Loading preferences');
        browser.storage.local.get('preferences')
            .then(result => {
                app.state.preferences = result.preferences || {};
                if (app.state.preferences.darkMode) {
                    document.body.classList.add('dark-mode');
                }
                if (app.state.preferences.rotatingContent) {
                    app.state.rotatingContent = app.state.preferences.rotatingContent;
                }
                if (app.elements.darkModeToggle) {
                    app.elements.darkModeToggle.checked = app.state.preferences.darkMode;
                }
            })
            .catch(error => app.log("Error loading preferences: " + error, 'error'));
    }

    function savePreferences() {
        app.log('Saving preferences');
        app.state.preferences.darkMode = document.body.classList.contains('dark-mode');
        app.state.preferences.rotatingContent = app.state.rotatingContent;
        browser.storage.local.set({ preferences: app.state.preferences })
            .then(() => app.log('Preferences saved'))
            .catch(error => app.log("Error saving preferences: " + error, 'error'));
    }

    function copyLogs() {
        app.log('Copying logs');
        const logText = Array.from(app.elements.logContainer.children)
            .map(log => log.textContent)
            .join('\n');
        navigator.clipboard.writeText(logText)
            .then(() => app.log('Logs copied to clipboard'))
            .catch(error => app.log("Error copying logs: " + error, 'error'));
    }

    initApp();
});





