import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
test('the actual extraction process loads parsers and reads TXT without touching package demo files',()=>{
 const r=spawnSync(process.execPath,['--import','tsx','worker/extract.ts','text/plain'],{input:'Texto de prueba sin datos personales',encoding:'utf8',timeout:30000,env:{PATH:process.env.PATH||'',NODE_ENV:'production'}});
 assert.equal(r.status,0,r.stderr);assert.equal(r.stdout,'Texto de prueba sin datos personales');
});
