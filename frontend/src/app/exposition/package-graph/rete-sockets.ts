import { Socket } from 'rete';

export const voidSocket = new Socket('Void');
export const boolSocket = new Socket('Bool');
export const integerSocket = new Socket('Integer');
export const floatSocket = new Socket('Float');
export const stringSocket = new Socket('String');

export const vector2Socket = new Socket('Vector2');
export const vector3Socket = new Socket('Vector3');