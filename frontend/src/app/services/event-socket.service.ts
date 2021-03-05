import { Optional } from '@angular/core';
import { InjectionToken } from '@angular/core';
import { Inject } from '@angular/core';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { share } from 'rxjs/operators';
import { WebSocketSubject, webSocket } from 'rxjs/webSocket';
import { EventMessage, EventType } from '../model/event-message';

export const WS_BASE_URL = new InjectionToken<string>('WS_BASE_URL');

@Injectable({
  providedIn: 'root'
})
export class EventSocketService {
  public socket: WebSocketSubject<EventMessage>;

  constructor(@Optional() @Inject(WS_BASE_URL) baseUrl?: string) {
    this.socket = webSocket(WS_BASE_URL + '/events');
  }

  /**
   * subscribeEvent
   */
  public subscribeEvent(event: EventType) : Observable<EventMessage> {
    return this.socket.multiplex(() => null, () => null, (msg) => {
      return msg.Type === event;
    }).pipe(share());
  }
}
