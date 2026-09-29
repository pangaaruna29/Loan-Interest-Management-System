import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Header } from './header';
import { AuthService } from '../../services/auth.service';

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header],
    }).compileComponents();

    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show the username as soon as the current user changes', () => {
    TestBed.inject(AuthService).setCurrentUser({ username: 'Taylor' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Taylor');
  });
});
