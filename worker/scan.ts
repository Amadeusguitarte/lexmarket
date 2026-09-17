import net from 'node:net';
export function scanBuffer(bytes:Buffer,host:string,port=3310):Promise<boolean> {
 return new Promise((resolve,reject)=>{
  const socket=net.createConnection({host,port}),chunks:Buffer[]=[];
  const finish=(error?:Error,clean=false)=>{socket.destroy();error?reject(error):resolve(clean);};
  socket.setTimeout(60000,()=>finish(new Error('Scanner timeout')));
  socket.on('error',e=>finish(e));
  socket.on('connect',()=>{
   socket.write('zINSTREAM\0');
   for(let i=0;i<bytes.length;i+=65536){const chunk=bytes.subarray(i,i+65536),size=Buffer.alloc(4);size.writeUInt32BE(chunk.length);socket.write(size);socket.write(chunk);}
   socket.write(Buffer.alloc(4));
  });
  socket.on('data',chunk=>{chunks.push(chunk);const response=Buffer.concat(chunks);if(response.length>2048){finish(new Error('Invalid scanner reply'));return;}if(response.includes(0)||response.includes(10)){const text=response.toString().replace(/\0/g,'').trim();if(text==='stream: OK')finish(undefined,true);else if(text.endsWith(' FOUND'))finish(undefined,false);else finish(new Error('Scan incomplete'));}});
  socket.on('end',()=>finish(new Error('Scanner closed without verdict')));
 });
}
