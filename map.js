////////////////////////////////////////////////////////////////////////////////
// HEXMAP LIB
////////////////////////////////////////////////////////////////////////////////

// Massive kudos to Amit Patel
// This code is adapted from his awesome work
// See: http://www.redblobgames.com/grids/hexagons/


const

////////////////////////////////////////////////////////////////////////////////
// CUBIC COORD HEX

// HEX FACTORY

Hex = (x = 0, y = 0, z) => z ? {x, y, z} : {x, y, z: (-x - y)},

// ADD & SUBSTRACT & EQUALS & IS-IN/INDEX-OF

hexAdd = (h1, h2) => ({x: h1.x + h2.x, y: h1.y + h2.y, z: h1.z + h2.z}),
hexSub = (h1, h2) => ({x: h1.x - h2.x, y: h1.y - h2.y, z: h1.z - h2.z}),
hexMultiply = (h, k) => ({x: h.x * k, y: h.y * k, z: h.z * k}),
hexEqual = (h1, h2) => h1.x === h2.x && h1.y === h2.y ? true : false,
hexIndexOf = (hs, h) => {
	let isIn = false;
	for (let i = 0; i < hs.length; i++) {
		if (hexEqual(hs[i], h)) isIn = true;
	}
	return isIn;
},

// LENGTH & DISTANCE

hexLength = (h) => (Math.abs(h.x) + Math.abs(h.y) + Math.abs(h.z)) / 2,
hexDistance = (h1, h2) => hexLength( hexSub(h1, h2) ),

// NEIGHBORS

hexDirections = [	Hex(+1,-1,0),Hex(+1,0,-1),Hex(0,+1,-1),
								  Hex(-1,+1,0),Hex(-1,0,+1),Hex(0,-1,+1) ],
hexDirection = (d) => hexDirections[d],

hexNeighbor = (h, d) => hexAdd(h, hexDirection(d)),
hexNeighbors = (h) => {
	const neighbors = [];
	for (let d = 0; d < 6; d++) {
		neighbors.push( hexNeighbor(h, d) );
	}

	return neighbors;
},

// DIAGONALS

hexDiagonals = [ Hex(2,-1,-1),Hex(1,-2,1),Hex(-1,-1,2),
	               Hex(-2,1,1),Hex(-1,2,-1),Hex(1,1,-2) ],

hexNeighborDiagonal = (h, d) => hexAdd(h, hexDiagonals[d]),
hexNeighborsDiagonal = (h) => {
	const neighbors = [];
	for (let d = 0; d < 6; d++) {
		neighbors.push( hexNeighborDiagonal(h, d) );
	}

	return neighbors;
},

// ROUNDING

hexRound = (h) => {
	let x = Math.trunc(Math.round(h.x)),
			y = Math.trunc(Math.round(h.y)),
			z = Math.trunc(Math.round(h.z));

	const xD = Math.abs(x - h.x),
				yD = Math.abs(y - h.y),
				zD = Math.abs(z - h.z);

	if (xD > yD && xD > zD) { x = -y - z; }
	else if (yD > zD) { y = -x - z; }
	else { z = -x - y; }

	return Hex(x, y, z);
},

// LERP & LINEDRAWING

// Linear extrapolation
hexLerp = (h1, h2, t) => Hex(
	h1.x + (h2.x - h1.x) * t,
	h1.y + (h2.y - h1.y) * t,
	h1.z + (h2.z - h1.z) * t
),

hexLinedraw = (h1, h2) => {
	const N = hexDistance(h1, h2),
				line = [],
				step = 1.0 / Math.max(N, 1);

	for (let i = 0; i <= N; i++) {
		line.push(hexRound(hexLerp(h1, h2, step * i)));
	}

	return line;
},


////////////////////////////////////////////////////////////////////////////////
// OFFSET COORD HEX

HexOffset = (col, row) => ({col, row}),

// CONVERSION

FLAT = true, POINTY = false, // Topped
EVEN = 1, ODD = -1, // Parity

hex2Offset = (h, topped = FLAT, parity = ODD) => topped ?
	HexOffset(
		h.x,
		h.y + Math.trunc((h.x + parity * (h.x & 1)) / 2)
	) :
	HexOffset(
	h.x + Math.trunc((h.y + parity * (h.y & 1)) / 2),
	h.y
),

