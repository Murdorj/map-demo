import { connectDB } from '../db';
import { Aimag } from '../models/Aimag';
import { Viewership } from '../models/Viewership';


const AIMAGS = [
['arkhangai','Архангай'],['bayan-ulgii','Баян‑Өлгий'],['bayankhongor','Баянхонгор'],
['bulgan','Булган'],['darkhan-uul','Дархан‑Уул'],['dornod','Дорнод'],['dornogovi','Дорноговь'],
['dundgovi','Дундговь'],['govi-altai','Говь‑Алтай'],['govisumber','Говьсүмбэр'],['khentii','Хэнтий'],
['khovd','Ховд'],['khuvsgul','Хөвсгөл'],['orkhon','Орхон'],['umnugovi','Өмнөговь'],
['uvurkhangai','Өвөрхангай'],['selenge','Сэлэнгэ'],['sukhbaatar','Сүхбаатар'],['tuv','Төв'],
['uvs','Увс'],['zavkhan','Завхан'],['ulaanbaatar','Улаанбаатар']
] as const;


function rnd(min:number,max:number){return Math.floor(Math.random()*(max-min+1))+min}


async function run(){
await connectDB();


await Aimag.deleteMany({});
await Viewership.deleteMany({});


// households: жишээ тоонууд (сүүлд албан статистикаар солино)
const aimagDocs = AIMAGS.map(([slug,name])=>({ slug, name, households: rnd(6000, 30000) }));
await Aimag.insertMany(aimagDocs);


const monthsBack = 3; // 3 сарын дата
const now = new Date();
const docs:any[] = [];
for(let m=0;m<monthsBack;m++){
const d = new Date(now.getFullYear(), now.getMonth()-m, 1);
for(const [slug] of AIMAGS){
docs.push({ aimag_slug: slug, date: d, views: rnd(4000, 320000), source: 'MNB' });
}
}
await Viewership.insertMany(docs);
console.log('Seeded aimags & viewership');
process.exit(0);
}
run();