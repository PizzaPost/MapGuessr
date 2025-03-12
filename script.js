let gameModes;

let gameState = 0; // 0 => choose gamemode
let gameArea; // not yet set area to choose locations from
let totalScore = 0;

let devMode = -1;
let altDevMode = 0;

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

// Example function that uses gameModes
function initializeGame() {
    if (gameModes) {
        console.log('Initializing game with:', gameModes);
        // Your game initialization logic here
        gameArea = getNestedObject(gameModes, []);
        gameModeSelector();
    } else {
        console.error('Game modes not loaded yet.');
    }
}

// Load the game modes when the script runs
loadGameModes();


function gameModeSelector() {
    // Create the gameModeSelector div if it doesn't exist
    let gameModeSelector = document.getElementById('gameModeSelector');
    if (!gameModeSelector) {
        gameModeSelector = document.createElement('div');
        gameModeSelector.id = 'gameModeSelector';
        document.body.appendChild(gameModeSelector);
    }

    // Create the selectedPathElement and the selectButton
    const selectedPathElement = document.createElement('p');
    selectedPathElement.id = 'selectedPath';
    selectedPathElement.innerText = 'Choose a game (or all in this directory ->)';
    const selectButton = document.createElement('button');
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

// Theme toggle functionality
function createThemeToggle() {
    const toggle = document.createElement('button');
    toggle.id = 'themeToggle';

    // Create a span for the emoji
    const emojiSpan = document.createElement('span');
    emojiSpan.style.display = 'block';
    emojiSpan.style.transform = 'translateY(1px)'; // Fine-tune emoji position
    toggle.appendChild(emojiSpan);

    // Function to update the emoji
    const updateEmoji = () => {
        const currentTheme = document.body.getAttribute('data-theme');
        emojiSpan.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
    };

    toggle.addEventListener('click', () => {
        const currentTheme = document.body.getAttribute('data-theme');
        if (currentTheme === 'dark') {
            document.body.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        } else {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        }
        updateEmoji();
    });

    // Check for saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
    }
    updateEmoji();

    // Add toggle to page
    document.body.appendChild(toggle);
}

function startGame(gameArea) {
    let gameContainer = document.getElementById('gameContainer');

    // Add the CSS transition here
    const style = document.createElement('style');
    style.textContent = `
        #gameContainer img {
            transition: transform 0.2s ease-out;
        }
    `;
    document.head.appendChild(style);

    if (!gameContainer) {
        gameContainer = document.createElement('div');
        gameContainer.id = 'gameContainer';
        document.body.appendChild(gameContainer);
    }

    gameContainer.innerHTML = '';

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
            const possibleMaps = possibleImages.find(list => list.includes(possibleImage))
            actualMap = possibleMaps[0];
            [imagePath, solution] = possibleImage;
            altDevMode++;
        }
    } else {
        if (Array.isArray(gameArea)) {
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
    randomImage.src = imagePath;
    randomImage.style.maxWidth = '100%';
    randomImage.style.height = '50%';
    gameContainer.appendChild(randomImage);
    resize();

    if (devMode > -1) { console.log(`Currently on map ${actualMap} image ${imagePath} with solution ${solution}`); }

    const mapImage = document.createElement('img');

    let selectedMap = null;

    // Create the map selector
    let selection = JSON.parse(JSON.stringify(gameArea));

    const backButton = document.createElement('button');

    const submitButton = document.createElement('button');

    let marker = document.createElement('div');

    const solutionMarker = document.createElement('div');

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

    function showCustomAlert(message, mode) {
        if (document.getElementById('custom-alert')) return; // Prevent multiple alerts
        if (mode===0) {
            const cont = document.getElementById('gameContainer');
            if (cont) {
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

        if (mode===0) {
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
    

    function displayMap(map) {
        // Display the map image
        selectedMap = map
        mapImage.src = map;
        mapImage.style.maxWidth = '100%';
        mapImage.style.height = '50%';
        gameContainer.appendChild(mapImage);
        resize();

        // Create a marker on the map
        marker.style.position = 'absolute';
        marker.style.width = '10px';
        marker.style.height = '10px';
        marker.style.backgroundColor = 'red';
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

            // Smooth centering interpolation
            const scaleAboveOne = newScale - 1;
            const centeringFactor = Math.max(0, 1 - scaleAboveOne);

            // Calculate transform origin
            const mouseOriginX = (mouseX / rect.width) * 100;
            const mouseOriginY = (mouseY / rect.height) * 100;
            const originX = mouseOriginX * (1 - centeringFactor) + 50 * centeringFactor;
            const originY = mouseOriginY * (1 - centeringFactor) + 50 * centeringFactor;

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
                gameContainer.appendChild(continueButton);
                if (selectedMap === actualMap) {
                    const userX = parseFloat(marker.dataset.x);
                    const userY = parseFloat(marker.dataset.y);
                    const [solutionX, solutionY] = solution;
                    const distance = Math.sqrt(Math.pow(userX - solutionX, 2) + Math.pow(userY - solutionY, 2));
                    const score = Math.max(0, 1000 - distance * 1000);

                    if (Array.isArray(solution) && solution.length > 0) {
                        totalScore += score;
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
                    const pathToMap = actualMap.split('/').slice(1, -2).join(' > ');
                    showCustomAlert('You have chosen the wrong map. It was ' + pathToMap, 0);
                }

                submitButton.remove();
            } else {
                showCustomAlert('Please place a marker on the map', 0);
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
            startGame(gameArea); // Restart game with current area
        };

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
                const gameContainer = document.getElementById('gameContainer');
                const containerRect = gameContainer.getBoundingClientRect();

                const x = parseFloat(marker.dataset.x);
                const y = parseFloat(marker.dataset.y);

                // Calculate expected position regardless of current visibility
                const markerLeft = rect.left + (x * rect.width) - 5 + window.scrollX;
                const markerTop = rect.top + (y * rect.height) - 5 + window.scrollY;

                // Update marker position
                marker.style.left = `${markerLeft}px`;
                marker.style.top = `${markerTop}px`;

                // // Calculate visibility using predicted position instead of actual rect
                // const isVisible =
                //     markerLeft + 10 > containerRect.left && // 10px width
                //     markerLeft < containerRect.right &&
                //     markerTop + 10 > containerRect.top &&
                //     markerTop < containerRect.bottom;

                // // Always update display state
                // marker.style.display = isVisible ? 'block' : 'none';
                // marker.style.pointerEvents = isVisible ? 'auto' : 'none';
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
    const imageWidth = isPortrait ? '100%' : '50%';

    allImages.forEach(img => img.style.width = imageWidth);
}

window.addEventListener('resize', resize);
document.addEventListener('DOMContentLoaded', createThemeToggle);