'use strict';

const fs = require('fs');

// readline is buggy - passes '\r' occasionally, see
// https://github.com/nodejs/node/issues/45992
// Just fixed a few days ago
/*
const readline = require('readline');

let offset = 0;

const file = readline.createInterface({
  input: fs.createReadStream('data/cedict_ts.u8', { encoding: 'utf8' }),
  output: process.stdout,
  terminal: false
});

file.on('line', (line) => {
  console.log('line: ',offset,line);
  offset += line.length + 2;
});
*/

const inputPath = process.argv[2];
if (!inputPath) usage();

const outputPath = process.argv[3];
if (!outputPath) usage();

const data = fs.readFileSync(inputPath).toString();

let offset = 0;

const index = {};

data.split('\r\n').forEach(line => {
  if (line && !line.startsWith('#')) {
    const parts = line.split(' ');
    if (!index[parts[0]]) {
      index[parts[0]] = [];
    }
    if (!index[parts[0]].includes(offset)) 
      index[parts[0]].push(offset);
    if (!index[parts[1]]) {
      index[parts[1]] = [];
    }
    if (!index[parts[1]].includes(offset)) 
      index[parts[1]].push(offset);
  }
  offset += line.length + 2;
});

let indexData = '';

Object.keys(index)
.sort()
.forEach(key => {
  indexData += key + ',' + index[key].join(',') + '\n';
});

fs.writeFileSync(outputPath, indexData);

function usage () {
  console.error('USAGE: generateIndex cedict_ts.u8 cedict.idx');
  process.exit(1);
}
