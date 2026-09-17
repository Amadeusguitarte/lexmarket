// Separate bounded process: parsers never run in the web server or worker parent.
import mammoth from 'mammoth';
import pdf from 'pdf-parse/lib/pdf-parse.js';
const chunks:Buffer[]=[];let size=0;
for await (const chunk of process.stdin){size+=chunk.length;if(size>10485760)throw new Error('Input too large');chunks.push(chunk);}
const buffer=Buffer.concat(chunks),mime=process.argv[2];
let text='';
if(mime==='text/plain')text=buffer.toString('utf8');
else if(mime==='application/pdf')text=(await pdf(buffer,{max:150})).text;
else if(mime==='application/vnd.openxmlformats-officedocument.wordprocessingml.document')text=(await mammoth.extractRawText({buffer})).value;
else throw new Error('Unsupported type');
process.stdout.write(text.replace(/\u0000/g,'').slice(0,100000));