offset2Hex = (h, topped = FLAT, parity = ODD) => {
	let x, y;
	if (topped) {
		x = h.col,
		y = h.row - Math.trunc((h.col + parity * (h.col & 1)) / 2);
	} else {
		x = h.col - Math.trunc((h.row + parity * (h.row & 1)) / 2),
		y = h.row;
	}
	return Hex(x, y, -x - y)	;
},


////////////////////////////////////////////////////////////////////////////////
// LAYOUT

Orientation = (f0, f1, f2, f3, b0, b1, b2, b3, startAngle) => (
	{f0, f1, f2, f3, b0, b1, b2, b3, startAngle}
),

Point = (x, y) => ({x,y}),

Layout = (orientation, size, origin) => ({orientation, size, origin}),

orientationPointy = Orientation(
	Math.sqrt(3), Math.sqrt(3)/2, 0, 3/2,
	Math.sqrt(3)/3, -1/3, 0, 2/3,
	0.5
),
orientationFlat = Orientation(
	3/2, 0, Math.sqrt(3)/2, Math.sqrt(3),
	2/3, 0, -1/3, Math.sqrt(3)/3,
	0
),

hex2Pixel = (layout, h) => {
	const M = layout.orientation,
				size = layout.size,
				origin = layout.origin,
				x = (M.f0 * h.x + M.f1 * h.y) * size.x,
				y = (M.f2 * h.x + M.f3 * h.y) * size.y;

	return Point(x + origin.x, y + origin.y);
},

pixel2Hex = (layout, p) => {
	const M = layout.orientation,
				size = layout.size,
				origin = layout.origin,
				pt = Point((p.x - origin.x) / size.x, (p.y - origin.y) / size.y),
				x = M.b0 * pt.x + M.b1 * pt.y,
				y = M.b2 * pt.x + M.b3 * pt.y;

	return Hex(x, y, -x - y);
},

hexCornerOffset = (layout, corner, k = 1) => {
	const M = layout.orientation,
				size = layout.size,
				angle = 2 * Math.PI * (corner + M.startAngle) / 6;

	return Point(size.x * Math.cos(angle) * k, size.y * Math.sin(angle) * k);
},

hexCorners = (layout, h, k = 1) => {
	const corners = [],
				center = hex2Pixel(layout, h);

	for (var i = 0; i < 6; i++) {
		var offset = hexCornerOffset(layout, i, k);
		corners.push(Point(center.x + offset.x, center.y + offset.y));
	}

	return corners;
};


////////////////////////////////////////////////////////////////////////////////
// Hexmap lib API demo

// console.warn("HEXMAP LIB");

// console.log("Coord");
// let o1 = HexOffset(3,4);
// let h1 = offset2Hex(o1, FLAT, ODD);
// console.log(o1, h1);
// let o2 = HexOffset(12, 7);
// let h2 = offset2Hex(o2, FLAT, ODD);
// console.log(o2, h2);
// console.log("Addition, substraction and multiplication");
// let h3 = hexAdd(h1, h2); console.log(h3);
// let h4 = hexSub(h1, h2); console.log(h4);
// let h5 = hexMultiply(h1, 2); console.log(h5);
// console.log("Length");
// let l = hexLength(h1); console.log(l);
// console.log("Distance");
// let d = hexDistance(h1, h2); console.log(d);
// console.log("Neighbors");
// let hn = hexNeighbors(h1); console.log(hn);
// let hnd = hexNeighborsDiagonal(h1); console.log(hnd);


////////////////////////////////////////////////////////////////////////////////
// USE THE LIB
////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////
// TOOLZ

// ARRAY UTILS

// 2D ARRAY FILL

const multiArray = (x, y) => Array(...Array(x)).map(() => Array(y));

// ARRAY SHUFFLE
// From: http://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array

const shuffle = (array) => {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}


// HEX COLOR MANIPULATION
// From: http://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors

function shadeBlend(p,c0,c1) {
    var n=p<0?p*-1:p,u=Math.round,w=parseInt;
    if(c0.length>7){
        var f=c0.split(","),t=(c1?c1:p<0?"rgb(0,0,0)":"rgb(255,255,255)").split(","),R=w(f[0].slice(4)),G=w(f[1]),B=w(f[2]);
        return "rgb("+(u((w(t[0].slice(4))-R)*n)+R)+","+(u((w(t[1])-G)*n)+G)+","+(u((w(t[2])-B)*n)+B)+")"
    }else{
        var f=w(c0.slice(1),16),t=w((c1?c1:p<0?"#000000":"#FFFFFF").slice(1),16),R1=f>>16,G1=f>>8&0x00FF,B1=f&0x0000FF;
        return "#"+(0x1000000+(u(((t>>16)-R1)*n)+R1)*0x10000+(u(((t>>8&0x00FF)-G1)*n)+G1)*0x100+(u(((t&0x0000FF)-B1)*n)+B1)).toString(16).slice(1)
    }
}


// PRIORITY QUEUE
// From: https://jsfiddle.net/GRIFFnDOOR/r7tvg/
// Savagely adapted/mangled!

const PriorityQueue = (arr) => {
	const queue = {

		heap: [],

		logHeap: function() {
			let output = "HEAP - "
			for (let i = 0; i < this.heap.length; i++) {
				output += "[" + this.heap[i][0] +  " / " + this.heap[i][1] + "]";
			}
			console.log(output);
		},

		length: function() {
			return this.heap.length;
		},

		push: function(data, priority) {
			var node = [data, priority];
			this.bubble(this.heap.push(node) - 1);
		},

		// removes and returns the data of lowest priority
		pop: function() {
			return this.heap.pop()[0];
		},

		// removes and returns the data of highest priority
		popHigh: function() {
			return this.heap.shift()[0];
		},

		// bubbles node i up the binary tree based on
		// priority until heap conditions are restored
		bubble: function(i) {
			while (i > 0) {
				// var parentIndex = i >> 1; // <=> floor(i/2)	// legacy code
				var parentIndex = i - 1;

				// if equal, no bubble (maintains insertion order)
				if (!this.isHigherPriority(i, parentIndex)) break;

				this.swap(i, parentIndex);
				i = parentIndex;
			}
		},

		// swaps the addresses of 2 nodes
		swap: function(i,j) {
			var temp = this.heap[i];
			this.heap[i] = this.heap[j];
			this.heap[j] = temp;
		},

		// returns true if node i is higher priority than j
		isHigherPriority: function(i,j) {
			return this.heap[i][1] > this.heap[j][1];
		}

	};

	if (arr) for (i=0; i< arr.length; i++)
		queue.heap.push(arr[i][0], arr[i][1]);

	return queue;
}


// TODO BUG !!!
// THROTTLING
// from: http://sampsonblog.com/749/simple-throttle-function

function throttle (callback, limit) {
    var wait = false;                 // Initially, we're not waiting
    return function () {              // We return a throttled function
        if (!wait) {                  // If we're not waiting
            callback.call();          // Execute users function
            wait = true;              // Prevent future invocations
            setTimeout(function () {  // After a period of time
                wait = false;         // And allow future invocations
            }, limit);
        }
    }
}



////////////////////////////////////////////////////////////////////////////////
// DEMO

// CONFIGURATION

const
			mapSize = {	width: 17, height: 15 }, // Logical map size, in cells
			mapTopped = FLAT, // FLAT or POINTY
			mapParity = (Math.random() < 0.5) ? EVEN : ODD, // EVEN or ODD

			mapRange = 11, // cell height max value
			mapSeaLevel = 2, // level of sea flood
			mapErosion = 50, // 10: boring / 100: mangled up
			mapSmoothing = 25, // in number of iterations
			mapLevelRatio = 0.25, // caps the height from top OR bottom

			cellSizeBase = 28,	// base size of a cell in px
			cellSizeRatio = 5/6,	// perspective cell height diminution ratio
			mapHasPerspective = true,	// if not, render a (visually) flat map
			mapDeepness = cellSizeBase / 4, // expand cells below them (in pixels)
			mapRangeScale = 5, // in pixels per height unit

			playerZoneRatio = 3;	// player corner side size (ex: 2 means half map)


// Computed vars

const	cellSize = {
	width: cellSizeBase,
	height: cellSizeBase * cellSizeRatio
};


// COMPUTE MAP SCREEN SIZE
// TODO: refactor & move this to hexmap lib

let	mapRenderSize = {};
let mapOrigin = {};

const hexAspect = Math.sqrt(3)/2;

