let gameModes;
let languages;

const urlParams = new URLSearchParams(window.location.search);
const language = urlParams.get('language') || urlParams.get('lang') || localStorage.getItem('language') || 'en';
let prank = urlParams.get('prank') || new Date().getMonth() === 3 && new Date().getDate() === 1; // true if it's April 1st
let gameState = 0; // useless, but we might make use of it in the future
let score = 0;
let totalScore = 0;
let totalPossibleScore = 0;
const maxPoints = 5000;
let gameArea; // not yet set area to choose locations from
let checkedGameModes = {};
let gameStarted = false;
let isOnline = false;
let isHost = false;
let syncRandomImage = "";
let syncActualMap = "";
let reload = false;
let filterModes = ['deepFried', 'extraCrispy', 'burnt'];
let currentFilterModeIndex = -1;
let showHistory = localStorage.getItem('showHistory') !== 'false';
let image_history = [];
let invertSelection = false;
let tooltip;
const toggleHistory = document.createElement('span');
let lastPressTime = null;
let timeoutId = null;
let lastLobbyAnimationTime = 0;
let closingTimeout = null;
let leaveLobbyButtonClicked = false;
let lobbyStates = ["private", "friendsOnly", "public"];

let devSkip = false;
let devMode = urlParams.get('devMode') || -1;
let altDevMode = 0;

let loadingDiv;
let alertBox;
let closeButton;

let keybinds = [];
// Keybinds for the game: ["key", [buttonsToPress, ...], doubleClick: boolean]
let selectButton; let submitButton; let continueButton;
keybinds.push([" ", ["selectButton", "submitButton", "continueButton"], false]); // single press space to select / submit / continue
let joinLobbyButton = document.createElement('button'); keybinds.push(["n", ["joinLobbyButton"], false]); // single press n to join any lobby
let leaveLobbyButton; keybinds.push(["Escape", ["leaveLobbyButton"], false]); // single press escape to leave lobby
let closeLobbyButton; keybinds.push(["Escape", ["closeLobbyButton"], true]); // double press escape to close lobby
let giveUpHostButton; keybinds.push(["g", ["giveUpHostButton"], false]); // single press g to give up host position
let claimHostButton; keybinds.push(["c", ["claimHostButton"], false]); // single press c to claim host position
let createNewLobbyCode; keybinds.push(["N", ["createNewLobbyCode"], false]); // single press N to create a new lobby
let switchLobbyStateButton;
// default keybinds will be overridden if there are custom ones in localStorage
keybinds = JSON.parse(localStorage.getItem('keybinds')) || keybinds;

function updatePrankImage() {
    if (prank && localStorage.getItem('theme') === 'light') {
        const image = document.createElement('img');
        image.id = 'prankImage';
        image.src = 'images/prank.png';
        image.style.position = 'fixed';
        image.style.top = '0';
        image.style.left = '0';
        image.style.width = '100%';
        image.style.height = '100%';
        image.style.zIndex = '-1';
        document.body.appendChild(image);
    } else {
        const prankImage = document.getElementById('prankImage');
        if (prankImage) {
            prankImage.remove();
        }
    }
}

updatePrankImage();

// duplicate names filter regex (replace selected with ""): ("[^,]*?")(?=[\d\D\n]*?\1), *(?=\n* *?")
const possibleNames = [
    "Aegis", "Alchemist", "Aqua", "Aura", "Baron", "Bellowing", "Blending", "Blizzard", "Clapping", "Competing",
    "Contemplating", "Elliptical", "Emerald", "Eon", "Finishing", "Flare", "Fox", "Fragmenting", "Geometric", "Ginger",
    "Griffin", "Havoc", "Ibis", "Jumping", "Magnetic", "Marauder", "Mist", "Omega", "Pinnacle", "Plummeting",
    "Posing", "Pouring", "Quantum", "Quiver", "Razor", "Refinement", "Ringing", "Roiling", "Rusting", "Saiyan",
    "Sapphire", "Siren", "Sorting", "Spectral", "Spectrum", "Stalking", "Stardust", "Supernova", "Tanzanite", "Tempest",
    "Tide", "Violet", "Whispering", "Xerophyte", "Abyss", "Accomplishing", "Achieving", "Acorn", "Acrid", "Aether",
    "Aligning", "Allure", "Aloe", "Amalgamating", "Amber", "Ambushing", "Amethyst", "Analyzing", "Anchoring", "Animated",
    "Apparition", "Appeal", "Archer", "Arranging", "Assassin", "Asteroid", "Asymmetric", "Atlas", "Attacking", "Attractiveness",
    "Aurora", "Avalanche", "Axolotl", "Babbling", "Balancing", "Bamboo", "Banging", "Banshee", "Basil", "Basilisk",
    "Battling", "Beating", "Beauty", "Behemoth", "Berserker", "Beryl", "Birch", "Blackhole", "Blasting", "Blaze",
    "Bleeding", "Blitz", "Boiling", "Bolt", "Bonding", "Brawler", "Breaking", "Breeze", "Brewing", "Brightness",
    "Brilliance", "Bubbling", "Burning", "Bursting", "Byte", "Cactus", "Cantor", "Captivation", "Catalyst", "Ceasing",
    "Celestial", "Centaur", "Centering", "Chaos", "Charismatic", "Charm", "Chasing", "Chattering", "Chimera", "Chiming",
    "Chipping", "Chrono", "Churning", "Cinder", "Circular", "Citrine", "Clanging", "Clarifying", "Clattering", "Clicking",
    "Climbing", "Clinking", "Cloudburst", "Clover", "Coalescing", "Cobalt", "Cobra", "Cobra007", "ColdSnap", "Colliding",
    "Colossus", "Combining", "Combusting", "Comet", "Completing", "Concentrating", "Concluding", "Conical", "Connecting", "Conquering",
    "Contesting", "Converging", "Corona", "Corroding", "Corsair", "Cosmos", "Coughing", "Cracking", "Crashing", "Crawling",
    "Crimson", "Crusader", "Crying", "Cubical", "Current", "Cyber", "Cyclone", "Cyclops", "Cylindrical", "Cypress",
    "Dagger", "Dahlia", "Daisy", "Dancing", "Dandelion", "Decagonal", "Defeating", "Deluge", "Detonating", "Diffraction",
    "Directing", "Distilling", "Diverging", "Dividing", "Diving", "Djinni", "Downpour", "Dragon", "Drift", "Drifting",
    "Driftwood", "Dripping", "Drizzle", "Drought", "Drumming", "Dryad", "Dusk", "DustStorm", "Dynamic", "Dynamo",
    "Earthquake", "Echo", "Echoing", "Eclipse", "Eddy", "Effervescent", "Elder", "Elegance", "Elm", "Ember",
    "Empress", "Enchantment", "Ending", "Energetic", "Enforcer", "Enigma", "Equilibrating", "Eroding", "Erupting", "Essence",
    "Eucalyptus", "EventHorizon", "Exfoliating", "Exploding", "Extracting", "Exuberant", "Falcon", "Falling", "Fang", "Fascination",
    "Faun", "Fennel", "Fermenting", "Fern", "Fiddling", "Fighting", "Filtering", "Fire Opal", "Firestorm", "Flaking",
    "FlareX", "Flash", "Flicker", "Flint", "Floating", "Flood", "Flowing", "Flying", "Foaming", "Focusing",
    "Fog", "Following", "Foxglove", "Fractal", "Frost", "Frostbite", "Frothing", "Fury", "Fusing", "Galactic",
    "Galaxy", "Gale", "Gambit", "Gaming", "Garnet", "Gesturing", "Ghost", "Giant", "Ginseng", "Glacier",
    "Gleam", "Gliding", "Glint", "Glitch", "Glory", "Glow", "Gossiping", "Grace", "Grandeur", "Gravity",
    "Groaning", "Grounding", "Grove", "Growling", "Grunting", "Guiding", "Gushing", "Gyre", "Hailstorm", "Halo",
    "Halting", "Hamburger", "Hammering", "Hawthorn", "Haze", "Heatwave", "Heliodor", "Heliotrope", "Helix", "Hexagonal",
    "Hibiscus", "Hilbert", "Hissing", "Hitting", "Hollow", "Horizon", "Hovering", "Howling", "Humming", "Hunting",
    "Hurricane", "Hydra", "Hyper", "Hypnotic", "Ice", "Iceberg", "Igloo", "Ignite", "Igniting", "Iguana",
    "Indicating", "Infernal", "Inferno", "Integrating", "Iolite", "Ion", "Iris", "Iron", "Ironclad", "Ivory",
    "Ivy", "Jade", "Jadeite", "Jasmine", "Jasper", "Jester", "JetStream", "Jingling", "Jinx", "Juggernaut",
    "Julia", "Juniper", "Kale", "Karma", "Kelp", "Kelpie", "Kestrel", "Kicking", "Kite", "Knightmare",
    "Knocking", "Knotweed", "Koch", "Kraken", "Krypton", "Kryptonite", "Kunzite", "Kyanite", "Labradorite", "Lancer",
    "Lapis", "Lark", "Lava", "LavaFlow", "Lavender", "Leading", "Leaking", "Leviathan", "Lightning", "LightningBolt",
    "Linking", "Lively", "Loom", "Luminosity", "Lunar", "LunarEclipse", "Luxury", "Lycan", "Lying", "Lynx",
    "Maelstrom", "Magma", "MagmaChamber", "Magnificence", "Majesty", "Malachite", "Mandelbrot", "Mantis", "Maple", "Matrix",
    "Maverick", "Meditating", "Mel", "Merging", "Mermaid", "Mesmerizing", "Meteor", "Midnight", "Minotaur", "Mirage",
    "Mixing", "Moaning", "Molting", "Mongoose", "Monsoon", "Moonbeam", "Moonstone", "Moss", "Mumbling", "Murmuring",
    "Muttering", "Mystic", "Nautilus", "Nebula", "Nectarine", "Nemesis", "Neon", "Nephrite", "Nettle", "Nighthawk",
    "Nightshade", "Nimbus", "Ninja", "Nitro", "Noble", "Nomad", "Noodle", "Nova", "Nuke", "Nymph",
    "Oblivion", "Obsidian", "Octagonal", "Olive", "Olivia", "Onslaught", "Onyx", "Oozing", "Opal", "Opulence",
    "Oracle", "Orbit", "Oregano", "Organizing", "Orion", "Outlaw", "Overlord", "Oxidizing", "Pandora", "Partitioning",
    "Pausing", "Pealing", "Peano", "Peeling", "Pegasus", "Pendulum", "Peony", "Peridot", "Phantom", "Phoenix",
    "Photon", "Pilot", "Pine", "Pinecone", "Pirate", "Pixel", "Playing", "Pointing", "PolarVortex", "Poltergeist",
    "Polygonal", "Pondering", "Posturing", "Pounding", "Prism", "Prowler", "Pulsar", "Pulse", "Pulsing", "Punching",
    "Purifying", "Pursuing", "Pyramidal", "Quake", "Quartz", "Quasar", "Quill", "Quince", "Quokka", "Radiance",
    "Raider", "Rainstorm", "Rapping", "Raptor", "Rattling", "Raven", "Reasoning", "Rebel", "Reclining", "Rectangular",
    "Reed", "Refining", "Reflecting", "Refraction", "Relaxing", "Reloaded", "Resonating", "Resting", "Reverberating", "Revolution",
    "Revolve", "Rhodochrosite", "Rider", "Ridge", "Rift", "Riftwalker", "Ripple", "Roaring", "Rogue", "Ronin",
    "Rosemary", "Rotate", "Ruby", "Runner", "Running", "Rustic", "Saber", "Sage", "Sagebrush", "Samurai",
    "Sandstorm", "Satyr", "Screaming", "Seeping", "Seething", "Segmenting", "Selkie", "Sentinel", "Separating", "Serpent",
    "Shade", "Shadow", "Shattering", "Shedding", "Shimmer", "Shouting", "Sierpinski", "Sifting", "Sighing", "Signaling",
    "Silent", "Simmering", "Singing", "Singularity", "Sinking", "Sitting", "Slapping", "Smashing", "Smog", "Snapping",
    "Snarling", "Sneezing", "Sniffling", "Snorting", "Snowstorm", "Soaring", "Sobbing", "Solar", "SolarFlare", "Sophistication",
    "Soul", "Sovereign", "Sparkle", "Sparkling", "Sparrow", "Spartan", "Speaking", "Specter", "Spectre", "Speed",
    "Spellbinding", "Spewing", "Spherical", "Sphinx", "Spin", "Spire", "Spirit", "Spitting", "Splendor", "Splintering",
    "Splitting", "Spruce", "Stabilizing", "Standing", "Starburst", "Starfire", "Starlight", "Stealth", "Steel", "Stellar",
    "Stewing", "Stopping", "Storm", "Stormbreaker", "Stratos", "Streaming", "Striker", "Striking", "Succeeding", "Sunray",
    "Sunset", "Sunstone", "Surge", "Swimming", "Swirl", "Symmetric", "Synthesizing", "Taco", "Talking", "Talon",
    "Tapping", "Terminating", "Terra", "Thinking", "Thistle", "Thorn", "Throbbing", "Thumping", "Thunder", "Thunderstorm",
    "Tinkering", "Tinkling", "Titan", "Titanium", "Tolling", "Topaz", "Tornado", "Toxic", "Toying", "Tracking",
    "TradeWinds", "Triangular", "Trickling", "Triumphing", "Tsunami", "Tundra", "Turbo", "Turn", "Twilight", "Twinkle",
    "Twist", "Typhoon", "Tyrant", "Ultraviolet", "Umbra", "Umbrella", "Unakite", "Undertow", "Unicorn", "Uniting",
    "Upland", "Uvarovite", "Vagabond", "Valkyrie", "Vanguard", "Variscite", "Velocity", "Vengeance", "Verdelite", "Vibrant",
    "Vibrating", "Vine", "Viper", "Void", "Volcano", "Vortex", "Voyager", "Vulcan", "Vulture", "Wailing",
    "Walking", "Warden", "Warlord", "Warring", "Warrior", "Watermelon Tourmaline", "Wave", "Weathering", "Weeping", "Whirlpool",
    "Whisper", "Whistling", "Wildfire", "Willow", "Winning", "Wisp", "Wisteria", "Wormhole", "Wraith", "Xanthorrhoea",
    "Xenith", "Xenon", "Xenotime", "Xylem", "Xylo", "Yarrow", "Yelling", "Yellow Diamond", "Yeti", "Yew",
    "Yewberry", "Yonder", "Zealot", "Zenith", "Zephyr", "Zero", "Zinnia", "Zircon", "Zodiac", "Zombie",
    "Zucchini", "Zypher", "Astral",
];

