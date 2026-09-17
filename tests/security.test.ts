import test from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import { EventEmitter } from 'node:events';
import { canReadPrivate, caseSchema, profileSchema, safeName, validateFile } from '../lib/shared';
import { scanBuffer } from '../worker/scan';
import { organization } from '../worker/organize';
test('private files require ownership or both verification and an explicit grant',()=>{
 assert.equal(canReadPrivate('owner','owner',false),true);
 for(const state of [undefined,'requested','revoked'])assert.equal(canReadPrivate('owner','other',true,state),false);
 assert.equal(canReadPrivate('owner','other',false,'granted'),false);
 assert.equal(canReadPrivate('owner','other',true,'granted'),true);
});
test('profile input strips privilege escalation and identity controls',()=>{
 const p=profileSchema.parse({name:'Test User',role:'lawyer',verification:'verified',verified_at:'2026-09-17',id:'other'});
 assert.equal('verification' in p,false);assert.equal('verified_at' in p,false);assert.equal('id' in p,false);
});
test('cases require a useful description but no documents or readiness score',()=>{
 assert.ok(caseSchema.safeParse({title:'Revisar un contrato',category:'Civil',city:'Bogotá',service:'Revisar y orientar',description:'Quisiera revisar un contrato que estoy preparando.'}).success);
 assert.equal(caseSchema.safeParse({title:'Caso',description:'Ayuda'}).success,false);
});
test('file extension alone cannot disguise executables, HTML or oversized input',()=>{
 assert.equal(validateFile('borrador.pdf',Buffer.from('%PDF-1.7\n')), 'application/pdf');
 assert.throws(()=>validateFile('fake.pdf',Buffer.from('<script>bad()</script>')));
 assert.throws(()=>validateFile('script.html',Buffer.from('<html>')));
 assert.throws(()=>validateFile('fake.txt',Buffer.from([0x4d,0x5a,0])));
 assert.throws(()=>validateFile('large.txt',Buffer.alloc(10485761,65)));
 assert.equal(safeName('../x\r\n/file.pdf'),'..xfile.pdf');
});
test('AI schema rejects unknown categories, excessive output and invented score fields',()=>{
 const valid={title:'Revisión de un asunto',category:'Otro',summary:'La persona busca una revisión profesional de sus documentos.',facts:[],questions:[]};
 assert.ok(organization.safeParse(valid).success);
 assert.equal(organization.safeParse({...valid,win_probability:.95}).success,false);
 assert.equal(organization.safeParse({...valid,category:'Ganador'}).success,false);
});
function fakeSocket(reply:string,outputs:Buffer[]) {
 const socket=Object.assign(new EventEmitter(),{setTimeout:()=>socket,destroy:()=>socket,write:(data:Buffer|string)=>{outputs.push(Buffer.from(data));if(Buffer.isBuffer(data)&&data.length===4&&data.readUInt32BE()===0)queueMicrotask(()=>socket.emit('data',Buffer.from(reply)));return true;}});
 queueMicrotask(()=>socket.emit('connect'));return socket as unknown as net.Socket;
}
test('scanner uses INSTREAM framing and treats infected files as blocked',async t=>{
 const bytes=Buffer.alloc(70000,65);let calls=0;const outputs:Buffer[]=[];
 t.mock.method(net,'createConnection',()=>fakeSocket(calls++===0?'stream: OK\0':'stream: Test-Signature FOUND\0',outputs));
 assert.equal(await scanBuffer(bytes,'scanner'),true);
 const received=Buffer.concat(outputs);assert.equal(received.subarray(0,10).toString(),'zINSTREAM\0');assert.equal(received.readUInt32BE(10),65536);assert.equal(received.readUInt32BE(65550),4464);assert.equal(received.readUInt32BE(received.length-4),0);
 assert.equal(await scanBuffer(bytes,'scanner'),false);
});
test('scanner errors never mark an upload clean',async t=>{
 t.mock.method(net,'createConnection',()=>fakeSocket('stream: scan size limit exceeded ERROR\0',[]));
 await assert.rejects(scanBuffer(Buffer.from('data'),'scanner'));
});