if (mapTopped === FLAT) {
	mapRenderSize = {
		width: Math.round( (mapSize.width + 1/3) * 2 * 3/4 * cellSize.width ),
		height: Math.round( (mapSize.height + 1/2) * 2 * cellSize.height * hexAspect + mapDeepness + mapRange * mapRangeScale )
	};
	mapOrigin.x = Math.round( cellSize.width );

	if (mapParity === ODD) {
		mapOrigin.y = Math.round( cellSize.height * Math.sqrt(3)/2 + mapRange * mapRangeScale );

	} else if (mapParity === EVEN) {
		mapOrigin.y = Math.round( cellSize.height * 2 * hexAspect + mapRange * mapRangeScale );
	}

} else if (mapTopped === POINTY) {
	mapRenderSize = {
		width: Math.round( (mapSize.width + 1/2) * 2 * cellSize.width * hexAspect ),
		height: Math.round( (mapSize.height + 1/3) * 2 * 3/4 * cellSize.height + mapDeepness + mapRange * mapRangeScale )
	};

	mapOrigin.y = Math.round( cellSize.height + mapRange * mapRangeScale );

	if (mapParity === ODD) {
		mapOrigin.x = Math.round( cellSize.width * hexAspect );

	} else if (mapParity === EVEN) {
		mapOrigin.x = Math.round( cellSize.width * 2 * hexAspect);
	}
}


// PLAYERS

const Player = (name, color) => ({name, color})

const generatePlayers = (PLAYERS) => {

	for (let p = 0; p < PLAYERS.length; p++) {
		let player = PLAYERS[p];
		let col, row;

		const randomCol = Math.random(),
					randomRow = Math.random(),
					colStart = Math.floor( mapSize.width * randomCol / playerZoneRatio ),
					rowStart = Math.floor( mapSize.height * randomRow / playerZoneRatio ),
					colEnd = Math.floor( mapSize.width * (1 - randomCol / playerZoneRatio) ),
					rowEnd = Math.floor( mapSize.height * (1 - randomRow / playerZoneRatio) );

		if (p === 0) { col = colStart; row =	rowStart; }
		else if (p === 1) {	col = colEnd; row = rowEnd; }
		else if (p === 2) {	col = colStart; row = rowEnd; }
		else if (p === 3) {	col = colEnd; row = rowStart; }

		player.hexOffset = HexOffset(col,row);
		player.hex = offset2Hex(player.hexOffset, mapTopped, mapParity);

		PLAYERS[p] = player;
	}
};

const PLAYERS = [
	Player("foo", "#f80"),
	Player("bar", "#f08"),
	// Player("faz", "#08f"),
	// Player("baz", "#8f0"),
];

generatePlayers(PLAYERS);


// CURSOR
let cursor = PLAYERS[1].hex;

let line = [];
let cursorPath = [];


////////////////////////////////////////////////////////////////////////////////
// MAP

