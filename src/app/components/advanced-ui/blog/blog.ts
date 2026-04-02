import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-blog',
  imports: [RouterModule],
  templateUrl: './blog.html',
  styleUrl: './blog.scss'
})
export class Blog {
  blogItems = [
    {
      title: 'Tourism',
      description: 'Explore tourism by visiting places.',
      timeAgo: '2 days ago',
      imageSrc: './assets/images/photos/blog1.jpg'  // keep your original or replace
    },
    {
      title: 'Beautician',
      description: 'Beautification courses are available.',
      timeAgo: '2 hrs ago',
      imageSrc: './assets/images/photos/blog2.jpg'
    },
    {
      title: 'Music',
      description: 'Music in a peaceful way.',
      timeAgo: '1 day ago',
      imageSrc: './assets/images/photos/blog5.jpg'
    },
    {
      title: 'Literature',
      description: 'English and spanish classes in Your way',
      timeAgo: '1 week ago',
      imageSrc: './assets/images/photos/blog4.jpg'
    },
    {
      title: 'Health',
      description: 'Health care and fitness awareness.',
      timeAgo: '22 hrs ago',
      imageSrc: './assets/images/photos/blog6.jpg'
    }
  ];
  activities = [
    {
      name: 'Samantha Melon',
      userId: '#1234',
      avatarSrc: './assets/images/faces/3.jpg',
      timeAgo: '8 hrs ago',
      badgeClass: 'success'
    },
    {
      name: 'Allie Grater',
      userId: '#1234',
      avatarSrc: './assets/images/faces/11.jpg',
      timeAgo: '12 hrs ago',
      badgeClass: 'danger'
    },
    {
      name: 'Gabe Lackmen',
      userId: '#1234',
      avatarSrc: './assets/images/faces/17.jpg',
      timeAgo: '1 hr ago',
      badgeClass: 'danger'
    },
    {
      name: 'Manuel Labor',
      userId: '#1234',
      avatarSrc: './assets/images/faces/15.jpg',
      timeAgo: '3 days ago',
      badgeClass: 'success'
    },
    {
      name: 'Cedric Kelly',
      userId: '#1234',
      avatarSrc: './assets/images/faces/13.jpg',
      timeAgo: '22 hrs ago',
      badgeClass: 'danger'
    },
    {
      name: 'Julian Kerr',
      userId: '#1234',
      avatarSrc: './assets/images/faces/14.jpg',
      timeAgo: '1 day ago',
      badgeClass: 'danger'
    }
  ];
}


