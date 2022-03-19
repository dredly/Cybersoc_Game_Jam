class TerrainTile {
    constructor (name, coordinates, movementMultiplier) {
        this.name = name;
        this.coordinates = coordinates;
        this.movementMultiplier = movementMultiplier;
    }

    toString () {
        return `${this.name} tile at coordinates ${this.coordinates}`;
    }

    makeTile () {
        const tile = document.createElement('div');
        tile.classList.add('tile');
        tile.classList.add(this.name);
        return tile;
    }
}

class TerrainNode extends TerrainTile {
    constructor(name, coordinates, movementMultiplier, dist, parent) {
        super(name, coordinates, movementMultiplier);
        this.dist = dist;
        this.parent = parent;
    }   
}

function makeTileArray (dimension) {
    const tileArray = [];
    for (let i = 0; i < dimension; i++) {
        for (let j = 0; j < dimension; j++) {
            const randomIndex = Math.floor(Math.random() * terrains.length);
            const {name, movementMultiplier} = terrains[randomIndex];
            const tile = new TerrainTile(name, [j, i], movementMultiplier);
            tileArray.push(tile);
        }
    }
    return tileArray;
}

function createNodes (tileArray) {
    const nodes = [];
    for (let tile of tileArray) {
        nodes.push(new TerrainNode(tile.name, tile.coordinates, tile.movementMultiplier, 10000, null));
    }
    return nodes;
}

function populateBoard (tileArray) {
    board.innerHTML = '';
    const dimension = Math.sqrt(tileArray.length);
    board.style.gridTemplateColumns = "1fr ".repeat(dimension);
    for (let tile of tileArray) {
        const tileElement = tile.makeTile();
        tileElement.style.width = `${800 / dimension}px`;
        board.appendChild(tileElement);
    }
}

function getNeighbourCoords(dimension, currentCoords) {
    const [j, i] = currentCoords;
    // First finds coordinates of potential neighbours in all directions (diagonals not considered)
    const possibleNeighbourCoords = [[j - 1, i], [j, i + 1], [j + 1, i], [j, i - 1]];
    // Then filters out coordinates that are out of bounds of the environment
    return possibleNeighbourCoords.filter(nc => {
        return nc[0] < dimension && nc[0] >= 0 && nc[1] < dimension && nc[1] >= 0;
    })
}

function changeToWater (coordinates, tileArray) {
    const [j, i] = coordinates;
    const dimension = Math.sqrt(tileArray.length);
    const elementIndex = (j * dimension + i);
    tileArray[elementIndex] = new TerrainTile('water', [i, j], 0);
}

function addBodiesOfWater (numberOfBodies) {
    for (let i = 0; i < numberOfBodies; i++) {
        //Pick a place to start the body of water
        const originCoords = [Math.floor(Math.random() * DIMENSION), Math.floor(Math.random() * DIMENSION)];
        console.log(originCoords);
        const bodySize = Math.floor(Math.random() * DIMENSION * 2);
        console.log(bodySize);
        changeToWater(originCoords, tileArray);
        numAdded = 0;
        let currentCoords = originCoords;
        while (numAdded < bodySize) {
            const neighbours = getNeighbourCoords(DIMENSION, currentCoords);
            const randomIndex = Math.floor(Math.random() * neighbours.length);
            currentCoords = neighbours[randomIndex];
            changeToWater(currentCoords, tileArray);
            numAdded ++;
        }
        console.log(getNeighbourCoords(DIMENSION, originCoords));
    }
    populateBoard(tileArray);
}

function choosePoint (possibleIndices) {
    return possibleIndices[Math.floor(Math.random() * possibleIndices.length)];
}

function makeStartAndEnd () {
    let possibleIndices = tileArray.map((t, i) => i).filter(t => tileArray[t].name !== 'water');
    const start = choosePoint(possibleIndices);
    possibleIndices = possibleIndices.filter(t => t !== start);
    const end = choosePoint(possibleIndices);
    board.children[start].innerText = 'Start';
    board.children[end].innerText = 'End';
    return [start, end];
}

function retrace (nodeList, endNode) {
    const retraced = [endNode];
    while (endNode.parent) {
        endNode = endNode.parent;
        retraced.push(endNode);
    }
    return retraced;
}

function dijkstra (nodeList, start, end) {
    const dimension = Math.sqrt(nodeList.length);
    nodeList[start].dist = 0;
    const unexplored = new Set(nodeList);
    while (unexplored.size > 0) {
        // Sets current node to the one with smallest dist value
        let listByDist = [...unexplored].sort((a, b) => a.dist - b.dist);
        let current = listByDist[0];
        console.log(current.coordinates);
        unexplored.delete(current);
        if (nodeList.indexOf(current) === end) {
            console.log("Got to the end");
            console.log(current);
            return retrace(nodeList, nodeList[end]);
        }
        const neighbourCoords = getNeighbourCoords(dimension, current.coordinates);
        for (let nc of neighbourCoords) {
            const neighbourNode = nodeList.find(n => n.coordinates[0] === nc[0] && n.coordinates[1] === nc[1]);
            // Skips nodes that are either obstacles or were already explored
            if (neighbourNode.name === 'water' || !unexplored.has(neighbourNode)) {
                continue;
            }
            newDist = 1 / neighbourNode.movementMultiplier;
            if (newDist < neighbourNode.dist) {
                neighbourNode.dist = newDist;
                neighbourNode.parent = current;
            }
        }
    }
    console.log('Hit a dead end or something');
    return;
}

function pathfind (start, end) {
    const grid = createNodes(tileArray);
    const path = dijkstra(grid, start, end);
    for (let node of path) {
        const ind = grid.indexOf(node);
        board.children[ind].classList.add('path');
    }
}

const DIMENSION = 9;
const board = document.querySelector('#game-board');
const showPathButton = document.querySelector('#show-path');
const regenerateButotn = document.querySelector('#regenerate');

const tileArray = makeTileArray(DIMENSION);
populateBoard(tileArray);
addBodiesOfWater(Math.floor(DIMENSION / 2));

const [start, end] = makeStartAndEnd();

showPathButton.addEventListener('click', () => pathfind(start, end));
regenerateButotn.addEventListener('click', () => window.location.reload());