function initialDeviceCheck() {
    if (isMobile() && 1 === 2) {
        const blackOverlay = document.createElement('div');
        blackOverlay.style.position = 'fixed';
        blackOverlay.style.top = '0';
        blackOverlay.style.left = '0';
        blackOverlay.style.width = '100vw';
        blackOverlay.style.height = '100vh';
        blackOverlay.style.background = 'black';
        blackOverlay.style.zIndex = '999';
        document.body.appendChild(blackOverlay);
        showCustomAlert(gLS("deviceIncompatible"), 0, undefined, true);
    } else if (!localStorage.getItem('hasVisited')) {
        createWelcomeOverlay();

        function createWelcomeOverlay() {
            const overlay = document.createElement('div');
            overlay.id = 'welcome-overlay';

            const containerHTML = document.createElement('div');
            containerHTML.id = 'welcome-container';

            const header = document.createElement('header');
            const headerTitle = document.createElement('h1');
            headerTitle.id = 'welcome-title';
            const raw = gLS("welcomeTitle");
            const emojiMatch = raw.match(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/u);
            const emoji = emojiMatch ? emojiMatch[0] : "";
            const text = emoji ? raw.slice(emoji.length) : raw;
            headerTitle.innerHTML = `
                <span>${emoji}</span>
                <span class="shimmer-text">${text}</span>
            `;
            header.appendChild(headerTitle);

            const contentWrapper = document.createElement('div');
            contentWrapper.id = 'content-wrapper';

            const tocSidebar = document.createElement('nav');
            tocSidebar.id = 'toc-sidebar';
            const tocTitle = document.createElement('h3');
            tocTitle.textContent = gLS("tocTitle");
            tocSidebar.appendChild(tocTitle);

            const mainContent = document.createElement('article');
            mainContent.id = 'main-content';

            contentWrapper.appendChild(tocSidebar);
            contentWrapper.appendChild(mainContent);

            const footer = document.createElement('footer');
            const startButton = document.createElement('button');
            startButton.className = 'primary-btn';
            startButton.id = 'start-btn';
            startButton.textContent = gLS("startButtonText");

            const toolbar = document.createElement('div');
            toolbar.className = 'toolbar';

            footer.appendChild(startButton);
            footer.appendChild(toolbar);

            containerHTML.appendChild(header);
            containerHTML.appendChild(contentWrapper);
            containerHTML.appendChild(footer);

            overlay.appendChild(containerHTML);
            document.body.appendChild(overlay);

            loadMarkdownContent();

            document.getElementById('start-btn').addEventListener('click', () => {
                containerHTML.style.position = 'fixed';
                containerHTML.style.top = '50%';
                containerHTML.style.left = '50%';
                containerHTML.style.transform = 'translate(-50%, -50%)';
                containerHTML.style.animation = 'shrinkOut 0.3s ease-in forwards';
                overlay.style.transition = 'opacity 0.3s ease-in';
                overlay.style.opacity = '0';
                containerHTML.addEventListener('animationend', () => {
                    containerHTML.remove();
                    overlay.remove();
                    document.removeEventListener('keydown', keyHandler);
                }, { once: true });
                localStorage.setItem('hasVisited', 'true');
            });
        }

        function setupJumpButton() {
            const container = document.getElementById('main-content');
            const startBtn = document.getElementById('start-btn');
            let isJumping = false;
            let animationTimeout = null;

            container.addEventListener('scroll', () => {
                const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50;

                if (isAtBottom && !isJumping) {
                    startBtn.classList.add('jump-active');
                    isJumping = true;
                } else if (!isAtBottom && isJumping) {
                    startBtn.classList.add('jump-completing');
                    startBtn.classList.remove('jump-active');
                    clearTimeout(animationTimeout);
                    animationTimeout = setTimeout(() => {
                        startBtn.classList.remove('jump-completing');
                        isJumping = false;
                    }, 250);
                }
            });
        }

        async function loadMarkdownContent() {
            try {
                const response = await fetch('./README.md');
                if (!response.ok) throw new Error('File not found');
                const text = await response.text();

                const mainContent = document.getElementById('main-content');
                const sidebar = document.getElementById('toc-sidebar');

                mainContent.innerHTML = `<div class="markdown-content">${parseMarkdown(text)}</div>`;
                generateTOC(mainContent, sidebar);
                setupLinks(mainContent);
                setupJumpButton();
            } catch (error) {
                console.error('Error loading content:', error);
                document.getElementById('main-content').innerHTML = `
                <div class="error">
                    <h3>⚠️ Documentation Missing</h3>
                    <p>${error.message}</p>
                </div>
            `;
            }
        }

        function parseMarkdown(text) {
            return text
                // Backslash am Zeilenende als <br> behandeln
                .replace(/\\(\s*)\n/g, '<br>')
                // Setext-Headings
                .replace(/^(.+)[ \t]*\r?\n(=+)[ \t]*$/gm, '<h1>$1</h1>')
                .replace(/^(.+)[ \t]*\r?\n(-+)[ \t]*$/gm, '<h2>$1</h2>')
                // ATX-Headings
                .replace(/^# (.*$)/gm, '<h1>$1</h1>')
                .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
                // Links
                .replace(/\[(.*?)\]\((.*?)\)/g, (_, text, link) => {
                    const cleanLink = link.toLowerCase()
                        .replace(/[^a-z0-9 -]/g, '')
                        .replace(/\s+/g, '-')
                        .replace(/-+/g, '-');
                    return `<a class="content-link" href="#${cleanLink}">${text}</a>`;
                })
                // Formatierung
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/`(.*?)`/g, '<code>$1</code>')
                .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        }

        function generateTOC(contentElement, sidebarElement) {
            const headings = contentElement.querySelectorAll('h1, h2, h3, h4, h5, h6');

            headings.forEach(heading => {
                const id = heading.textContent
                    .toLowerCase()
                    .replace(/[^a-z0-9 -]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/-+/g, '-');

                heading.id = id;

                const tocItem = document.createElement('a');
                tocItem.className = `toc-link ${heading.tagName.toLowerCase()}`;
                tocItem.textContent = heading.textContent;
                tocItem.href = `#${id}`;
                tocItem.addEventListener('click', smoothScroll);
                sidebarElement.appendChild(tocItem);
            });
        }

        function setupLinks(container) {
            container.querySelectorAll('.content-link').forEach(link => {
                link.addEventListener('click', smoothScroll);
            });
        }

        function smoothScroll(e) {
            e.preventDefault();
            const link = e.target.closest('a');
            if (!link || !link.hash) return;

            const targetId = decodeURIComponent(link.hash.substring(1));
            const target = document.getElementById(targetId);
            const container = document.getElementById('main-content');

            if (target && container) {
                const headerHeight = document.querySelector('header').offsetHeight;
                const containerRect = container.getBoundingClientRect();
                const targetRect = target.getBoundingClientRect();
                const scrollPosition = targetRect.top - containerRect.top + container.scrollTop - headerHeight + 100;

                container.scrollTo({
                    top: scrollPosition,
                    behavior: 'smooth'
                });

                target.classList.add('highlight');
                setTimeout(() => target.classList.remove('highlight'), 2000);
                history.replaceState(null, null, link.hash);
            }
        }
    }
}

function gLS(key) { // get language string
    return languages[language][prank ? 'aprilFools' : 'normal'][key] || key;
}

function charLimit(element, limit) {
    element2 = document.getElementById(element);
    if (element2.innerText.length > limit) {
        element2.innerText = element2.innerText.slice(0, limit);
        element2.blur();
    }
}

if (showHistory) {
    toggleHistory.classList.add('disabled');
}

function isMobile() {
    const toMatch = [/Android/i, /webOS/i, /iPhone/i, /iPod/i, /BlackBerry/i, /Windows Phone/i];
    return toMatch.some((toMatchItem) => {
        return navigator.userAgent.match(toMatchItem);
    });
}

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

if (localStorage.getItem('loginDetails') || auth.currentUser) {
    if (auth.currentUser) {
        console.log('User is already logged in')
        joinLobbyButton.disabled = false; // Enable multiplayer if user is already logged in
    } else {
        const loginDetails = JSON.parse(localStorage.getItem('loginDetails'));
        console.log('Login read from localStorage')
        auth.signInWithEmailAndPassword(loginDetails.email, loginDetails.password)
            .then(() => { joinLobbyButton.disabled = false; }) // Enable multiplayer if sign in is successful
            .catch(error => {
                console.error('Error signing in with stored credentials:', error);
                localStorage.removeItem('loginDetails'); // Remove invalid credentials
                joinLobbyButton.disabled = true; // Disable multiplayer until sign in is successful
            });
    }
} else {
    console.log('No login details found in localStorage')
    joinLobbyButton.disabled = true; // Disable multiplayer until sign in is successful
}

function closeAllLobbies() {
    db.collection('lobbies').get().then(querySnapshot => {
        querySnapshot.forEach(doc => {
            doc.ref.delete();
        });
    });
}

