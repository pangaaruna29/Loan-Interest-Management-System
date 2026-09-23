import { Routes } from '@angular/router';
import { ClientDetails } from './client-details/client-details';
import { ClientForm } from './client-form/client-form';
import { Homepage } from './homepage/homepage';

export const routes: Routes = [
    {path:'',component:Homepage},
    {path:'clientDetails',component:ClientDetails},
    {path:'clientform',component:ClientForm}
];
