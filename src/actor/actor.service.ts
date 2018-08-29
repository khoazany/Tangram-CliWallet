import { Injectable } from '@nestjs/common';
import { Kadence } from '../kadence/kadence.service';


@Injectable() 
export class Actor {
    
    constructor(private readonly kad: Kadence) {
    }
}