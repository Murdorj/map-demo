# MNB Viewership Map (Mongolia)

Монгол Улсын аймаг бүрийн МҮОНТ (MNB) сувгийн үзэлтийг **интерактив газрын зураг** дээр харуулдаг бүрэн-stack апп.

- **Frontend:** Next.js (App Router), React, TailwindCSS, react-map-gl (Mapbox)  
- **Backend:** Express + TypeScript, MongoDB (Mongoose)  
- **Data:** GADM-ээс боловсруулсан аймгуудын хил (`public/mongolia_aimags.json`), үзэлтийн demo дата (MongoDB)  

---

## 🚀 Гол боломжууд

- Аймаг тус бүрийг **choropleth** (үзэлтийн интервалын дагуу будагдалт) эсвэл **distinct** (өөр өөр өнгөт) хэлбэрээр харах  
- Картад **hover** хийхэд нэр, үзэлт бүхий **popup**  
- **Top 5** аймаг (өндөр үзэлт)  
- **Overall** хүснэгт (өсөх/буурахаар эрэмбэлнэ)  
- Үзэлтийг **пер 1000 өрхөөр нормчлох** горим  
- Сар сонгож **фильтрлэх**  

---

## ⚙️ Суурилуулалт (Local dev)

### 1) Шаардлага
- Node.js **18+**
- npm (эсвэл pnpm/yarn)
- MongoDB (локал эсвэл контейнер)

### 2) Backend тохиргоо

`.env`:

```env
PORT=8000
CORS_ORIGIN=http://localhost:3000
MONGODB_URI=mongodb://admin:secret@localhost:27017/mnb?authSource=admin

Mongo-г Podman/Docker-оор ажиллуулах:

```
podman run -d --name mongo -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=secret \
  docker.io/mongo:7

Backend-ийг асаах:

```
cd backend
npm i
npm run dev

Demo дата seed хийх:

```
npm run seed

### 3) Frontend тохиргоо

.env.local:

```
NEXT_PUBLIC_API_BASE=http://localhost:8000
NEXT_PUBLIC_MAPBOX_TOKEN=pk.XXXXXXXXXXXX...

Frontend-ийг асаах:

```
npm i
npm run dev
# http://localhost:3000

---

API
GET /api/viewership

- Query params:

- date: YYYY-MM

- normalized=1

Жишээ хариу:

```
{
  "date": "2025-08",
  "metric": "views",
  "data": [
    { "aimag_slug": "ulaanbaatar", "views": 73903, "per_1000": 3325.5 },
    { "aimag_slug": "arkhangai", "views": 65707, "per_1000": 7873.8 }
  ]
}

GeoJSON хөрвүүлэлт

public/mongolia_aimags.json нь GADM-ээс боловсруулсан хил. Хэрэв өөрөө хөрвүүлэх бол:

```
npx mapshaper gadm41_MNG_1.json \
  -each 'name = NL_NAME_1 || NAME_1;
         slug = (name.normalize("NFKD")
                   .replace(/[\u0300-\u036f]/g,"")
                   .replace(/[^A-Za-z0-9\s-]/g,"")
                   .trim()
                   .replace(/\s+/g,"-")
                   .toLowerCase());
         if (slug==="bayan-olgii") slug="bayan-ulgii";
         if (slug==="govi-altay") slug="govi-altai";
         if (slug==="hovsgol") slug="khuvsgul";
         if (slug==="uvurhangai") slug="uvurkhangai";
         if (slug==="suhbaatar") slug="sukhbaatar";
         if (slug==="darhan-uul") slug="darkhan-uul";
         if (slug==="govisumber") slug="govisumber";
         if (slug==="tuv-aimag"||slug==="tov") slug="tuv";
         if (slug==="umnogovi"||slug==="omnogovi") slug="umnugovi";
         if (slug==="orkhon-aimag") slug="orkhon";
         if (slug==="ulaanbaatar-hot") slug="ulaanbaatar";' \
  -simplify 10% keep-shapes \
  -o format=geojson precision=0.0001 public/mongolia_aimags.json

---

Frontend компонентууд

- MapView.tsx — Газрын зураг (Choropleth/Distinct, popup, хил)

- Legend.tsx — Өнгөний тайлбар

- TopFive.tsx — Топ 5 аймаг

- OverallTable.tsx — Бүх аймаг (sort боломжтой)

---

Түгээмэл асуудал

- Mapbox карт харагдахгүй → NEXT_PUBLIC_MAPBOX_TOKEN шалгах

- /mongolia_aimags.json 404 → public/ хавтсанд байгаа эсэх

- Popup error → import { Popup } from 'react-map-gl' мартсан эсэх
