import { Routes } from '@angular/router';
import { ClientDetails } from './pages/client-details/client-details';
import { ClientForm } from './pages/client-form/client-form';
import { Homepage } from './pages/homepage/homepage';
import { Header } from './pages/header/header';
import { Loginpage } from './pages/loginpage/loginpage';
import { Signuppage } from './pages/signuppage/signuppage';

export const routes: Routes = [
    {path:'header',component:Header},
    {path:'',component:Homepage},
    {path:'login',component:Loginpage},
    {path:'signup',component:Signuppage},
    {path:'clientDetails',component:ClientDetails},
    {path:'newClient',component:ClientForm}
];
