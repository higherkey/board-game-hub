import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthComponent } from './auth.component';
import { AuthService } from '../../services/auth.service';
import { Router, provideRouter } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';

describe('AuthComponent', () => {
  let component: AuthComponent;
  let fixture: ComponentFixture<AuthComponent>;
  let mockAuthService: any;
  let mockRouter: any;

  beforeEach(async () => {
    mockAuthService = {
      isAuthenticated: jasmine.createSpy('isAuthenticated').and.returnValue(false),
      login: jasmine.createSpy('login').and.returnValue(of({ token: 'abc' }))
    };

    await TestBed.configureTestingModule({
      imports: [AuthComponent, ReactiveFormsModule],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService }
      ]
    })
      .compileComponents();

    mockRouter = TestBed.inject(Router);
    spyOn(mockRouter, 'navigate');
  });

  it('should create', () => {
    fixture = TestBed.createComponent(AuthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should redirect if already authenticated', () => {
    mockAuthService.isAuthenticated.and.returnValue(true);
    fixture = TestBed.createComponent(AuthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should show error if form is invalid on submit', () => {
    fixture = TestBed.createComponent(AuthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.loginForm.controls['email'].setValue('');
    component.onSubmit();
    expect(mockAuthService.login).not.toHaveBeenCalled();
    expect(component.loginForm.valid).toBeFalse();
  });

  it('should call login on valid submit and redirect', () => {
    fixture = TestBed.createComponent(AuthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.loginForm.controls['email'].setValue('test@test.com');
    component.loginForm.controls['password'].setValue('123456');

    component.onSubmit();

    expect(mockAuthService.login).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should handle login error', () => {
    mockAuthService.login.and.returnValue(throwError(() => new Error('Failed')));
    fixture = TestBed.createComponent(AuthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.loginForm.controls['email'].setValue('test@test.com');
    component.loginForm.controls['password'].setValue('123456');

    component.onSubmit();

    expect(component.errorMessage).toBe('Invalid email or password');
    expect(component.isLoading).toBeFalse();
  });
});
