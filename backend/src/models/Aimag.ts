import { Schema, model } from 'mongoose';


const AimagSchema = new Schema({
slug: { type: String, required: true, unique: true },
name: { type: String, required: true },
households: { type: Number, default: 0 }
}, { timestamps: true });


export type AimagDoc = {
slug: string;
name: string;
households: number;
};


export const Aimag = model('Aimag', AimagSchema);