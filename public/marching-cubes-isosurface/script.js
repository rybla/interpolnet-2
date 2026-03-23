// Marching Cubes lookup tables
const edgeTable = new Int32Array([
  0x0  , 0x109, 0x203, 0x30a, 0x406, 0x50f, 0x605, 0x70c,
  0x80c, 0x905, 0xa0f, 0xb06, 0xc0a, 0xd03, 0xe09, 0xf00,
  0x190, 0x99 , 0x393, 0x29a, 0x596, 0x49f, 0x795, 0x69c,
  0x99c, 0x895, 0xb9f, 0xa96, 0xd9a, 0xc93, 0xf99, 0xe90,
  0x230, 0x339, 0x33 , 0x13a, 0x636, 0x73f, 0x435, 0x53c,
  0xa3c, 0xb35, 0x83f, 0x936, 0xe3a, 0xf33, 0xc39, 0xd30,
  0x3a0, 0x2a9, 0x1a3, 0xaa , 0x7a6, 0x6af, 0x5a5, 0x4ac,
  0xbac, 0xaa5, 0x9af, 0x8a6, 0xfaa, 0xea3, 0xda9, 0xca0,
  0x460, 0x569, 0x663, 0x76a, 0x66 , 0x16f, 0x265, 0x36c,
  0xc6c, 0xd65, 0xe6f, 0xf66, 0x86a, 0x963, 0xa69, 0xb60,
  0x5f0, 0x4f9, 0x7f3, 0x6fa, 0x1f6, 0xff , 0x3f5, 0x2fc,
  0xdfc, 0xcf5, 0xfff, 0xef6, 0x9fa, 0x8f3, 0xbf9, 0xaf0,
  0x650, 0x759, 0x453, 0x55a, 0x256, 0x35f, 0x55 , 0x15c,
  0xe5c, 0xf55, 0xc5f, 0xd56, 0xa5a, 0xb53, 0x859, 0x950,
  0x7c0, 0x6c9, 0x5c3, 0x4ca, 0x3c6, 0x2cf, 0x1c5, 0xcc ,
  0xfcc, 0xec5, 0xdcf, 0xcc6, 0xbca, 0xac3, 0x9c9, 0x8c0,
  0x8c0, 0x9c9, 0xac3, 0xbca, 0xcc6, 0xdcf, 0xec5, 0xfcc,
  0xcc , 0x1c5, 0x2cf, 0x3c6, 0x4ca, 0x5c3, 0x6c9, 0x7c0,
  0x950, 0x859, 0xb53, 0xa5a, 0xd56, 0xc5f, 0xf55, 0xe5c,
  0x15c, 0x55 , 0x35f, 0x256, 0x55a, 0x453, 0x759, 0x650,
  0xaf0, 0xbf9, 0x8f3, 0x9fa, 0xef6, 0xfff, 0xcf5, 0xdfc,
  0x2fc, 0x3f5, 0xff , 0x1f6, 0x6fa, 0x7f3, 0x4f9, 0x5f0,
  0xb60, 0xa69, 0x963, 0x86a, 0xf66, 0xe6f, 0xd65, 0xc6c,
  0x36c, 0x265, 0x16f, 0x66 , 0x76a, 0x663, 0x569, 0x460,
  0xca0, 0xda9, 0xea3, 0xfaa, 0x8a6, 0x9af, 0xaa5, 0xbac,
  0x4ac, 0x5a5, 0x6af, 0x7a6, 0xaa , 0x1a3, 0x2a9, 0x3a0,
  0xd30, 0xc39, 0xf33, 0xe3a, 0x936, 0x83f, 0xb35, 0xa3c,
  0x53c, 0x435, 0x73f, 0x636, 0x13a, 0x33 , 0x339, 0x230,
  0xe90, 0xf99, 0xc93, 0xd9a, 0xa96, 0xb9f, 0x895, 0x99c,
  0x69c, 0x795, 0x49f, 0x596, 0x29a, 0x393, 0x99 , 0x190,
  0xf00, 0xe09, 0xd03, 0xc0a, 0xb06, 0xa0f, 0x905, 0x80c,
  0x70c, 0x605, 0x50f, 0x406, 0x30a, 0x203, 0x109, 0x0
]);