const Map = (size) => {
	const map = multiArray(size.width, size.height);

	map.getFromHex = (hex) => {
		const hexOffset = hex2Offset(hex, mapTopped, mapParity);
		if (map[hexOffset.col]) {
			return map[hexOffset.col][hexOffset.row];
		} else {
			return undefined;
		}
	};

	// MAP POPULATE
	map.populate = () => {
		for (let x = 0; x < size.width; x++) {
			for (let y = 0; y < size.height; y++) {
				map[x][y] = {};
			}
		}
	};

	// MAP HEIGHT
	map.generateHeight = () => {
		const rndLevel = (Math.random() - 0.5) * 2 * mapLevelRatio;	// from -1 to 1

		for (let x = 0; x < size.width; x++) {
			for (let y = 0; y < size.height; y++) {
				map[x][y].height = (Math.random() + rndLevel) * mapRange;
			}
		}
	};

	// MAP SMOOTH
	map.smooth = (iterations) => {
		for (let n = 0; n < iterations; n++) {
			for (let x = 0; x < size.width; x++) {
				for (let y = 0; y < size.height; y++) {

					let xr = x === size.width - 1 ? 0 : x + 1;
					let yd = y === size.height - 1 ? 0 : y + 1;
					const avg = (map[x][y].height * mapErosion +
											 map[xr][y].height + map[x][yd].height +
											 map[xr][yd].height ) / (3 + mapErosion);

					map[x][y].height = avg;
				}
			}
		}
	};

	map.isValidGraphCell = (height) => {
		// Seas or mountains aren't valid
		return (height > mapSeaLevel && height < 8);
	};

	// MAP GRAPH
	map.generateGraph = () => {

		for (let x = 0; x < size.width; x++) {
			for (let y = 0; y < size.height; y++) {

				const hexOffset = HexOffset(x, y),
							hex = offset2Hex(hexOffset, mapTopped, mapParity),
							neighborsRaw = hexNeighbors(hex),
							neighbors = [],
							costs = [],
							height = Math.floor( map[x][y].height );


				// Is the cell a valid node?
				map[x][y].isInGraph = false;
				if (map.isValidGraphCell(height)) {
					map[x][y].isInGraph = true;
				}

				// Each (eventual) neighbor of the cell
				for (let i = 0; i < 6; i++) {
					const n = neighborsRaw[i],
								no = hex2Offset(n, mapTopped, mapParity);

					// Is the neighbor on/in the map?
					if (no.col >= 0	&& no.row >= 0
							&& no.col < size.width 	&& no.row < size.height ) {

						const neighborHeight = map[no.col][no.row].height;

						if ( // Both current and neigbor hexes are valid ones
							map.isValidGraphCell(height) &&
							map.isValidGraphCell(neighborHeight)
						) {
							neighbors.push(n); // add an edge to the graph

							// EDGE COST
							const incline = Math.max( height - neighborHeight, -1	);
							const cost = 2 + incline; // move static cost + inclination cost

							costs.push(cost);	// add the edge cost to the graph
						}
					}
				}

				// Backup things into cell
				map[x][y].hex = hex;
				map[x][y].hexOffset = hexOffset;
				map[x][y].neighbors = neighbors;
			}
		}
	};

	//////////////////////////////////////////////////////////////////////////////
	// PATH FINDING
	// From:
	//	http://www.redblobgames.com/pathfinding/a-star/introduction.html
	//	http://www.redblobgames.com/pathfinding/a-star/implementation.html

	map.getIndexHexes = (cameFrom) => {
		const hexes = [];
		for (let h = 0; h < cameFrom.length; h++) {
			hexes.push( cameFrom[h][0] );
		};
		return hexes;
	};

	map.findFromHex = (data, hex) => {
		for (let h = 0; h < data.length; h++) {
			if ( hexEqual(data[h][0], hex) ) {
				return data[h][1];
			}
		};
		return undefined;
	};

	map.findPath = (start, goal) => {
		const frontier = PriorityQueue();  // List of the places to explore next
		const cameFrom = [];	// List of where we've already been
		const costSoFar = [];	// The price we paid to go there
		let found = false;
		let counter = 0;

		frontier.push(start, 0);
    cameFrom.push([start, undefined]);
		costSoFar.push([start, 0]);

		while (frontier.length() > 0) {

			counter++;

			const current = frontier.pop();
			const currentHex = map.getFromHex(current);
			// const neighbors = currentHex.neighbors;
			const	neighbors = shuffle(currentHex.neighbors);	// randomize

			// Early exit (stop exploring map when goal is reached)
			if (goal) {
				if (hexEqual(current, goal)) {
					found = true;
					break;
				}
			}

			for (let n = 0; n < neighbors.length; n++ ) {
				const next = neighbors[n],
							newCost = map.findFromHex(costSoFar, current) // sum on current
											+ map.getFromHex(next).height, // plus cost of the next move
							cameFromHexes = map.getIndexHexes(cameFrom),
							comeSoFarHexes = map.getIndexHexes(costSoFar);

				if (!hexIndexOf(comeSoFarHexes, next) || newCost < costSoFar[next]) {
					costSoFar.push([next, newCost]);
					frontier.push(next, newCost + hexDistance(next, goal));
					cameFrom.push([next, current]);
				}
			}
		}

		// BUILD PATH BACK FROM GOAL
		if (goal && found) {
			let current = goal;
			let path = [goal];

			while ( ! hexEqual(current, start) ) {
				current = map.findFromHex(cameFrom, current);
				path.push(current);
			}

			return path.reverse();
		} else {
			return undefined;
		}
	};

	//////////////////////////////////////////

	// MAP GENERATE
	map.generate = () => {
		line = undefined;
		while (!line) {
			generatePlayers(PLAYERS);
			map.generateHeight();
			map.smooth(mapSmoothing);
			map.generateGraph();
			// Draw a path between the two first players
			line = map.findPath( PLAYERS[0].hex, PLAYERS[1].hex );
		}
	};


	// MAP BUILDING ("constructor")

	map.populate();
	map.generate();

	return map;
};

