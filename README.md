const Hex = (x = 0, y = 0, z) => z ? {x, y, z} : {x, y, z: (-x – y)};

algorithme de création des hexagones. Il prends trois valeurs (x,y,z) qui représente trois points cardinaux de l’hexagone. l’algorithme converti deux valeurs (x et y ) pour positionner le troisième (z).

const hexAdd = (h1, h2) => ({x: h1.x + h2.x, y: h1.y + h2.y, z: h1.z + h2.z}) ;
Permet l’ajout de deux hexagones par simple addition de ses trois valeurs

const hexSub = (h1, h2) => ({x: h1.x - h2.x, y: h1.y - h2.y, z: h1.z – h2.z}) ;
Suppression de la différence entre deux hexagones

const hexEqual = (h1, h2) => h1.x === h2.x && h1.y === h2.y ? true : false ;
Vérifie l’égalité entre deux hexagones

const hexMultiply = (h, k) => ({x: h.x * k, y: h.y * k, z: h.z * k});
Multiplie l’hexagone par la valeur k

const hexIndexOf = (hs, h) => {
let isIn = false;
     for (let i = 0; i < hs.length; i++) {
	if (hexEqual(hs[i], h)) isIn = true;
     }
 return isIn;
} ;
Vérifie si l’hexagone existe déjà et si c’est le cas, il lève un flag isIn à true
const hexLength = (h) => (Math.abs(h.x) + Math.abs(h.y) + Math.abs(h.z)) / 2 ;

Converti les valeurs x,y,z d’un hexagone en valeur absolue 

const hexDistance = (h1, h2) => hexLength( hexSub(h1, h2) ) ;

Utilisant la constante précédente et la différence entre les hexagones, donne la distance entre deux hexagone en valeur absolue

const hexDirections = [ Hex(+1,-1,0),Hex(+1,0,-1),Hex(0,+1,-1),Hex(-1,+1,0),Hex(-1,0,+1),Hex(0,-1,+1) ] ;

Crée un tableau d’hexagones voisins

const hexDirection = (d) => hexDirections[d];

donne la position d’un élément d dans le tableau hexDirections

const hexNeighbor = (h, d) => hexAdd(h, hexDirection(d));

ajoute à la valeur d, la valeur h pour ensuite l’ajouter dans le tableau hexDirections

const hexNeighbors = (h) => {
	const neighbors = [];
	for (let d = 0; d < 6; d++) {
		neighbors.push( hexNeighbor(h, d) );
	}
	return neighbors;
} ;

crée un tableau neighbors qui ajoute tous les voisins d de l’hexagone h

const hexDiagonals = [ Hex(2,-1,-1),Hex(1,-2,1),Hex(-1,-1,2),Hex(-2,1,1),Hex(-1,2,-1),Hex(1,1,-2)];

crée un tableau d’hexagones en diagonales

const hexNeighborDiagonal = (h, d) => hexAdd(h, hexDiagonals[d]) ;

donne la position d’un élément d dans le tableau  hexDiagonals

hexNeighborsDiagonal = (h) => {
	const neighbors = [];
	for (let d = 0; d < 6; d++) {
		neighbors.push( hexNeighborDiagonal(h, d) );
	}
	return neighbors;
};

crée un tableau neighbors qui ajoute tous les voisins diagonaux d de l’hexagone h

hexRound = (h) => {
	let x = Math.trunc(Math.round(h.x)),
		y = Math.trunc(Math.round(h.y)),
		z = Math.trunc(Math.round(h.z));
    
effectue un arrondis puis une troncature des valeurs x,y,z de l’hexagone

	const xD = Math.abs(x – h.x),
		yD = Math.abs(y – h.y)
		zD = Math.abs(z – h.z);
    
donne une valeur absolue de la soustraction de la valeur arrondis par la valeur originel

	if (xD > yD && xD > zD) { x = -y - z; }
  
Si la soustraction xD est supérieur à la valeur soustrait yD et zD, alors la formule mathématique de l’hexagone sera x = -y - z; 

	else if (yD > zD) { y = -x - z; }
  
Si yD est supérieur à zD et inférieur à xD, alors la formule sera y = -x – z;

	else { z = -x - y; }
  
Enfin, si zD est supérieur à xD et yD, alors la formule sera z = -x – y

	return Hex(x, y, z);
},
	