function triggerLobbyAnimation() {
    const now = Date.now();
    // Check if 5 seconds have passed since the last animation
    if (now - lastLobbyAnimationTime >= 5000) {
        playerListDiv.classList.remove('animate');
        void playerListDiv.offsetWidth; // Trigger reflow to restart animation
        playerListDiv.classList.add('animate');
        gameModeSelector.classList.remove('animate');
        void gameModeSelector.offsetWidth; // Trigger reflow to restart animation
        gameModeSelector.classList.add('animate');
        lastLobbyAnimationTime = now;
        // Remove the class after animation completes
        setTimeout(() => {
            playerListDiv.classList.remove('animate');
            gameModeSelector.classList.remove('animate');
        }, 800);
    }
}

function closeThisLobby() {
    db.collection('lobbies').doc(lobbyName).delete();
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

async function loadLanguages() {
    try {
        const response = await fetch('languages.json'); // Path to your JSON file
        if (!response.ok) {
            throw new Error('Failed to load languages');
        }
        languages = await response.json(); // Parse the JSON data
        console.log('Languages loaded successfully:', languages);
        // Call any functions that depend on languages here
        createMoreButton();
        initialDeviceCheck();
        initializeGame();
    } catch (error) {
        console.error('Error loading languages:', error);
    }
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
        loadLanguages();
    } catch (error) {
        console.error('Error loading game modes:', error);
    }
}

function getPlayerNames(players, doc = null) {
    console.log(doc !== null);
    let result = [];
    players.sort((a, b) => b.totalScore - a.totalScore);
    let rank = 1;
    let prevScore = null;

    players.forEach((player, index) => {
        if (prevScore !== null && player.totalScore < prevScore) {
            rank = index + 1;
        }
        prevScore = player.totalScore;

        let color, glow;
        if (rank === 1) {
            color = '#FFD700'; // gold
            glow = '0 0 5px rgba(255, 217, 0, 0.6), 0 0 6px rgba(255, 217, 0, 0.6), 0 0 7px rgba(255, 217, 0, 0.6)'; // big glow
        } else if (rank === 2) {
            color = '#C0C0C0'; // silver
            glow = '0 0 5px rgba(192, 192, 192, 0.7), 0 0 6px rgba(192, 192, 192, 0.7)'; // medium glow
        } else if (rank === 3) {
            color = '#cd7f32'; // bronze
            glow = '0 0 5px rgb(205, 128, 50)'; // small glow
        } else {
            color = 'white';
            glow = 'none';
        }

        let playerName = document.createElement('span');
        playerName.style.color = color;
        playerName.style.textShadow = glow;
        playerName.textContent = `${player.name} (${player.score.toFixed(0)} / ${player.totalScore.toFixed(0)} / ${player.totalPossibleScore.toFixed(0)})`;
        const kickAndBanButtonContainer = document.createElement('span');
        kickAndBanButtonContainer.id = 'kickAndBanButtonContainer';
        const kickButton = document.createElement('button');
        kickButton.className = 'kickButton';
        kickButton.innerText = gLS("kickButton");
        const banButton = document.createElement('button');
        banButton.className = 'banButton';
        banButton.innerText = gLS("banButton");
        if (player.uid !== auth.currentUser.uid) {
            kickButton.onclick = () => {
                doc.ref.update({
                    players: players.filter(playerElement => playerElement.uid !== player.uid)
                });
            };
            banButton.onclick = () => {
                doc.ref.update({
                    players: players.filter(playerElement => playerElement.uid !== player.uid),
                    bannedPlayers: firebase.firestore.FieldValue.arrayUnion({ uid: player.uid, name: player.name })
                });
            };
        } else {
            kickButton.style.display = 'none';
            banButton.style.display = 'none';
        }
        if (doc) {
            kickAndBanButtonContainer.appendChild(banButton);
            kickAndBanButtonContainer.appendChild(kickButton);
        }

        const playerDiv = document.createElement('div');
        playerDiv.appendChild(playerName);
        playerDiv.appendChild(kickAndBanButtonContainer);
        playerDiv.appendChild(document.createElement('br'));

        result.push(playerDiv);
    });
    return result;
}

// Load the game modes when the script runs
loadGameModes();

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

const gameVersionDiv = document.createElement('div');
const lobbyInput = document.createElement('input');
const nameInput = document.createElement('input');
if (localStorage.getItem('lastUsedName')) {
    nameInput.value = localStorage.getItem('lastUsedName');
}
let lobbyName = "defaultlobby";
let userName = "defaultuser";

function chooseVersion() {
    gameVersionDiv.id = 'gameVersion';
    document.body.appendChild(gameVersionDiv);

    lobbyInput.type = 'password';
    lobbyInput.placeholder = gLS("placeholderLobbyName");
    lobbyInput.classList.add('input-field-1');

    const lobbyContainer = document.createElement('div');
    lobbyContainer.className = 'autocomplete-container';
    lobbyContainer.appendChild(lobbyInput);

    const dropdown = document.createElement('div');
    dropdown.className = 'custom-autocomplete';
    lobbyContainer.appendChild(dropdown);

    gameVersionDiv.appendChild(lobbyContainer);

    let dropDownHistory = JSON.parse(localStorage.getItem('lobbyNameHistory') || '[]');

    function updateDropdown() {
        dropdown.innerHTML = dropDownHistory
            .map(item => `<div class="suggestion-item">${item}</div>`)
            .join('');
    }

    lobbyInput.addEventListener('focus', () => {
        if (dropDownHistory.length > 0) {
            if (closingTimeout) {
                clearTimeout(closingTimeout);
                dropdown.classList.remove('closing');
            }
            dropdown.style.display = 'block';
            updateDropdown();
        }
    });

    lobbyInput.addEventListener('blur', () => {
        dropdown.classList.add('closing');
        closingTimeout = setTimeout(() => {
            dropdown.style.display = 'none';
            dropdown.classList.remove('closing');
        }, 600);
    });

    dropdown.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('suggestion-item')) {
            lobbyInput.value = e.target.textContent;
            clearTimeout(closingTimeout);
            dropdown.classList.remove('closing');
        }
    });

    nameInput.type = 'text';
    nameInput.placeholder = gLS('placeholderUserName');
    nameInput.classList.add('input-field-2');

    // Create loading animation element
    loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-animation';
    loadingDiv.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(loadingDiv);
    loadingDiv.style.display = 'none'; // Initially hidden

    // Create the join lobby button
    joinLobbyButton.id = 'joinLobbyButton';
    joinLobbyButton.innerText = gLS("joinLobbyButtonText");
    joinLobbyButton.addEventListener("mouseenter", () => {
        if (joinLobbyButton.disabled) {
            profileButton.style.transition = "transform 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55)";
            profileButton.style.transform = "scale(1.3)";
            profileButton.style.boxShadow = "0 0 0 2px #33ccff, 0 0 10px 4px #33ccff";
            profileButton.style.animation = "glow 1s ease infinite";
        }
    });

    joinLobbyButton.addEventListener("mouseleave", () => {
        profileButton.style.transform = "scale(1)";
        profileButton.style.boxShadow = "none";
    });
    joinLobbyButton.onclick = () => {
        isOnline = true;
        lobbyName = lobbyInput.value.trim();
        userName = nameInput.value.trim();
        if (lobbyName) {
            if (userName) {
                loadingDiv.style.display = 'flex';
                localStorage.setItem('lastUsedName', userName);
                let history = JSON.parse(localStorage.getItem('lobbyNameHistory') || '[]');
                history = [...new Set(history.concat(lobbyName))];
                if (history.length > 3) {
                    history.shift();
                }
                localStorage.setItem('lobbyNameHistory', JSON.stringify(history));
                joinLobby();
            } else {
                showCustomAlert(gLS("noUserName"), undefined, gameVersionDiv);
            }
        } else {
            showCustomAlert(gLS("noLobbyName"), undefined, gameVersionDiv);
        }
    };

    gameVersionDiv.appendChild(joinLobbyButton);
    gameVersionDiv.appendChild(lobbyInput);
    gameVersionDiv.appendChild(nameInput);
    gameVersionDiv.appendChild(document.createElement('br'));

    // Create the play single player button
    const singlePlayerButton = document.createElement('button');
    singlePlayerButton.id = 'singlePlayerButton';
    singlePlayerButton.innerText = gLS("singlePlayerButtonText");
    singlePlayerButton.onclick = () => {
        console.log('Starting single player game...');
        gameVersionDiv.style.display = 'none';
        startGameModeSelector();
    };
    gameVersionDiv.appendChild(singlePlayerButton);
    profileButton = document.createElement('button');
    profileButton.id = 'profileButton';
    profileButton.innerText = gLS("loginButtonText");
    if (localStorage.getItem('loginDetails') || auth.currentUser) {
        if (auth.currentUser) {
            profileButton.innerText = gLS("profileButtonText");
        } else {
            profileButton.innerText = gLS("profileButtonText");
        }
    }
    profileButton.onclick = () => {
        console.log(auth.currentUser);
        if (auth.currentUser === null) {
            profileButton.blur();
            const loginOverlay = document.createElement('div');
            loginOverlay.id = 'loginOverlay';
            loginOverlay.zIndex = '999';
            loginOverlay.classList.add('custom-alert-overlay');
            loginOverlay.style.background = 'rgba(0, 0, 0, 0.5)';
            loginOverlay.style.backdropFilter = 'blur(2px)';
            loginOverlay.innerHTML = `
                <div class="custom-alert" id="loginAlert">
                    <h2>${gLS("loginTitle")}</h2>
                    <p>${gLS("loginText")}</p>
                    <input type="email" id="loginEmail" placeholder="${gLS("emailPlaceholder")}" required>
                    <input type="password" id="loginPassword" placeholder="${gLS("passwordPlaceholder")}" required>
                    <button id="loginSubmit">${gLS("loginButtonText")}</button>
                </div>
            `;
            document.body.appendChild(loginOverlay);

            const loginEmail = document.getElementById('loginEmail');
            const loginPassword = document.getElementById('loginPassword');
            const loginSubmit = document.getElementById('loginSubmit');
            const loginAlert = document.getElementById('loginAlert');

            loginSubmit.onclick = () => {
                const email = loginEmail.value.trim();
                const password = loginPassword.value.trim();
                localStorage.setItem('loginDetails', JSON.stringify({ email, password }));
                auth.signInWithEmailAndPassword(email, password)
                    .then(() => {
                        console.log('User signed in successfully.');
                        closeAlert();
                        profileButton.innerText = gLS("profileButtonText");
                        joinLobbyButton.disabled = false; // Enable multiplayer after sign-in
                    })
                    .catch(error => {
                        auth.createUserWithEmailAndPassword(email, password)
                            .then(() => {
                                console.log('Account created successfully.');
                                closeAlert();
                                profileButton.innerText = gLS("profileButtonText");
                                joinLobbyButton.disabled = false; // Enable multiplayer after account creation
                            })
                            .catch(createError => {
                                showCustomAlert(createError.message.replace('Firebase:', ''), 0);
                            });
                    });
            };
            function closeAlert() {
                loginAlert.style.animation = 'shrinkOut 0.2s ease-in forwards';
                loginOverlay.style.opacity = '0';
                loginOverlay.style.transition = 'opacity 0.2s ease-in';
                loginOverlay.addEventListener('animationend', () => {
                    loginAlert.remove();
                    loginOverlay.remove();
                    document.removeEventListener('keydown', keyHandler);
                }, { once: true });

                if (reload) {
                    window.location.reload();
                }
            }

            loginOverlay.onclick = (event) => {
                if (!loginAlert.contains(event.target)) {
                    closeAlert();
                }
            };

            document.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' && loginOverlay.parentNode) {
                    // Check if any input is focused
                    if (document.activeElement === loginEmail ||
                        document.activeElement === loginPassword) {
                        loginSubmit.click();
                    }
                }
            });
        } else {
            console.log('Opening profile...');
            openProfile();
        }
    };
    gameVersionDiv.appendChild(profileButton);
}

