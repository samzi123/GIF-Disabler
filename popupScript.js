// Scripts associated with the index.html page and run when the extension is clicked to show the popup.

// need to add a click listener here because Chrome doesn't allow inline JS in the index.html
document.addEventListener('DOMContentLoaded', function() {
    // add listeners to all switches
    const masterSwitch = document.getElementById('masterSwitchIcon');
    masterSwitch.addEventListener('click', function() {
        masterSwitchClicked();
    });

    const settingsSwitches = document.getElementsByClassName('settingsSwitch');

    for (let i = 0; i < settingsSwitches.length; i++) {
        const settingsSwitch = settingsSwitches[i];

        settingsSwitch.addEventListener('click', function() {
            settingsSwitchClicked(settingsSwitch.id);
        });
    }
});

// changes the value of a switch in the settings
function invertSavedBooleanValue (variableName) {
    chrome.storage.sync.get([variableName], function(data){
        const currentValue = data[variableName];
        let storageValues= {};

        if (currentValue === false) {
            storageValues[variableName] = true;
        } else {         
            storageValues[variableName] = false;  
        }

        chrome.storage.sync.set(storageValues, function(){ });
    });
}

// called anytime the toggle is clicked to switch the extension on or off
function masterSwitchClicked() {
    invertSavedBooleanValue("gifExtensionDisabled");
    // update the toggle to the new value
    let masterSwitchToggleCheckbox = document.getElementById("masterSwitchToggleCheckbox");
    masterSwitchToggleCheckbox.checked = !masterSwitchToggleCheckbox.checked;
    document.getElementById("masterSwitchText").innerHTML = masterSwitchToggleCheckbox.checked ? "ON" : "OFF";
}


// called anytime the toggle is clicked to switch the extension on or off
function settingsSwitchClicked(settingsType) {
    // check which setting was toggled, then flip the saved value
    if (settingsType === "playOnHoverToggle") {
        invertSavedBooleanValue(settingsType);
    }
}

// updates all the settings toggles to their saved values
function updateSettingsTogglesToSavedValues() {
    chrome.storage.sync.get(["playOnHoverToggle"], function(data){
        let playOnHoverToggle = data.playOnHoverToggle;

        // default to being enabled if the value is undefined (on first install)
        if (playOnHoverToggle === undefined) {
            chrome.storage.sync.set({ 'playOnHoverToggle': true });
            playOnHoverToggle = true;
        }

        document.getElementById("playOnHoverCheckbox").checked = playOnHoverToggle;
    });
}

function updateMasterSwitchToggleToSavedValue() {
    chrome.storage.sync.get(["gifExtensionDisabled"], function(data){
        var gifExtensionDisabled = data.gifExtensionDisabled;

        // default to being enabled if the value is undefined (on first install)
        if (gifExtensionDisabled === undefined) {
            chrome.storage.sync.set({ 'gifExtensionDisabled': false });
            gifExtensionDisabled = false;
        }

        document.getElementById("masterSwitchToggleCheckbox").checked = !gifExtensionDisabled;
        document.getElementById("masterSwitchText").innerHTML = gifExtensionDisabled ? "OFF" : "ON";
    });
}

// fetches whether the extension is disabled and updates the toggles accordingly
function initialize() {
    updateMasterSwitchToggleToSavedValue();
    updateSettingsTogglesToSavedValues();
}

initialize();
