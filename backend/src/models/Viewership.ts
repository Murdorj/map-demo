import { Schema, model } from 'mongoose';


const ViewSchema = new Schema({
aimag_slug: { type: String, required: true, index: true },
date: { type: Date, required: true, index: true },
views: { type: Number, required: true },
source: { type: String, default: 'MNB' },
created_at: { type: Date, default: () => new Date() }
});
ViewSchema.index({ aimag_slug: 1, date: 1 }, { unique: true });


export type ViewershipDoc = {
aimag_slug: string;
date: Date;
views: number;
source?: string;
};


export const Viewership = model('Viewership', ViewSchema);