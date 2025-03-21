let gameModes;

let gameState = 0; // 0 => choose gamemode; 1 => startGame; 2 => selectMap
let totalScore = 0;
let gameArea; // not yet set area to choose locations from
let gameStarted = false;
let isOnline = false;
let isHost = false;
let syncRandomImage = "";
let syncActualMap = "";
let reload = false;

let devMode = -1;
let altDevMode = 0;

let loadingDiv;

// Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBDDQ-mIDOwBabaArd7NTW3bna92zhKifA",
    authDomain: "mocoxiii-mapguessr.firebaseapp.com",
    projectId: "mocoxiii-mapguessr",
    storageBucket: "mocoxiii-mapguessr.firebasestorage.app",
    messagingSenderId: "159195403147",
    appId: "1:159195403147:web:b0fdb670cabc24680c158e",
    measurementId: "G-DNV45FQ36B"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore (for real-time messaging)
const db = firebase.firestore();

// Initialize Firebase Authentication
const auth = firebase.auth();

auth.signInAnonymously().catch(error => {
    console.error('Authentication failed:', error);
});

function closeAllLobbies() {
    db.collection('lobbies').get().then(querySnapshot => {
        querySnapshot.forEach(doc => {
            doc.ref.delete();
        });
    });
}

function closeThisLobby() {
    db.collection('lobbies').doc(lobbyName).delete();
    location.reload();
}

function clearHosts() {
    db.collection('lobbies').get().then(querySnapshot => {
        querySnapshot.forEach(doc => {
            doc.ref.update({
                players: doc.data().players.reduce((acc, player) => {
                    if (!player.host) acc.push(player);
                    return acc;
                }, [])
            });
        });
    });
}

// Function to load the JSON file
async function loadGameModes() {
    try {
        const response = await fetch('gameModes.json'); // Path to your JSON file
        if (!response.ok) {
            throw new Error('Failed to load game modes');
        }
        gameModes = await response.json(); // Parse the JSON data
        console.log('Game modes loaded successfully:', gameModes);
        // Call any functions that depend on gameModes here
        initializeGame();
    } catch (error) {
        console.error('Error loading game modes:', error);
    }
}

function getPlayerNames(players) {
    let result = '';
    players.sort((a, b) => b.totalScore - a.totalScore).forEach(player => {
        result += `\n${player.name} (${player.score.toFixed(0)} / ${player.totalScore.toFixed(0)})`;
    });
    return result;
}

// Example function that uses gameModes
function initializeGame() {
    if (gameModes) {
        console.log('Initializing game with:', gameModes);
        // Your game initialization logic here
        gameArea = getNestedObject(gameModes, []);
        chooseVersion();
    } else {
        console.error('Game modes not loaded yet.');
    }
}

// Load the game modes when the script runs
loadGameModes();

const gameVersionDiv = document.createElement('div');
const lobbyInput = document.createElement('input');
const nameInput = document.createElement('input');
let lobbyName = "defaultlobby";
let userName = "defaultuser";

function chooseVersion() {
    gameVersionDiv.id = 'gameVersion';
    document.body.appendChild(gameVersionDiv);


    // Create the text input for lobby name
    lobbyInput.type = 'text';
    lobbyInput.placeholder = 'Lobby Name';
    lobbyInput.classList.add('input-field-1');
    nameInput.type = 'text';
    nameInput.placeholder = 'Your Name';
    nameInput.classList.add('input-field-2');

    // Create loading animation element
    loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-animation';
    loadingDiv.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(loadingDiv);
    loadingDiv.style.display = 'none'; // Initially hidden

    // Create the join lobby button
    const joinLobbyButton = document.createElement('button');
    joinLobbyButton.innerText = 'Join Lobby';
    joinLobbyButton.onclick = () => {
        isOnline = true;
        lobbyName = lobbyInput.value.trim();
        userName = nameInput.value.trim();
        if (lobbyName) {
            if (userName) {
                loadingDiv.style.display = 'flex';
                joinLobby();
            } else {
                showCustomAlert('No user name provided.', undefined, gameVersionDiv);
            }
        } else {
            showCustomAlert('No lobby name provided.', undefined, gameVersionDiv);
        }
    };

    gameVersionDiv.appendChild(joinLobbyButton);
    gameVersionDiv.appendChild(lobbyInput);
    gameVersionDiv.appendChild(nameInput);
    gameVersionDiv.appendChild(document.createElement('br'));

    // Create the play single player button
    const singlePlayerButton = document.createElement('button');
    singlePlayerButton.innerText = 'Play Single Player';
    singlePlayerButton.onclick = () => {
        console.log('Starting single player game...');
        gameVersionDiv.style.display = 'none';
        startGameModeSelector();
    };
    gameVersionDiv.appendChild(singlePlayerButton);
}

function leaveLobby() {
    db.collection('lobbies').doc(lobbyName).get().then(doc => {
        if (doc.exists) {
            const players = doc.data().players || [];
            const updatedPlayers = players.filter(player => player.name !== userName);
            if (updatedPlayers.length === 0) {
                closeThisLobby();
            }
            doc.ref.update({ players: updatedPlayers }).then(() => {
                location.reload();
            });
        }
    });
}

