# MapGuessr
GeoGuessr but for games. Specifically those not on lostgamer.io

Important: This is an early-access version of the game. No move, pan is forced.

## Usage

### Joining a lobby

When joining a lobby, the capitalization of the lobby code is important to get right. Your name may be anything, but will be appended "(number)" like "James" and "James(1)". After pressing the **Join Lobby** button, you will enter an [online lobby](#multiplayer).

Single Player
-
This is the [offline mode](#single-player-or-host), recommended for single players to not unnecessarily use our servers. This mode is best supported and most stable.

Multiplayer
-
When playing with friends, one player may [host](#the-host) a lobby and share the lobby code with the other players. The host will behave like in [single player mode](#single-player-or-host), while the other players behave [differently](#other-players).

Single Player or Host
-
As a single player or host, you get to choose one or multiple maps before the game starts.
### Some functionality:
#### Checkboxes
When using the **checkboxes**, your selection will **stay saved** until you reload the page or deselect again.\
When no checkbox is selected, the **Select** button will choose **the entire directory you are currently in** as the directory to pull locations from.\
When **any checkbox is checked**, independent of your currently opened directory, the **Select** button will pull from all of your checked directories. This has a neat side-effect, where you can select a game and then a level inside it to give that level a higher chance of appearing, as it is included in the selected game and counted on its own aswell.\
The **bottom right corner** includes an option for toggling **selection inversion**, indicated by a **flipping symbol**. Enabling this will default to including everything in your **current directory** and **excluding** anything you have checked. Checked categories outside of your current directory will be **ignored**.
#### Buttons
When clicking a **light blue button**, you change directories. Also using the **Back** button allows you to freely roam all directories. Be aware of where you are located in the directories when pressing the **Select** button while in inverted selection mode, to be sure that the game will select your preferences correctly.\
**Dark Blue** buttons will select only that map and its possible locations, **completely overwriting** any checkboxes.

Online Specific Features
-
Every online player will be able to leave at any time using the button on the bottom of the page. This ensures a safe disconnect from the lobby, clearing up server ressources and removing your score from the lobby leaderboard. If you leave as host, the host position may be claimed by another player.
### The Host
**The Host** will be able to act like a [single player](#single-player-or-host) but also has some extra functionality. They are able to give up their host status at any time using the button in the bottom left corner, such that it may be claimed by another player. Only the host is able to de-throne themselves. They are also entitled to **closing the lobby** with the button next to the **Give Up Host** button.

### Other Players
**Non-Host Players** will first wait for the host to select which locations are about to be played. They are unable to change the currently played map or continue the game after the round ends without the hosts approval.\
Once a **host gives up or disconnects**, a **Claim Host** button will appear in the bottom left corner of the page. Pressing this button will award the host role to a random player who also pressed that button during the same second. This is done to prevent multiple players all becoming host of the same lobby, as they would then send many doubled and often conflicting signals to the server, effectively ruining the game experience.

All Players
-
**All Players** are able to **click** the random image to change the difficulty. This difficulty will not sync across the lobby, as to enable the possibility of a more fair game when playing against a more experienced player.\
On devices with a mouse pointer, you may use the wheel to zoom into the map once it has been selected. Limits are 1x and 5x zoom respectively.\
**Clicking on the map** will place a marker. You may adjust this marker until you press **Submit**. Your guess will be scored from 0-5000 depending on your distance from the actual location on the map. There **is** a tolerance for 5k guesses and 0 points will be awarded if either the marker is placed further than half the image width/height average away from the actual location or you guessed the wrong map entirely. **Keep in mind, that when guessing a map, there may be locations that appear on multiple. In these cases, the correct map is the one where the target location is available in the highest detail.** For example, on the maps of Subnautica, guessing the location of an image to be on an island on the world/biome map, while not technically wrong, will not award points because there exist more detailed maps of each island.\
**Dragging** the map will move it.\
**Right Clicking** will reset the zoom and position of the map.


## Keybinds
**Space**: confirm your action (presses alert, continue, and submit buttons)
**Escape**: leave the lobby
**Double Escape**: close the lobby
**n**: join a public server when no one was entered in the field and give you a name when no one was entered
**g**: give up the host position
**c**: claim the host position