const map = Map(mapSize);

// LAYOUT

const layout = Layout(
	mapTopped ? orientationFlat : orientationPointy, // topped
	{x: cellSize.width, y: cellSize.height}, // cell size in px
	mapOrigin // origin
);

// Direction arrows
// const directionArrows = 			[ "↙", "↖", "↑", "↗", "↘", "↓" ] ;
// const directionArrowsPointy = [ "↙", "↖", "←", "↗", "↘", "→" ] ;



////////////////////////////////////////////////////////////////////////////////
// DRAW MAP

// CANVAS DRAW POLYGON

const drawPolygon = (ctx, corners = [], h = 0) => {
	ctx.beginPath();
	ctx.moveTo(corners[0].x, corners[0].y + h);

	for (let c = 1; c < corners.length; c++) {
		ctx.lineTo(corners[c].x, corners[c].y + h);
	}

	ctx.lineTo(corners[0].x, corners[0].y + h);
	ctx.closePath();

	ctx.fill();
	ctx.stroke();
};

const drawHex = (ctx, corners, h = 0) => {
	drawPolygon(
		ctx,
		[ corners[0], corners[1], corners[2], corners[3], corners[4], corners[5] ],
		h
	);
};

const drawMap = (ctx, deltaT) => {

	// COMPUTE UI OVERLAY

	// Simple straight line drawing
	// line = hexLinedraw(PLAYERS[0].hex, cursor);

	cursorPath = undefined;

	if (map.getFromHex(cursor) && map.getFromHex(cursor).isInGraph) {
		cursorPath = map.findPath( PLAYERS[0].hex, cursor );
	}


	// CLEAR
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	for (let y = 0; y < mapSize.height; y++) {let logRow = "";
		for (let xi= 0; xi < mapSize.width; xi++) {

			// *kind of* Z-sorting algo
			let x;
			if (mapSize.width % 2 === 1) {
				x = mapParity === EVEN ? xi * 2 + 1 : x = xi * 2;
				if (x >= mapSize.width) x -= mapSize.width;

			} else {
				if (mapParity === EVEN) {
					x = xi * 2 + 1;
					if (x >= mapSize.width) x -= mapSize.width + 1;
				} else {
					x = xi * 2;
					if (x >= mapSize.width) x -= mapSize.width - 1;
				}
			}

			const val = map[x][y].height;
			const valFlooded = val < mapSeaLevel ? mapSeaLevel : val;
			const valFloor = Math.floor(val);
logRow += valFloor + " ";

			const offset = HexOffset(x, y);
			const hex = offset2Hex( offset, mapTopped, mapParity );
			const point = hex2Pixel(layout, hex);
			const corners = hexCorners(layout, hex);
			const cornersHalf = hexCorners(layout, hex, 0.5);

			// Cell color
			let color;
			if (val > 11) 			color = "#ccffff";	// 11: ice
			else if (val > 10) 	color = "#ffffff";	// 10: snow
			else if (val > 9) 	color = "#aaaaaa";	//  9: high mountain

			else if (val > 8) 	color = "#666666";	//  8: mountain
			else if (val > 7) 	color = "#003300";	//  7: deep forest
			else if (val > 6) 	color = "#006600";	//  6: forest

			else if (val > 5) 	color = "#449900";	//  5: bush
			else if (val > 4) 	color = "#88cc00";	//  4: grass
			else if (val > 3) 	color = "#eeee44";  //  3: beach

			else if (val > 2) 	color = "#0000ff";	//  2: "light" sea
			else if (val > 1) 	color = "#0000cc";	//  1: sea
			else 								color = "#000088";	//  0: deep sea

			// Cell height
			const h = mapHasPerspective ? - Math.floor(valFlooded) * mapRangeScale : 0;


			////////////////////////////////////
			// DRAW

			ctx.lineWidth = 2;
	    ctx.strokeStyle = "rgba(0,0,0,0.25)";

			if (mapHasPerspective) {

				// Draw hexagon sides

				ctx.fillStyle = shadeBlend(-0.25, color);
				drawPolygon(ctx, [
					{x: corners[0].x, y: corners[0].y + h},
					{x: corners[0].x, y: corners[0].y + mapDeepness},
					{x: corners[1].x, y: corners[1].y + mapDeepness},
					{x: corners[1].x, y: corners[1].y + h}
				], 0);

				ctx.fillStyle = mapTopped !== "pointy" ?
					shadeBlend(0.0, color) :
					shadeBlend(0.25, color);
				drawPolygon(ctx, [
					{x: corners[1].x, y: corners[1].y + h},
					{x: corners[1].x, y: corners[1].y + mapDeepness},
					{x: corners[2].x, y: corners[2].y + mapDeepness},
					{x: corners[2].x, y: corners[2].y + h}
				], 0);

				if (mapTopped !== "pointy") {
					ctx.fillStyle = shadeBlend(0.25, color);
					drawPolygon(ctx, [
						{x: corners[2].x, y: corners[2].y + h},
						{x: corners[2].x, y: corners[2].y + mapDeepness},
						{x: corners[3].x, y: corners[3].y + mapDeepness},
						{x: corners[3].x, y: corners[3].y + h}
					], 0);
				}

			}


			// ON-MAP UI

			// Draw hexagon cell background
			ctx.fillStyle = color;
			drawHex(ctx, corners, h);

			// Drawline
			for (let i = 0; i < line.length; i++) {
				if (hexEqual(hex, line[i]))  {

					ctx.fillStyle = "rgba(255,0,255,1.0)";
					drawHex(ctx, cornersHalf, h);
				}
			}

			// Draw cursor path
			if (cursorPath) {
				for (let i = 0; i < cursorPath.length; i++) {
					if (hexEqual(hex, cursorPath[i]))  {
						ctx.fillStyle = "rgba(0,127,255,1.0)";
						drawHex(ctx, cornersHalf, h);
					}
				}
			}

			// Players
			for (let p = 0; p < PLAYERS.length; p++) {
				let playerHex = PLAYERS[p].hex;
				if (hexEqual(hex, playerHex)) {
					ctx.fillStyle = PLAYERS[p].color;
					drawHex(ctx, corners, h);
				}
			}

			// Cursor
			if (hexEqual(hex, cursor)) {
				ctx.fillStyle = "rgba(255,0,0,1)";
				if (cursorPath) ctx.fillStyle = "rgba(255,127,0,1)";
				drawHex(ctx, corners, h);
			};


//			// Text

// 			ctx.font = "10px Arial";
// 	    ctx.lineWidth = 0;
//   	  ctx.fillStyle = "rgba(255,255,255,1)";

// 			// Write in black on light terrain colors
// 			if (valFloor === 11 || valFloor === 10 || valFloor === 9 || valFloor === 3 ) {
// 				ctx.fillStyle = "rgba(0,0,0,1)";
// 			}

// 			ctx.fillText(valFloor, point.x - 3, point.y + 3 + h);

		}
	}

}