function joinLobby() {
    console.log(`Joining lobby: ${lobbyName}`);
    gameVersionDiv.style.display = 'none';
    const leaveLobbyButton = document.createElement('button');
    leaveLobbyButton.innerText = 'Leave Lobby';
    leaveLobbyButton.style.position = 'fixed';
    leaveLobbyButton.style.bottom = '0';
    leaveLobbyButton.style.left = '50%';
    leaveLobbyButton.style.transform = 'translateX(-50%)';
    leaveLobbyButton.style.zIndex = '9999';
    leaveLobbyButton.style.cursor = 'pointer';
    leaveLobbyButton.onclick = () => {
        leaveLobby();
    };
    document.body.appendChild(leaveLobbyButton);
    db.collection('lobbies').doc(lobbyName).get().then(doc => {
        if (doc.exists) {
            const existingPlayers = doc.data().players;
            const existingPlayerNames = existingPlayers.map(player => player.name);
            let newUserName = userName;
            let number = 1;
            const existingUID = existingPlayers.find(player => player.uid === auth.currentUser.uid);
            const existingUserName = existingPlayers.find(player => player.name === userName);
            if (existingUID && existingPlayerNames.includes(newUserName)) {
                isHost = existingUserName ? existingUserName.host : false;
            } else {
                while (existingPlayerNames.includes(newUserName)) {
                    newUserName = `${userName}(${number})`;
                    number++;
                }
            }
            userName = newUserName;
            console.log(`Lobby exists, joining as ${userName}`);
            
            // Join the lobby
            doc.ref.get().then(docSnapshot => {
                if (docSnapshot.exists) {
                    const players = docSnapshot.data().players || [];
                    let playerExists = false;
                    const updatedPlayers = players.map(player => {
                        if (player.name === userName) {
                            playerExists = true;
                            return {
                                uid: auth.currentUser.uid,
                                name: userName,
                                host: isHost,
                                wantsHost: null,
                                score: 0,
                                totalScore: 0
                            };
                        }
                        return player;
                    });
                    if (!playerExists) {
                        updatedPlayers.push({
                            uid: auth.currentUser.uid,
                            name: userName,
                            host: isHost,
                            wantsHost: null,
                            score: 0,
                            totalScore: 0
                        });
                    }
                    doc.ref.update({ players: updatedPlayers });
                }
            }).then(() => {
                loadingDiv.style.display = 'none';
                if (isHost) {
                    playAsHost();
                } else {
                    playAsMember();
                }
            });
        } else {
            console.log('Lobby does not exist, creating...');
            // Create the lobby
            db.collection('lobbies').doc(lobbyName).set({
                players: [{
                    uid: auth.currentUser.uid,
                    name: userName,
                    host: true,
                    wantsHost: null,
                    score: 0,
                    totalScore: 0
                }]
            }).then(() => {
                loadingDiv.style.display = 'none';
                playAsHost();
            });
        }
    }).catch(error => {
        console.error('Error joining lobby:', error);
        loadingDiv.style.display = 'none';
        showCustomAlert('An error occurred. Please try again.', undefined, gameVersionDiv);
    });
}

const playerListDiv = document.createElement('div');
playerListDiv.id = 'playerList';
const playerListText = document.createElement('p');
playerListText.innerText = 'Players:';
playerListDiv.appendChild(playerListText);

function playAsMember() {
    gameVersionDiv.style.display = 'none';
    lobbyName = lobbyInput.value;
    const claimHostButton = document.createElement('button');
    db.collection('lobbies').doc(lobbyName).onSnapshot(doc => {
        if (!doc.exists) {
            showCustomAlert('Lobby no longer exists. The page will reload now.', undefined, [gameVersionDiv, playerListDiv, gameContainer]);
            window.location.reload();
            return;
        }
        const players = doc.data().players || [];
        const userInLobby = players.find(player => player.uid === auth.currentUser.uid);
        if (!userInLobby) {
            showCustomAlert('You have been kicked from this lobby. The page will reload now.', undefined, [gameVersionDiv, playerListDiv, gameContainer]);
            window.location.reload();
            return;
        }
        setTimeout(() => {
            db.collection('lobbies').doc(lobbyName).get().then(doc => {
                const hostPlayers = doc.data().players.filter(player => player.host);
                if (hostPlayers.length === 0) {
                    const wantsHostPlayers = doc.data().players.filter(player => player.wantsHost !== null && player.wantsHost !== undefined);
                    if (wantsHostPlayers.length > 0) {
                        const ourPlayer = wantsHostPlayers.find(player => player.name === userName);
                        if (ourPlayer && wantsHostPlayers.reduce((max, player) => player.wantsHost > max ? player.wantsHost : max, 0) === ourPlayer.wantsHost) {
                            doc.ref.update({
                                players: doc.data().players.map(player => {
                                    if (player.name === userName) {
                                        player.host = true;
                                        player.wantsHost = null;
                                    }
                                    return player;
                                })
                            }).then(() => {
                                isHost = true;
                                playAsHost();
                            });
                        } else {
                            doc.ref.update({
                                players: doc.data().players.map(player => {
                                    if (player.name === userName) {
                                        player.wantsHost = null;
                                    }
                                    return player;
                                })
                            });
                            isHost = false;
                        }
                    }
                    claimHostButton.id = 'claimHostButton';
                    claimHostButton.innerText = 'Claim Host Position';
                    claimHostButton.style.position = 'fixed';
                    claimHostButton.style.bottom = '0';
                    claimHostButton.style.left = '0';
                    claimHostButton.onclick = () => {
                        doc.ref.update({
                            players: doc.data().players.map(player => {
                                if (player.name === userName) {
                                    player.wantsHost = Math.random();
                                }
                                return player;
                            })
                        });
                    };
                    document.body.appendChild(claimHostButton);
                } else {
                    const claimHostButton = document.getElementById('claimHostButton');
                    if (claimHostButton) {
                        claimHostButton.remove();
                    }
                }
                if (doc.data().gameStarted && syncRandomImage != doc.data().randomImage) {
                    syncActualMap = doc.data().actualMap;
                    syncRandomImage = doc.data().randomImage;
                    reload = doc.data().reload;
                    startGame(JSON.parse(doc.data().gameArea));
                } else {
                    const playerNames = getPlayerNames(doc.data().players);
                    playerListText.innerText = `Players: ${playerNames}`;
                    document.body.appendChild(playerListDiv);
                }
                if (reload) {
                    location.reload();
                }
            });
        }, 1000); // IMPORTANT: gives the server some time to transfer the data
    });
}

