var map[][][];
var hexagones;
var size = 30;
var

function hex_corner(center, size, i){
  var angle_deg = 60 * i
  var angle_rad = PI / 180 * angle_deg
  return Point(center.x + size * cos(angle_rad),
               center.y + size * sin(angle_rad))
}
