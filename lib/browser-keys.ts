'use client';

const TAVILY_KEY='atlas-browser-tavily-key';
const TAVILY_CONSENT='atlas-browser-tavily-consent';
const GEMINI_KEY='atlas-browser-gemini-key';
const GEMINI_CONSENT='atlas-browser-gemini-consent';
const GEMINI_MODEL='atlas-browser-gemini-model';

function read(key:string){
 if(typeof localStorage==='undefined')return '';
 try{return String(localStorage.getItem(key)||'')}catch{return ''}
}
function write(key:string,value:string){
 if(typeof localStorage==='undefined')return;
 try{localStorage.setItem(key,value)}catch{/* ignore quota / private mode */}
}
function remove(key:string){
 if(typeof localStorage==='undefined')return;
 try{localStorage.removeItem(key)}catch{/* ignore */}
}

export function getTavilyBrowserKey(){return read(TAVILY_KEY).trim()}
export function getTavilyBrowserConsent(){return read(TAVILY_CONSENT)==='1'}
export function hasTavilyBrowserKey(){return getTavilyBrowserKey().length>=20&&getTavilyBrowserConsent()}
export function saveTavilyBrowserKey(key:string,consent:boolean){
 const trimmed=String(key||'').trim();
 write(TAVILY_KEY,trimmed);
 write(TAVILY_CONSENT,consent?'1':'0');
}
export function clearTavilyBrowserKey(){
 remove(TAVILY_KEY);
 remove(TAVILY_CONSENT);
}

export function getGeminiBrowserKey(){return read(GEMINI_KEY).trim()}
export function getGeminiBrowserConsent(){return read(GEMINI_CONSENT)==='1'}
export function getGeminiBrowserModel(){return read(GEMINI_MODEL).trim()||'gemini-2.5-flash'}
export function hasGeminiBrowserKey(){return getGeminiBrowserKey().length>=20&&getGeminiBrowserConsent()}
export function saveGeminiBrowserKey(key:string,consent:boolean,model?:string){
 const trimmed=String(key||'').trim();
 write(GEMINI_KEY,trimmed);
 write(GEMINI_CONSENT,consent?'1':'0');
 if(model)write(GEMINI_MODEL,String(model).trim());
}
export function clearGeminiBrowserKey(){
 remove(GEMINI_KEY);
 remove(GEMINI_CONSENT);
}
