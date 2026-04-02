import { Routes } from '@angular/router';

export const advanceduiRoutingModule: Routes = [
  {
    path: 'advanced-ui', children: [
      {
        path: 'accordion-collapse',
        loadComponent: () => import('./accordion-collapse/accordion-collapse').then((m) => m.AccordionCollapse),
        title: 'Nowa - Accordions  & collapse',
        data: { parentTitle: 'Advanced Ui', subParentTitle: '', childTitle: 'Accordions  & collapse' }
      },
      {
        path: 'carousel',
        loadComponent: () => import('./carousel/carousel').then((m) => m.Carousel),
        title: 'Nowa - Carousel',
        data: { parentTitle: 'Advanced Ui', subParentTitle: '', childTitle: 'Carousel' }
      },
      {
        path: 'draggable-cards',
        loadComponent: () => import('./draggable-cards/draggable-cards').then((m) => m.DraggableCards),
        title: 'Nowa - Draggable Cards',
        data: { parentTitle: 'Advanced Ui', subParentTitle: '', childTitle: 'Draggable Cards' }
      },
      {
        path: 'modals-closes',
        loadComponent: () => import('./modals-closes/modals-closes').then((m) => m.ModalsCloses),
        title: 'Nowa - Modals & Closes',
        data: { parentTitle: 'Advanced Ui', subParentTitle: '', childTitle: ' Modals & Closes' }
      },
      {
        path: 'placeholders',
        loadComponent: () => import('./placeholders/placeholders').then((m) => m.Placeholders),
        title: 'Nowa - Placeholders',
        data: { parentTitle: 'Advanced Ui', subParentTitle: '', childTitle: 'Placeholders' }
      },
      {
        path: 'navbar',
        loadComponent: () => import('./navbar/navbar').then((m) => m.Navbar),
        title: 'Nowa - Navbar',
        data: { parentTitle: 'Advanced Ui', subParentTitle: '', childTitle: 'Navbar' }
      },
      {
        path: 'offcanvas',
        loadComponent: () => import('./offcanves/offcanves').then((m) => m.Offcanves),
        title: 'Nowa - Offcanvas',
        data: { parentTitle: 'Advanced Ui', subParentTitle: '', childTitle: 'Offcanvas' }
      },
      {
        path: 'rating',
        loadComponent: () => import('./ratings/ratings').then((m) => m.Ratings),
        title: 'Nowa - Ratings',
        data: { parentTitle: 'Advanced Ui', subParentTitle: '', childTitle: 'Ratings' }
      },
      {
        path: 'scrollspy',
        loadComponent: () => import('./scrollspy/scrollspy').then((m) => m.Scrollspy),
        title: 'Nowa - Scrollspy',
        data: { parentTitle: 'Advanced Ui', subParentTitle: '', childTitle: 'Scrollspy' }
      },
      {
        path: 'swiper-element',
        loadComponent: () => import('./swiper-js/swiper-js').then((m) => m.SwiperJs),
        title: 'Nowa - Swiper Element',
        data: { parentTitle: 'Advanced Ui', subParentTitle: '', childTitle: 'Swiper Element' }
      },
      {
        path: 'timeline',
        loadComponent: () => import('./timeline/timeline').then((m) => m.Timeline),
        title: 'Nowa - Timeline',
        data: { parentTitle: 'Advanced Ui', subParentTitle: '', childTitle: 'Timeline' }
      },
      {
        path: 'search',
        loadComponent: () => import('./search/search').then((m) => m.Search),
        title: 'Nowa - Search',
        data: { parentTitle: 'Advanced Ui', subParentTitle: '', childTitle: 'Search' }
      },
      {
        path: 'userlist',
        loadComponent: () => import('./userlist/userlist').then((m) => m.Userlist),
        title: 'Nowa - Userlist',
        data: { parentTitle: 'Advanced Ui', subParentTitle: '', childTitle: 'Userlist' }
      },
      {
        path: 'blog',
        loadComponent: () => import('./blog/blog').then((m) => m.Blog),
        title: 'Nowa - Blog',
        data: { parentTitle: 'Advanced Ui', subParentTitle: '', childTitle: 'Blog' }
      },
      {
        path: 'blog-details',
        loadComponent: () => import('./blog-details/blog-details').then((m) => m.BlogDetails),
        title: 'Nowa - Blog-details',
        data: { parentTitle: 'Advanced Ui', subParentTitle: '', childTitle: 'Blog-details' }
      },
      {
        path: 'edit-post',
        loadComponent: () => import('./edit-post/edit-post').then((m) => m.EditPost),
        title: 'Nowa - edit-post',
        data: { parentTitle: 'Advanced Ui', subParentTitle: '', childTitle: ' edit-post' }
      },
    ]
  }
];
