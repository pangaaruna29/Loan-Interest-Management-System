import { Routes } from '@angular/router';
import { ClientDetails } from './pages/client-details/client-details';
import { ClientForm } from './pages/client-form/client-form';
import { Homepage } from './pages/homepage/homepage';
import { Header } from './pages/header/header';
import { Loginpage } from './pages/loginpage/loginpage';
import { Signuppage } from './pages/signuppage/signuppage';
import { LogoutPage } from './pages/logout-page/logout-page';
import { ViewClient } from './pages/view-client/view-client';
import { PaymentOption } from './pages/payment-option/payment-option';

export const routes: Routes = [
    { path: 'header', component: Header },
    { path: '', component: Homepage },
    { path: 'login', component: Loginpage },
    { path: 'signup', component: Signuppage },
    { path: 'logout', component: LogoutPage },
    { path: 'clientDetails', component: ClientDetails },
    { path: 'newClient', component: ClientForm },
    { path: 'clients/edit/:id', component: ClientForm },
    { path: 'viewClient', component: ViewClient },
    { path: 'payment', component: PaymentOption }
];