const triTable = new Int32Array([
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  0, 8, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  0, 1, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  1, 8, 3, 9, 8, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  1, 2, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  0, 8, 3, 1, 2, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  9, 2, 10, 0, 2, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  2, 8, 3, 2, 10, 8, 10, 9, 8, -1, -1, -1, -1, -1, -1, -1,
  3, 11, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  0, 11, 2, 8, 11, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  1, 9, 0, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  1, 11, 2, 1, 9, 11, 9, 8, 11, -1, -1, -1, -1, -1, -1, -1,
  3, 10, 1, 11, 10, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  0, 10, 1, 0, 8, 10, 8, 11, 10, -1, -1, -1, -1, -1, -1, -1,
  3, 9, 0, 3, 11, 9, 11, 10, 9, -1, -1, -1, -1, -1, -1, -1,
  9, 8, 10, 10, 8, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  4, 7, 12, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  4, 7, 12, 0, 8, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  0, 1, 9, 8, 4, 7, 12, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  1, 8, 3, 9, 8, 1, 4, 7, 12, -1, -1, -1, -1, -1, -1, -1,
  1, 2, 10, 4, 7, 12, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  0, 8, 3, 1, 2, 10, 4, 7, 12, -1, -1, -1, -1, -1, -1, -1,
  9, 2, 10, 0, 2, 9, 4, 7, 12, -1, -1, -1, -1, -1, -1, -1,
  2, 8, 3, 2, 10, 8, 10, 9, 8, 4, 7, 12, -1, -1, -1, -1,
  3, 11, 2, 4, 7, 12, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  0, 11, 2, 8, 11, 0, 4, 7, 12, -1, -1, -1, -1, -1, -1, -1,
  1, 9, 0, 2, 3, 11, 4, 7, 12, -1, -1, -1, -1, -1, -1, -1,
  1, 11, 2, 1, 9, 11, 9, 8, 11, 4, 7, 12, -1, -1, -1, -1,
  3, 10, 1, 11, 10, 3, 4, 7, 12, -1, -1, -1, -1, -1, -1, -1,
  0, 10, 1, 0, 8, 10, 8, 11, 10, 4, 7, 12, -1, -1, -1, -1,
  3, 9, 0, 3, 11, 9, 11, 10, 9, 4, 7, 12, -1, -1, -1, -1,
  9, 8, 10, 10, 8, 11, 4, 7, 12, -1, -1, -1, -1, -1, -1, -1,
  9, 5, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  9, 5, 4, 0, 8, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  0, 5, 4, 1, 5, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  8, 5, 4, 8, 3, 5, 3, 1, 5, -1, -1, -1, -1, -1, -1, -1,
  1, 2, 10, 9, 5, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  0, 8, 3, 1, 2, 10, 9, 5, 4, -1, -1, -1, -1, -1, -1, -1,
  0, 2, 10, 4, 0, 10, 5, 4, 10, -1, -1, -1, -1, -1, -1, -1,
  2, 8, 3, 2, 10, 8, 10, 5, 8, 5, 4, 8, -1, -1, -1, -1,
  3, 11, 2, 9, 5, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  0, 11, 2, 8, 11, 0, 9, 5, 4, -1, -1, -1, -1, -1, -1, -1,
  1, 5, 4, 0, 1, 4, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1,
  1, 11, 2, 1, 5, 11, 5, 4, 11, 4, 8, 11, -1, -1, -1, -1,
  3, 10, 1, 11, 10, 3, 9, 5, 4, -1, -1, -1, -1, -1, -1, -1,
  0, 10, 1, 0, 8, 10, 8, 11, 10, 9, 5, 4, -1, -1, -1, -1,
  3, 5, 4, 3, 11, 5, 11, 10, 5, 10, 0, 5, -1, -1, -1, -1,
  10, 8, 11, 10, 5, 8, 5, 4, 8, -1, -1, -1, -1, -1, -1, -1,
  7, 12, 5, 9, 7, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  0, 8, 3, 7, 12, 5, 9, 7, 5, -1, -1, -1, -1, -1, -1, -1,
  0, 1, 7, 1, 5, 7, 12, 0, 7, -1, -1, -1, -1, -1, -1, -1,
  1, 8, 3, 1, 7, 8, 7, 12, 8, 5, 7, 1, -1, -1, -1, -1,
  1, 2, 10, 7, 12, 5, 9, 7, 5, -1, -1, -1, -1, -1, -1, -1,
  0, 8, 3, 1, 2, 10, 7, 12, 5, 9, 7, 5, -1, -1, -1, -1,
  0, 2, 10, 7, 0, 10, 12, 7, 10, 5, 12, 10, -1, -1, -1, -1,
  2, 8, 3, 2, 10, 8, 10, 5, 8, 5, 7, 8, 7, 12, 8, -1,
  3, 11, 2, 7, 12, 5, 9, 7, 5, -1, -1, -1, -1, -1, -1, -1,
  0, 11, 2, 8, 11, 0, 7, 12, 5, 9, 7, 5, -1, -1, -1, -1,
  1, 5, 7, 0, 1, 7, 12, 0, 7, 2, 3, 11, -1, -1, -1, -1,
  1, 11, 2, 1, 5, 11, 5, 7, 11, 7, 12, 11, 12, 8, 11, -1,
  3, 10, 1, 11, 10, 3, 7, 12, 5, 9, 7, 5, -1, -1, -1, -1,
  0, 10, 1, 0, 8, 10, 8, 11, 10, 7, 12, 5, 9, 7, 5, -1,
  3, 5, 7, 3, 11, 5, 11, 10, 5, 10, 0, 5, 12, 3, 7, -1,
  10, 8, 11, 10, 5, 8, 5, 7, 8, 7, 12, 8, -1, -1, -1, -1,
  10, 6, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  0, 8, 3, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  0, 1, 9, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  1, 8, 3, 9, 8, 1, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1,
  1, 2, 6, 5, 1, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  0, 8, 3, 1, 2, 6, 5, 1, 6, -1, -1, -1, -1, -1, -1, -1,
  9, 2, 6, 0, 2, 9, 5, 9, 6, -1, -1, -1, -1, -1, -1, -1,
  2, 8, 3, 2, 6, 8, 6, 5, 8, 5, 9, 8, -1, -1, -1, -1,
  3, 11, 2, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  0, 11, 2, 8, 11, 0, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1,
  1, 9, 0, 2, 3, 11, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1,
  1, 11, 2, 1, 9, 11, 9, 8, 11, 10, 6, 5, -1, -1, -1, -1,
  3, 6, 1, 11, 6, 3, 5, 1, 6, -1, -1, -1, -1, -1, -1, -1,
  0, 6, 1, 0, 8, 6, 8, 11, 6, 11, 5, 6, -1, -1, -1, -1,
  3, 9, 0, 3, 11, 9, 11, 6, 9, 6, 5, 9, -1, -1, -1, -1,
  6, 5, 11, 5, 9, 11, 9, 8, 11, -1, -1, -1, -1, -1, -1, -1,
  4, 7, 12, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  4, 7, 12, 0, 8, 3, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1,
  0, 1, 9, 4, 7, 12, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1,
  1, 8, 3, 9, 8, 1, 4, 7, 12, 10, 6, 5, -1, -1, -1, -1,
  1, 2, 6, 5, 1, 6, 4, 7, 12, -1, -1, -1, -1, -1, -1, -1,
  0, 8, 3, 1, 2, 6, 5, 1, 6, 4, 7, 12, -1, -1, -1, -1,
  9, 2, 6, 0, 2, 9, 5, 9, 6, 4, 7, 12, -1, -1, -1, -1,
  2, 8, 3, 2, 6, 8, 6, 5, 8, 5, 9, 8, 4, 7, 12, -1,
  3, 11, 2, 4, 7, 12, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1,
  0, 11, 2, 8, 11, 0, 4, 7, 12, 10, 6, 5, -1, -1, -1, -1,
  1, 9, 0, 2, 3, 11, 4, 7, 12, 10, 6, 5, -1, -1, -1, -1,
  1, 11, 2, 1, 9, 11, 9, 8, 11, 4, 7, 12, 10, 6, 5, -1,
  3, 6, 1, 11, 6, 3, 5, 1, 6, 4, 7, 12, -1, -1, -1, -1,
  0, 6, 1, 0, 8, 6, 8, 11, 6, 11, 5, 6, 4, 7, 12, -1,
  3, 9, 0, 3, 11, 9, 11, 6, 9, 6, 5, 9, 4, 7, 12, -1,
  6, 5, 11, 5, 9, 11, 9, 8, 11, 4, 7, 12, -1, -1, -1, -1,
  9, 6, 4, 10, 9, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  0, 8, 3, 9, 6, 4, 10, 9, 6, -1, -1, -1, -1, -1, -1, -1,
  0, 6, 4, 1, 6, 0, 10, 6, 1, -1, -1, -1, -1, -1, -1, -1,
  8, 6, 4, 8, 3, 6, 3, 1, 6, 1, 10, 6, -1, -1, -1, -1,
  1, 2, 4, 9, 1, 4, 2, 6, 4, -1, -1, -1, -1, -1, -1, -1,
  0, 8, 3, 1, 2, 4, 9, 1, 4, 2, 6, 4, -1, -1, -1, -1,
  0, 2, 4, 6, 4, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  2, 8, 3, 2, 4, 8, 6, 4, 2, -1, -1, -1, -1, -1, -1, -1,
  3, 11, 2, 9, 6, 4, 10, 9, 6, -1, -1, -1, -1, -1, -1, -1,
  0, 11, 2, 8, 11, 0, 9, 6, 4, 10, 9, 6, -1, -1, -1, -1,
  1, 6, 4, 0, 1, 4, 10, 6, 1, 2, 3, 11, -1, -1, -1, -1,
  1, 11, 2, 1, 6, 11, 6, 4, 11, 4, 8, 11, 10, 6, 1, -1,
  3, 6, 1, 11, 6, 3, 9, 1, 6, 4, 9, 6, -1, -1, -1, -1,
  0, 6, 1, 0, 8, 6, 8, 11, 6, 11, 4, 6, 4, 9, 6, -1,
  3, 6, 4, 3, 11, 6, 11, 0, 6, 0, 4, 6, -1, -1, -1, -1,
  8, 11, 6, 8, 6, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  7, 12, 10, 9, 7, 10, 6, 9, 10, -1, -1, -1, -1, -1, -1, -1,
  0, 8, 3, 7, 12, 10, 9, 7, 10, 6, 9, 10, -1, -1, -1, -1,
  0, 1, 7, 1, 10, 7, 10, 6, 7, 6, 12, 7, -1, -1, -1, -1,
  1, 8, 3, 1, 7, 8, 7, 12, 8, 12, 6, 8, 6, 10, 8, 10, 1, 8,
  1, 2, 7, 9, 1, 7, 2, 6, 7, 6, 12, 7, -1, -1, -1, -1,
  0, 8, 3, 1, 2, 7, 9, 1, 7, 2, 6, 7, 6, 12, 7, -1,
  0, 2, 7, 6, 7, 2, 12, 7, 6, -1, -1, -1, -1, -1, -1, -1,
  2, 8, 3, 2, 7, 8, 7, 12, 8, 12, 6, 8, 6, 2, 8, -1,
  3, 11, 2, 7, 12, 10, 9, 7, 10, 6, 9, 10, -1, -1, -1, -1,
  0, 11, 2, 8, 11, 0, 7, 12, 10, 9, 7, 10, 6, 9, 10, -1,
  1, 10, 7, 0, 1, 7, 10, 6, 7, 6, 12, 7, 2, 3, 11, -1,
  1, 11, 2, 1, 10, 11, 10, 6, 11, 6, 12, 11, 12, 8, 11, 7, 12, 1,
  3, 6, 1, 11, 6, 3, 9, 1, 6, 7, 9, 6, 12, 7, 6, -1,
  0, 6, 1, 0, 8, 6, 8, 11, 6, 11, 12, 6, 12, 7, 6, 7, 9, 6,
  3, 6, 7, 3, 11, 6, 11, 0, 6, 0, 7, 6, 12, 7, 6, -1,
  8, 11, 6, 8, 6, 7, 7, 12, 6, -1, -1, -1, -1, -1, -1, -1,
  11, 7, 6, 10, 11, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  0, 8, 3, 11, 7, 6, 10, 11, 6, -1, -1, -1, -1, -1, -1, -1,
  0, 1, 9, 11, 7, 6, 10, 11, 6, -1, -1, -1, -1, -1, -1, -1,
  1, 8, 3, 9, 8, 1, 11, 7, 6, 10, 11, 6, -1, -1, -1, -1,
  1, 2, 10, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  0, 8, 3, 1, 2, 10, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1,
  9, 2, 10, 0, 2, 9, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1,
  2, 8, 3, 2, 10, 8, 10, 9, 8, 11, 7, 6, -1, -1, -1, -1,
  3, 7, 6, 2, 3, 6, 10, 2, 6, -1, -1, -1, -1, -1, -1, -1,
  0, 7, 6, 8, 0, 6, 2, 8, 6, 10, 2, 6, -1, -1, -1, -1,
  1, 9, 0, 3, 7, 6, 2, 3, 6, 10, 2, 6, -1, -1, -1, -1,
  1, 7, 6, 9, 1, 6, 8, 9, 6, 2, 8, 6, 10, 2, 6, -1,
  10, 1, 6, 3, 7, 1, 6, 3, 1, -1, -1, -1, -1, -1, -1, -1,
  0, 8, 1, 8, 7, 1, 7, 6, 1, 6, 10, 1, -1, -1, -1, -1,
  3, 9, 0, 6, 3, 9, 7, 6, 9, -1, -1, -1, -1, -1, -1, -1,
  9, 8, 7, 6, 9, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  4, 11, 12, 10, 11, 4, 6, 10, 4, -1, -1, -1, -1, -1, -1, -1,
  4, 11, 12, 10, 11, 4, 6, 10, 4, 0, 8, 3, -1, -1, -1, -1,
  0, 1, 9, 4, 11, 12, 10, 11, 4, 6, 10, 4, -1, -1, -1, -1,
  1, 8, 3, 9, 8, 1, 4, 11, 12, 10, 11, 4, 6, 10, 4, -1,
  1, 2, 10, 4, 11, 12, 10, 11, 4, 6, 10, 4, -1, -1, -1, -1,
  0, 8, 3, 1, 2, 10, 4, 11, 12, 10, 11, 4, 6, 10, 4, -1,
  9, 2, 10, 0, 2, 9, 4, 11, 12, 10, 11, 4, 6, 10, 4, -1,
  2, 8, 3, 2, 10, 8, 10, 9, 8, 4, 11, 12, 10, 11, 4, 6, 10, 4,
  3, 12, 6, 2, 3, 6, 10, 2, 6, 4, 12, 6, -1, -1, -1, -1,
  0, 12, 6, 8, 0, 6, 2, 8, 6, 10, 2, 6, 4, 12, 6, -1,
  1, 9, 0, 3, 12, 6, 2, 3, 6, 10, 2, 6, 4, 12, 6, -1,
  1, 12, 6, 9, 1, 6, 8, 9, 6, 2, 8, 6, 10, 2, 6, 4, 12, 6,
  10, 1, 6, 3, 12, 1, 6, 3, 1, 4, 12, 1, -1, -1, -1, -1,
  0, 8, 1, 8, 12, 1, 12, 6, 1, 6, 10, 1, 4, 12, 1, -1,
  3, 9, 0, 6, 3, 9, 12, 6, 9, 4, 12, 9, -1, -1, -1, -1,
  9, 8, 12, 6, 9, 12, 4, 12, 9, -1, -1, -1, -1, -1, -1, -1,
  9, 11, 7, 10, 11, 9, 4, 10, 9, 6, 4, 9, -1, -1, -1, -1,
  0, 8, 3, 9, 11, 7, 10, 11, 9, 4, 10, 9, 6, 4, 9, -1,
  0, 1, 7, 1, 11, 7, 11, 10, 7, 10, 4, 7, 4, 6, 7, -1,
  1, 8, 3, 1, 7, 8, 7, 11, 8, 11, 10, 8, 10, 4, 8, 4, 6, 8,
  1, 2, 10, 9, 11, 7, 10, 11, 9, 4, 10, 9, 6, 4, 9, -1,
  0, 8, 3, 1, 2, 10, 9, 11, 7, 10, 11, 9, 4, 10, 9, 6, 4, 9,
  0, 2, 10, 7, 0, 10, 11, 7, 10, 4, 11, 10, 6, 4, 10, -1,
  2, 8, 3, 2, 10, 8, 10, 7, 8, 7, 11, 8, 11, 4, 8, 4, 6, 8,
  3, 7, 6, 2, 3, 6, 10, 2, 6, 4, 10, 6, 9, 4, 6, -1,
  0, 7, 6, 8, 0, 6, 2, 8, 6, 10, 2, 6, 4, 10, 6, 9, 4, 6,
  1, 4, 0, 2, 1, 4, 10, 2, 4, 6, 10, 4, 7, 6, 4, -1,
  1, 7, 6, 9, 1, 6, 8, 9, 6, 2, 8, 6, 10, 2, 6, 4, 10, 6,
  10, 1, 6, 3, 7, 1, 6, 3, 1, 4, 6, 1, 9, 4, 1, -1,
  0, 8, 1, 8, 7, 1, 7, 6, 1, 6, 10, 1, 4, 6, 1, 9, 4, 1,
  3, 4, 0, 6, 3, 4, 7, 6, 4, -1, -1, -1, -1, -1, -1, -1,
  8, 7, 6, 4, 8, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1
]);

