import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewClient } from './view-client';

describe('ViewClient', () => {
  let component: ViewClient;
  let fixture: ComponentFixture<ViewClient>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewClient],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewClient);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