function playAsHost() {
    gameVersionDiv.style.display = 'none';
    db.collection('lobbies').doc(lobbyName).onSnapshot(doc => {
        if (!doc.exists) {
            showCustomAlert('Lobby no longer exists. The page will reload now.', undefined, [gameVersionDiv, playerListDiv, gameContainer]);
            window.location.reload();
            return;
        }
        const players = doc.data().players || [];
        const playerNames = getPlayerNames(players);
        playerListText.innerText = `Players: ${playerNames}`;
        document.body.appendChild(playerListDiv);
    });
    const closeLobbyButton = document.createElement('button');
    const giveUpHostButton = document.createElement('button');
    giveUpHostButton.id = 'giveUpHostButton';
    giveUpHostButton.innerText = 'Give up host position';
    giveUpHostButton.style.position = 'fixed';
    giveUpHostButton.style.bottom = '0';
    giveUpHostButton.style.left = '0';
    giveUpHostButton.onclick = () => {
        db.collection('lobbies').doc(lobbyName).get().then(doc => {
            if (doc.exists) {
                doc.ref.update({
                    players: doc.data().players.map(player => {
                        if (player.uid === auth.currentUser.uid) {
                            player.host = false;
                        }
                        return player;
                    })
                });
                giveUpHostButton.remove();
                closeLobbyButton.remove();
                gameModeSelector.style.display = 'none';
                isHost = false;
                playAsMember();
            }
        });
    };
    document.body.appendChild(giveUpHostButton);

    closeLobbyButton.id = 'closeLobbyButton';
    closeLobbyButton.innerText = 'Close Lobby';
    closeLobbyButton.style.position = 'fixed';
    closeLobbyButton.style.bottom = '0';
    const giveUpHostButtonRect = giveUpHostButton.getBoundingClientRect();
    closeLobbyButton.style.left = `${giveUpHostButtonRect.right}px`;
    closeLobbyButton.onclick = () => {
        closeThisLobby();
    };
    document.body.appendChild(closeLobbyButton);

    isHost = true;

    db.collection('lobbies').doc(lobbyName).get().then(doc => {
        if (doc.data().hasOwnProperty('gameStarted')) {
            gameStarted = doc.data().gameStarted;
        }
        if (!gameStarted) {
            startGameModeSelector();
        }
    });
}

/**
 * Shows a custom alert box with a message and a close button. If mode is 0, the box will shake and have a red border, indicating an error. If mode is not 0, the box will have a green border.
 * @param {string} message The message to show in the alert box.
 * @param {number} mode The mode of the alert box. Only supports 0 for now.
 * @param {HTMLElement} cont The container element to shake if mode is 0. If not provided, the game container will be used.
 */
