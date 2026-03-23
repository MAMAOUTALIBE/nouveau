export let BasicList = {
    Html: `  <ul class="list-group">
                <li class="list-group-item">
                    <div class="d-flex align-items-center">
                        <span class="avatar avatar-sm">
                            <img src="./assets/images/faces/1.jpg" alt="img">
                        </span>
                        <div class="ms-2 fw-medium">
                            Alicia Sierra
                        </div>
                    </div>
                </li>
                <li class="list-group-item">
                    <div class="d-flex align-items-center">
                        <span class="avatar avatar-sm">
                            <img src="./assets/images/faces/3.jpg" alt="img">
                        </span>
                        <div class="ms-2 fw-medium">
                            Samantha Mery
                        </div>
                    </div>
                </li>
                <li class="list-group-item">
                    <div class="d-flex align-items-center">
                        <span class="avatar avatar-sm">
                            <img src="./assets/images/faces/6.jpg" alt="img">
                        </span>
                        <div class="ms-2 fw-medium">
                            Juliana Pena
                        </div>
                    </div>
                </li>
                <li class="list-group-item">
                    <div class="d-flex align-items-center">
                        <span class="avatar avatar-sm">
                            <img src="./assets/images/faces/15.jpg" alt="img">
                        </span>
                        <div class="ms-2 fw-medium">
                            Adam Smith
                        </div>
                    </div>
                </li>
                <li class="list-group-item">
                    <div class="d-flex align-items-center">
                        <span class="avatar avatar-sm">
                            <img src="./assets/images/faces/13.jpg" alt="img">
                        </span>
                        <div class="ms-2 fw-medium">
                            Farhaan Amhed
                        </div>
                    </div>
                </li>
            </ul>  `,
    Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-list-group',
  imports: [],
  templateUrl: './list-group.html',
  styleUrl: './list-group.scss'
})
export class ListGroupComponent {

}


    `,

}

export let ActiveItems = {
    Html: `   <ul class="list-group">
                <li class="list-group-item active" aria-current="true">
                    <div class="d-flex align-items-center">
                        <div>
                            <span class="avatar avatar-sm bg-white-transparent avatar-rounded svg-white p-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#000000"
                                    viewBox="0 0 256 256">
                                    <path d="M216,116.69V216H152V152H104v64H40V116.69l82.34-82.35a8,8,0,0,1,11.32,0Z"
                                        opacity="0.2"></path>
                                    <path
                                        d="M240,208H224V136l2.34,2.34A8,8,0,0,0,237.66,127L139.31,28.68a16,16,0,0,0-22.62,0L18.34,127a8,8,0,0,0,11.32,11.31L32,136v72H16a8,8,0,0,0,0,16H240a8,8,0,0,0,0-16ZM48,120l80-80,80,80v88H160V152a8,8,0,0,0-8-8H104a8,8,0,0,0-8,8v56H48Zm96,88H112V160h32Z">
                                    </path>
                                </svg>
                            </span>
                        </div>
                        <div class="ms-2">
                            Home
                        </div>
                    </div>
                </li>
                <li class="list-group-item">
                    <div class="d-flex align-items-center">
                        <div>
                            <span class="avatar avatar-sm bg-primary-transparent avatar-rounded svg-primary p-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#000000"
                                    viewBox="0 0 256 256">
                                    <path
                                        d="M208,192H48a8,8,0,0,1-6.88-12C47.71,168.6,56,147.81,56,112a72,72,0,0,1,144,0c0,35.82,8.3,56.6,14.9,68A8,8,0,0,1,208,192Z"
                                        opacity="0.2"></path>
                                    <path
                                        d="M224,71.1a8,8,0,0,1-10.78-3.42,94.13,94.13,0,0,0-33.46-36.91,8,8,0,1,1,8.54-13.54,111.46,111.46,0,0,1,39.12,43.09A8,8,0,0,1,224,71.1ZM35.71,72a8,8,0,0,0,7.1-4.32A94.13,94.13,0,0,1,76.27,30.77a8,8,0,1,0-8.54-13.54A111.46,111.46,0,0,0,28.61,60.32,8,8,0,0,0,35.71,72Zm186.1,103.94A16,16,0,0,1,208,200H167.2a40,40,0,0,1-78.4,0H48a16,16,0,0,1-13.79-24.06C43.22,160.39,48,138.28,48,112a80,80,0,0,1,160,0C208,138.27,212.78,160.38,221.81,175.94ZM150.62,200H105.38a24,24,0,0,0,45.24,0ZM208,184c-10.64-18.27-16-42.49-16-72a64,64,0,0,0-128,0c0,29.52-5.38,53.74-16,72Z">
                                    </path>
                                </svg>
                            </span>
                        </div>
                        <div class="ms-2">
                            Notifications
                        </div>
                    </div>
                </li>
                <li class="list-group-item">
                    <div class="d-flex align-items-center">
                        <div>
                            <span class="avatar avatar-sm bg-primary-transparent avatar-rounded svg-primary p-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#000000"
                                    viewBox="0 0 256 256">
                                    <path d="M208,128v72a8,8,0,0,1-8,8H56a8,8,0,0,1-8-8V128Z" opacity="0.2"></path>
                                    <path
                                        d="M216,72H180.92c.39-.33.79-.65,1.17-1A29.53,29.53,0,0,0,192,49.57,32.62,32.62,0,0,0,158.44,16,29.53,29.53,0,0,0,137,25.91a54.94,54.94,0,0,0-9,14.48,54.94,54.94,0,0,0-9-14.48A29.53,29.53,0,0,0,97.56,16,32.62,32.62,0,0,0,64,49.57,29.53,29.53,0,0,0,73.91,71c.38.33.78.65,1.17,1H40A16,16,0,0,0,24,88v32a16,16,0,0,0,16,16v64a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V136a16,16,0,0,0,16-16V88A16,16,0,0,0,216,72ZM149,36.51a13.69,13.69,0,0,1,10-4.5h.49A16.62,16.62,0,0,1,176,49.08a13.69,13.69,0,0,1-4.5,10c-9.49,8.4-25.24,11.36-35,12.4C137.7,60.89,141,45.5,149,36.51Zm-64.09.36A16.63,16.63,0,0,1,96.59,32h.49a13.69,13.69,0,0,1,10,4.5c8.39,9.48,11.35,25.2,12.39,34.92-9.72-1-25.44-4-34.92-12.39a13.69,13.69,0,0,1-4.5-10A16.6,16.6,0,0,1,84.87,36.87ZM40,88h80v32H40Zm16,48h64v64H56Zm144,64H136V136h64Zm16-80H136V88h80v32Z">
                                    </path>
                                </svg>
                            </span>
                        </div>
                        <div class="ms-2">
                            Sent Messages
                        </div>
                    </div>
                </li>
                <li class="list-group-item">
                    <div class="d-flex align-items-center">
                        <div>
                            <span class="avatar avatar-sm bg-primary-transparent avatar-rounded svg-primary p-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#000000"
                                    viewBox="0 0 256 256">
                                    <path d="M192,96a64,64,0,1,1-64-64A64,64,0,0,1,192,96Z" opacity="0.2"></path>
                                    <path
                                        d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z">
                                    </path>
                                </svg>
                            </span>
                        </div>
                        <div class="ms-2">
                            New Requests
                        </div>
                    </div>
                </li>
                <li class="list-group-item">
                    <div class="d-flex align-items-center">
                        <div>
                            <span class="avatar avatar-sm bg-primary-transparent avatar-rounded svg-primary p-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#000000"
                                    viewBox="0 0 256 256">
                                    <path d="M200,56V208a8,8,0,0,1-8,8H64a8,8,0,0,1-8-8V56Z" opacity="0.2"></path>
                                    <path
                                        d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z">
                                    </path>
                                </svg>
                            </span>
                        </div>
                        <div class="ms-2">
                            Deleted Messages
                        </div>
                    </div>
                </li>
            </ul>  `,
    Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-list-group',
  imports: [],
  templateUrl: './list-group.html',
  styleUrl: './list-group.scss'
})
export class ListGroupComponent {

}


    `,

}
export let DisabledItems = {
    Html: ` <ul class="list-group">
                <li class="list-group-item disabled" aria-disabled="true">A disabled item meant to be disabled
                </li>
                <li class="list-group-item">Simply dummy text of the printing</li>
                <li class="list-group-item">There are many variations of passages</li>
                <li class="list-group-item">All the Lorem Ipsum generators</li>
                <li class="list-group-item">Written in 45 BC. This book is a treatise on the theory</li>
            </ul> `,
    Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-list-group',
  imports: [],
  templateUrl: './list-group.html',
  styleUrl: './list-group.scss'
})
export class ListGroupComponent {

}


    `,

}

export let Flush = {
    Html: ` <ul class="list-group list-group-flush">
                <li class="list-group-item d-inline-flex align-items-center fw-medium"><i
                        class="ti ti-mail fs-16 align-middle me-2 text-muted"></i>Asish Trivedhi<span
                        class="ms-1 text-muted fw-normal d-inline-block">(+1023-84534)</span></li>
                <li class="list-group-item d-inline-flex align-items-center fw-medium"><i
                        class="ti ti-brand-tiktok fs-16 align-middle me-2 text-muted"></i>Alezander Russo<span
                        class="ms-1 text-muted fw-normal d-inline-block">(+7546-12342)</span></li>
                <li class="list-group-item d-inline-flex align-items-center fw-medium"><i
                        class="ti ti-brand-whatsapp fs-16 align-middle me-2 text-muted"></i>Karem Smith<span
                        class="ms-1 text-muted fw-normal d-inline-block">(+9944-56632)</span></li>
                <li class="list-group-item d-inline-flex align-items-center fw-medium"><i
                        class="ti ti-brand-facebook fs-16 align-middle me-2 text-muted"></i>Melissa Brien<span
                        class="ms-1 text-muted fw-normal d-inline-block">(+1023-34323)</span></li>
                <li class="list-group-item d-inline-flex align-items-center fw-medium"><i
                        class="ti ti-brand-instagram fs-16 align-middle me-2 text-muted"></i>Kamala Harris<span
                        class="ms-1 text-muted fw-normal d-inline-block">(+91-63421)</span></li>
            </ul>  `,
    Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-list-group',
  imports: [],
  templateUrl: './list-group.html',
  styleUrl: './list-group.scss'
})
export class ListGroupComponent {

}


    `,

}
export let Links = {
    Html: ` <div class="list-group">
                <a href="javascript:void(0);" class="list-group-item list-group-item-action active" aria-current="true">
                    <div class="d-flex align-items-center">
                        <div>
                            <span class="avatar avatar-xs bg-white text-default avatar-rounded">
                                C
                            </span>
                        </div>
                        <div class="ms-2">California</div>
                    </div>
                </a>
                <a href="javascript:void(0);" class="list-group-item list-group-item-action">
                    <div class="d-flex align-items-center">
                        <div>
                            <span class="avatar avatar-xs bg-secondary avatar-rounded">
                                N
                            </span>
                        </div>
                        <div class="ms-2">New Jersey</div>
                    </div>
                </a>
                <a href="javascript:void(0);" class="list-group-item list-group-item-action">
                    <div class="d-flex align-items-center">
                        <div>
                            <span class="avatar avatar-xs bg-info avatar-rounded">
                                L
                            </span>
                        </div>
                        <div class="ms-2">Los Angeles</div>
                    </div>
                </a>
                <a href="javascript:void(0);" class="list-group-item list-group-item-action">
                    <div class="d-flex align-items-center">
                        <div>
                            <span class="avatar avatar-xs bg-warning avatar-rounded">
                                M
                            </span>
                        </div>
                        <div class="ms-2">Miami Florida</div>
                    </div>
                </a>
                <a class="list-group-item list-group-item-action disabled">
                    <div class="d-flex align-items-center">
                        <div>
                            <span class="avatar avatar-xs bg-success avatar-rounded">
                                W
                            </span>
                        </div>
                        <div class="ms-2">Washington D.C</div>
                    </div>
                </a>
            </div> `,
    Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-list-group',
  imports: [],
  templateUrl: './list-group.html',
  styleUrl: './list-group.scss'
})
export class ListGroupComponent {

}


    `,

}
export let Buttons = {
    Html: `   <div class="list-group">
                <button type="button" class="list-group-item list-group-item-action active" aria-current="true">Simply
                    dummy text of the printing<span class="badge float-end bg-primary">243</span></button>
                <button type="button" class="list-group-item list-group-item-action">There are many variations of
                    passages<span class="badge float-end bg-secondary-transparent">35</span></button>
                <button type="button" class="list-group-item list-group-item-action">All the Lorem Ipsum generators<span
                        class="badge float-end bg-info-transparent">132</span></button>
                <button type="button" class="list-group-item list-group-item-action">All the Lorem Ipsum generators<span
                        class="badge float-end bg-success-transparent">2525</span></button>
                <button type="button" class="list-group-item list-group-item-action">A disabled item meant to be
                    disabled<span class="badge float-end bg-danger-transparent">21</span></button>
            </div> `,
    Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-list-group',
  imports: [],
  templateUrl: './list-group.html',
  styleUrl: './list-group.scss'
})
export class ListGroupComponent {

}


    `,

}
export let Contextualclasses = {
    Html: ` <ul class="list-group">
                <li class="list-group-item">A simple default list group item</li>

                <li class="list-group-item list-group-item-primary">A simple primary list
                    group
                    item</li>
                <li class="list-group-item list-group-item-secondary">A simple secondary
                    list
                    group item</li>
                <li class="list-group-item list-group-item-success">A simple success list
                    group
                    item</li>
                <li class="list-group-item list-group-item-danger">A simple danger list
                    group
                    item</li>
                <li class="list-group-item list-group-item-warning">A simple warning list
                    group
                    item</li>
                <li class="list-group-item list-group-item-info">A simple info list group
                    item
                </li>
                <li class="list-group-item list-group-item-light">A simple light list group
                    item
                </li>
                <li class="list-group-item list-group-item-dark">A simple dark list group
                    item
                </li>
            </ul> `,
    Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-list-group',
  imports: [],
  templateUrl: './list-group.html',
  styleUrl: './list-group.scss'
})
export class ListGroupComponent {

}


    `,

}
export let Contextualclasseswithhoverstyles = {
    Html: ` <div class="list-group">
                <a href="javascript:void(0);" class="list-group-item list-group-item-action">A simple default
                    list
                    group item</a>

                <a href="javascript:void(0);" class="list-group-item list-group-item-action list-group-item-primary">A
                    simple primary list group item</a>
                <a href="javascript:void(0);" class="list-group-item list-group-item-action list-group-item-secondary">A
                    simple secondary list group item</a>
                <a href="javascript:void(0);" class="list-group-item list-group-item-action list-group-item-success">A
                    simple success list group item</a>
                <a href="javascript:void(0);" class="list-group-item list-group-item-action list-group-item-danger">A
                    simple danger list group item</a>
                <a href="javascript:void(0);" class="list-group-item list-group-item-action list-group-item-warning">A
                    simple warning list group item</a>
                <a href="javascript:void(0);" class="list-group-item list-group-item-action list-group-item-info">A
                    simple
                    info list group item</a>
                <a href="javascript:void(0);" class="list-group-item list-group-item-action list-group-item-light">A
                    simple light list group item</a>
                <a href="javascript:void(0);" class="list-group-item list-group-item-action list-group-item-dark">A
                    simple
                    dark list group item</a>
            </div>  `,
    Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-list-group',
  imports: [],
  templateUrl: './list-group.html',
  styleUrl: './list-group.scss'
})
export class ListGroupComponent {

}


    `,

}
export let SolidColoredLists = {
    Html: `     <ul class="list-group">
                <li class="list-group-item">A simple default list group item</li>

                <li class="list-group-item list-item-solid-primary">A simple primary list
                    group
                    item</li>
                <li class="list-group-item list-item-solid-secondary">A simple secondary
                    list
                    group item</li>
                <li class="list-group-item list-item-solid-success">A simple success list
                    group
                    item</li>
                <li class="list-group-item list-item-solid-danger">A simple danger list
                    group
                    item</li>
                <li class="list-group-item list-item-solid-warning">A simple warning list
                    group
                    item</li>
                <li class="list-group-item list-item-solid-info">A simple info list group
                    item
                </li>
                <li class="list-group-item list-item-solid-light">A simple light list group
                    item
                </li>
                <li class="list-group-item list-item-solid-dark text-white">A simple dark list group
                    item
                </li>
            </ul> `,
    Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-list-group',
  imports: [],
  templateUrl: './list-group.html',
  styleUrl: './list-group.scss'
})
export class ListGroupComponent {

}


    `,

}
export let Customcontent = {
    Html: `  <div class="list-group">
                <a href="javascript:void(0);" class="list-group-item list-group-item-action active" aria-current="true">
                    <div class="d-sm-flex w-100 justify-content-between">
                        <h6 class="mb-1 fw-medium text-fixed-white">Web page editors now use Lorem Ipsum?</h6>
                        <small>3 days ago</small>
                    </div>
                    <p class="mb-1">There are many variations of passages of Lorem Ipsum available, but the majority
                        have suffered alteration in some form, by injected humour.</p>
                    <small>24,Nov 2024.</small>
                </a>
                <a href="javascript:void(0);" class="list-group-item list-group-item-action">
                    <div class="d-sm-flex w-100 justify-content-between">
                        <h6 class="mb-1 fw-medium">Richard McClintock, a Latin professor?</h6>
                        <small class="text-muted">4 hrs ago</small>
                    </div>
                    <p class="mb-1">Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a
                        piece of classical Latin literature.</p>
                    <small class="text-muted">30,Nov 2024.</small>
                </a>
                <a href="javascript:void(0);" class="list-group-item list-group-item-action">
                    <div class="d-sm-flex w-100 justify-content-between">
                        <h6 class="mb-1 fw-medium">It uses a dictionary of over 200 Latin words?</h6>
                        <small class="text-muted">15 hrs ago</small>
                    </div>
                    <p class="mb-1">Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.</p>
                    <small class="text-muted">4,Nov 2024.</small>
                </a>
                <a href="javascript:void(0);" class="list-group-item list-group-item-action">
                    <div class="d-sm-flex w-100 justify-content-between">
                        <h6 class="mb-1 fw-medium">The standard Lorem Ipsum used since the 1500s?</h6>
                        <small class="text-muted">45 mins ago</small>
                    </div>
                    <p class="mb-1">All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as
                        necessary, making this the first true generator on the Internet.</p>
                    <small class="text-muted">28,Oct 2024.</small>
                </a>
            </div> `,
    Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-list-group',
  imports: [],
  templateUrl: './list-group.html',
  styleUrl: './list-group.scss'
})
export class ListGroupComponent {

}


    `,

}
export let Subheadings = {
    Html: ` <ol class="list-group list-group-numbered">
                <li class="list-group-item d-sm-flex justify-content-between align-items-start">
                    <div class="ms-2 me-auto text-muted">
                        <div class="fw-medium fs-14 text-default">What Happened?</div>
                        Many experts have recently suggested may exist.
                    </div>
                    <span class="badge bg-primary-transparent">32 Views</span>
                </li>
                <li class="list-group-item d-sm-flex justify-content-between align-items-start">
                    <div class="ms-2 me-auto text-muted">
                        <div class="fw-medium fs-14 text-default">It Was Amazing!</div>
                        His idea involved taking red.
                    </div>
                    <span class="badge bg-secondary-transparent">52 Views</span>
                </li>
                <li class="list-group-item d-sm-flex justify-content-between align-items-start">
                    <div class="ms-2 me-auto text-muted">
                        <div class="fw-medium fs-14 text-default">News Is A Great Weapon.</div>
                        News can influence in many ways.
                    </div>
                    <span class="badge bg-success-transparent">1,204 Views</span>
                </li>
                <li class="list-group-item d-sm-flex justify-content-between align-items-start">
                    <div class="ms-2 me-auto text-muted">
                        <div class="fw-medium fs-14 text-default">majority have suffered.</div>
                        If you are going to use a passage of Lorem Ipsum, you need to be sure there isn't anything.
                    </div>
                    <span class="badge bg-danger-transparent">14 Views</span>
                </li>
            </ol>  `,
    Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-list-group',
  imports: [],
  templateUrl: './list-group.html',
  styleUrl: './list-group.scss'
})
export class ListGroupComponent {

}


    `,

}
export let NumberedLists = {
    Html: `   <ol class="list-group list-group-numbered">
                <li class="list-group-item">Simply dummy text of the printing.</li>
                <li class="list-group-item">There are many variations of passages.</li>
                <li class="list-group-item">All the Lorem Ipsum generators.</li>
                <li class="list-group-item">Written in 45 BC. This book is a treatise on the theory.</li>
                <li class="list-group-item">Randomised words which don't look.</li>
                <li class="list-group-item">Always free from repetition, injected humour.</li>
            </ol> `,
    Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-list-group',
  imports: [],
  templateUrl: './list-group.html',
  styleUrl: './list-group.scss'
})
export class ListGroupComponent {

}


    `,

}
export let ListWithCheckboxes = {
    Html: `   <ul class="list-group">
                <li class="list-group-item">
                    <input class="form-check-input me-1 fw-medium" type="checkbox" value="" aria-label="..." checked>
                    Accurate information at any given point.
                </li>
                <li class="list-group-item">
                    <input class="form-check-input me-1 fw-medium" type="checkbox" value="" aria-label="...">
                    Hearing the information and responding.
                </li>
                <li class="list-group-item">
                    <input class="form-check-input me-1 fw-medium" type="checkbox" value="" aria-label="..." checked>
                    Setting up and customizing your own sales.
                </li>
                <li class="list-group-item">
                    <input class="form-check-input me-1 fw-medium" type="checkbox" value="" aria-label="..." checked>
                    New Admin Launched.
                </li>
                <li class="list-group-item">
                    <input class="form-check-input me-1 fw-medium" type="checkbox" value="" aria-label="...">
                    To maximize profits and improve productivity.
                </li>
                <li class="list-group-item">
                    <input class="form-check-input me-1 fw-medium" type="checkbox" value="" aria-label="...">
                    To have a complete 360° overview of sales information, having.
                </li>
            </ul> `,
    Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-list-group',
  imports: [],
  templateUrl: './list-group.html',
  styleUrl: './list-group.scss'
})
export class ListGroupComponent {

}


    `,

}
export let ListWithRadios = {
    Html: ` <div class="list-group">
                <label class="list-group-item">
                    <input class="form-check-input me-1" type="radio" value="" name="list-radio" checked>
                    Accurate information at any given point.
                </label>
                <label class="list-group-item">
                    <input class="form-check-input me-1" type="radio" value="" name="list-radio" checked>
                    Hearing the information and responding.
                </label>
                <label class="list-group-item">
                    <input class="form-check-input me-1" type="radio" value="" name="list-radio" checked>
                    Setting up and customizing your own sales.
                </label>
                <label class="list-group-item">
                    <input class="form-check-input me-1" type="radio" value="" name="list-radio">
                    New Admin Launched.
                </label>
                <label class="list-group-item">
                    <input class="form-check-input me-1" type="radio" value="" name="list-radio">
                    To maximize profits and improve productivity.
                </label>
                <label class="list-group-item">
                    <input class="form-check-input me-1" type="radio" value="" name="list-radio">
                    To have a complete 360° overview of sales information, having.
                </label>
            </div>  `,
    Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-list-group',
  imports: [],
  templateUrl: './list-group.html',
  styleUrl: './list-group.scss'
})
export class ListGroupComponent {

}


    `,

}
export let ListWithbadges = {
    Html: ` <ul class="list-group">
                <li class="list-group-item d-flex justify-content-between align-items-center fw-medium">
                    Groceries
                    <span class="badge bg-primary">Available</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center fw-medium">
                    Furniture
                    <span class="badge bg-secondary">Buy</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center fw-medium">
                    Beauty
                    <span class="badge bg-danger rounded-pill">32</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center fw-medium">
                    Books
                    <span class="badge bg-light text-default">New</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center fw-medium">
                    Toys
                    <span class="badge bg-info-gradient">Hot</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center fw-medium">
                    Mobiles
                    <span class="badge bg-warning">Sold Out</span>
                </li>
            </ul>  `,
    Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-list-group',
  imports: [],
  templateUrl: './list-group.html',
  styleUrl: './list-group.scss'
})
export class ListGroupComponent {

}


    `,

}
export let Horizontal = {
    Html: `   <ul class="mb-3 list-group list-group-horizontal">
                <li class="list-group-item">An item</li>
                <li class="list-group-item">A second item</li>
                <li class="list-group-item">A third item</li>
            </ul>
            <ul class="mb-3 list-group list-group-horizontal-sm">
                <li class="list-group-item">An item</li>
                <li class="list-group-item">A second item</li>
                <li class="list-group-item">A third item</li>
            </ul>
            <ul class="mb-3 list-group list-group-horizontal-md">
                <li class="list-group-item">An item</li>
                <li class="list-group-item">A second item</li>
                <li class="list-group-item">A third item</li>
            </ul>
            <ul class="mb-3 list-group list-group-horizontal-lg">
                <li class="list-group-item">An item</li>
                <li class="list-group-item">A second item</li>
                <li class="list-group-item">A third item</li>
            </ul>
            <ul class="mb-3 list-group list-group-horizontal-xl">
                <li class="list-group-item">An item</li>
                <li class="list-group-item">A second item</li>
                <li class="list-group-item">A third item</li>
            </ul>
            <ul class="mb-3 list-group list-group-horizontal-xxl">
                <li class="list-group-item">An item</li>
                <li class="list-group-item">A second item</li>
                <li class="list-group-item">A third item</li>
            </ul>  `,
    Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-list-group',
  imports: [],
  templateUrl: './list-group.html',
  styleUrl: './list-group.scss'
})
export class ListGroupComponent {

}


    `,

}