function openProfile() {
    const overlay = document.createElement('div');
    overlay.className = 'profile-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    overlay.style.zIndex = '1000';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';

    const profilePopup = document.createElement('div');
    profilePopup.className = 'profile-popup';
    profilePopup.style.position = 'relative';
    profilePopup.style.width = '100%';
    profilePopup.style.maxWidth = '1200px';
    profilePopup.style.backgroundColor = 'none';
    profilePopup.style.padding = '20px';
    profilePopup.style.overflow = 'hidden';

    profilePopup.innerHTML = `
        <div id="controlPanel">
            <select id="bgType">
                <option id="solidOption" value="solid">solid color</option>
                <option id="gradientOption" value="gradient">gradient</option>
            </select>
            <div class="bg-option" id="solid">
                <input type="color" id="solidColorPicker" />
            </div>
            <div class="bg-option" id="gradient">
                <input type="color" id="gradientColor1" />
                <input type="color" id="gradientColor2" />
            </div>
        </div>

        <div class="content">
            <div class="profile-section">
                <div class="profile-picture">
                    <img src="images/no-pf-pic.png" id="profileImage" />
                </div>
                <div id="profileInfo">
                    <h1 contenteditable="true" onkeydown="charLimit('profileName', 30);" onkeyup="charLimit('profileName', 30);" onkeypress="charLimit('profileName', 30);" id="profileName">Name</h1>
                    <p style="width: 970px;" contenteditable="true" onkeydown="charLimit('profileDescription', 320);" onkeyup="charLimit('profileDescription', 320);" onkeypress="charLimit('profileDescription', 320);" id="profileDescription">Description</p>
                </div>
            </div>
            <div class="tabs">
                <div id="statsTab" class="tab active" data-section="stats"></div>
                <div id="friendsTab" class="tab" data-section="friends"></div>
            </div>
            <div class="content-area">
                <div class="content-section active" id="stats">
                    <ul>
                        <li>Posts: 0</li>
                        <li>Followers: 0</li>
                        <li>Following: 0</li>
                        <li>Reactions: 0</li>
                        <li>Comments: 0</li>
                        <li>Shares: 0</li>
                        <li>Views: 0</li>
                    </ul>
                </div>
                <div class="content-section" id="friends">
                    <ul>
                        <li>MoCoXIII</li>
                        <li>Rubix</li>
                        <li>p2r3</li>
                        <li>Ghxo</li>
                        <li>Olivia Rodrigo</li>
                        <li>Yndranth, The God of Gayness</li>
                    </ul>
                </div>
            </div>
            <button id="back-button" class="back-button"></button>
        </div>
    `;

    document.body.appendChild(overlay);
    overlay.appendChild(profilePopup);

    const bgType = profilePopup.querySelector('#bgType');
    const solidPicker = profilePopup.querySelector('#solidColorPicker');
    const grad1 = profilePopup.querySelector('#gradientColor1');
    const grad2 = profilePopup.querySelector('#gradientColor2');
    const options = profilePopup.querySelectorAll('.bg-option');
    const statsTab = document.getElementById("statsTab");
    const friendsTab = document.getElementById("friendsTab");
    const backButton = document.getElementById("back-button");
    const solidColor= document.getElementById("solidOption");
    const gradientColor= document.getElementById("gradientOption");

    statsTab.textContent = gLS("statsTabText");
    friendsTab.textContent = gLS("friendsTabText");
    backButton.textContent = gLS("backButtonText");
    solidColor.textContent = gLS("solidColorText");
    gradientColor.textContent = gLS("gradientColorText");

    const profileName = profilePopup.querySelector('#profileName');
    profileName.style.color = 'black';
    const profileDescription = profilePopup.querySelector('#profileDescription');
    profileDescription.style.color = 'black';

    solidPicker.value = '#092E6A';
    grad1.value = '#8681BD';
    grad2.value = '#3D376B';

    applyBackground('solid');

    function applyBackground(type) {
        options.forEach(o => o.style.display = 'none');
        const selectedOption = type === 'gradient' ? 'gradient' : 'solid';
        profilePopup.querySelector(`#${selectedOption}`).style.display = 'block';
        if (type === 'solid') {
            overlay.style.backgroundImage = '';
            overlay.style.backgroundColor = solidPicker.value;
        } else if (type === 'gradient') {
            overlay.style.backgroundColor = '';
            overlay.style.backgroundImage = `linear-gradient(45deg, ${grad1.value}, ${grad2.value})`;
        }
    }

    bgType.addEventListener('change', () => applyBackground(bgType.value));

    solidPicker.addEventListener('input', () => {
        if (bgType.value === 'solid') {
            overlay.style.backgroundColor = solidPicker.value;
        }
    });

    function updateGradient() {
        if (bgType.value === 'gradient') {
            overlay.style.backgroundImage = `linear-gradient(45deg, ${grad1.value}, ${grad2.value})`;
        }
    }

    grad1.addEventListener('input', updateGradient);
    grad2.addEventListener('input', updateGradient);

    profilePopup.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            profilePopup.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            profilePopup.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
            tab.classList.add('active');
            profilePopup.querySelector(`#${tab.dataset.section}`).classList.add('active');
        });
    });

    profilePopup.querySelector('.back-button').addEventListener('click', () => {
        overlay.remove();
    });
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
                leaveLobbyButtonClicked = true;
                location.reload();
            });
        }
    });
}

const lobbyButtonContainer = document.createElement('div');
function joinLobby() {
    console.log(`Joining lobby: ${lobbyName}`);
    lobbyButtonContainer.id = 'lobbyButtonContainer';
    lobbyButtonContainer.style.display = 'flex';
    lobbyButtonContainer.style.gap = '10px';
    lobbyButtonContainer.style.position = 'fixed';
    lobbyButtonContainer.style.bottom = '20px';
    lobbyButtonContainer.style.left = '50%';
    lobbyButtonContainer.style.transform = 'translateX(-50%)';
    lobbyButtonContainer.style.zIndex = '9999';
    gameVersionDiv.style.display = 'none';
    const lobbyCodeDisplay = document.createElement('div');
    lobbyCodeDisplay.id = 'lobbyCodeDisplay';
    lobbyCodeDisplay.innerText = `${gLS("lobbyCode")}: ${lobbyName.replace(/./g, '*')}`;
    lobbyCodeDisplay.onmouseenter = () => {
        lobbyCodeDisplay.innerText = `${gLS("clickToCopy")}`;
    };
    lobbyCodeDisplay.onmouseleave = () => {
        lobbyCodeDisplay.innerText = `${gLS("lobbyCode")}: ${lobbyName.replace(/./g, '*')}`;
    };
    lobbyCodeDisplay.onclick = () => {
        navigator.clipboard.writeText(lobbyName)
        showCustomAlert(gLS("lobbyCodeCopied"), 1);
    };
    document.body.appendChild(lobbyCodeDisplay);
    leaveLobbyButton = document.createElement('button');
    leaveLobbyButton.id = 'leaveLobbyButton';
    leaveLobbyButton.innerText = gLS("leaveLobbyButtonText");
    leaveLobbyButton.style.cursor = 'pointer';
    leaveLobbyButton.onclick = () => {
        if (lobbyButtonContainer.parentElement) {
            lobbyButtonContainer.remove();
        }
        leaveLobby();
    };
    lobbyButtonContainer.appendChild(leaveLobbyButton);
    document.body.appendChild(lobbyButtonContainer);
    triggerLobbyAnimation();
    db.collection('lobbies').doc(lobbyName).get().then(doc => {
        playerListText.innerText = gLS("playerListText");
        if (doc.exists) {
            if (doc.data().state !== 'public' && !(doc.data().state === 'friendsOnly' && doc.data().friends?.includes(auth.currentUser.uid))) {
                showCustomAlert(gLS("lobbyPrivate"), 0, undefined, true);
                return;
            }
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

            if (doc.data().bannedPlayers?.some(banned => banned.uid === firebase.auth().currentUser?.uid)) {
                showCustomAlert(gLS("lobbyBanned"), 0, undefined, gameVersionDiv, true);
                return;
            }

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
                                totalScore: 0,
                                totalPossibleScore: 0
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
                            totalScore: 0,
                            totalPossibleScore: 0
                        });
                    }
                    doc.ref.update({ players: updatedPlayers });
                }
            }).then(() => {
                loadingDiv.style.display = 'none';
                play();
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
                    totalScore: 0,
                    totalPossibleScore: 0
                }],
                state: "private"
            }).then(() => {
                loadingDiv.style.display = 'none';
                isHost = true;
                play();
            });
        }
    }).catch(error => {
        console.error('Error joining lobby:', error);
        loadingDiv.style.display = 'none';
        showCustomAlert(gLS("error"), undefined, gameVersionDiv);
    });
}

const playerListDiv = document.createElement('div');
playerListDiv.id = 'playerList';
const playerListText = document.createElement('div');
playerListText.id = 'playerListText';
playerListDiv.appendChild(playerListText);

