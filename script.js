const gameModes = {
    "Portal Series": {
        "Portal 2": {
            "Chapter 1 - The Courtesy Call": {
                "Container Ride": [
                    "images/portal2/chapter1/container_ride/map.jpg",
                    [
                        "images/portal2/chapter1/container_ride/1.jpg",
                        []
                    ]
                ],
                "Portal Carousel": [
                    "images/portal2/chapter1/portal_carousel/map.jpg",
                    [
                        "images/portal2/chapter1/portal_carousel/1.jpg",
                        []
                    ]
                ],
                "Portal Gun": [
                    "images/portal2/chapter1/portal_gun/map.jpg",
                    [
                        "images/portal2/chapter1/portal_gun/1.jpg",
                        []
                    ]
                ],
                "Smooth Jazz": [
                    "images/portal2/chapter1/smooth_jazz/map.jpg",
                    [
                        "images/portal2/chapter1/smooth_jazz/1.jpg",
                        []
                    ]
                ],
                "Cube Momentum": [
                    "images/portal2/chapter1/cube_momentum/map.jpg",
                    [
                        "images/portal2/chapter1/cube_momentum/1.jpg",
                        []
                    ]
                ],
                "Future Starter": [
                    "images/portal2/chapter1/future_starter/map.jpg",
                    [
                        "images/portal2/chapter1/future_starter/1.jpg",
                        []
                    ]
                ],
                "Secret Panel": [
                    "images/portal2/chapter1/secret_panel/map.jpg",
                    [
                        "images/portal2/chapter1/secret_panel/1.jpg",
                        []
                    ]
                ],
                "Wake Up": [
                    "images/portal2/chapter1/wake_up/map.jpg",
                    [
                        "images/portal2/chapter1/wake_up/1.jpg",
                        []
                    ]
                ],
                "Incinerator": [
                    "images/portal2/chapter1/incinerator/map.jpg",
                    [
                        "images/portal2/chapter1/incinerator/1.jpg",
                        []
                    ]
                ]
            },
            "Chapter 2 - The Cold Boot": {
                "Laser Intro": [
                    "images/portal2/chapter2/laser_intro/map.jpg",
                    [
                        "images/portal2/chapter2/laser_intro/1.jpg",
                        []
                    ]
                ],
                "Laser Stairs": [
                    "images/portal2/chapter2/laser_stairs/map.jpg",
                    [
                        "images/portal2/chapter2/laser_stairs/1.jpg",
                        []
                    ]
                ],
                "Dual Lasers": [
                    "images/portal2/chapter2/dual_lasers/map.jpg",
                    [
                        "images/portal2/chapter2/dual_lasers/1.jpg",
                        []
                    ]
                ],
                "Laser Over Goo": [
                    "images/portal2/chapter2/laser_over_goo/map.jpg",
                    [
                        "images/portal2/chapter2/laser_over_goo/1.jpg",
                        []
                    ]
                ],
                "Catapult Intro": [
                    "images/portal2/chapter2/catapult_intro/map.jpg",
                    [
                        "images/portal2/chapter2/catapult_intro/1.jpg",
                        []
                    ]
                ],
                "Trust Fling": [
                    "images/portal2/chapter2/trust_fling/map.jpg",
                    [
                        "images/portal2/chapter2/trust_fling/1.jpg",
                        []
                    ]
                ],
                "Pit Flings": [
                    "images/portal2/chapter2/pit_flings/map.jpg",
                    [
                        "images/portal2/chapter2/pit_flings/1.jpg",
                        []
                    ]
                ],
                "Fizzler Intro": [
                    "images/portal2/chapter2/fizzler_intro/map.jpg",
                    [
                        "images/portal2/chapter2/fizzler_intro/1.jpg",
                        []
                    ]
                ]
            }
        }
    }
}

let gameState = 0; // 0 => choose gamemode
let gameArea = getNestedObject(gameModes, []); // not yet set area to choose locations from

gameModeSelector(); // interface to select gameArea

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
    selectedPathElement.innerText = 'All Games / ';
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
                button.style.backgroundColor = 'black';
                button.style.color = 'white';
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

// Helper function to navigate the nested object
function getNestedObject(obj, keys) {
    return keys.reduce((o, k) => o && o[k], obj);
}

