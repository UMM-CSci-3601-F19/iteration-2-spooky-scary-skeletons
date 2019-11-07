import {Component, OnInit, NgModule} from '@angular/core';
import {Room} from './room';
import {Machine} from './machine';
import {Observable} from 'rxjs';
import {HomeService} from './home.service';
import {AuthService} from "../auth.service";

declare let gapi: any;

@Component({
  templateUrl: 'home.component.html',
  styleUrls: ['./home.component.css']
})

export class HomeComponent implements OnInit {

  /*
   * This is a switch for the E2E test
   * before running the tests
   * set autoRefresh to be true,
   * after testing, set the boolean
   * back to true in order to make
   * the functionailty works.
   */
  private autoRefresh = true;

  public machineListTitle: string;
  public brokenMachineListTitle: string;
  public rooms: Room[];
  public machines: Machine[];
  public filteredMachines: Machine[];
  public numOfBroken: number;
  public numOfWashers: number;
  public numOfDryers: number;
  private highlightedID: string = '';

  public roomId: string;
  public roomName: string;
  public selectorState: number;

  public auth: AuthService;
  public text: string;
  public buttonSource1: string;

  constructor(public homeService: HomeService) {
    this.machineListTitle = 'available within all rooms';
    this.brokenMachineListTitle = 'Unavailable machines within all rooms';
  }

  setSelector(state: number) {
    this.selectorState = state;
  }

  isHighlighted(machine: Machine): boolean {
    return machine.id['$oid'] === this.highlightedID;
  }

  public updateRoom(newId: string, newName: string): void {
    this.roomId = newId;
    this.roomName = newName;
    this.machineListTitle = 'available within ' + this.roomName;
    this.brokenMachineListTitle = 'Unavailable machines within ' + this.roomName;
    this.updateMachines();
    this.setSelector(1);
  }

  private updateMachines(): void {
    if (this.roomId == null || this.roomId === '') {
      this.filteredMachines = this.machines;
    } else {
      this.filteredMachines = this.machines.filter(machine => machine.room_id === this.roomId);
    }
    this.homeService.updateRunningStatus(this.filteredMachines, this.machines);
    if (this.filteredMachines !== undefined) {
      this.numOfBroken = this.filteredMachines.filter(m => m.status === 'broken').length;
      this.numOfWashers = this.filteredMachines.filter(m => m.status === 'normal' && m.type === 'washer').length;
      this.numOfDryers = this.filteredMachines.filter(m => m.status === 'normal' && m.type === 'dryer').length;
    }
  }

  loadAllMachines(): void {
    const machines: Observable<Machine[]> = this.homeService.getMachines();
    machines.subscribe(
      // tslint:disable-next-line:no-shadowed-variable
      machines => {
        this.machines = machines;
      },
      err => {
        console.log(err);
      });
  }

  loadAllRooms(): void {
    const rooms: Observable<Room[]> = this.homeService.getRooms();
    rooms.subscribe(
      // tslint:disable-next-line:no-shadowed-variable
      rooms => {
        this.rooms = rooms;
      },
      err => {
        console.log(err);
      });
  }

  initGapi(): void {
    this.auth.loadClient();
  }

  ngOnInit(): void {
    (async () => {
      this.setSelector(0);
      this.loadAllRooms();
      this.loadAllMachines();

      await this.delay(1000); // wait 1s for loading data

      this.updateMachines();
      this.homeService.updateAvailableMachineNumber(this.rooms, this.machines);
      this.updateTime();
    }) ();
    this.initGapi();
  }

  updateTime(): void {
    (async () => {
      this.loadAllMachines();
      this.homeService.updateRunningStatus(this.filteredMachines, this.machines);
      this.homeService.updateAvailableMachineNumber(this.rooms, this.machines);
      if (this.autoRefresh) {
        await this.delay(60000); // hold 60s for the next refresh
        console.log('Refresh');
        this.updateTime();
      }
    }) ();
  }

  delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
  }
}