function showCustomAlert(message, mode = 0, cont = null) {
    if (document.getElementById('custom-alert')) return; // Prevent multiple alerts
    if (mode === 0) {
        if (cont === null) {
            cont = document.getElementById('gameContainer');
        }

        if (Array.isArray(cont)) {
            cont.forEach(element => {
                element.animate([
                    { transform: 'translateX(0)' },
                    { transform: 'translateX(-12px)' },
                    { transform: 'translateX(12px)' },
                    { transform: 'translateX(0)' }
                ], {
                    duration: 400,  // Total duration of the shake
                    easing: 'ease-in-out',
                    iterations: 1  // Runs only once
                });
            });
        } else if (cont) {
            cont.animate([
                { transform: 'translateX(0)' },
                { transform: 'translateX(-12px)' },
                { transform: 'translateX(12px)' },
                { transform: 'translateX(0)' }
            ], {
                duration: 400,  // Total duration of the shake
                easing: 'ease-in-out',
                iterations: 1  // Runs only once
            });
        }
    }

    // Create overlay to block interactions
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.background = 'rgba(0, 0, 0, 0)';
    overlay.style.zIndex = '999';
    overlay.style.pointerEvents = 'auto'; // Blocks interactions
    document.body.appendChild(overlay);

    // Create the alert box
    const alertBox = document.createElement('div');
    alertBox.id = 'custom-alert'; // Unique ID to prevent duplicates
    alertBox.innerText = message;
    alertBox.style.position = 'fixed';
    alertBox.style.top = '50%';
    alertBox.style.left = '50%';
    alertBox.style.transform = 'translate(-50%, -50%)';
    alertBox.style.background = 'rgb(40, 40, 40)';
    alertBox.style.color = 'white';
    alertBox.style.padding = '20px';
    alertBox.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.3)';
    alertBox.style.zIndex = '1001';
    alertBox.style.borderRadius = '8px';
    alertBox.style.textAlign = 'center';

    // Create the close button
    const closeButton = document.createElement('button');
    closeButton.innerText = 'OK';
    closeButton.style.marginTop = '10px';
    closeButton.style.padding = '5px 10px';
    closeButton.style.border = 'none';
    closeButton.style.color = 'white';
    closeButton.style.cursor = 'pointer';
    closeButton.style.borderRadius = '4px';

    if (mode === 0) {
        alertBox.style.border = '2px solid red';
        closeButton.style.background = 'red';
    } else {
        alertBox.style.border = '2px solid green';
        closeButton.style.background = 'green';
    }

    function closeAlert() {
        alertBox.remove();
        overlay.remove();
        document.removeEventListener('keydown', keyHandler); // Remove key listener
    }

    closeButton.onclick = closeAlert;
    overlay.onclick = closeAlert;

    // Close on Enter key
    function keyHandler(event) {
        if (event.key === 'Enter') {
            closeAlert();
        }
    }

    document.addEventListener('keydown', keyHandler);

    alertBox.appendChild(closeButton);
    document.body.appendChild(alertBox);
    closeButton.focus(); // Focus on button so Enter works immediately
}

let gameModeSelector = document.getElementById('gameModeSelector');
if (!gameModeSelector) {
    gameModeSelector = document.createElement('div');
    gameModeSelector.id = 'gameModeSelector';
    document.body.appendChild(gameModeSelector);
}
gameModeSelector.style.display = 'none';

const selectedPathElement = document.createElement('p');
const selectButton = document.createElement('button');

function startGameModeSelector() {
    // Create the gameModeSelector div if it doesn't exist
    gameModeSelector.style.display = 'block';

    // Create the selectedPathElement and the selectButton
    selectedPathElement.id = 'selectedPath';
    selectedPathElement.innerText = 'Choose a game (or all in this directory ->)';
    selectButton.id = 'selectButton';
    selectButton.innerText = 'Select';
    selectButton.onclick = () => {
        selectGameMode();
    };
    gameModeSelector.appendChild(selectedPathElement);
    gameModeSelector.appendChild(selectButton);

    // Helper function to select a game mode
    function selectGameMode() {
        gameState = 1;
        gameModeSelector.remove();

        if (isHost) {
            gameStarted = true;
            syncChanges(true, gameArea, syncActualMap, syncRandomImage);
        }

        startGame(gameArea);
    }

    // Helper function to render options
    function renderOptions(options, parentKeys = []) {
        // Clear previous options
        const children = Array.from(gameModeSelector.children);
        children.forEach(child => {
            if (child.id !== 'selectedPath' && child.id !== 'selectButton') {
                gameModeSelector.removeChild(child);
            }
        });

        // Create back button if not at the top level
        if (parentKeys.length > 0) {
            const backButton = document.createElement('button');
            backButton.innerText = 'Back';
            backButton.onclick = () => {
                parentKeys.pop();
                gameArea = getNestedObject(gameModes, parentKeys);
                const selectedPath = parentKeys.join(' > ');
                selectedPathElement.innerText = selectedPath;
                if (parentKeys.length === 0) {
                    selectedPathElement.innerText = 'All Games / ';
                }
                renderOptions(getNestedObject(gameModes, parentKeys), parentKeys);
            };
            gameModeSelector.insertBefore(backButton, selectButton);
        }

        gameModeSelector.appendChild(document.createElement('br'));
        gameModeSelector.appendChild(document.createElement('br'));

        // Render current options
        Object.keys(options).forEach(key => {
            const button = document.createElement('button');
            button.innerText = key;
            const value = options[key];
            if (!(typeof value === 'object' && !Array.isArray(value))) {
                toAltButton(button);
            }

            button.onclick = () => {
                const selectedPath = parentKeys.concat([key]).join(' > ');
                selectedPathElement.innerText = selectedPath;
                gameArea = getNestedObject(gameModes, parentKeys.concat([key]));
                if (typeof value === 'object' && !Array.isArray(value)) {
                    parentKeys.push(key);
                    renderOptions(value, parentKeys);
                } else {
                    selectGameMode();
                }
            };
            gameModeSelector.appendChild(button);
        });
    }

    // Start rendering options from the top level
    renderOptions(gameModes);
}

function syncChanges(gS = false, gA = gameArea, aM = syncActualMap, rI = syncRandomImage) {
    db.collection('lobbies').doc(lobbyName).update({
        gameStarted: gS,
        gameArea: JSON.stringify(gA),
        actualMap: aM,
        randomImage: rI,
        reload: false
    });
}

function toAltButton(button) {
    button.style.background = 'var(--button-bg-alt)';
    button.style.color = 'var(--button-color-alt)';
    button.style.boxShadow = '0 4px 15px var(--button-shadow-alt)';
}

// Helper function to navigate the nested object
function getNestedObject(obj, keys) {
    return keys.reduce((o, k) => o && o[k], obj);
}