function startGame(gameArea) {
    let gameContainer = document.getElementById('gameContainer');

    // Create the gameContainer div if it doesn't exist
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
    const selectedImage = possibleImages.length > 0 ? possibleImages[Math.floor(Math.random() * possibleImages.length)] : [];
    //const randomIndex = Math.floor(1 + (Math.random() * (selectedImage.length - 1)));
    const [imagePath, solution] = selectedImage; //[randomIndex];
    const randomImage = document.createElement('img');
    randomImage.src = imagePath;
    randomImage.style.maxWidth = '100%';
    randomImage.style.height = '50%';
    gameContainer.appendChild(randomImage);
    resize();

    const mapImage = document.createElement('img');

    let selectedMap = null;

    // Create the map selector
    let selection = JSON.parse(JSON.stringify(gameArea));

    const backButton = document.createElement('button');

    const submitButton = document.createElement('button');

    const mapSelector = document.createElement('div');
    mapSelector.id = 'mapSelector';
    gameContainer.appendChild(mapSelector);

    const selectedPathElement = document.createElement('p');
    selectedPathElement.id = 'selectedPath';
    selectedPathElement.innerText = 'All Games / ';
    mapSelector.appendChild(selectedPathElement);

    // Helper function to select a map
    function selectMap() {
        gameState = 2;
        mapSelector.style.display = 'none';
        displayMap(selection[0]);

        // Create a back button
        backButton.innerText = 'Back';
        backButton.onclick = () => {
            // Go back to the map selection screen
            gameState = 1;
            mapSelector.style.display = 'block';
            mapImage.style.display = 'none';
            selection = JSON.parse(JSON.stringify(gameArea));
            submitButton.remove();
            backButton.remove();
            renderOptions(selection);
        };
        gameContainer.appendChild(backButton);
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
                selection = getNestedObject(gameModes, parentKeys);
                const selectedPath = parentKeys.join(' > ');
                selectedPathElement.innerText = selectedPath;
                if (parentKeys.length === 0) {
                    selectedPathElement.innerText = 'All Games / ';
                }
                renderOptions(getNestedObject(gameModes, parentKeys), parentKeys);
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
                button.style.backgroundColor = 'black';
                button.style.color = 'white';
            }

            button.onclick = () => {
                const selectedPath = parentKeys.concat([key]).join(' > ');
                selectedPathElement.innerText = selectedPath;
                selection = getNestedObject(gameModes, parentKeys.concat([key]));
                if (typeof value === 'object' && !Array.isArray(value)) {
                    parentKeys.push(key);
                    renderOptions(value, parentKeys);
                } else {
                    selectMap()
                }
            };
            mapSelector.appendChild(button);
        });
    }

    // Start rendering options from the top level
    if (Array.isArray(selection)) {
        selectMap();
    } else {
        renderOptions(selection);
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
        let marker = document.createElement('div');
        marker.style.position = 'absolute';
        marker.style.width = '10px';
        marker.style.height = '10px';
        marker.style.backgroundColor = 'red';
        marker.style.borderRadius = '50%';
        marker.style.display = 'none'; // Initially hidden
        document.body.appendChild(marker);

        // Listen for map clicks to place marker
        mapImage.onclick = (event) => {
            if (document.body.contains(submitButton)) {
                const rect = mapImage.getBoundingClientRect();
                const x = ((event.clientX - rect.left) + window.scrollX) / rect.width;
                const y = ((event.clientY - rect.top) + window.scrollY) / rect.height;
                marker.style.left = `${event.pageX - 5}px`; // subtract half the size of the marker
                marker.style.top = `${event.pageY - 5}px`;
                marker.style.display = 'block';
                marker.dataset.x = x;
                marker.dataset.y = y;
                console.log(x, y);
            }
        };

        // Create submit button
        submitButton.innerText = 'Submit';
        submitButton.onclick = () => {
            if (marker.style.display === 'block') {
                backButton.remove();
                gameContainer.appendChild(continueButton);
                if (selectedMap === selection[0]) {
                    const userX = parseFloat(marker.dataset.x);
                    const userY = parseFloat(marker.dataset.y);
                    const [solutionX, solutionY] = solution;
                    const distance = Math.sqrt(Math.pow(userX - solutionX, 2) + Math.pow(userY - solutionY, 2));
                    const score = Math.max(0, 1000 - distance * 1000);

                    if (Array.isArray(solution) && solution.length > 0) {
                        alert(`You scored ${score.toFixed(0)} points!`);
                        const solutionMarker = document.createElement('div');
                        solutionMarker.style.position = 'absolute';
                        solutionMarker.style.width = '10px';
                        solutionMarker.style.height = '10px';
                        solutionMarker.style.backgroundColor = 'green';
                        solutionMarker.style.borderRadius = '50%';
                        solutionMarker.style.left = `${mapImage.offsetLeft + solutionX * mapImage.offsetWidth - 5}px`; // subtract half the size of the marker
                        solutionMarker.style.top = `${mapImage.offsetTop + solutionY * mapImage.offsetHeight - 5}px`;
                        document.body.appendChild(solutionMarker);
                    } else {
                        alert('You got the map correct!\nThis image has not been assigned a solution yet.');
                    }
                } else {
                    const pathToMap = selectedPathElement.innerText;
                    alert('You have chosen the wrong map. It was ' + pathToMap);
                }

                submitButton.remove();
            } else {
                alert('Please place a marker on the map');
            }
        };
        gameContainer.appendChild(document.createElement('br'));
        gameContainer.appendChild(submitButton);

        // Create continue button
        const continueButton = document.createElement('button');
        continueButton.innerText = 'Continue';
        continueButton.onclick = () => {
            marker.remove();
            startGame(gameArea); // Restart game with current area
        };
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
