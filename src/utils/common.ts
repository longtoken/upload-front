import {CancelTokenSource} from 'axios';

export const CHUNK_SIZE = 2097152;

export let axiosList: CancelTokenSource[] = [];