// LIVE


const plotCursor = (e, canvasOffset) => {
	cursor = hexRound( pixel2Hex( layout, Point(
		e.x - canvasOffset.x,
		e.y - canvasOffset.y + mapDeepness + mapRangeScale * mapSeaLevel	// TODO - better mapping
	)));
}


window.onload = () => {

	const	canvas = document.getElementById('canvas'),
				generateBtn = document.getElementById('generate'),
				ctx = canvas.getContext('2d');

	// Set canvas size
	canvas.width  = mapRenderSize.width;
	canvas.height = mapRenderSize.height;

	// Get canvas offset (from top-left viewport corner)
	const canvasOffset = {
		x: canvas.offsetLeft,
		y: canvas.offsetTop
	}

	// USER INPUT EVENTS

	canvas.addEventListener('mousemove', (e) => {
		throttle(plotCursor(e, canvasOffset) , 500); render();	// TODO BUG - throttles nothing!!!
	});

	generateBtn.addEventListener('click', () => {
		map.generate();
		render();
	});



	// ANIMATION LOOP

	// let startTime = undefined,
	// 		time,
	// 		deltaT;

	const render = () => {
		// time = Date.now();
		// if (startTime === undefined) startTime = time;
		// deltaT = time - startTime;

		drawMap(ctx);
	}

	// LAUCH LOOP

	// (function animloop(){
	// 	render();
	// 	window.requestAnimationFrame(animloop);
	// })();

	// Initial rendering
	render();

};
