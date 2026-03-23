import { Component, inject } from '@angular/core';
import { SvgReplaceDirective } from "../../../shared/directives/svgReplace.directive";
export interface TimelineItem {
  badgeType: 'icon' | 'image';
  badgeValue: string; // icon class or image path
  title: string;
  body: string;
  image?: string; // optional image/video
  video?: boolean; // optional image/video
  likes: number;
  date: string;
  inverted?: boolean;
}
@Component({
  selector: 'app-timeline',
  imports: [],
  templateUrl: './timeline.html',
  styleUrl: './timeline.scss'
})
export class Timeline {
  timelineItems: TimelineItem[] = [
    {
      badgeType: 'image',
      badgeValue: './assets/images/faces/3.jpg',
      title: 'Art Ramadani posted a status update',
      body: 'Tolerably earnestly middleton extremely distrusts she boy now not. Add and offered prepare how cordial two promise. Greatly who affixed suppose but enquire compact prepare all put. Added forth chief trees but rooms think may.',
      likes: 19,
      date: '19 Oct 2020'
    },
    {
      badgeType: 'icon',
      badgeValue: 'las la-business-time',
      title: 'Job Meeting',
      body: 'You have a meeting at Laborator Office Today.',
      likes: 25,
      date: '10th Oct 2020',
      inverted: true
    },
    {
      badgeType: 'icon',
      badgeValue: 'las la-user-circle',
      title: 'Arlind Nushi checked in at New York',
      body: 'Alpha 5 has arrived just over a month after Alpha 4 with some major feature improvements and a boat load of bug fixes.',
      likes: 19,
      date: '8th June 2021'
    },
    {
      badgeType: 'image',
      badgeValue: './assets/images/faces/12.jpg',
      title: 'Eroll Maxhuni uploaded 4 new photos to album Summer Trip',
      body: 'Pianoforte principles our unaffected not for astonished travelling are particular.',
      image: "./assets/images/media/media-94.jpg",
      likes: 19,
      date: '27th Sep 2021',
      inverted: true
    },
    {
      badgeType: 'icon',
      badgeValue: 'las la-envelope-open-text',
      title: 'Support Team sent you an email',
      body: 'Etsy doostang zoodles disqus groupon greplin oooj voxy zoodles, weebly ning heekya handango imeem plugg dopplr jibjab, movity jajah plickers sifteo edmodo ifttt zimbra. Babblely odeo kaboodle quora plaxo ideeli hulu weebly balihoo....',
      likes: 25,
      date: '25th Oct 2021'
    },
    {
      badgeType: 'image',
      badgeValue: './assets/images/faces/15.jpg',
      title: 'Mr. Doe shared a video',
      body: '',
      video: true,
      likes: 32,
      date: '19th Oct 2020',
      inverted: true
    },
    {
      badgeType: 'icon',
      badgeValue: 'las la-check-circle',
      title: 'Sarah Young accepted your friend request',
      body: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Amet cupiditate, delectus deserunt doloribus earum eveniet explicabo fuga iste magni maxime',
      likes: 26,
      date: '12th Dec 2021'
    }
  ];



}


