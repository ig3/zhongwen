#!/usr/bin/env node
'use strict';

// Download the latest CC-CEDICT to data/cedict_ts.u8

const fs = require('fs');
const { Readable } = require('stream');
const zlib = require('node:zlib');

const stream = fs.createWriteStream('data/cedict_ts.u8');
fetch('https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz')
.then(res => {
  if (!res.ok) throw new Error('response is not OK');
  Readable.fromWeb(res.body).pipe(zlib.createGunzip()).pipe(stream);
});
