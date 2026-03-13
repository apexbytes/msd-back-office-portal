import { Component } from '@angular/core';
import { InitialsPipe } from '../../../core/pipe/initials.pipe';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [InitialsPipe],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
})
export class UsersComponent {}