function play() {
    gameVersionDiv.style.display = 'none';
    lobbyName = lobbyInput.value;
    db.collection('lobbies').doc(lobbyName).onSnapshot(doc => {
        if (!doc.exists) {
            showCustomAlert(gLS("lobbyNonexistent"), undefined, [], true);
            return;
        }
        const players = doc.data().players || [];
        const userInLobby = players.find(player => player.uid === auth.currentUser.uid);
        if (!userInLobby && !leaveLobbyButtonClicked) {
            showCustomAlert(gLS("lobbyKicked"), undefined, [], true);
            leaveLobbyButtonClicked = false;
            return;
        }
        setTimeout(() => {
            db.collection('lobbies').doc(lobbyName).get().then(doc => {
                lobbyButtonContainer.innerHTML = "";
                lobbyButtonContainer.appendChild(leaveLobbyButton);
                if (isHost) {
                    if (claimHostButton) claimHostButton.remove();
                    const bannedPlayers = doc.data().bannedPlayers || [];
                    const bannedPlayerNames = bannedPlayers.map(banned => banned.name || banned);
                    playerListText.innerHTML = "";
                    const playerListDescriptor = document.createElement('div');
                    playerListDescriptor.textContent = gLS('playerListText');
                    playerListText.appendChild(playerListDescriptor);
                    playerListText.appendChild(document.createElement('br'));
                    getPlayerNames(doc.data().players || [], doc = doc).forEach(playerDiv => {
                        playerListText.appendChild(playerDiv);
                    });
                    if (bannedPlayerNames.length > 0) {
                        playerListText.appendChild(document.createElement('br'));
                        const bannedPlayersDescriptor = document.createElement('div');
                        bannedPlayersDescriptor.textContent = gLS('bannedPlayers');
                        playerListText.appendChild(bannedPlayersDescriptor)
                        playerListText.appendChild(document.createElement('br'));
                        bannedPlayerNames.forEach(bannedPlayerName => {
                            const bannedPlayerDiv = document.createElement('div');
                            bannedPlayerDiv.id = 'bannedPlayerDiv';
                            const bannedPlayerText = document.createElement('span');
                            bannedPlayerText.id = 'bannedPlayerText';
                            bannedPlayerText.style.color = 'gray';
                            bannedPlayerText.style.fontStyle = 'italic';
                            bannedPlayerText.textContent = bannedPlayerName;
                            bannedPlayerDiv.appendChild(bannedPlayerText);
                            const unbanButton = document.createElement('button');
                            unbanButton.className = 'unbanButton';
                            unbanButton.innerText = gLS("unbanButton");
                            unbanButton.onclick = () => {
                                doc.ref.update({
                                    bannedPlayers: doc.data().bannedPlayers.filter(banned => banned.name !== bannedPlayerName)
                                });
                            };
                            bannedPlayerDiv.appendChild(unbanButton);
                            playerListText.appendChild(bannedPlayerDiv);
                        });
                    }
                    document.body.appendChild(playerListDiv);
                    closeLobbyButton = document.createElement('button');
                    giveUpHostButton = document.createElement('button');
                    giveUpHostButton.id = 'giveUpHostButton';
                    giveUpHostButton.innerText = gLS("giveUpHostButtonText");
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
                            }
                        });
                    };
                    closeLobbyButton.id = 'closeLobbyButton';
                    closeLobbyButton.innerText = gLS("closeLobbyButtonText");
                    closeLobbyButton.onclick = () => {
                        closeLobbyButton.disabled = true;
                        closeLobbyButton.style.cursor = 'not-allowed';
                        closeThisLobby();
                    };
                    switchLobbyStateButton = document.createElement('button');
                    switchLobbyStateButton.className = 'switchLobbyStateButton';
                    switchLobbyStateButton.innerText = gLS("switchLobbyStateButton");
                    switchLobbyStateButton.onclick = () => {
                        lobbyStates = [...lobbyStates.slice(1), lobbyStates[0]];
                        doc.ref.update({
                            state: lobbyStates[0]
                        });
                        console.log(doc.data().state);
                        console.log(lobbyStates)
                    };
                    lobbyButtonContainer.appendChild(closeLobbyButton);
                    lobbyButtonContainer.appendChild(giveUpHostButton);
                    lobbyButtonContainer.appendChild(switchLobbyStateButton);
                    if (doc.data().hasOwnProperty('gameStarted')) {
                        gameStarted = doc.data().gameStarted;
                    }
                    if (!gameStarted) {
                        startGameModeSelector();
                    }
                } else {
                    if (closeLobbyButton) closeLobbyButton.remove();
                    if (giveUpHostButton) giveUpHostButton.remove();
                    if (claimHostButton) { claimHostButton.remove(); }
                    if (switchLobbyStateButton) { switchLobbyStateButton.remove(); }
                    claimHostButton = document.createElement('button');
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
                            if (claimHostButton) claimHostButton.remove();
                        } else {
                            lobbyButtonContainer.appendChild(claimHostButton);
                        }
                        claimHostButton.id = 'claimHostButton';
                        claimHostButton.innerText = gLS("claimHostButtonText");
                        claimHostButton.style.cursor = 'pointer';
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
                    } else {
                        if (claimHostButton) { claimHostButton.remove(); }
                    }
                    if (doc.data().gameStarted && syncRandomImage != doc.data().randomImage) {
                        syncActualMap = doc.data().actualMap;
                        syncRandomImage = doc.data().randomImage;
                        reload = doc.data().reload;
                        startGame(JSON.parse(doc.data().gameArea));
                    } else {
                        playerListText.innerHTML = "";
                        const playerListDescriptor = document.createElement('span');
                        playerListDescriptor.textContent = gLS("playerListText");
                        playerListText.appendChild(playerListDescriptor);
                        playerListText.appendChild(document.createElement('br'));
                        getPlayerNames(doc.data().players || []).forEach(playerDiv => {
                            playerListText.appendChild(playerDiv);
                        });
                        document.body.appendChild(playerListDiv);
                    }
                    if (reload) {
                        location.reload();
                    }
                }
            });
        }, isHost ? 0 : 1000); // IMPORTANT: gives the server some time to transfer the data
    });
}