const state = {
  gridSize: 32,
  threshold: 0.5,
  wireframe: false,
  showGrid: false
};

let scene, camera, renderer;
let scalarField, geometry, mesh, gridPoints;
const gridScale = 10;
const cellSize = gridScale / state.gridSize;

function init() {
  const container = document.getElementById('canvas-container');

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0f19);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 5, 15);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(10, 20, 10);
  scene.add(dirLight);

  const dirLight2 = new THREE.DirectionalLight(0x00ffcc, 0.5);
  dirLight2.position.set(-10, -10, -10);
  scene.add(dirLight2);

  const numPoints = state.gridSize * state.gridSize * state.gridSize;
  scalarField = new Float32Array(numPoints);

  const pointsGeo = new THREE.BufferGeometry();
  const pointsPos = new Float32Array(numPoints * 3);
  const pointsColor = new Float32Array(numPoints * 3);
  const pointsSize = new Float32Array(numPoints);
  let idx = 0;
  for (let z = 0; z < state.gridSize; z++) {
    for (let y = 0; y < state.gridSize; y++) {
      for (let x = 0; x < state.gridSize; x++) {
        pointsPos[idx++] = (x - state.gridSize / 2) * cellSize;
        pointsPos[idx++] = (y - state.gridSize / 2) * cellSize;
        pointsPos[idx++] = (z - state.gridSize / 2) * cellSize;
      }
    }
  }
  pointsGeo.setAttribute('position', new THREE.BufferAttribute(pointsPos, 3));
  pointsGeo.setAttribute('color', new THREE.BufferAttribute(pointsColor, 3));
  pointsGeo.setAttribute('size', new THREE.BufferAttribute(pointsSize, 1));

  // Custom shader for point size/color scaling
  const pointsMat = new THREE.ShaderMaterial({
    uniforms: {
      colorBase: { value: new THREE.Color(0xff00ff) },
      colorHighlight: { value: new THREE.Color(0xffffff) }
    },
    vertexShader: `
      attribute float size;
      attribute vec3 color;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (10.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      void main() {
        // Soft circle point
        vec2 xy = gl_PointCoord.xy - vec2(0.5);
        float ll = length(xy);
        if(ll > 0.5) discard;
        float alpha = (0.5 - ll) * 2.0;
        gl_FragColor = vec4(vColor, alpha * 0.4);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  gridPoints = new THREE.Points(pointsGeo, pointsMat);
  gridPoints.visible = state.showGrid;
  scene.add(gridPoints);

  geometry = new THREE.BufferGeometry();
  const material = new THREE.MeshStandardMaterial({
    color: 0x00ffcc,
    roughness: 0.2,
    metalness: 0.5,
    side: THREE.DoubleSide,
    wireframe: state.wireframe
  });
  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  window.addEventListener('resize', onWindowResize);
  setupUI();

  animate();
}

function setupUI() {
  const thresholdSlider = document.getElementById('thresholdSlider');
  const thresholdValue = document.getElementById('thresholdValue');
  const wireframeBtn = document.getElementById('wireframeBtn');
  const gridBtn = document.getElementById('gridBtn');

  thresholdSlider.addEventListener('input', (e) => {
    state.threshold = parseFloat(e.target.value);
    thresholdValue.textContent = state.threshold.toFixed(2);
  });

  wireframeBtn.addEventListener('click', () => {
    state.wireframe = !state.wireframe;
    mesh.material.wireframe = state.wireframe;
    wireframeBtn.classList.toggle('active', state.wireframe);
  });

  gridBtn.addEventListener('click', () => {
    state.showGrid = !state.showGrid;
    gridPoints.visible = state.showGrid;
    gridBtn.classList.toggle('active', state.showGrid);
  });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function updateScalarField(time) {
  const { gridSize } = state;
  const metaballs = [
    { x: Math.sin(time) * 3, y: Math.cos(time * 0.8) * 3, z: Math.sin(time * 1.2) * 3, r: 2.5 },
    { x: Math.cos(time * 1.5) * 4, y: Math.sin(time * 1.1) * 3, z: Math.cos(time * 0.9) * 2, r: 3.0 },
    { x: Math.sin(time * 0.7) * 2, y: Math.cos(time * 1.3) * 4, z: Math.sin(time * 1.5) * 3, r: 2.0 }
  ];

  let idx = 0;
  for (let z = 0; z < gridSize; z++) {
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const px = (x - gridSize / 2) * cellSize;
        const py = (y - gridSize / 2) * cellSize;
        const pz = (z - gridSize / 2) * cellSize;

        let val = 0;
        for (let i = 0; i < metaballs.length; i++) {
          const mb = metaballs[i];
          const dx = px - mb.x;
          const dy = py - mb.y;
          const dz = pz - mb.z;
          const distSq = dx * dx + dy * dy + dz * dz;
          if (distSq === 0) val += 1000;
          else val += (mb.r * mb.r) / distSq;
        }
        scalarField[idx] = val;

        // Update point size and color based on scalar value
        const cIdx = idx * 3;
        const normalizedVal = Math.min(val / 1.5, 1.0);

        // Color gradient from dark magenta to bright cyan
        gridPoints.geometry.attributes.color.array[cIdx] = 1.0 - normalizedVal; // R
        gridPoints.geometry.attributes.color.array[cIdx+1] = normalizedVal; // G
        gridPoints.geometry.attributes.color.array[cIdx+2] = 1.0; // B

        // Size scale based on density
        gridPoints.geometry.attributes.size.array[idx] = 1.0 + normalizedVal * 5.0;

        idx++;
      }
    }
  }

  gridPoints.geometry.attributes.color.needsUpdate = true;
  gridPoints.geometry.attributes.size.needsUpdate = true;
}

function getGridVal(x, y, z) {
  const { gridSize } = state;
  if (x < 0 || x >= gridSize || y < 0 || y >= gridSize || z < 0 || z >= gridSize) return 0;
  return scalarField[x + y * gridSize + z * gridSize * gridSize];
}

const vOffsets = [
  [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0],
  [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]
];

const eOffsets = [
  [0, 1], [1, 2], [2, 3], [3, 0],
  [4, 5], [5, 6], [6, 7], [7, 4],
  [0, 4], [1, 5], [2, 6], [3, 7]
];

function interpolate(v1, val1, v2, val2) {
  const { threshold } = state;
  if (Math.abs(threshold - val1) < 0.00001) return v1;
  if (Math.abs(threshold - val2) < 0.00001) return v2;
  if (Math.abs(val1 - val2) < 0.00001) return v1;

  const mu = (threshold - val1) / (val2 - val1);
  return {
    x: v1.x + mu * (v2.x - v1.x),
    y: v1.y + mu * (v2.y - v1.y),
    z: v1.z + mu * (v2.z - v1.z)
  };
}

function updateMarchingCubes() {
  const { gridSize, threshold } = state;
  const positions = [];

  for (let z = 0; z < gridSize - 1; z++) {
    for (let y = 0; y < gridSize - 1; y++) {
      for (let x = 0; x < gridSize - 1; x++) {
        const px = (x - gridSize / 2) * cellSize;
        const py = (y - gridSize / 2) * cellSize;
        const pz = (z - gridSize / 2) * cellSize;

        let cubeIndex = 0;
        const vals = new Array(8);
        const pts = new Array(8);

        for (let i = 0; i < 8; i++) {
          const ox = x + vOffsets[i][0];
          const oy = y + vOffsets[i][1];
          const oz = z + vOffsets[i][2];
          vals[i] = getGridVal(ox, oy, oz);
          pts[i] = {
            x: px + vOffsets[i][0] * cellSize,
            y: py + vOffsets[i][1] * cellSize,
            z: pz + vOffsets[i][2] * cellSize
          };
          if (vals[i] < threshold) cubeIndex |= (1 << i);
        }

        const edges = edgeTable[cubeIndex];
        if (edges === 0) continue;

        const vertList = new Array(12);
        for (let i = 0; i < 12; i++) {
          if (edges & (1 << i)) {
            const i1 = eOffsets[i][0];
            const i2 = eOffsets[i][1];
            vertList[i] = interpolate(pts[i1], vals[i1], pts[i2], vals[i2]);
          }
        }

        for (let i = 0; i < 16; i += 3) {
          if (triTable[cubeIndex * 16 + i] === -1) break;
          const v0i = triTable[cubeIndex * 16 + i];
          const v1i = triTable[cubeIndex * 16 + i + 1];
          const v2i = triTable[cubeIndex * 16 + i + 2];
          if (v0i === undefined || v1i === undefined || v2i === undefined ||
              v0i === -1 || v1i === -1 || v2i === -1) break;
          const v0 = vertList[v0i];
          const v1 = vertList[v1i];
          const v2 = vertList[v2i];
          if (!v0 || !v1 || !v2) continue;

          if (triTable[cubeIndex * 16 + i] === -1) break;


          positions.push(v0.x, v0.y, v0.z);
          positions.push(v1.x, v1.y, v1.z);
          positions.push(v2.x, v2.y, v2.z);
        }
      }
    }
  }

  if (positions.length > 0) {
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.computeVertexNormals();
  } else {
    geometry.setAttribute('position', new THREE.Float32BufferAttribute([], 3));
    if (geometry.attributes.normal) {
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute([], 3));
    }
  }
}

function animate() {
  requestAnimationFrame(animate);

  const time = Date.now() * 0.001;
  updateScalarField(time);
  updateMarchingCubes();

  // Simple orbit rotation since no OrbitControls
  camera.position.x = Math.sin(time * 0.2) * 15;
  camera.position.z = Math.cos(time * 0.2) * 15;
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
}

window.onload = init;
