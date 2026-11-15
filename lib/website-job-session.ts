import {filterWebsiteJobs,type WebsiteJob} from './verified-website-jobs';
import type {SearchConditions} from './grounded-search';

/** URL-key merge that keeps the first occurrence (prior session jobs win over later batches). */
export function mergeUniqueJobs(...lists:Array<Array<Partial<WebsiteJob>|null|undefined>>){
 return [...new Map(lists.flat().filter((j):j is Partial<WebsiteJob>&{url:string}=>!!j?.url).map(j=>[j.url,j as WebsiteJob])).values()];
}

/** Additive Tavily/load-more: keep catalog + current + novel. New discover replaces with the request batch only. */
export function mergeSearchBatch(opts:{
 additive:boolean;
 catalog:WebsiteJob[];
 jobs:WebsiteJob[];
 next:WebsiteJob[];
 overflow:WebsiteJob[];
 held:WebsiteJob[];
 excludedUrls?:string[];
}){
 const {additive,catalog,jobs,next,overflow,held,excludedUrls=[]}=opts;
 const dead=new Set(excludedUrls);
 const merged=additive?mergeUniqueJobs(catalog,jobs,next):next;
 const nextOverflow=mergeUniqueJobs(additive?overflow:[],held).filter(j=>!merged.some(x=>x.url===j.url));
 const saved=additive
  ? mergeUniqueJobs(catalog.filter(j=>!dead.has(j.url)),merged,nextOverflow).slice(-1000)
  : mergeUniqueJobs(merged,nextOverflow).slice(-1000);
 return {merged,nextOverflow,saved};
}

export function sessionMatchTotals(list:WebsiteJob[],c:Partial<SearchConditions>,carry:WebsiteJob[]){
 const live=filterWebsiteJobs(list,c,{allowStale:true});
 return {
  matched:live.length,
  displayed:live.length,
  deferred:carry.length,
  accumulated:list.length,
  sourceCounts:Object.fromEntries([...new Set(live.map(j=>j.source))].map(source=>[source,live.filter(j=>j.source===source).length])),
 };
}

/** Request-level stats: body-verified must cover Tavily + discover; matched is post-merge valid count. */
export function combineRequestStats(opts:{
 tavilyScanned:number;
 tavilyVerified:number;
 tavilyMatched:number;
 tavilyDupes:number;
 tavilyMismatch:number;
 discoverScanned:number;
 discoverVerified:number;
 discoverMatched:number;
 discoverDupes:number;
 discoverMismatch:number;
 validCount:number;
}){
 const scanned=opts.tavilyScanned+opts.discoverScanned;
 const verified=opts.tavilyVerified+opts.discoverVerified;
 return {
  scanned,
  verified,
  matched:opts.validCount,
  duplicatesExcluded:opts.tavilyDupes+opts.discoverDupes,
  filterMismatched:opts.tavilyMismatch+opts.discoverMismatch,
  coherent:verified>=opts.validCount||opts.validCount===0,
 };
}