function showCustomAlert(message, mode = 0, cont = null, reload = false) {
    if (document.getElementById('custom-alert')) return; // Prevent multiple alerts
    // Handle container shake
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
                    { transform: 'translateX(0)' },
                    { transform: 'translateX(-12px)' },
                    { transform: 'translateX(12px)' },
                    { transform: 'translateX(0)' },
                    { transform: 'translateX(-12px)' },
                    { transform: 'translateX(12px)' },
                    { transform: 'translateX(0)' }
                ], {
                    duration: 1200,  // Total duration of the shake
                    easing: 'ease-in-out',
                    iterations: 1  // Runs only once
                });
            });
        } else if (cont) {
            cont.animate([
                { transform: 'translateX(0)' },
                { transform: 'translateX(-12px)' },
                { transform: 'translateX(12px)' },
                { transform: 'translateX(0)' },
                { transform: 'translateX(-12px)' },
                { transform: 'translateX(12px)' },
                { transform: 'translateX(0)' },
                { transform: 'translateX(-12px)' },
                { transform: 'translateX(12px)' },
                { transform: 'translateX(0)' }
            ], {
                duration: 1200,  // Total duration of the shake
                easing: 'ease-in-out',
                iterations: 1  // Runs only once
            });
        }
    }

    // Create overlay to block interactions
    const overlay = document.createElement('div');
    overlay.className = 'custom-alert-overlay';
    // Create the alert box
    alertBox = document.createElement('div');
    alertBox.id = 'custom-alert';
    alertBox.className = `custom-alert ${mode === 0 ? 'error' : 'success'}`;
    alertBox.textContent = message;

    // Create the close button
    closeButton = document.createElement('button');
    closeButton.textContent = 'OK';
    if (mode === 0) {
        closeButton.className = 'button-red';
    } else {
        closeButton.className = 'button-green';
    }

    function closeAlert() {
        alertBox.style.animation = 'shrinkOut 0.2s ease-in forwards';

        alertBox.addEventListener('animationend', () => {
            alertBox.remove();
            overlay.remove();
            document.removeEventListener('keydown', keyHandler);
        }, { once: true });

        if (reload) {
            window.location.reload();
        }
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
    document.body.append(overlay, alertBox);
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
selectButton = document.createElement('button');

function startGameModeSelector() {
    // Create the gameModeSelector div if it doesn't exist
    gameModeSelector.style.display = 'block';

    // Create the selectedPathElement and the selectButton
    selectedPathElement.id = 'selectedPath';
    selectedPathElement.innerText = gLS("chooseGameText");
    selectButton.id = 'selectButton';
    selectButton.innerText = gLS("selectButtonText");
    selectButton.onclick = () => {
        selectGameMode();
    };
    gameModeSelector.appendChild(selectedPathElement);
    gameModeSelector.appendChild(selectButton);

    // Helper function to select a game mode
    function selectGameMode() {
        if (Object.keys(checkedGameModes).length === 0) {
            console.log("Playing on all maps.");
        } else if (invertSelection) {
            /**
             * Recursively filters out keys from an object that are in the
             * checkedGameModes object.
             *
             * @param {Object} obj The object to filter.
             * @returns {Object} The filtered object.
             */
            function recursiveFilter(obj) {
                if (Array.isArray(obj)) {
                    return obj; // don't look inside arrays (for some reason still counted as objects by the check below)
                }

                if (typeof obj !== 'object') {
                    return obj;
                }

                const newObj = {};
                for (const key in obj) {
                    if (!(key in checkedGameModes)) {
                        newObj[key] = recursiveFilter(obj[key]);
                    }
                }

                return newObj;
            }

            gameArea = recursiveFilter(gameArea);
        } else {
            gameArea = checkedGameModes;
        }

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
            backButton.innerText = gLS("backButtonText");
            backButton.onclick = () => {
                parentKeys.pop();
                gameArea = getNestedObject(gameModes, parentKeys);
                const selectedPath = parentKeys.join(' > ');
                selectedPathElement.innerText = selectedPath;
                if (parentKeys.length === 0) {
                    selectedPathElement.innerText = gLS("allGamesText");
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
            const checkBox = document.createElement('input');
            checkBox.type = 'checkbox';
            if (Object.prototype.hasOwnProperty.call(checkedGameModes, key)) {
                checkBox.checked = true;
            }
            button.innerText = key;
            const value = options[key];
            // button.dataset.value = JSON.stringify(value); // or checkBox maybe?

            checkBox.onclick = () => {
                if (checkBox.checked) {
                    checkedGameModes[key] = value;
                } else {
                    delete checkedGameModes[key];
                }
            }

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
                    checkedGameModes = {};
                    selectGameMode();
                }
            };

            const container = document.createElement('div');
            container.classList.add("button-container");
            container.style.display = 'inline-flex';
            container.style.alignItems = 'center';
            container.appendChild(checkBox);
            container.appendChild(button);
            gameModeSelector.appendChild(container);
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
        } else if (typeof obj[key] === 'object') {
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

function showLanguageMenu() {
    if (document.getElementById('languageBox')) return; // Prevent multiple menus
    // Create overlay to block interactions
    const overlay = document.createElement('div');
    overlay.className = 'language-overlay';
    document.body.appendChild(overlay);

    // Create the alert box
    const languageBox = document.createElement('div');
    languageBox.id = 'languageBox';
    languageBox.innerHTML = `
    <h2 style="text-align: center; font-weight: bold;">${gLS("languages")}</h2>
    <h3 style="text-align: center;font-weight: normal; color: red;">${gLS("aiMistakes")}</h3>
    <br>
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-size: 18px;">
        <div style="text-align: center;"><a href="?lang=en">English (en)</a></div>
        <div style="text-align: center;"><a href="?lang=de">Deutsch (de)</a></div>
        <div style="text-align: center;"><a href="?lang=fr">Français (fr)</a></div>
        
        <div style="text-align: center;"><a href="?lang=es">Español (es)</a></div>
        <div style="text-align: center;"><a href="?lang=ja">日本語 (ja)</a></div>
        <div style="text-align: center;"><a href="?lang=zh">中文 (zh)</a></div>
        
        <div style="text-align: center;"><a href="?lang=ru">Русский (ru)</a></div>
        <div style="text-align: center;"><a href="?lang=ar">العربية (ar)</a></div>
        <div style="text-align: center;"><a href="?lang=pt">Português (pt)</a></div>
        
        <div style="text-align: center;"><a href="?lang=hi">हिन्दी (hi)</a></div>
        <div style="text-align: center;"><a href="?lang=it">Italiano (it)</a></div>
        <div style="text-align: center;"><a href="?lang=ko">한국어 (ko)</a></div>
        
        <div style="text-align: center;"><a href="?lang=tr">Türkçe (tr)</a></div>
        <div style="text-align: center;"><a href="?lang=vi">Tiếng Việt (vi)</a></div>
        <div style="text-align: center;"><a href="?lang=th">ไทย (th)</a></div>
        
        <div style="text-align: center;"><a href="?lang=nl">Nederlands (nl)</a></div>
        <div style="text-align: center;"><a href="?lang=pl">Polski (pl)</a></div>
        <div style="text-align: center;"><a href="?lang=id">Bahasa Indonesia (id)</a></div>
        
        <div style="text-align: center;"><a href="?lang=bn">বাংলা (bn)</a></div>
        <div style="text-align: center;"><a href="?lang=lv">Latviešu (lv)</a></div>
        <div style="text-align: center;"><a href="?lang=uk">Українська (uk)</a></div>
        
        <div style="text-align: center;"><a href="?lang=ms">Bahasa Melayu (ms)</a></div>
        <div style="text-align: center;"><a href="?lang=sw">Kiswahili (sw)</a></div>
        <div style="text-align: center;"></div> <!-- Empty div for layout balance -->
    </div>`;

    const flags = document.createElement('div');
    flags.className = 'lottieContainer';
    flags.style.width = '80px';
    flags.style.height = '80px';

    const animation = lottie.loadAnimation({
        container: flags,
        renderer: 'svg',
        loop: false,
        autoplay: false,
        path: 'flags.json'
    });
    setTimeout(() => animation.play(), 500);

    languageBox.insertBefore(flags, languageBox.firstChild);

    // Create the close button
    const closeButton = document.createElement('button');
    closeButton.innerText = gLS("closeButtonText");
    closeButton.classList.add('button-gray');

    function closeLanguageBox() {
        languageBox.style.animation = 'shrinkOut 0.2s ease-in forwards';
        languageBox.addEventListener('animationend', () => {
            languageBox.remove();
            overlay.remove();
            document.removeEventListener('keydown', keyHandler);
        }, { once: true });
    }

    closeButton.onclick = closeLanguageBox;
    overlay.onclick = closeLanguageBox;

    // Close on Enter key
    function keyHandler(event) {
        if (event.key === 'Enter') {
            closeLanguageBox();
        }
    }
    document.addEventListener('keydown', keyHandler);

    languageBox.appendChild(closeButton);
    document.body.appendChild(languageBox);
    closeButton.focus(); // Focus on button so Enter works immediately
}

function showCreditMenu() {
    if (document.getElementById('credits')) return; // Prevent multiple menus
    // Create overlay to block interactions
    const overlay = document.createElement('div');
    overlay.className = 'credit-overlay';
    document.body.appendChild(overlay);

    // Create the alert box
    const creditBox = document.createElement('div');
    creditBox.id = 'credits';
    creditBox.innerHTML = `
    <h2 style="text-align: center; font-weight: bold;">CREDITS</h2>
    <div style="display: flex; flex-direction: column; align-items: start; font-size: 18px;">
        <div>
            <strong>${gLS("programmer")}</strong>
            <a href="https://github.com/MoCoXIII/MapGuessr" target="_blank"><u>MoCoXIII</u></a><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <a href="https://github.com/PizzaPost/MapGuessr" target="_blank"><u>PizzaPost</u></a>
        </div>
        <div>
            <strong>${gLS("mapper")}</strong>
            <a href="https://github.com/PizzaPost/MapGuessr" target="_blank"><u>PizzaPost</u></a><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <a href="https://github.com/MoCoXIII/MapGuessr" target="_blank"><u>MoCoXIII</u></a><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            Ghxo
        </div>
        <div><strong>${gLS("designer")}</strong>
            <a href="https://github.com/PizzaPost/MapGuessr" target="_blank"><u>PizzaPost</u></a>
        </div>
        <div><strong>${gLS("idea")}</strong>
            <a href="https://github.com/MoCoXIII/MapGuessr" target="_blank"><u>MoCoXIII</u></a>
        </div>
    </div>
    `;

    // Create the close button
    const closeButton = document.createElement('button');
    closeButton.innerText = gLS("closeButtonText");
    closeButton.classList.add('button-gray');

    function closeCredits() {
        creditBox.style.animation = 'shrinkOut 0.2s ease-in forwards';
        creditBox.addEventListener('animationend', () => {
            creditBox.remove();
            overlay.remove();
            document.removeEventListener('keydown', keyHandler);
        }, { once: true });
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


function attachTooltip(el, text) {
    el.addEventListener("mouseenter", e => {
        tooltip = document.createElement("div");
        tooltip.id = 'tooltip'
        tooltip.textContent = text;
        tooltip.classList.add("tooltip");
        document.body.appendChild(tooltip);
        tooltip.style.left = e.pageX - tooltip.offsetWidth - 20 + "px";
        tooltip.style.top = e.pageY + "px";
    });
    el.addEventListener("mousemove", e => {
        if (tooltip) {
            tooltip.style.left = e.pageX - tooltip.offsetWidth - 20 + "px";
            tooltip.style.top = e.pageY - 10 + "px";
            document.body.appendChild(tooltip);
        }
    });
    el.addEventListener("mouseleave", () => {
        if (tooltip) {
            document.body.removeChild(tooltip); tooltip = null;
        }
    });
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
    infoLink.style.width = '40px';

    const themeEmoji = document.createElement('span');
    themeEmoji.id = 'themeEmoji';
    themeEmoji.style.width = '40px';

    const keybindMenu = document.createElement('span');
    keybindMenu.id = 'keybindMenu';
    keybindMenu.textContent = '⌨️';

    const toggleSelection = document.createElement('span');
    toggleSelection.id = 'toggleSelection';
    toggleSelection.textContent = '🔄️';

    const toggleHistory = document.createElement('span');
    toggleHistory.id = 'toggleHistory';
    toggleHistory.textContent = '🖼️';

    const localStorageReset = document.createElement('span');
    localStorageReset.id = 'localStorageReset';
    localStorageReset.textContent = '🗑️';

    const languageMenu = document.createElement('span');
    languageMenu.id = 'languageMenu';
    languageMenu.textContent = '💬';

    attachTooltip(infoLink, gLS("infoTooltipText"));
    attachTooltip(themeEmoji, gLS("themeTooltipText"));
    attachTooltip(keybindMenu, gLS("keybindTooltipText"));
    attachTooltip(toggleSelection, gLS("toggleSelectionTooltipText"));
    attachTooltip(toggleHistory, gLS("toggleHistoryTooltipText"));
    attachTooltip(localStorageReset, gLS("localStorageResetTooltipText"));
    attachTooltip(languageMenu, gLS("languageMenuTooltipText"));

    menuButton.appendChild(textSpan);
    menuButton.appendChild(infoLink);
    menuButton.appendChild(themeEmoji)
    menuButton.appendChild(keybindMenu);
    menuButton.appendChild(toggleSelection);
    menuButton.appendChild(toggleHistory);
    menuButton.appendChild(localStorageReset);
    menuButton.appendChild(languageMenu);

    const updateEmoji = () => {
        const currentTheme = document.body.getAttribute('data-theme');
        themeEmoji.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
    };

    if (!showHistory) {
        toggleHistory.classList.add('disabled');
    }

    menuButton.addEventListener('click', (event) => {
        if (menuButton.getBoundingClientRect().height >= 200) {
            // option actions
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
                updatePrankImage();
            }
            if (event.target.id === 'infoLink') {
                showCreditMenu()
            }
            if (event.target.id === 'languageMenu') {
                showLanguageMenu();
            }
            if (event.target.id === 'keybindMenu') {
                if (document.getElementById('keybinds')) return;

                // Create overlay
                const overlay = document.createElement('div');
                overlay.className = 'keybind-overlay';
                overlay.addEventListener('click', (event) => { if (!event.target.closest('#keybinds')) { closeKeybindsMenu() } });
                document.body.appendChild(overlay);

                // Create menu container
                const keybindMenuBox = document.createElement('div');
                keybindMenuBox.id = 'keybinds';
                keybindMenuBox.className = 'keybinds';

                // Add title
                const title = document.createElement('h2');
                title.className = 'keybinds-title';
                title.textContent = gLS("keybindMenuTitleText");
                keybindMenuBox.appendChild(title);

                // Add explanation
                const explanation = document.createElement('p');
                explanation.className = 'keybinds-explanation';
                explanation.innerHTML = `<strong>Instructions:</strong><br>
                    - <strong>Key:</strong> The key that triggers the action.<br>
                    - <strong>Double Press:</strong> Whether the action requires a double press.<br>
                    - Modify the fields below to customize your keybinds.`;
                keybindMenuBox.appendChild(explanation);

                // Create keybinds list
                const keybindsList = document.createElement('div');
                keybindsList.className = 'keybinds-list';

                keybinds.forEach(([key, elements, doublePress], index) => {
                    const keybindRow = document.createElement('div');
                    keybindRow.className = 'keybind-row';

                    // Key input
                    const keybindTextfield = document.createElement('input');
                    keybindTextfield.className = 'keybind-input';
                    keybindTextfield.value = key;
                    keybindTextfield.onkeydown = (e) => {
                        e.preventDefault();
                        const key = e.key === ' ' ? 'Space' : e.key;
                        keybindTextfield.value = key;
                        keybinds[index][0] = key;

                        // adjust width of textfield
                        keybindTextfield.style.width = '30px';
                        if (keybindTextfield.scrollWidth > 30) {
                            keybindTextfield.style.width = `${keybindTextfield.scrollWidth + 5}px`;
                        }

                        return false;
                    };

                    const slider = document.createElement('div');
                    slider.className = 'lottieContainer';

                    const animation = lottie.loadAnimation({
                        container: slider,
                        renderer: 'svg',
                        loop: false,
                        autoplay: false,
                        path: 'slider.json'
                    });

                    if (keybinds[index][2]) { animation.playSegments([30], true); }

                    // State-Variable zum Umschalten der Segmente
                    let playFirstSegment = !keybinds[index][2];
                    slider.addEventListener('click', () => {
                        if (playFirstSegment) {
                            animation.playSegments([0, 30], true);
                            keybinds[index][2] = true;
                        } else {
                            animation.playSegments([30, 0], true);
                            keybinds[index][2] = false;
                        }
                        playFirstSegment = !playFirstSegment;
                    });


                    // Action description
                    const actionDescription = document.createElement('span');
                    actionDescription.className = 'keybind-action';
                    actionDescription.innerHTML = elements
                        .map(element => {
                            const el = document.getElementById(element);
                            return isElementVisible(el) ? `<strong>${el.textContent}</strong>` : element;
                        })
                        .join(', ');

                    // Create labels
                    const createLabel = (text) => {
                        const label = document.createElement('span');
                        label.className = 'keybind-label';
                        label.textContent = text;
                        return label;
                    };

                    keybindRow.appendChild(createLabel(gLS("actionLabelText")));
                    keybindRow.appendChild(actionDescription);
                    keybindRow.appendChild(createLabel(gLS("keyLabelText")));
                    keybindRow.appendChild(keybindTextfield);
                    keybindRow.appendChild(createLabel(gLS("doublePressLabelText")));
                    keybindRow.appendChild(slider);

                    keybindsList.appendChild(keybindRow);
                });

                keybindMenuBox.appendChild(keybindsList);

                // Exit button
                const exitMenuButton = document.createElement('button');
                exitMenuButton.className = 'keybind-exit-btn';
                exitMenuButton.textContent = gLS("exitMenuButtonText");
                exitMenuButton.onclick = () => closeKeybindsMenu();
                function closeKeybindsMenu() {
                    localStorage.setItem('keybinds', JSON.stringify(keybinds));
                    if (prank) {
                        const menuRect = keybindMenuBox.getBoundingClientRect();
                        const centerX = menuRect.left + menuRect.width / 2;
                        const centerY = menuRect.top + menuRect.height / 2;

                        // Create realistic glass fragments
                        const fragmentCount = 50;
                        const originalStyles = window.getComputedStyle(keybindMenuBox);

                        // Hide original menu but keep visible for cloning styles
                        keybindMenuBox.style.opacity = '0';
                        keybindMenuBox.style.pointerEvents = 'none';

                        for (let i = 0; i < fragmentCount; i++) {
                            const fragment = document.createElement('div');
                            fragment.style.cssText = `
                                position: fixed;
                            `;

                            // Create irregular polygon shapes
                            const polygonPoints = Array.from({ length: 5 }, () =>
                                Math.random() * 100 + '% ' + Math.random() * 100 + '%'
                            ).join(',');

                            // Clone original menu's appearance
                            fragment.style.cssText = `
                                position: fixed;
                                width: ${Math.random() * 50 + 20}px;
                                height: ${Math.random() * 50 + 20}px;
                                background: rgba(255,255,255,0.9);
                                border: 1px solid rgba(0,0,0,0.2);
                                box-shadow: 0 0 5px rgba(0,0,0,0.3);
                                clip-path: polygon(${polygonPoints});
                                opacity: 0.9;
                                transform-origin: center;
                                backface-visibility: hidden;
                            `;

                            // Random position in menu
                            fragment.style.left = `${menuRect.left + Math.random() * menuRect.width}px`;
                            fragment.style.top = `${menuRect.top + Math.random() * menuRect.height}px`;

                            document.body.appendChild(fragment);

                            // Physics parameters
                            const angle = Math.atan2(
                                fragment.offsetTop - centerY,
                                fragment.offsetLeft - centerX
                            );
                            const force = Math.random() * 150 + 50;
                            const rotationX = (Math.random() - 0.5) * 360;
                            const rotationY = (Math.random() - 0.5) * 360;
                            const rotationZ = (Math.random() - 0.5) * 720;
                            const gravity = 980; // px/s²

                            // Animate with Web Animations API for better performance
                            const animation = fragment.animate([
                                {
                                    transform: `
                                        translate(0, 0)
                                        rotateX(0deg)
                                        rotateY(0deg)
                                        rotateZ(0deg)
                                    `,
                                    opacity: 1
                                },
                                {
                                    transform: `
                                        translate(${Math.cos(angle) * force}px, 
                                                ${Math.sin(angle) * force}px)
                                        rotateX(${rotationX}deg)
                                        rotateY(${rotationY}deg)
                                        rotateZ(${rotationZ}deg)
                                    `,
                                    offset: 0.3,
                                    opacity: 0.8
                                },
                                {
                                    transform: `
                                        translate(${Math.cos(angle) * force * 1.5}px, 
                                                ${Math.sin(angle) * force + gravity}px)
                                        rotateX(${rotationX * 2}deg)
                                        rotateY(${rotationY * 2}deg)
                                        rotateZ(${rotationZ * 2}deg)
                                    `,
                                    opacity: 0
                                }
                            ], {
                                duration: 2000,
                                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                                fill: 'forwards'
                            });

                            animation.onfinish = () => fragment.remove();
                        }

                        // Add subtle overlay crack effect
                        const crackOverlay = document.createElement('div');
                        crackOverlay.style.cssText = `
                            position: fixed;
                            top: ${menuRect.top}px;
                            left: ${menuRect.left}px;
                            width: ${menuRect.width}px;
                            height: ${menuRect.height}px;
                            pointer-events: none;
                            background-image: radial-gradient(circle at 50% 50%, 
                                rgba(0,0,0,0.1) 10%,
                                rgba(0,0,0,0) 70%);
                            mix-blend-mode: overlay;
                        `;
                        document.body.appendChild(crackOverlay);
                        crackOverlay.animate([{ opacity: 1 }, { opacity: 0 }],
                            { duration: 300, fill: 'forwards' }).onfinish = () => crackOverlay.remove();

                        // Remove overlay after animation
                        const overlayAnimation = overlay.animate([{ opacity: 1 }, { opacity: 0 }],
                            { duration: 2000, fill: 'forwards' });
                        setTimeout(() => overlay.remove(), 2000);
                    } else {
                        overlay.remove();
                    }
                };

                keybindMenuBox.appendChild(exitMenuButton);
                overlay.appendChild(keybindMenuBox);
            }
            if (event.target.id === 'toggleHistory') {
                showHistory = !showHistory;
                localStorage.setItem('showHistory', showHistory);
                if (showHistory) {
                    toggleHistory.classList.add('disabled');
                    showCustomAlert(gLS("historyDisabled"), 1);
                }
                else {
                    toggleHistory.classList.remove('disabled');
                    showCustomAlert(gLS("historyEnabled"), 1);
                }
            }
            if (event.target.id === 'toggleSelection') {
                invertSelection = !invertSelection;
                showCustomAlert(invertSelection ? gLS("selectionInverted") : gLS("selectionNormal"), 1); // TODO: I selected Portal 2 and Subnautica but it didn't invert
                // TODO: The whole selection thing is broken. I selected Subnautica and presssed toggle but nothing happened.
            }
            if (event.target.id === 'localStorageReset') {
                localStorage.clear();
                firebase.auth().signOut();
                showCustomAlert(gLS("localStorageCleared"), 1);
            }
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

    if (showHistory) {
        imagesWrapper.innerHTML = '';
    } else {
        const historyLength = 3; // history length in generation (each 2 pictures)
        if (imagesWrapper.children.length > 2 * historyLength) {
            for (let i = 0; i < 2; i++) {
                imagesWrapper.removeChild(imagesWrapper.firstChild);
            }
        }
        const children = Array.from(imagesWrapper.children);
        for (let i = 0; i < children.length / 2; i++) {
            const first = children[i * 2];
            const second = children[i * 2 + 1];
            if (first && !second) {
                imagesWrapper.removeChild(first)
                break
            }
            const blur = Math.max(0, 1.7 * (i ** 2) - 7.9 * i + 10); // TODO: When the first photo is guessed and appears in the history, it
            // immediately has the strongest blur effect instead of the lowest.
            // After the second photo becomes the newest in the history, it has
            // a medium blur strength, and the oldest still has the strongest.
            // However, the oldest one should have the medium blur strength, and the
            // newest should have the lowest. After the next guess is everything correct.
            // We do not want this behavior though, as we prefer the blur to gradually increase towards the top.
            first.style.filter = `blur(${blur}px)`;
            second.style.filter = `blur(${blur}px)`;
            second.style.transform = 'scale(1)';
            second.onwheel = null;
        }
    }

    gameContainer.appendChild(imagesWrapper);

    // Display a random image
    function collectLists(obj) {
        let result = [];
        if (Array.isArray(obj)) {
            return [obj];
        } else {
            Object.values(obj).forEach(value => {
                result = result.concat(collectLists(value));
            });
        }

        return result;
    }

    let possibleImages = collectLists(gameArea);

    function filterPossibleImages(possibleImages) {
        let newPossibleImages = [];
        possibleImages.forEach(mapArray => {
            const [mapString, ...imageArrays] = mapArray;
            const filteredImages = imageArrays.filter(imageArray => !image_history.includes(imageArray[0]));
            if (filteredImages.length > 0) {
                newPossibleImages.push([mapString, ...filteredImages]);
            }
        });
        return newPossibleImages;
    }

    possibleImages = filterPossibleImages(possibleImages);
    if (possibleImages.length === 0) {
        image_history.splice(0, Math.ceil(image_history.length * 0.5));
        possibleImages = filterPossibleImages(collectLists(gameArea));
    }

    let actualMap = null;

    let [imagePath, solution] = [null, null];

    if (devMode > -1) {
        if (devSkip) {
            devSkip = false;
            solution = [0, 1];
            let attempts = 0;
            const maxAttempts = possibleImages.reduce((count, list) => count + list.length - 1, 0);
            while (attempts <= maxAttempts && solution.length > 0) {
                if (attempts + 1 > maxAttempts) {
                    console.log(`Attempts are about to run out, choosing next image.`);
                }
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
                attempts++;
            }
        } else {
            if (devMode >= possibleImages.length) {
                devMode = 0;
            }
            if (altDevMode >= possibleImages[devMode].length - 1) {
                altDevMode = 0;
                devMode++;
            }
            const possibleImage = possibleImages[devMode][1 + altDevMode];
            actualMap = possibleImages[devMode][0];
            [imagePath, solution] = possibleImage;
            altDevMode++;
        }
    } else {
        if (isOnline) {
            if (!isHost) {
                if (syncActualMap === "" || syncRandomImage === "") {
                    showCustomAlert(gLS("noImageReceived"), undefined, [], true);
                    return;
                }
                actualMap = syncActualMap;
                [imagePath, solution] = JSON.parse(syncRandomImage);
            } else {
                const randomNumber = Math.floor(Math.random() * possibleImages.length);
                const possibleImage = possibleImages[randomNumber][1 + Math.floor(Math.random() * (possibleImages[randomNumber].length - 1))];
                actualMap = possibleImages[randomNumber][0];
                syncActualMap = actualMap;
                [imagePath, solution] = possibleImage;
                syncRandomImage = JSON.stringify(possibleImage);
                syncChanges(true, gameArea, syncActualMap, syncRandomImage);
            }
        } else {
            const randomNumber = Math.floor(Math.random() * possibleImages.length);
            const possibleImage = possibleImages[randomNumber][1 + Math.floor(Math.random() * (possibleImages[randomNumber].length - 1))];
            actualMap = possibleImages[randomNumber][0];
            [imagePath, solution] = possibleImage;
        }
        image_history.push(imagePath);
    }

    const randomImage = document.createElement('img');
    if (currentFilterModeIndex >= 0) {
        randomImage.classList.remove(...filterModes);
        randomImage.classList.add(filterModes[currentFilterModeIndex]);
    }
    randomImage.onclick = () => {
        currentFilterModeIndex += 1;
        if (currentFilterModeIndex >= filterModes.length) {
            currentFilterModeIndex = -1;
        }
        randomImage.classList.remove(...filterModes);
        randomImage.classList.add(filterModes[currentFilterModeIndex]);
    };
    randomImage.style.width = "100%";
    randomImage.src = imagePath;
    imagesWrapper.appendChild(randomImage);
    resize();

    const mapImage = document.createElement('img');
    mapImage.style.width = "100%";
    const mapImageContainer = document.createElement('div');
    mapImageContainer.id = 'mapImageContainer';
    mapImageContainer.style.position = "relative";
    mapImageContainer.appendChild(mapImage);

    let selectedMap = null;

    // Create the map selector
    let selection = JSON.parse(JSON.stringify(gameArea));

    const backButton = document.createElement('button');

    submitButton = document.createElement('button');
    submitButton.id = 'submitButton';

    let marker = document.createElement('div');
    marker.id = 'marker';

    const line = document.createElement('div');
    line.id = 'connectionLine';

    const solutionMarker = document.createElement('div');
    solutionMarker.id = 'solutionMarker';

    const mapSelector = document.createElement('div');
    mapSelector.id = 'mapSelector';
    gameContainer.appendChild(mapSelector);

    const selectedPathElement = document.createElement('p');
    selectedPathElement.id = 'selectedPath';
    selectedPathElement.innerText = gLS("imageChoiceText");
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

        if (!Array.isArray(gameArea) && !(devMode > -1)) {
            // Create a back button
            backButton.innerText = gLS("backButtonText");
            backButton.onclick = () => {
                // Go back to the map selection screen
                gameState = 1;
                mapSelector.style.display = 'block';
                mapImage.style.display = 'none';
                if (imagesWrapper.children.length === 2) {
                    imagesWrapper.style.gridTemplateColumns = '1fr';
                }
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
            backButton.innerText = gLS("backButtonText");
            backButton.onclick = () => {
                parentKeys.pop();
                selection = getParentObject(gameArea, selection);
                const selectedPath = parentKeys.join(' > ');
                selectedPathElement.innerText = selectedPath;
                if (parentKeys.length === 0) {
                    selectedPathElement.innerText = gLS("allGamesText");
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
        let isDragging = false;
        let startX, startY;
        let currentTranslateX = 0;
        let currentTranslateY = 0;
        let currentScale = 1;
        let dragOccurred = false;
        let initialClientX, initialClientY;
        selectedMap = map
        mapImage.src = map;
        imagesWrapper.style.gridTemplateColumns = '1fr 1fr';
        imagesWrapper.appendChild(mapImageContainer);
        resize();

        function startDrag(e) {
            e.preventDefault();
            isDragging = true;
            dragOccurred = false;
            mapImage.style.cursor = 'grabbing';

            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            startX = clientX;
            startY = clientY;
            initialClientX = clientX;
            initialClientY = clientY;

            // Parse current transform values
            const transform = mapImage.style.transform;
            const translateMatch = transform.match(/translate\(([^)]+)\)/);
            if (translateMatch) {
                const parts = translateMatch[1].split(',').map(p => parseFloat(p));
                currentTranslateX = parts[0] || 0;
                currentTranslateY = parts[1] || 0;
            } else {
                currentTranslateX = 0;
                currentTranslateY = 0;
            }

            const scaleMatch = transform.match(/scale\(([^)]+)\)/);
            currentScale = scaleMatch ? parseFloat(scaleMatch[1]) : 1;

            document.addEventListener('mousemove', handleDrag);
            document.addEventListener('mouseup', endDrag);
        }

        function handleDrag(e) { // TODO: Make it impossible to drag the image out of the gameContainer (with a buffer)
            if (!isDragging) return;
            e.preventDefault();
            dragOccurred = true;

            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            const deltaX = (clientX - startX) / currentScale;
            const deltaY = (clientY - startY) / currentScale;

            currentTranslateX += deltaX;
            currentTranslateY += deltaY;

            mapImage.style.transform =
                `translate(${currentTranslateX}px, ${currentTranslateY}px) ` +
                `scale(${currentScale})`;

            startX = clientX;
            startY = clientY;

            updateMarker(e, true);
        }

        function endDrag(e) {
            isDragging = false;
            mapImage.style.cursor = 'grab';

            dragOccurred = true;

            const distance = Math.hypot(e.clientX - initialClientX, e.clientY - initialClientY);
            if (distance < 5) { // Call setMarker only if no drag occurred.
                setMarker(e);
            }

            document.removeEventListener('mousemove', handleDrag);
            document.removeEventListener('mouseup', endDrag);
        }

        mapImage.oncontextmenu = (e) => {
            e.preventDefault();
        }
        mapImage.onmousedown = (e) => {
            if (e.button === 2) {
                currentScale = 1;
                currentTranslateX = 0;
                currentTranslateY = 0;
                mapImage.style.transform =
                    `translate(${currentTranslateX}px, ${currentTranslateY}px) ` +
                    `scale(${currentScale})`;
                setTimeout(updateMarker, 200)
            } else {
                startDrag(e);
            }
        }


        // Create a marker on the map
        marker.style.position = 'absolute';
        marker.style.width = '10px';
        marker.style.height = '10px';
        marker.style.backgroundColor = 'red';
        marker.style.border = '2px solid black';
        marker.style.borderRadius = '50%';
        marker.style.display = 'none'; // Initially hidden
        mapImageContainer.appendChild(marker);

        marker.onclick = (event) => {
            setMarker(event);
        };

        function zoomImage(event) {
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
            const currentTransform = mapImage.style.transform;
            const transformParts = currentTransform ? currentTransform.split(' ') : [];
            const scaleIndex = transformParts.findIndex(part => part.startsWith('scale'));
            if (scaleIndex === -1) {
                transformParts.push(`scale(${newScale})`);
            } else {
                transformParts[scaleIndex] = `scale(${newScale})`;
            }
            mapImage.style.transform = transformParts.join(' ');

            updateMarker(event, true);
        }

        mapImage.onwheel = (event) => {
            event.preventDefault();
            zoomImage(event)
        };

        marker.onwheel = (event) => {
            event.preventDefault();
            zoomImage(event)
        };

        solutionMarker.onwheel = (event) => {
            event.preventDefault();
            zoomImage(event)
        };

        gameContainer.onscroll = (event) => {
            updateMarker(event);
        };

        // Create submit button
        submitButton.innerText = gLS("submitButtonText");
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

                score = 0;
                totalPossibleScore += maxPoints;

                if (selectedMap === actualMap) {
                    const userX = parseFloat(marker.dataset.x);
                    const userY = parseFloat(marker.dataset.y);
                    const [solutionX, solutionY] = solution;
                    const distance = Math.sqrt(Math.pow(userX - solutionX, 2) + Math.pow(userY - solutionY, 2));
                    score = distance <= 0.01 ? maxPoints : Math.max(0, maxPoints - ((distance - 0.01) / (0.5 - 0.01)) * maxPoints);

                    if (Array.isArray(solution) && solution.length > 0) {
                        totalScore += score;

                        document.title = `${gLS("titleScore")} ${totalScore.toFixed(0)}`;
                        showCustomAlert(`${gLS("pointsScored")} ${score.toFixed(0)}`, 1);
                        solutionMarker.style.position = 'absolute';
                        solutionMarker.style.width = '10px';
                        solutionMarker.style.height = '10px';
                        solutionMarker.style.backgroundColor = 'green';
                        solutionMarker.style.borderRadius = '50%';
                        solutionMarker.style.border = '2px solid black';
                        solutionMarker.dataset.x = solutionX;
                        solutionMarker.dataset.y = solutionY;
                        solutionMarker.style.display = 'block';
                        mapImageContainer.appendChild(solutionMarker);
                        updateMarker(solutionMarker);

                        // Create the connection Line

                        marker.parentNode.insertBefore(line, marker);

                        updateConnectionLine();
                    } else {
                        showCustomAlert(gLS("correctNoSolution"), 1);
                    }
                } else {
                    const pathToMap = findPathToItem(gameModes, actualMap);
                    showCustomAlert(gLS("wrongMap") + pathToMap);
                }

                submitButton.remove();
            } else {
                showCustomAlert(gLS("markerNotSet"));
            }
            if (isOnline) {
                db.collection('lobbies').doc(lobbyName).get().then(doc => {
                    const players = doc.data().players;
                    const myPlayer = players.find(player => player.name === userName);
                    myPlayer.score = score;
                    myPlayer.totalScore = totalScore;
                    myPlayer.totalPossibleScore = totalPossibleScore;
                    db.collection('lobbies').doc(lobbyName).update({
                        gameStarted: false,
                        players: players,
                    });
                });
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
        continueButton = document.createElement('button');
        continueButton.id = 'continueButton';
        continueButton.innerText = gLS("continueButtonText");
        continueButton.onclick = (event) => {
            if (isOnline) {
                db.collection('lobbies').doc(lobbyName).update({ gameStarted: true });
            }
            if (devMode > -1 && event.shiftKey) {
                devSkip = true;
            }
            startGame(gameArea); // Restart game with current area
        };
        if (devMode > -1) {
            gameContainer.appendChild(continueButton);
            backButton.remove();
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

        function updateConnectionLine() {
            const markerRect = marker.getBoundingClientRect();
            const solutionRect = solutionMarker.getBoundingClientRect();
            const mICRect = mapImageContainer.getBoundingClientRect();

            // Calculate centers. Keep in mind that the markers' left and top are page values, while line.style.left sets the distance to the left of the mapImageContainer
            const userCenterX = markerRect.left + markerRect.width / 2 - mICRect.left;
            const userCenterY = markerRect.top + markerRect.height / 2 - mICRect.top;
            const solutionCenterX = solutionRect.left + solutionRect.width / 2 - mICRect.left;
            const solutionCenterY = solutionRect.top + solutionRect.height / 2 - mICRect.top;

            // Calculate line parameters
            const deltaX = solutionCenterX - userCenterX;
            const deltaY = solutionCenterY - userCenterY;
            const length = Math.sqrt(deltaX ** 2 + deltaY ** 2);
            const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;

            // Update line styles
            line.classList.add('connection-line');
            line.style.position = 'absolute';
            line.style.left = `${userCenterX}px`;
            line.style.top = `${userCenterY}px`;
            line.style.width = `${length}px`;
            line.style.transform = `rotate(${angle}deg)`;
            line.style.display = 'block';
        }

        function updateMarker(event, delay = false) {
            const updatePosition = (marker) => {
                if (!marker.dataset.x || !marker.dataset.y) return;

                const x = parseFloat(marker.dataset.x);
                const y = parseFloat(marker.dataset.y);

                const translateMatch = mapImage.style.transform.match(/translate\(([^)]+)\)/);
                const translateX = translateMatch ? parseFloat(translateMatch[1].split(',')[0]) : 0;
                const translateY = translateMatch ? parseFloat(translateMatch[1].split(',')[1]) : 0;

                const scaleMatch = mapImage.style.transform.match(/scale\(([^)]+)\)/);
                const scale = scaleMatch ? parseFloat(scaleMatch[1]) : 1;

                const rect = mapImage.getBoundingClientRect();
                const containerRect = mapImageContainer.getBoundingClientRect();
                const markerLeft = (x * rect.width) - 5 + (rect.left - containerRect.left);
                const markerTop = (y * rect.height) - 5 + (rect.top - containerRect.top);

                // Update marker position
                marker.style.left = `${markerLeft}px`;
                marker.style.top = `${markerTop}px`;
            };

            const updateAll = () => {
                updatePosition(marker);
                updatePosition(solutionMarker);
                updateConnectionLine(); // Add this line to update connection
            };

            if (delay) {
                setTimeout(updateAll, 200);
            } else {
                updateAll();
            }
        }
    }
}

function isElementVisible(element) {
    if (!element) return false; // Element doesn't exist

    const style = window.getComputedStyle(element);

    // Check for display: none, visibility: hidden/collapsed, and opacity: 0
    if (style.display === 'none') return false;
    if (style.visibility === 'hidden' || style.visibility === 'collapse') return false;
    if (parseFloat(style.opacity) <= 0) return false;

    // Check if element has zero area
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;

    return true;
}

// keybinds
document.addEventListener('keydown', event => {
    if (document.activeElement.tagName !== 'INPUT' && document.getElementById('keybinds') === null && event.key !== 'Shift') {
        const currentTime = Date.now();
        // Check for double press (within 300ms)
        if (lastPressTime !== null && currentTime - lastPressTime < 300) {
            clearTimeout(timeoutId);
            lastPressTime = null;
            timeoutId = null;

            // double press action
            console.log("Double press: ", event.key);
            keybinds.forEach(keybind => {
                const [key, elements, isDoublePress] = keybind;
                if (event.key === key && isDoublePress) {
                    elements.forEach(element => {
                        const elementID = element;
                        element = document.getElementById(element);
                        if (isElementVisible(element)) {
                            // check for special case of joinLobbyButton
                            if (element.id === 'joinLobbyButton') {
                                autoFill(element);
                            } else {
                                element.click();
                            }
                        }
                        if (elementID === 'createNewLobbyCode') {
                            createNewLobby();
                        }
                    });
                }
            });
        } else {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                // single press action
                console.log("Single press: ", event.key);

                keybinds.forEach(keybind => {
                    const [key, elements, isDoublePress] = keybind;
                    if (event.key === key && !isDoublePress) {
                        elements.forEach(element => {
                            const elementID = element;
                            element = document.getElementById(element);
                            if (isElementVisible(element)) {
                                // check for special case of joinLobbyButton
                                if (element.id === 'joinLobbyButton') {
                                    autoFill(element);
                                } else {
                                    element.click();
                                }
                            }
                            if (elementID === 'createNewLobbyCode') {
                                createNewLobby();
                            }
                        });
                    }
                });
                lastPressTime = null;
                timeoutId = null;
            }, 300);
            lastPressTime = currentTime;
        }
    }
});

function createNewLobby() {
    // Show loading animation
    loadingDiv.style.display = 'flex';
    db.collection('lobbies').get().then(querySnapshot => {
        const lobbies = querySnapshot.docs.map(doc => doc.id);
        let newLobbyName;
        do {
            newLobbyName = 'lobby' + Math.floor(Math.random() * 1000);
        } while (lobbies.includes(newLobbyName));
        lobbyInput.value = newLobbyName;
        document.body.removeChild(loadingAnimation);
    }).catch(() => {
        loadingDiv.style.display = 'none';
    });
}

function autoFill(element = null) {
    loadingDiv.style.display = 'flex';
    db.collection('lobbies').get().then(querySnapshot => {
        if (lobbyInput.value === '') {
            const lobbies = querySnapshot.docs;
            const lobbyCount = lobbies.length;
            const randomLobbyName = lobbyCount > 0 ? lobbies[Math.floor(Math.random() * lobbyCount)].id : '1';
            lobbyInput.value = randomLobbyName;
        }
        if (nameInput.value === '') {
            nameInput.value = possibleNames[Math.floor(Math.random() * possibleNames.length)] + possibleNames[Math.floor(Math.random() * possibleNames.length)];
        }
        if (element) {
            element.click();
        }
        document.body.removeChild(loadingAnimation);
    }).catch(() => {
        loadingDiv.style.display = 'none';
    });
}

function resize() {
    const allImages = document.querySelectorAll('img');

    const width = window.innerWidth;
    const height = window.innerHeight;
    const isPortrait = (width < height) || (allImages.length === 1);
    imagesWrapper.style.gridTemplateColumns = isPortrait ? '1fr' : 'repeat(2, 1fr)';
}

window.addEventListener('resize', resize);

window.addEventListener('beforeunload', event => {
    leaveLobby();
});