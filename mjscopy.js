const fs = require('fs');

// Some packages still can't deal with mjs file extensions
fs.copyFileSync('dist/meeussunmoon.mjs', 'dist/meeussunmoon.m.js');
