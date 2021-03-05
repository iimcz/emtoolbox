import { Component, OnInit } from '@angular/core';
import { EventType } from '../model/event-message';
import { ConnectionClient } from '../services/api.generated.service';
import { EventSocketService } from '../services/event-socket.service';

@Component({
  selector: 'app-client-list',
  templateUrl: './client-list.component.html',
  styleUrls: ['./client-list.component.css']
})
export class ClientListComponent implements OnInit {
  pendingClients: string[];
  connectedClients: string[];

  constructor(private connectionClient: ConnectionClient,
    private eventSocket: EventSocketService) { }

  ngOnInit(): void {
    this.reloadData();

    this.eventSocket.subscribeEvent(EventType.ConnectionsUpdated).subscribe(
      (_) => {
        this.reloadData();
      }
    )
  }

  reloadData(): void {
    this.connectionClient.getPending().toPromise().then((data) => {
      this.pendingClients = data;
    })
    this.connectionClient.getConnected().toPromise().then((data) => {
      this.connectedClients = data;
    })
  }

  acceptPending(pending: string) {
    this.connectionClient.acceptPending(pending).toPromise().then(() => this.reloadData());
  }
}
