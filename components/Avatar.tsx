'use client';
import {useState} from 'react';
import {safeAvatar} from '@/lib/avatar';
export default function Avatar({name,url,large=false}:{name:string;url?:string|null;large?:boolean}){
 const [failed,setFailed]=useState(false);const src=safeAvatar(url);
 return <span className={'avatar person-avatar'+(large?' large':'')}>{src&&!failed?<img src={src} alt={'Foto de '+name} referrerPolicy="no-referrer" onError={()=>setFailed(true)}/>:name.trim().slice(0,1).toUpperCase()||'L'}</span>;
}