/**
 * Finds the parent object of a given child object in a nested object
 * @param {object} obj - The nested object to search in
 * @param {object} child - The child object to find the parent of
 * @returns {object} The parent object of the child object, or undefined if not found
 */
function getParentObject(obj, child) {
    for (const key of Object.keys(obj)) {
        if (JSON.stringify(obj[key]) === JSON.stringify(child)) {
            return obj;
        } else if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
            const result = getParentObject(obj[key], child);
            if (result) {
                return result;
            }
        }
    }
}

function findPathToItem(obj, item) {
    let result = '';
    for (const key in obj) {
        if (obj[key] === item || (Array.isArray(obj[key]) && obj[key].includes(item))) {
            result = key;
            break;
        } else if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
            const subResult = findPathToItem(obj[key], item);
            if (subResult) {
                result = `${key} > ${subResult}`;
                break;
            }
        }
    }
    return result;
}

function showCreditMenu() {
    if (document.getElementById('credits')) return; // Prevent multiple menus
    // Create overlay to block interactions
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.background = 'rgba(0, 0, 0, 0)';
    overlay.style.zIndex = '999';
    overlay.style.pointerEvents = 'auto'; // Blocks interactions
    document.body.appendChild(overlay);

    // Create the alert box
    const creditBox = document.createElement('div');
    creditBox.id = 'credits'; // Unique ID to prevent duplicates
    creditBox.innerHTML = `
    <style>
      #credits a {
        color: Blue;
        text-decoration: none;
      }
      #credits a:active {
        color: RoyalBlue;
      }
    </style>
    <h2 style="text-align: center; font-weight: bold;">CREDITS</h2>
    <div style="display: flex; flex-direction: column; align-items: start; font-size: 18px;">
        <div>
            <strong>Programmer:</strong> 
            <a href="https://github.com/MoCoXIII/MapGuessr" target="_blank"><u>MoCoXIII</u></a><br>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <a href="https://github.com/PizzaPost/MapGuessr" target="_blank"><u>PizzaPost</u></a>
        </div>
        <div>
            <strong>Mapper:</strong> 
            <a href="https://github.com/PizzaPost/MapGuessr" target="_blank"><u>PizzaPost</u></a><br>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 
            <a href="https://github.com/MoCoXIII/MapGuessr" target="_blank"><u>MoCoXIII</u></a>
        </div>
        <div><strong>Designer:</strong> 
            <a href="https://github.com/PizzaPost/MapGuessr" target="_blank"><u>PizzaPost</u></a>
        </div>
        <div><strong>Idea:</strong> 
            <a href="https://github.com/MoCoXIII/MapGuessr" target="_blank"><u>MoCoXIII</u></a>
        </div>
    </div>
    `;
    creditBox.style.position = 'fixed';
    creditBox.style.top = '50%';
    creditBox.style.left = '50%';
    creditBox.style.transform = 'translate(-50%, -50%)';
    creditBox.style.background = 'rgb(40, 40, 40)';
    creditBox.style.color = 'white';
    creditBox.style.padding = '20px';
    creditBox.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.3)';
    creditBox.style.zIndex = '1001';
    creditBox.style.borderRadius = '8px';
    creditBox.style.textAlign = 'center';
    creditBox.style.border = '2px solid gray';

    // Create the close button
    const closeButton = document.createElement('button');
    closeButton.innerText = 'OK';
    closeButton.style.marginTop = '10px';
    closeButton.style.padding = '5px 10px';
    closeButton.style.border = 'none';
    closeButton.style.color = 'white';
    closeButton.style.cursor = 'pointer';
    closeButton.style.borderRadius = '4px';
    closeButton.style.background = 'gray';

    function closeCredits() {
        creditBox.remove();
        overlay.remove();
        document.removeEventListener('keydown', keyHandler); // Remove key listener
    }

    closeButton.onclick = closeCredits;
    overlay.onclick = closeCredits;

    // Close on Enter key
    function keyHandler(event) {
        if (event.key === 'Enter') {
            closeCredits();
        }
    }

    document.addEventListener('keydown', keyHandler);

    creditBox.appendChild(closeButton);
    document.body.appendChild(creditBox);
    closeButton.focus(); // Focus on button so Enter works immediately
}

// Menu button functionality
function createMoreButton() {
    const menuButton = document.createElement('button');
    menuButton.id = 'menuButton';

    const textSpan = document.createElement('span');
    textSpan.id = 'textButton'
    textSpan.textContent = '...'

    const infoLink = document.createElement('span');
    infoLink.id = 'infoLink';
    infoLink.textContent = 'i';

    const themeEmoji = document.createElement('span');
    themeEmoji.id = 'themeEmoji';

    menuButton.appendChild(textSpan);
    menuButton.appendChild(infoLink);
    menuButton.appendChild(themeEmoji)

    const updateEmoji = () => {
        const currentTheme = document.body.getAttribute('data-theme');
        themeEmoji.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
    };

    menuButton.addEventListener('click', (event) => {
        if (event.target.id === 'themeEmoji') {
            const currentTheme = document.body.getAttribute('data-theme');
            if (currentTheme === 'dark') {
                document.body.removeAttribute('data-theme');
                localStorage.setItem('theme', 'light');
            } else {
                document.body.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
            }
            updateEmoji();
        }
        if (event.target.id === 'infoLink') {
            showCreditMenu()
        }
    });

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
    }
    updateEmoji();

    // Add button to page
    document.body.appendChild(menuButton);
}