const hexLerp = (h1, h2, t) => Hex(
	h1.x + (h2.x - h1.x) * t,
	h1.y + (h2.y - h1.y) * t,
	h1.z + (h2.z - h1.z) * t
);

Permet de connaître l’interpolation linéaire de deux hexagones en utilisant la variable t en pondération

hexLinedraw = (h1, h2) => {
	const N = hexDistance(h1, h2),
		line = [],
		step = 1.0 / Math.max(N, 1);
	for (let i = 0; i <= N; i++) {
		line.push(hexRound(hexLerp(h1, h2, step * i)));
	}
	return line;
} ;

crée une constante N qui utilise hexDistance, un tableau line et un pas qui divise 1 par le plus grand nombre compris entre N et 1 (pour avoir un chiffre entre 0 et 1).
rempli le tableau line avec la valeur arrondis du hexRound et pondéré par hexLerp

const HexOffset = (col, row) => ({col, row}) ;
Prends les valeurs col et row pour crée un objet à deux valeurs.

FLAT = true, POINTY = false, // Topped
EVEN = 1, ODD = -1, // Parity
const hex2Offset = (h, topped = FLAT, parity = ODD) => topped ?
	HexOffset(
		h.x,
		h.y + Math.trunc((h.x + parity * (h.x & 1)) / 2)
	) :
	HexOffset(
		h.x + Math.trunc((h.y + parity * (h.y & 1)) / 2),
		h.y
) ;
Algorithme de conversion de l’hexagone. Si l’hexagone est en topped, il auras la pointe sur le y alors que si il est en flat, il l’aura sur le x.
const offset2Hex = (h, topped = FLAT, parity = ODD) => {
	let x, y;
	if (topped) {
		x = h.col,
		y = h.row - Math.trunc((h.col + parity * (h.col & 1)) / 2);
	} else {
		x = h.col - Math.trunc((h.row + parity * (h.row & 1)) / 2),
		y = h.row;
	}
	return Hex(x, y, -x – y) ;
};

conversion de l’hexagone pour qu’il ai une forme normée.

const Orientation = (f0, f1, f2, f3, b0, b1, b2, b3, startAngle) => (
{f0, f1, f2, f3, b0, b1, b2, b3, startAngle}
);

Object prenant l’ensemble des points d’un hexagone

const Point = (x, y) => ({x,y}) ;

const Layout = (orientation, size, origin) => ({orientation, size, origin}),

le layout prends l’orientation (selon le type d’hexagone) 

const orientationPointy = Orientation(
		Math.sqrt(3), Math.sqrt(3)/2, 0, 3/2,
		Math.sqrt(3)/3, -1/3, 0, 2/3,
		0.5
	);
  
const orientationFlat = Orientation(
		3/2, 0, Math.sqrt(3)/2, Math.sqrt(3),
		2/3, 0, -1/3, Math.sqrt(3)/3,
		0
	);
  
prends une formule mathématique pour tracer l’hexagone.

hex2Pixel = (layout, h) => {
	const M = layout.orientation,
		size = layout.size,
		origin = layout.origin,
		pt = Point((p.x - origin.x) / size.x, (p.y - origin.y) / size.y),
		x = M.b0 * pt.x + M.b1 * pt.y,
		y = M.b2 * pt.x + M.b3 * pt.y;
	return Hex(x, y, -x - y);
} ;

multiplie les point x et y par la taille de layout pour adapter la taille des hexagones au layout

const hexCornerOffset = (layout, corner, k = 1) => {
	const M = layout.orientation,
			size = layout.size,
			angle = 2 * Math.PI * (corner + M.startAngle) / 6;
	return Point(size.x * Math.cos(angle) * k, size.y * Math.sin(angle) * k);
};

Adapte la forme des point anguleux pour correspondre à la taille du layout

const hexCorners = (layout, h, k = 1) => {
	const corners = [],
		center = hex2Pixel(layout, h);
	for (var i = 0; i < 6; i++) {
		var offset = hexCornerOffset(layout, i, k);
		corners.push(Point(center.x + offset.x, center.y + offset.y));
	}
	return corners;
};

Ajoute les points (son centre et la position de ses offset) à un tableau d’angle

const multiArray = (x, y) => Array(...Array(x)).map(() => Array(y));

crée un tableau multiple de x et de y

const shuffle = (array) => {
	var currentIndex = array.length, temporaryValue, randomIndex;
	while (0 !== currentIndex) {
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}
	return array
} ;
