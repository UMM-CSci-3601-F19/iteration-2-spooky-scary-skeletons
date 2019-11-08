import {TestBed, ComponentFixture, async} from '@angular/core/testing';
import {HomeComponent} from './home.component';
import {DebugElement} from '@angular/core';
import {By} from '@angular/platform-browser';
import {CustomModule} from '../custom.module';
import {HomeService} from './home.service';
import {Machine} from './machine';
import {Room} from './room';
import {Observable} from 'rxjs';

describe('Home page', () => {

  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  let homeServiceStub: {
    getRooms: () => Observable<Room[]>;
    getMachines: () => Observable<Machine[]>;
    updateRunningStatus;
  };

  // @ts-ignore
  beforeEach(() => {
    homeServiceStub = {
      getMachines: () => Observable.of([{
        id: 'id_1',
        running: false,
        status: 'normal',
        room_id: 'room_a',
        type: 'washer',
        name: 'cool_washer',
        remainingTime: -1,
        vacantTime: 10,
      }, {
        id: 'string',
        running: false,
        status: 'normal',
        room_id: 'room_b',
        type: 'dryer',
        name: 'cool_dryer',
        remainingTime: 10,
        vacantTime: -1,
      }]),
      getRooms: () => Observable.of([{
        id: 'room_a',
        name: 'A',

        numberOfAllMachines: null,
        numberOfAvailableMachines: null,
      }, {
        id: 'room_b',
        name: 'B',

        numberOfAllMachines: null,
        numberOfAvailableMachines: null,
      }, ]),
      updateRunningStatus: () => null,
    };

    TestBed.configureTestingModule({
      imports: [CustomModule],
      declarations: [HomeComponent], // declare the test component
      providers: [{provide: HomeService, useValue: homeServiceStub}]
    });

    fixture = TestBed.createComponent(HomeComponent);

    component = fixture.componentInstance; // BannerComponent test instance
  });

  it('update room info when a new room is selected', () => {
    const machines: Observable<Machine[]> = homeServiceStub.getMachines();
    machines.subscribe(
      // tslint:disable-next-line:no-shadowed-variable
      machines => {
        component.machines = machines;
      });
    component.updateRoom('room_b', 'B');
    expect(component.roomId).toBe('room_b');
    expect(component.roomName).toBe('B');
  });

  it('update machines with a new room id', () => {
    const machines: Observable<Machine[]> = homeServiceStub.getMachines();
    machines.subscribe(
      // tslint:disable-next-line:no-shadowed-variable
      machines => {
        component.machines = machines;
      });
    component.updateRoom('room_a', 'A');
    expect(component.filteredMachines.length).toBe(1);
    expect(component.filteredMachines[0].id).toBe('id_1');
  });

  it('load all the machines', () => {
    const machines: Observable<Machine[]> = homeServiceStub.getMachines();
    machines.subscribe(
      // tslint:disable-next-line:no-shadowed-variable
      machines => {
        component.machines = machines;
      });
    expect(component.machines.length).toBe(2);
  });

  it('load all the rooms', () => {
    const rooms: Observable<Room[]> = homeServiceStub.getRooms();
    rooms.subscribe(
      // tslint:disable-next-line:no-shadowed-variable
      rooms => {
        component.rooms = rooms;
      });
    expect(component.rooms.length).toBe(2);
  });

  it('should load and update the time remaining', () => {
    let spy = spyOn(component, 'ngOnInit');
    component.ngOnInit();
    expect(spy).toHaveBeenCalled();
    spy = spyOn(component, 'updateTime');
    component.updateTime();
    expect(spy).toHaveBeenCalled();
  });
});