let gameContainer = document.getElementById('gameContainer');
if (!gameContainer) {
    gameContainer = document.createElement('div');
    gameContainer.id = 'gameContainer';
}
document.body.appendChild(gameContainer);
gameContainer.style.display = 'none';
let imagesWrapper = document.getElementById('imageWrapper');
if (!imagesWrapper) {
    imagesWrapper = document.createElement('div');
    imagesWrapper.id = 'imageWrapper';
    imagesWrapper.classList.add('images-wrapper');
}

function startGame(gameArea) {
    // Remove any existing objects with id marker or solutionMarker
    const markerObjects = document.querySelectorAll('[id="marker"], [id="solutionMarker"]');
    markerObjects.forEach(object => object.remove());

    // Add the CSS transition here
    const style = document.createElement('style');
    style.textContent = `
        #gameContainer img {
            transition: transform 0.2s ease-out;
        }
    `;
    document.head.appendChild(style);

    gameContainer.innerHTML = '';
    gameContainer.style.display = 'block';
    gameContainer.appendChild(imagesWrapper);

    // Display a random image
    function collectLists(obj) {
        let result = [];
        Object.values(obj).forEach(value => {
            if (Array.isArray(value)) {
                result.push(value);
            } else if (typeof value === 'object' && value !== null) {
                result = result.concat(collectLists(value));
            }
        });
        return result;
    }

    const possibleImages = collectLists(gameArea);

    let actualMap = null;

    let [imagePath, solution] = [null, null];

    if (devMode > -1) {
        if (Array.isArray(gameArea)) {
            if (devMode >= gameArea.length - 1) {
                devMode = 0;
            }
            actualMap = gameArea[0];
            [imagePath, solution] = gameArea[1 + devMode];
            devMode++;
        } else {
            if (devMode >= possibleImages.length) {
                devMode = 0;
            }
            if (altDevMode >= possibleImages[devMode].length - 1) {
                altDevMode = 0;
                devMode++;
            }
            const possibleImage = possibleImages[devMode][1 + altDevMode];
            const possibleMaps = possibleImages.find(list => list.includes(possibleImage));
            actualMap = possibleMaps[0];
            [imagePath, solution] = possibleImage;
            altDevMode++;
        }
    } else {
        if (isOnline) {
            if (!isHost) {
                if (syncActualMap === "" || syncRandomImage === "") {
                    showCustomAlert('No image or map received from the host.\nThis should not happen.\nWe will reload this page for you.\nRe-entering this lobby will fix this.', undefined, [gameVersionDiv, playerListDiv, gameContainer]);
                    window.location.reload();
                    return;
                }
                actualMap = syncActualMap;
                [imagePath, solution] = JSON.parse(syncRandomImage);
            } else {
                if (Array.isArray(gameArea)) {
                    actualMap = gameArea[0];
                    syncActualMap = actualMap;
                    const possibleImage = gameArea[1 + Math.floor(Math.random() * (gameArea.length - 1))];
                    [imagePath, solution] = possibleImage;
                    syncRandomImage = JSON.stringify(possibleImage);
                } else {
                    const randomNumber = Math.floor(Math.random() * possibleImages.length);
                    const possibleImage = possibleImages[randomNumber][1 + Math.floor(Math.random() * (possibleImages[randomNumber].length - 1))];
                    const possibleMaps = possibleImages.find(list => list.includes(possibleImage))
                    actualMap = possibleMaps[0];
                    syncActualMap = actualMap;
                    [imagePath, solution] = possibleImage;
                    syncRandomImage = JSON.stringify(possibleImage);
                }
                syncChanges(true, gameArea, syncActualMap, syncRandomImage);
            }
        } else if (Array.isArray(gameArea)) {
            actualMap = gameArea[0];
            [imagePath, solution] = gameArea[1 + Math.floor(Math.random() * (gameArea.length - 1))];
        } else {
            const randomNumber = Math.floor(Math.random() * possibleImages.length);
            const possibleImage = possibleImages[randomNumber][1 + Math.floor(Math.random() * (possibleImages[randomNumber].length - 1))];
            const possibleMaps = possibleImages.find(list => list.includes(possibleImage))
            actualMap = possibleMaps[0];
            [imagePath, solution] = possibleImage;
        }
    }

    const randomImage = document.createElement('img');
    randomImage.style.width = "100%";
    randomImage.src = imagePath;
    imagesWrapper.appendChild(randomImage);
    resize();

    const mapImage = document.createElement('img');
    mapImage.style.width = "100%";

    let selectedMap = null;

    // Create the map selector
    let selection = JSON.parse(JSON.stringify(gameArea));

    const backButton = document.createElement('button');

    const submitButton = document.createElement('button');

    let marker = document.createElement('div');
    marker.id = 'marker';

    const solutionMarker = document.createElement('div');
    solutionMarker.id = 'solutionMarker';

    const mapSelector = document.createElement('div');
    mapSelector.id = 'mapSelector';
    gameContainer.appendChild(mapSelector);

    const selectedPathElement = document.createElement('p');
    selectedPathElement.id = 'selectedPath';
    selectedPathElement.innerText = 'Choose where you think this image was taken';
    mapSelector.appendChild(selectedPathElement);

    // Helper function to select a map
    function selectMap(selected) {
        gameState = 2;
        mapSelector.style.display = 'none';
        if (devMode > -1) {
            displayMap(actualMap)
        } else {
            displayMap(selected[0]);
        }

        if (!Array.isArray(gameArea)) {
            // Create a back button
            backButton.innerText = 'Back';
            backButton.onclick = () => {
                // Go back to the map selection screen
                gameState = 1;
                mapSelector.style.display = 'block';
                mapImage.style.display = 'none';
                imagesWrapper.style.gridTemplateColumns = '1fr';
                marker.remove();
                submitButton.remove();
                backButton.remove();
            };
            gameContainer.appendChild(backButton);
        }
    }

    // Helper function to render options
    function renderOptions(options, parentKeys = []) {
        // Clear previous options
        const children = Array.from(mapSelector.children);
        children.forEach(child => {
            if (child.id !== 'selectedPath') {
                mapSelector.removeChild(child);
            }
        });

        // Create back button if not at the top level
        if (parentKeys.length > 0) {
            const backButton = document.createElement('button');
            backButton.innerText = 'Back';
            backButton.onclick = () => {
                parentKeys.pop();
                selection = getParentObject(gameModes, selection);
                const selectedPath = parentKeys.join(' > ');
                selectedPathElement.innerText = selectedPath;
                if (parentKeys.length === 0) {
                    selectedPathElement.innerText = 'All Games / ';
                }
                renderOptions(selection, parentKeys);
            };
            mapSelector.appendChild(backButton);
        }

        mapSelector.appendChild(document.createElement('br'));
        mapSelector.appendChild(document.createElement('br'));

        // Render current options
        Object.keys(options).forEach(key => {
            const button = document.createElement('button');
            button.innerText = key;
            const value = options[key];
            if (!(typeof value === 'object' && !Array.isArray(value))) {
                toAltButton(button);
            }

            button.dataset.value = JSON.stringify(selection[key]);

            button.onclick = () => {
                const selectedPath = parentKeys.concat([key]).join(' > ');
                selectedPathElement.innerText = selectedPath;
                if (typeof value === 'object' && !Array.isArray(value)) {
                    selection = JSON.parse(button.dataset.value);
                    parentKeys.push(key);
                    renderOptions(value, parentKeys);
                } else {
                    selectMap(JSON.parse(button.dataset.value));
                }
            };
            mapSelector.appendChild(button);
        });
    }

    // Start rendering options from the top level
    if (Array.isArray(selection) || devMode > -1) {
        selectMap(selection);
    } else {
        renderOptions(selection);
    }

    function displayMap(map) {
        // Display the map image
        selectedMap = map
        mapImage.src = map;
        imagesWrapper.style.gridTemplateColumns = '1fr 1fr';
        imagesWrapper.appendChild(mapImage);
        resize();

        // Create a marker on the map
        marker.style.position = 'absolute';
        marker.style.width = '10px';
        marker.style.height = '10px';
        marker.style.backgroundColor = 'red';
        marker.style.border = '2px solid black';
        marker.style.borderRadius = '50%';
        marker.style.display = 'none'; // Initially hidden
        document.body.appendChild(marker);

        // Listen for map clicks to place marker
        mapImage.onclick = (event) => {
            setMarker(event);
        };

        marker.onclick = (event) => {
            setMarker(event);
        };

        mapImage.onwheel = (event) => {
            event.preventDefault();
            const rect = mapImage.getBoundingClientRect();
            const scrollDelta = event.deltaY;

            // Current scale and position
            const oldScale = parseFloat(mapImage.style.transform?.match(/scale\(([^)]+)\)/)?.[1]) || 1;
            let newScale = oldScale - scrollDelta / 500;

            // Enforce minimum scale of 1 (original size)
            newScale = Math.min(5, Math.max(1, newScale));

            // Calculate mouse position relative to image
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            // Calculate origin based on mouse position and current scale
            const originX = (mouseX / rect.width) * 100;
            const originY = (mouseY / rect.height) * 100;

            // Apply transformations
            mapImage.style.transformOrigin = `${originX}% ${originY}%`;
            mapImage.style.transform = `scale(${newScale})`;

            // Smooth centering animation when returning to original size
            if (newScale === 1 && oldScale !== 1) {
                mapImage.style.transition = 'transform 0.3s ease-out, transform-origin 0.3s ease-out';
                setTimeout(() => {
                    mapImage.style.transformOrigin = '50% 50%';
                    mapImage.style.transition = '';
                }, 10);
            }

            updateMarker(event, true);
        };

        gameContainer.onscroll = (event) => {
            updateMarker(event);
        };

        // Create submit button
        submitButton.innerText = 'Submit';
        submitButton.onclick = () => {
            if (marker.style.display === 'block') {
                backButton.remove();

                if (isOnline) {
                    if (isHost) {
                        gameContainer.appendChild(continueButton);
                    }
                } else {
                    gameContainer.appendChild(continueButton);
                }

                if (selectedMap === actualMap) {
                    const userX = parseFloat(marker.dataset.x);
                    const userY = parseFloat(marker.dataset.y);
                    const [solutionX, solutionY] = solution;
                    const distance = Math.sqrt(Math.pow(userX - solutionX, 2) + Math.pow(userY - solutionY, 2));
                    const maxPoints = 5000;
                    const score = distance <= 0.01 ? maxPoints : Math.max(0, maxPoints - ((distance - 0.01) / (0.5 - 0.01)) * maxPoints);

                    if (Array.isArray(solution) && solution.length > 0) {
                        totalScore += score;

                        if (isOnline) {
                            db.collection('lobbies').doc(lobbyName).get().then(doc => {
                                const players = doc.data().players;
                                const myPlayer = players.find(player => player.name === userName);
                                myPlayer.score = score;
                                myPlayer.totalScore = totalScore;
                                db.collection('lobbies').doc(lobbyName).update({
                                    gameStarted: false,
                                    players: players,
                                });
                            });
                        }

                        document.title = `MapGuessr | Score: ${totalScore.toFixed(0)}`;
                        showCustomAlert(`You scored ${score.toFixed(0)} points!`, 1);
                        solutionMarker.style.position = 'absolute';
                        solutionMarker.style.width = '10px';
                        solutionMarker.style.height = '10px';
                        solutionMarker.style.backgroundColor = 'green';
                        solutionMarker.style.borderRadius = '50%';
                        solutionMarker.dataset.x = solutionX;
                        solutionMarker.dataset.y = solutionY;
                        solutionMarker.style.left = `${mapImage.offsetLeft + solutionX * mapImage.offsetWidth - 5}px`; // subtract half the size of the marker
                        solutionMarker.style.top = `${mapImage.offsetTop + solutionY * mapImage.offsetHeight - 5}px`;
                        const mapRect = mapImage.getBoundingClientRect();
                        const scaleX = mapImage.naturalWidth / mapRect.width;
                        const scaleY = mapImage.naturalHeight / mapRect.height;
                        solutionMarker.style.left = `${mapRect.left + (solutionX * mapImage.naturalWidth / scaleX) - 5 + window.scrollX}px`;
                        solutionMarker.style.top = `${mapRect.top + (solutionY * mapImage.naturalHeight / scaleY) - 5 + window.scrollY}px`;
                        solutionMarker.style.display = 'block';
                        document.body.appendChild(solutionMarker);
                    } else {
                        showCustomAlert('You got the map correct!\nThis image has not been assigned a solution yet.', 1);
                    }
                } else {
                    const pathToMap = findPathToItem(gameModes, actualMap);
                    showCustomAlert('You have chosen the wrong map. It was ' + pathToMap);
                }

                submitButton.remove();
            } else {
                showCustomAlert('Please place a marker on the map');
            }
        };

        const breakElements = gameContainer.querySelectorAll('br');
        if (breakElements.length === 0) {
            gameContainer.appendChild(document.createElement('br'));
        }
        gameContainer.appendChild(submitButton);

        if (devMode > -1) { console.log(`Currently on map ${actualMap} (image ${imagePath.split('/').slice(-1).join(' > ')}), which you think is ${selectedMap}`); }
        mapImage.style.display = '';

        // Create continue button
        const continueButton = document.createElement('button');
        continueButton.innerText = 'Continue';
        continueButton.onclick = () => {
            marker.remove();
            solutionMarker.remove();
            if (isOnline) {
                db.collection('lobbies').doc(lobbyName).update({ gameStarted: true });
            }
            startGame(gameArea); // Restart game with current area
        };
        if (devMode > -1) {
            gameContainer.appendChild(continueButton);
        }

        function setMarker(event) {
            if (document.body.contains(submitButton)) {
                const rect = mapImage.getBoundingClientRect();
                const x = (event.clientX - rect.left) / rect.width;
                const y = (event.clientY - rect.top) / rect.height;

                if (devMode > -1) { console.log(`${x}, ${y}`); }

                marker.dataset.x = x;
                marker.dataset.y = y;
                marker.style.display = 'block';
                updateMarker(event);
            }
        }

        function updateMarker(event, delay = false) {
            const updatePosition = (marker) => {
                if (!marker.dataset.x || !marker.dataset.y) return;

                const rect = mapImage.getBoundingClientRect();

                const x = parseFloat(marker.dataset.x);
                const y = parseFloat(marker.dataset.y);

                // Calculate expected position regardless of current visibility
                const markerLeft = rect.left + (x * rect.width) - 5 + window.scrollX;
                const markerTop = rect.top + (y * rect.height) - 5 + window.scrollY;

                // Update marker position
                marker.style.left = `${markerLeft}px`;
                marker.style.top = `${markerTop}px`;
            };

            if (delay) {
                setTimeout(() => { updatePosition(marker); updatePosition(solutionMarker); }, 200);
            } else {
                updatePosition(marker);
                updatePosition(solutionMarker);
            }
        }
    }
}

function resize() {
    const allImages = document.querySelectorAll('img');

    const width = window.innerWidth;
    const height = window.innerHeight;
    const isPortrait = (width < height) || (allImages.length === 1);
    imagesWrapper.style.gridTemplateColumns = isPortrait ? '1fr' : 'repeat(2, 1fr)';
}

window.addEventListener('resize', resize);
document.addEventListener('DOMContentLoaded', createMoreButton);

window.addEventListener('beforeunload', event => {
    leaveLobby();
});