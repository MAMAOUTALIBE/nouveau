export let Dropdowns = {
    Html: `   <div class="btn-list d-flex align-items-center flex-wrap">
                <div ngbDropdown class="dropdown">
                    <button class="btn btn-primary dropdown-toggle" type="button" id="dropdownMenuButton1"
                        data-bs-toggle="dropdown" aria-expanded="false" ngbDropdownToggle>
                        Dropdown button
                    </button>
                    <ul ngbDropdownMenu class="dropdown-menu" aria-labelledby="dropdownMenuButton1">
                        @for(item of dropdownitems ;track item){
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a></li>
                        }

                    </ul>
                </div>
                <div ngbDropdown class="dropdown">
                    <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuLink"
                        data-bs-toggle="dropdown" aria-expanded="false" ngbDropdownToggle>
                        Dropdown link
                    </button>
                    <ul ngbDropdownMenu class="dropdown-menu" aria-labelledby="dropdownMenuButton1">
                        @for(item of dropdownitems ;track item){
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a></li>
                        }
                    </ul>
                </div>
            </div> `,
    Ts: `
import { Component } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-dropdowns',
  imports: [NgbDropdownModule],
  templateUrl: './dropdowns.html',
  styleUrl: './dropdowns.scss'
})
  export class DropdownsComponent {


    dropdownitems = [
   'Action','Another action','Active','Something else here'
  ]
  }

    `,

}
export let Singledropdownbuttons = {
    Html: ` <div class="btn-list">
                <div ngbDropdown class="btn-group">
                    <button type="button" class="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown"
                        aria-expanded="false" ngbDropdownToggle>
                        Action
                    </button>
                    <ul ngbDropdownMenu class="dropdown-menu">
                        @for(item of dropdownitems ;track item){
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a></li>
                        }
                        <li>
                            <hr class="dropdown-divider">
                        </li>
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Separated link</a></li>
                    </ul>
                </div>
                <div ngbDropdown class="btn-group">
                    <button ngbDropdownToggle type="button" class="btn btn-secondary dropdown-toggle"
                        data-bs-toggle="dropdown" aria-expanded="false">
                        Action
                    </button>
                    <ul ngbDropdownMenu class="dropdown-menu">
                        @for(item of dropdownitems ;track item){
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a></li>
                        }
                        <li>
                            <hr class="dropdown-divider">
                        </li>
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Separated link</a></li>
                    </ul>
                </div>
                <div ngbDropdown class="btn-group">
                    <button ngbDropdownToggle type="button" class="btn btn-danger dropdown-toggle"
                        data-bs-toggle="dropdown" aria-expanded="false">
                        Action
                    </button>
                    <ul ngbDropdownMenu class="dropdown-menu">
                        @for(item of dropdownitems ;track item){
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a></li>
                        }
                        <li>
                            <hr class="dropdown-divider">
                        </li>
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Separated link</a></li>
                    </ul>
                </div>
                <div ngbDropdown class="btn-group">
                    <button ngbDropdownToggle type="button" class="btn btn-warning dropdown-toggle"
                        data-bs-toggle="dropdown" aria-expanded="false">
                        Action
                    </button>
                    <ul ngbDropdownMenu class="dropdown-menu">
                        @for(item of dropdownitems ;track item){
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a></li>
                        }
                        <li>
                            <hr class="dropdown-divider">
                        </li>
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Separated link</a></li>
                    </ul>
                </div>
                <div ngbDropdown class="btn-group">
                    <button ngbDropdownToggle type="button" class="btn btn-success dropdown-toggle"
                        data-bs-toggle="dropdown" aria-expanded="false">
                        Action
                    </button>
                    <ul ngbDropdownMenu class="dropdown-menu">
                        @for(item of dropdownitems ;track item){
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a></li>
                        }
                        <li>
                            <hr class="dropdown-divider">
                        </li>
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Separated link</a></li>
                    </ul>
                </div>
                <div ngbDropdown class="btn-group">
                    <button ngbDropdownToggle type="button" class="btn btn-info dropdown-toggle"
                        data-bs-toggle="dropdown" aria-expanded="false">
                        Action
                    </button>
                    <ul ngbDropdownMenu class="dropdown-menu">
                        @for(item of dropdownitems ;track item){
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a></li>
                        }
                        <li>
                            <hr class="dropdown-divider">
                        </li>
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Separated link</a></li>
                    </ul>
                </div>
            </div>
  `,
    Ts: `
import { Component } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-dropdowns',
  imports: [NgbDropdownModule],
  templateUrl: './dropdowns.html',
  styleUrl: './dropdowns.scss'
})
  export class DropdownsComponent {


    dropdownitems = [
   'Action','Another action','Active','Something else here'
  ]}

    `,

}
export let RoundedButtonDropdowns = {
    Html: `   <div class="btn-list">
                <div ngbDropdown class="btn-group">
                    <button ngbDropdownToggle type="button" class="btn btn-primary dropdown-toggle rounded-pill"
                        data-bs-toggle="dropdown" aria-expanded="false">
                        Action
                    </button>
                    <ul ngbDropdownMenu class="dropdown-menu">
                        @for(item of dropdownitems ;track item){
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a></li>
                        }
                        <li>
                            <hr class="dropdown-divider">
                        </li>
                        <li><a class="dropdown-item" href="javascript:void(0);">Separated link</a></li>
                    </ul>
                </div>
                <div ngbDropdown class="btn-group">
                    <button ngbDropdownToggle type="button" class="btn btn-secondary dropdown-toggle rounded-pill"
                        data-bs-toggle="dropdown" aria-expanded="false">
                        Action
                    </button>
                    <ul ngbDropdownMenu class="dropdown-menu">
                        @for(item of dropdownitems ;track item){
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a></li>
                        }
                        <li>
                            <hr class="dropdown-divider">
                        </li>
                        <li><a class="dropdown-item" href="javascript:void(0);">Separated link</a></li>
                    </ul>
                </div>
                <div ngbDropdown class="btn-group">
                    <button type="button" class="btn btn-danger dropdown-toggle rounded-pill" data-bs-toggle="dropdown"
                        aria-expanded="false">
                        Action
                    </button>
                    <ul ngbDropdownMenu class="dropdown-menu">
                        @for(item of dropdownitems ;track item){
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a></li>
                        }
                        <li>
                            <hr class="dropdown-divider">
                        </li>
                        <li><a class="dropdown-item" href="javascript:void(0);">Separated link</a></li>
                    </ul>
                </div>
                <div ngbDropdown class="btn-group">
                    <button type="button" class="btn btn-warning dropdown-toggle rounded-pill" data-bs-toggle="dropdown"
                        ngbDropdownToggle aria-expanded="false">
                        Action
                    </button>
                    <ul ngbDropdownMenu class="dropdown-menu">
                        @for(item of dropdownitems ;track item){
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a></li>
                        }
                        <li>
                            <hr class="dropdown-divider">
                        </li>
                        <li><a class="dropdown-item" href="javascript:void(0);">Separated link</a></li>
                    </ul>
                </div>
                <div ngbDropdown class="btn-group">
                    <button type="button" class="btn btn-success dropdown-toggle rounded-pill" data-bs-toggle="dropdown"
                        ngbDropdownToggle aria-expanded="false">
                        Action
                    </button>
                    <ul ngbDropdownMenu class="dropdown-menu">
                        @for(item of dropdownitems ;track item){
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a></li>
                        }
                        <li>
                            <hr class="dropdown-divider">
                        </li>
                        <li><a class="dropdown-item" href="javascript:void(0);">Separated link</a></li>
                    </ul>
                </div>
                <div ngbDropdown class="btn-group">
                    <button type="button" class="btn btn-info dropdown-toggle rounded-pill" data-bs-toggle="dropdown"
                        ngbDropdownToggle aria-expanded="false">
                        Action
                    </button>
                    <ul ngbDropdownMenu class="dropdown-menu">
                        @for(item of dropdownitems ;track item){
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a></li>
                        }
                        <li>
                            <hr class="dropdown-divider">
                        </li>
                        <li><a class="dropdown-item" href="javascript:void(0);">Separated link</a></li>
                    </ul>
                </div>
            </div>  `,
    Ts: `
import { Component } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-dropdowns',
  imports: [NgbDropdownModule],
  templateUrl: './dropdowns.html',
  styleUrl: './dropdowns.scss'
})
  export class DropdownsComponent {
    dropdownitems = [
   'Action','Another action','Active','Something else here'
  ]
  }

    `,

}
export let OutlineButtonDropdowns = {
    Html: ` <div class="btn-list">
                <div ngbDropdown class="btn-group">
                    <button type="button" class="btn btn-outline-primary dropdown-toggle" ngbDropdownToggle
                        data-bs-toggle="dropdown" aria-expanded="false">
                        Action
                    </button>
                    <ul ngbDropdownMenu class="dropdown-menu">
                        @for(item of dropdownitems ;track item){
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a></li>
                        }
                        <li>
                            <hr class="dropdown-divider">
                        </li>
                        <li><a class="dropdown-item" href="javascript:void(0);">Separated link</a></li>
                    </ul>
                </div>
                <div ngbDropdown class="btn-group">
                    <button type="button" class="btn btn-outline-secondary dropdown-toggle" ngbDropdownToggle
                        data-bs-toggle="dropdown" aria-expanded="false">
                        Action
                    </button>
                    <ul ngbDropdownMenu class="dropdown-menu">
                        @for(item of dropdownitems ;track item){
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a></li>
                        }

                        <li>
                            <hr class="dropdown-divider">
                        </li>
                        <li><a class="dropdown-item" href="javascript:void(0);">Separated link</a></li>
                    </ul>
                </div>
                <div ngbDropdown class="btn-group">
                    <button type="button" class="btn btn-outline-danger dropdown-toggle" ngbDropdownToggle
                        data-bs-toggle="dropdown" aria-expanded="false">
                        Action
                    </button>
                    <ul ngbDropdownMenu class="dropdown-menu">
                        @for(item of dropdownitems ;track item){
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a></li>
                        }
                        <li>
                            <hr class="dropdown-divider">
                        </li>
                        <li><a class="dropdown-item" href="javascript:void(0);">Separated link</a></li>
                    </ul>
                </div>
                <div ngbDropdown class="btn-group">
                    <button type="button" class="btn btn-outline-warning dropdown-toggle" ngbDropdownToggle
                        data-bs-toggle="dropdown" aria-expanded="false">
                        Action
                    </button>
                    <ul ngbDropdownMenu class="dropdown-menu">
                        @for(item of dropdownitems ;track item){
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a></li>
                        }
                        <li>
                            <hr class="dropdown-divider">
                        </li>
                        <li><a class="dropdown-item" href="javascript:void(0);">Separated link</a></li>
                    </ul>
                </div>
                <div ngbDropdown class="btn-group">
                    <button type="button" class="btn btn-outline-success dropdown-toggle" ngbDropdownToggle
                        data-bs-toggle="dropdown" aria-expanded="false">
                        Action
                    </button>
                    <ul ngbDropdownMenu class="dropdown-menu">
                        @for(item of dropdownitems ;track item){
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a></li>
                        }
                        <li>
                            <hr class="dropdown-divider">
                        </li>
                        <li><a class="dropdown-item" href="javascript:void(0);">Separated link</a></li>
                    </ul>
                </div>
                <div ngbDropdown class="btn-group">
                    <button type="button" class="btn btn-outline-info dropdown-toggle" data-bs-toggle="dropdown"
                        ngbDropdownToggle aria-expanded="false">
                        Action
                    </button>
                    <ul ngbDropdownMenu class="dropdown-menu">
                        @for(item of dropdownitems ;track item){
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a></li>
                        }
                        <li>
                            <hr class="dropdown-divider">
                        </li>
                        <li><a class="dropdown-item" href="javascript:void(0);">Separated link</a></li>
                    </ul>
                </div>
            </div> `,
    Ts: `
import { Component } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-dropdowns',
  imports: [NgbDropdownModule],
  templateUrl: './dropdowns.html',
  styleUrl: './dropdowns.scss'
})
  export class DropdownsComponent {
    dropdownitems = [
   'Action','Another action','Active','Something else here'
  ]
  }

    `,

}
export let RoundedOutlineDropdowns = {
    Html: `  <div class="btn-list">
                <div ngbDropdown class="btn-group">
                    <button type="button" class="btn btn-outline-primary dropdown-toggle rounded-pill" ngbDropdownToggle
                        data-bs-toggle="dropdown" aria-expanded="false">
                        Action
                    </button>
                    <ul ngbDropdownMenu class="dropdown-menu">
                        @for(item of dropdownitems ;track item){
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a>
                        </li>
                        }
                        <li>
                            <hr class="dropdown-divider">
                        </li>
                        <li><a class="dropdown-item" href="javascript:void(0);">Separated link</a></li>
                    </ul>
                </div>
                <div ngbDropdown class="btn-group">
                    <button type="button" class="btn btn-outline-secondary dropdown-toggle rounded-pill"
                        ngbDropdownToggle data-bs-toggle="dropdown" aria-expanded="false">
                        Action
                    </button>
                    <ul ngbDropdownMenu class="dropdown-menu">
                        @for(item of dropdownitems ;track item){
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a>
                        </li>
                        }
                        <li>
                            <hr class="dropdown-divider">
                        </li>
                        <li><a class="dropdown-item" href="javascript:void(0);">Separated link</a></li>
                    </ul>
                </div>
                <div ngbDropdown class="btn-group">
                    <button type="button" class="btn btn-outline-danger dropdown-toggle rounded-pill" ngbDropdownToggle
                        data-bs-toggle="dropdown" aria-expanded="false">
                        Action
                    </button>
                    <ul ngbDropdownMenu class="dropdown-menu">
                        @for(item of dropdownitems ;track item){
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a>
                        </li>
                        }
                        <li>
                            <hr class="dropdown-divider">
                        </li>
                        <li><a class="dropdown-item" href="javascript:void(0);">Separated link</a></li>
                    </ul>
                </div>
                <div ngbDropdown class="btn-group">
                    <button type="button" class="btn btn-outline-warning dropdown-toggle rounded-pill" ngbDropdownToggle
                        data-bs-toggle="dropdown" aria-expanded="false">
                        Action
                    </button>
                    <ul ngbDropdownMenu class="dropdown-menu">
                        @for(item of dropdownitems ;track item){
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a>
                        </li>
                        }
                        <li>
                            <hr class="dropdown-divider">
                        </li>
                        <li><a class="dropdown-item" href="javascript:void(0);">Separated link</a></li>
                    </ul>
                </div>
                <div ngbDropdown class="btn-group">
                    <button type="button" class="btn btn-outline-success dropdown-toggle rounded-pill" ngbDropdownToggle
                        data-bs-toggle="dropdown" aria-expanded="false">
                        Action
                    </button>
                    <ul ngbDropdownMenu class="dropdown-menu">
                        @for(item of dropdownitems ;track item){
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a>
                        </li>
                        }
                        <li>
                            <hr class="dropdown-divider">
                        </li>
                        <li><a class="dropdown-item" href="javascript:void(0);">Separated link</a></li>
                    </ul>
                </div>
                <div ngbDropdown class="btn-group">
                    <button type="button" class="btn btn-outline-info dropdown-toggle rounded-pill" ngbDropdownToggle
                        data-bs-toggle="dropdown" aria-expanded="false">
                        Action
                    </button>
                    <ul ngbDropdownMenu class="dropdown-menu">
                        @for(item of dropdownitems ;track item){
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a>
                        </li>
                        }
                        <li>
                            <hr class="dropdown-divider">
                        </li>
                        <li><a class="dropdown-item" href="javascript:void(0);">Separated link</a></li>
                    </ul>
                </div>
            </div>  `,
    Ts: `
import { Component } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-dropdowns',
  imports: [NgbDropdownModule],
  templateUrl: './dropdowns.html',
  styleUrl: './dropdowns.scss'
})
  export class DropdownsComponent {
    dropdownitems = [
   'Action','Another action','Active','Something else here'
  ]
  }

    `,

}
export let Splitbuttons = {
    Html: `
            <!-- Example split danger button -->
            <div ngbDropdown class="btn-group my-1">
                <button type="button" class="btn btn-primary">Action</button>
                <button type="button" class="btn btn-primary dropdown-toggle dropdown-toggle-split me-2"
                    ngbDropdownToggle data-bs-toggle="dropdown" aria-expanded="false">
                    <span class="visually-hidden">Toggle Dropdown</span>
                </button>
                <ul ngbDropdownMenu class="dropdown-menu">
                    @for(item of dropdownitems ;track item){
                    <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a></li>
                    }
                    <li>
                        <hr class="dropdown-divider">
                    </li>
                    <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Separated link</a></li>
                </ul>
            </div>
            <div ngbDropdown class="btn-group my-1">
                <button type="button" class="btn btn-secondary">Action</button>
                <button type="button" class="btn btn-secondary dropdown-toggle dropdown-toggle-split me-2"
                    ngbDropdownToggle data-bs-toggle="dropdown" aria-expanded="false">
                    <span class="visually-hidden">Toggle Dropdown</span>
                </button>
                <ul ngbDropdownMenu class="dropdown-menu">
                    @for(item of dropdownitems ;track item){
                    <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a></li>
                    }
                    <li>
                        <hr class="dropdown-divider">
                    </li>
                    <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Separated link</a></li>
                </ul>
            </div>
            <div ngbDropdown class="btn-group my-1">
                <button type="button" class="btn btn-info">Action</button>
                <button type="button" class="btn btn-info dropdown-toggle dropdown-toggle-split me-2" ngbDropdownToggle
                    data-bs-toggle="dropdown" aria-expanded="false">
                    <span class="visually-hidden">Toggle Dropdown</span>
                </button>
                <ul ngbDropdownMenu class="dropdown-menu">
                    @for(item of dropdownitems ;track item){
                    <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a></li>
                    }
                    <li>
                        <hr class="dropdown-divider">
                    </li>
                    <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Separated link</a></li>
                </ul>
            </div>
            <div ngbDropdown class="btn-group my-1">
                <button type="button" class="btn btn-success">Action</button>
                <button type="button" class="btn btn-success dropdown-toggle dropdown-toggle-split me-2"
                    ngbDropdownToggle data-bs-toggle="dropdown" aria-expanded="false">
                    <span class="visually-hidden">Toggle Dropdown</span>
                </button>
                <ul ngbDropdownMenu class="dropdown-menu">
                    @for(item of dropdownitems ;track item){
                    <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a></li>
                    }
                    <li>
                        <hr class="dropdown-divider">
                    </li>
                    <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Separated link</a></li>
                </ul>
            </div>
            <div ngbDropdown class="btn-group my-1">
                <button type="button" class="btn btn-warning">Action</button>
                <button type="button" class="btn btn-warning dropdown-toggle dropdown-toggle-split me-2"
                    ngbDropdownToggle data-bs-toggle="dropdown" aria-expanded="false">
                    <span class="visually-hidden">Toggle Dropdown</span>
                </button>
                <ul ngbDropdownMenu class="dropdown-menu">
                    @for(item of dropdownitems ;track item){
                    <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a></li>
                    }
                    <li>
                        <hr class="dropdown-divider">
                    </li>
                    <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Separated link</a></li>
                </ul>
            </div>
            <div ngbDropdown class="btn-group my-1">
                <button type="button" class="btn btn-danger">Action</button>
                <button type="button" class="btn btn-danger dropdown-toggle dropdown-toggle-split me-2"
                    ngbDropdownToggle data-bs-toggle="dropdown" aria-expanded="false">
                    <span class="visually-hidden">Toggle Dropdown</span>
                </button>
                <ul ngbDropdownMenu class="dropdown-menu">
                    @for(item of dropdownitems ;track item){
                    <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a></li>
                    }
                    <li>
                        <hr class="dropdown-divider">
                    </li>
                    <li><a class="dropdown-item" href="javascript:void(0);">Separated link</a></li>
                </ul>
            </div> `,
    Ts: `
import { Component } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-dropdowns',
  imports: [NgbDropdownModule],
  templateUrl: './dropdowns.html',
  styleUrl: './dropdowns.scss'
})
  export class DropdownsComponent {
    dropdownitems = [
   'Action','Another action','Active','Something else here'
  ]
  }

    `,

}
export let DropdownSizing = {
    Html: `  <div ngbDropdown class="btn-group my-1 me-2">
                <button class="btn btn-primary btn-lg dropdown-toggle" type="button" data-bs-toggle="dropdown"
                    ngbDropdownToggle aria-expanded="false">
                    Large button
                </button>
                <ul ngbDropdownMenu class="dropdown-menu">
                    @for(item of dropdownitems ;track item){
                    <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a></li>
                    }
                    <li>
                        <hr class="dropdown-divider">
                    </li>
                    <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Separated link</a></li>
                </ul>
            </div>
            <div ngbDropdown class="btn-group my-1 me-2">
                <button class="btn btn-light btn-lg" type="button">
                    Large split button
                </button>
                <button type="button" class="btn btn-lg btn-light dropdown-toggle dropdown-toggle-split"
                    ngbDropdownToggle data-bs-toggle="dropdown" aria-expanded="false">
                    <span class="visually-hidden">Toggle Dropdown</span>
                </button>
                <ul ngbDropdownMenu class="dropdown-menu">
                    @for(item of dropdownitems ;track item){
                    <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a></li>
                    }
                    <li>
                        <hr class="dropdown-divider">
                    </li>
                    <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Separated link</a></li>
                </ul>
            </div>
            <!-- samll button groups (default and split) -->
            <div ngbDropdown class="btn-group my-1 me-2">
                <button class="btn btn-primary btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown"
                    ngbDropdownToggle aria-expanded="false">
                    Small button
                </button>
                <ul ngbDropdownMenu class="dropdown-menu">
                    @for(item of dropdownitems ;track item){
                    <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a></li>
                    } <li>
                        <hr class="dropdown-divider">
                    </li>
                    <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Separated link</a></li>
                </ul>
            </div>
            <div ngbDropdown class="btn-group my-1">
                <button class="btn btn-light btn-sm" type="button">
                    Small split button
                </button>
                <button type="button" class="btn btn-sm btn-light dropdown-toggle dropdown-toggle-split"
                    ngbDropdownToggle data-bs-toggle="dropdown" aria-expanded="false">
                    <span class="visually-hidden">Toggle Dropdown</span>
                </button>
                <ul ngbDropdownMenu class="dropdown-menu">
                    @for(item of dropdownitems ;track item){
                    <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a></li>
                    }
                    <li>
                        <hr class="dropdown-divider">
                    </li>
                    <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Separated link</a></li>
                </ul>
            </div>  `,
    Ts: `
import { Component } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-dropdowns',
  imports: [NgbDropdownModule],
  templateUrl: './dropdowns.html',
  styleUrl: './dropdowns.scss'
})
  export class DropdownsComponent {

  }

    `,

}
export let Dropup = {
    Html: `   <div ngbDropdown class="btn-group dropup my-1">
                <button type="button" class="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown"
                    ngbDropdownToggle aria-expanded="false">
                    Dropup
                </button>
                <ul ngbDropdownMenu class="dropdown-menu">
                    <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Action</a></li>
                    <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Another action</a></li>
                    <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Something else here</a></li>
                    <li>
                        <hr ngbDropdownItem class="dropdown-divider">
                    </li>
                    <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Separated link</a></li>
                </ul>
            </div>
            <div ngbDropdown class="btn-group dropup my-1">
                <button type="button" class="btn btn-secondary">
                    Split dropup
                </button>
                <button type="button" class="btn btn-secondary dropdown-toggle dropdown-toggle-split" ngbDropdownToggle
                    data-bs-toggle="dropdown" aria-expanded="false">
                    <span class="visually-hidden">Toggle Dropdown</span>
                </button>
                <ul ngbDropdownMenu class="dropdown-menu">
                    <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Action</a></li>
                    <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Another action</a></li>
                    <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Something else here</a></li>
                    <li>
                        <hr ngbDropdownItem class="dropdown-divider">
                    </li>
                    <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Separated link</a></li>
                </ul>
            </div>  `,
    Ts: `
import { Component } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-dropdowns',
  imports: [NgbDropdownModule],
  templateUrl: './dropdowns.html',
  styleUrl: './dropdowns.scss'
})
  export class DropdownsComponent {

  }

    `,

}
export let Dropupright = {
    Html: `  <div ngbDropdown class="btn-group dropend my-1">
                    <button type="button" class="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown"
                        ngbDropdownToggle aria-expanded="false">
                        Dropright
                    </button>
                    <ul ngbDropdownMenu class="dropdown-menu">
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Action</a></li>
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Another action</a></li>
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Something else here</a>
                        </li>
                        <li>
                            <hr ngbDropdownItem class="dropdown-divider">
                        </li>
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Separated link</a></li>
                    </ul>
                </div>
                <div ngbDropdown class="btn-group dropend my-1">
                    <button type="button" class="btn btn-secondary">
                        Split dropend
                    </button>
                    <button type="button" class="btn btn-secondary dropdown-toggle dropdown-toggle-split"
                        ngbDropdownToggle data-bs-toggle="dropdown" aria-expanded="false">
                        <span class="visually-hidden">Toggle Dropright</span>
                    </button>
                    <ul ngbDropdownMenu class="dropdown-menu">
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Action</a></li>
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Another action</a></li>
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Something else here</a>
                        </li>
                        <li>
                            <hr ngbDropdownItem class="dropdown-divider">
                        </li>
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Separated link</a></li>
                    </ul>
                </div>`,
    Ts: `
import { Component } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-dropdowns',
  imports: [NgbDropdownModule],
  templateUrl: './dropdowns.html',
  styleUrl: './dropdowns.scss'
})
  export class DropdownsComponent {

  }

    `,

}
export let Active = {
    Html: `  <div ngbDropdown>

                <button  type="button" class="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown"
             ngbDropdownToggle   aria-expanded="false">
                Dropstart
            </button>
            <ul  ngbDropdownMenu class="dropdown-menu">
                <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Regular link</a></li>
                <li><a ngbDropdownItem  class="dropdown-item active" href="javascript:void(0);" aria-current="true">Active
                    link</a>
                </li>
                <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Another link</a></li>
            </ul>
        </div> `,
    Ts: `
import { Component } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-dropdowns',
  imports: [NgbDropdownModule],
  templateUrl: './dropdowns.html',
  styleUrl: './dropdowns.scss'
})
  export class DropdownsComponent {

  }

    `,

}
export let Dropupleft = {
    Html: `  <div ngbDropdown class="btn-group dropstart my-1">

                <button type="button" class="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown"
                    ngbDropdownToggle aria-expanded="false">
                    Dropleft
                </button>
                <ul ngbDropdownMenu class="dropdown-menu">
                    <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Action</a></li>
                    <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Another action</a></li>
                    <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Something else here</a>
                    </li>
                    <li>
                        <hr ngbDropdownItem class="dropdown-divider">
                    </li>
                    <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Separated link</a></li>
                </ul>
            </div>
            <div class="btn-group">
                <div ngbDropdown class="btn-group dropstart my-1" role="group">
                    <button ngbDropdownToggle type="button"
                        class="btn btn-secondary dropdown-toggle dropdown-toggle-split" data-bs-toggle="dropdown"
                        aria-expanded="false">
                        <span class="visually-hidden">Toggle Dropstart</span>
                    </button>
                    <ul ngbDropdownMenu class="dropdown-menu">
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Action</a></li>
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Another action</a>
                        </li>
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Something else
                                here</a>
                        </li>
                        <li>
                            <hr ngbDropdownItem class="dropdown-divider">
                        </li>
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Separated link</a>
                        </li>
                    </ul>
                </div>
                <button type="button" class="btn btn-secondary my-1">
                    Split dropleft
                </button>
            </div> `,
    Ts: `
import { Component } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-dropdowns',
  imports: [NgbDropdownModule],
  templateUrl: './dropdowns.html',
  styleUrl: './dropdowns.scss'
})
  export class DropdownsComponent {

  }

    `,

}
export let Disabled = {
    Html: `<div ngbDropdown>
                <button type="button" class="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown"
                    ngbDropdownToggle aria-expanded="false">
                    Dropstart
                </button>
                <ul ngbDropdownMenu class="dropdown-menu">
                    <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Regular link</a></li>
                    <li><a ngbDropdownItem [disabled]="true" class="dropdown-item disabled" href="javascript:void(0);" aria-current="true">Active
                            link</a></li>
                    <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Another link</a></li>
                </ul>
            </div>  `,
    Ts: `
import { Component } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-dropdowns',
  imports: [NgbDropdownModule],
  templateUrl: './dropdowns.html',
  styleUrl: './dropdowns.scss'
})
  export class DropdownsComponent {

  }

    `,

}
export let Autoclosebehavior = {
    Html: ` <div class="btn-list">
                <div ngbDropdown class="btn-group">
                    <button ngbDropdownToggle class="btn btn-primary dropdown-toggle" type="button" id="defaultDropdown"
                        data-bs-toggle="dropdown" data-bs-auto-close="true" aria-expanded="false">
                        Default dropdown
                    </button>
                    <ul ngbDropdownMenu class="dropdown-menu" aria-labelledby="defaultDropdown">
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Menu item</a></li>
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Menu item</a></li>
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Menu item</a></li>
                    </ul>
                </div>
                <div ngbDropdown class="btn-group">
                    <button ngbDropdownToggle class="btn btn-secondary dropdown-toggle" type="button"
                        id="dropdownMenuClickableOutside" data-bs-toggle="dropdown" data-bs-auto-close="inside"
                        aria-expanded="false">
                        Clickable outside
                    </button>
                    <ul ngbDropdownMenu class="dropdown-menu" aria-labelledby="dropdownMenuClickableOutside">
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Menu item</a></li>
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Menu item</a></li>
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Menu item</a></li>
                    </ul>
                </div>
                <div ngbDropdown class="btn-group">
                    <button class="btn btn-info dropdown-toggle" type="button" id="dropdownMenuClickableInside"
                        ngbDropdownToggle data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="false">
                        Clickable inside
                    </button>
                    <ul ngbDropdownMenu class="dropdown-menu" aria-labelledby="dropdownMenuClickableInside">
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Menu item</a></li>
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Menu item</a></li>
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Menu item</a></li>
                    </ul>
                </div>
                <div ngbDropdown class="btn-group">
                    <button ngbDropdownToggle class="btn btn-warning dropdown-toggle" type="button"
                        id="dropdownMenuClickable" data-bs-toggle="dropdown" data-bs-auto-close="false"
                        aria-expanded="false">
                        Manual close
                    </button>
                    <ul ngbDropdownMenu class="dropdown-menu" aria-labelledby="dropdownMenuClickable">
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Menu item</a></li>
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Menu item</a></li>
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Menu item</a></li>
                    </ul>
                </div>
            </div> `,
    Ts: `
import { Component } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-dropdowns',
  imports: [NgbDropdownModule],
  templateUrl: './dropdowns.html',
  styleUrl: './dropdowns.scss'
})
  export class DropdownsComponent {

  }

    `,

}
export let dropdownswithForms = {
    Html: `  <div ngbDropdown class="dropdown">
                <button ngbDropdownToggle class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenu2"
                    data-bs-toggle="dropdown" aria-expanded="false">
                    Dropdown
                </button>
                <div ngbDropdownMenu class="dropdown-menu">
                    <form ngbDropdownItem class="px-4 py-3" novalidate>
                        <div class="mb-3">
                            <label for="exampleDropdownFormEmail1" class="form-label">Email
                                address</label>
                            <input type="email" class="form-control" id="exampleDropdownFormEmail1"
                                placeholder="email@example.com">
                        </div>
                        <div class="mb-3">
                            <label for="exampleDropdownFormPassword1" class="form-label">Password</label>
                            <input type="password" class="form-control" id="exampleDropdownFormPassword1"
                                placeholder="Password">
                        </div>
                        <div class="mb-3">
                            <div class="form-check">
                                <input type="checkbox" class="form-check-input" id="dropdownCheck">
                                <label class="form-check-label" for="dropdownCheck">
                                    Remember me
                                </label>
                            </div>
                        </div>
                        <button class="btn btn-primary">Sign in</button>
                    </form>
                    <div class="dropdown-divider"></div>
                    <a class="dropdown-item" href="javascript:void(0);">New around here? Sign up</a>
                    <a class="dropdown-item" href="javascript:void(0);">Forgot password?</a>
                </div>
            </div>  `,
    Ts: `
import { Component } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-dropdowns',
  imports: [NgbDropdownModule],
  templateUrl: './dropdowns.html',
  styleUrl: './dropdowns.scss'
})
  export class DropdownsComponent {

  }

    `,

}
export let Dropdownmenucentered = {
    Html: `  <p class="card-title mb-3">Use <code>.dropdown-center</code> on the parent element.
            </p>
            <div ngbDropdown class="dropdown-center">
                <button ngbDropdownToggle class="btn btn-primary dropdown-toggle" type="button" id="dropdownCenterBtn"
                    data-bs-toggle="dropdown" aria-expanded="false">
                    Centered dropdown
                </button>
                <ul ngbDropdownMenu class="dropdown-menu" aria-labelledby="dropdownCenterBtn">
                    <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Action</a></li>
                    <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Action two</a></li>
                    <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Action three</a></li>
                </ul>
            </div> `,
    Ts: `
import { Component } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-dropdowns',
  imports: [NgbDropdownModule],
  templateUrl: './dropdowns.html',
  styleUrl: './dropdowns.scss'
})
  export class DropdownsComponent {

  }

    `,

}
export let Dropupcentered = {
    Html: `   <p class="card-title mb-3">Use <code>.dropup-center</code>
                on the parent element.
            </p>
            <div ngbDropdown class="dropup-center dropup">
                <button ngbDropdownToggle class="btn btn-secondary dropdown-toggle" type="button" id="dropupCenterBtn"
                    data-bs-toggle="dropdown" aria-expanded="false">
                    Centered dropup
                </button>
                <ul ngbDropdownMenu class="dropdown-menu" aria-labelledby="dropupCenterBtn">
                    <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Action</a></li>
                    <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Action two</a></li>
                    <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Action three</a></li>
                </ul>
            </div>`,
    Ts: `
import { Component } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-dropdowns',
  imports: [NgbDropdownModule],
  templateUrl: './dropdowns.html',
  styleUrl: './dropdowns.scss'
})
  export class DropdownsComponent {

  }

    `,

}
export let Menuitems = {
    Html: ` <p class="card-title mb-3">You can use <code>&lt;a&gt;</code> or <code>&lt;button&gt;</code>
                as
                dropdown items.</p>
            <div ngbDropdown class="dropdown">
                <button class="btn btn-info dropdown-toggle" type="button" id="dropdownMenu1" data-bs-toggle="dropdown"
                    ngbDropdownToggle aria-expanded="false">
                    Dropdown
                </button>
                <ul ngbDropdownMenu class="dropdown-menu" aria-labelledby="dropdownMenu1">
                    <li><button ngbDropdownItem class="dropdown-item" type="button">Action</button></li>
                    <li><button ngbDropdownItem class="dropdown-item" type="button">Another action</button>
                    </li>
                    <li><button ngbDropdownItem class="dropdown-item" type="button">Something else
                            here</button>
                    </li>
                </ul>
            </div> `,
    Ts: `
import { Component } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-dropdowns',
  imports: [NgbDropdownModule],
  templateUrl: './dropdowns.html',
  styleUrl: './dropdowns.scss'
})
  export class DropdownsComponent {

  }

    `,

}
export let Dropdownsoptions = {
    Html: `  <p class="card-title mb-3">Use <code>data-bs-offset</code> or <code>data-bs-reference</code>
                    to change
                    the location of the dropdown.</p>
                <div class="d-flex align-items-center">
                    <div class="dropdown me-1">
                        <button type="button" class="btn btn-primary dropdown-toggle" id="dropdownMenuOffset"
                            data-bs-toggle="dropdown" aria-expanded="false" data-bs-offset="10,20">
                            Offset
                        </button>
                        <ul class="dropdown-menu" aria-labelledby="dropdownMenuOffset">
                            @for(item of dropdownitems ;track item){
                            <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a>
                            </li>
                            }
                        </ul>
                    </div>
                    <div class="btn-group">
                        <button type="button" class="btn btn-info">Reference</button>
                        <button type="button" class="btn btn-info dropdown-toggle dropdown-toggle-split"
                            id="dropdownMenuReference" data-bs-toggle="dropdown" aria-expanded="false"
                            data-bs-reference="parent">
                            <span class="visually-hidden">Toggle Dropdown</span>
                        </button>
                        <ul class="dropdown-menu" aria-labelledby="dropdownMenuReference">
                            @for(item of dropdownitems ;track item){
                            <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a>
                            </li>
                            }
                            <li>
                                <hr class="dropdown-divider">
                            </li>
                            <li><a class="dropdown-item" href="javascript:void(0);">Separated link</a></li>
                        </ul>
                    </div>
                </div> `,
    Ts: `
import { Component } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-dropdowns',
  imports: [NgbDropdownModule],
  templateUrl: './dropdowns.html',
  styleUrl: './dropdowns.scss'
})
  export class DropdownsComponent {

  }

    `,

}
export let Alignmentoptions = {
    Html: ` <div class="btn-list">
                <div ngbDropdown class="btn-group">
                    <button class="btn btn-primary dropdown-toggle mb-0" type="button" id="dropdownMenuButton"
                        ngbDropdownToggle data-bs-toggle="dropdown" aria-expanded="false">
                        Dropdown
                    </button>
                    <ul ngbDropdownMenu class="dropdown-menu" aria-labelledby="dropdownMenuButton">
                        @for(item of Menuitem;track item){
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a></li>
                        }
                    </ul>
                </div>
                <div ngbDropdown class="btn-group">
                    <button type="button" class="btn btn-secondary dropdown-toggle mb-0" data-bs-toggle="dropdown"
                        ngbDropdownToggle aria-expanded="false">
                        Right-aligned menu
                    </button>
                    <ul ngbDropdownMenu class="dropdown-menu dropdown-menu-end">
                        @for(item of Menuitem;track item){
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a></li>
                        }
                    </ul>
                </div>
                <div ngbDropdown class="btn-group">
                    <button type="button" class="btn btn-info dropdown-toggle mb-0" data-bs-toggle="dropdown"
                        ngbDropdownToggle data-bs-display="static" aria-expanded="false">
                        Left-aligned, right-aligned lg
                    </button>
                    <ul ngbDropdownMenu class="dropdown-menu dropdown-menu-lg-end">
                        @for(item of Menuitem;track item){
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a></li>
                        }
                    </ul>
                </div>
                <div ngbDropdown class="btn-group">
                    <button type="button" class="btn btn-warning dropdown-toggle mb-0" data-bs-toggle="dropdown"
                        ngbDropdownToggle data-bs-display="static" aria-expanded="false">
                        Right-aligned, left-aligned lg
                    </button>
                    <ul ngbDropdownMenu class="dropdown-menu dropdown-menu-end dropdown-menu-lg-start">
                        @for(item of Menuitem;track item){
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a></li>
                        }
                    </ul>
                </div>
                <div ngbDropdown class="btn-group dropstart">
                    <button type="button" class="btn btn-success dropdown-toggle mb-0" data-bs-toggle="dropdown"
                        ngbDropdownToggle aria-expanded="false">
                        Dropstart
                    </button>
                    <ul ngbDropdownMenu class="dropdown-menu">
                        @for(item of Menuitem;track item){
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a></li>
                        }
                    </ul>
                </div>
                <div ngbDropdown class="btn-group dropend">
                    <button type="button" class="btn btn-danger dropdown-toggle mb-0" data-bs-toggle="dropdown"
                        ngbDropdownToggle aria-expanded="false">
                        Dropend
                    </button>
                    <ul ngbDropdownMenu class="dropdown-menu">
                        @for(item of Menuitem;track item){
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a></li>
                        }
                    </ul>
                </div>
                <div ngbDropdown class="btn-group dropup">
                    <button type="button" class="btn btn-teal dropdown-toggle mb-0" data-bs-toggle="dropdown"
                        ngbDropdownToggle aria-expanded="false">
                        Dropup
                    </button>
                    <ul ngbDropdownMenu class="dropdown-menu">
                        @for(item of Menuitem;track item){
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a></li>
                        }
                    </ul>
                </div>
            </div>  `,
    Ts: `
import { Component } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-dropdowns',
  imports: [NgbDropdownModule],
  templateUrl: './dropdowns.html',
  styleUrl: './dropdowns.scss'
})
  export class DropdownsComponent {
   Menuitem=[
    'Menu item','Menu item','Menu item','Menu item'
  ]
  }

    `,

}
export let DarkDropdowns = {
    Html: `
            <div ngbDropdown class="dropdown">
                <button class="btn btn-dark dropdown-toggle" type="button" id="dropdownMenuButton3" ngbDropdownToggle
                    data-bs-toggle="dropdown" aria-expanded="false">
                    Dropdown button
                </button>
                <ul ngbDropdownMenu class="dropdown-menu dropdown-menu-dark">
                    @for(item of dropdownitems ;track item){
                    <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a></li>
                    }
                </ul>
            </div> `,
    Ts: `
import { Component } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-dropdowns',
  imports: [NgbDropdownModule],
  templateUrl: './dropdowns.html',
  styleUrl: './dropdowns.scss'
})
  export class DropdownsComponent {

  }

    `,

}
export let Menualignment = {
    Html: `     <div ngbDropdown class="btn-group">
                <button type="button" class="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown"
                    ngbDropdownToggle aria-expanded="false">
                    Right-aligned menu example
                </button>
                <ul ngbDropdownMenu class="dropdown-menu dropdown-menu-end">
                    @for(item of dropdownitems ;track item){
                    <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a></li>
                    }
                </ul>
            </div> `,
    Ts: `
import { Component } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-dropdowns',
  imports: [NgbDropdownModule],
  templateUrl: './dropdowns.html',
  styleUrl: './dropdowns.scss'
})
  export class DropdownsComponent {
  dropdownitems = [
   'Action','Another action','Active','Something else here'
  ]

  }

    `,

}
export let Responsivealignmentend = {
    Html: ` <div ngbDropdown class="btn-group">
                <button type="button" class="btn btn-secondary dropdown-toggle text-wrap" ngbDropdownToggle
                    data-bs-toggle="dropdown" data-bs-display="static" aria-expanded="false">
                    Left-aligned but right aligned when large screen
                </button>
                <ul ngbDropdownMenu class="dropdown-menu dropdown-menu-lg-end">
                    @for(item of dropdownitems ;track item){
                    <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a>
                    </li>
                    }
                </ul>
            </div>
  `,
    Ts: `
import { Component } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-dropdowns',
  imports: [NgbDropdownModule],
  templateUrl: './dropdowns.html',
  styleUrl: './dropdowns.scss'
})
  export class DropdownsComponent {
  dropdownitems = [
   'Action','Another action','Active','Something else here'
  ]

  }

    `,

}
export let Responsivealignmentleft = {
    Html: ` <div ngbDropdown class="btn-group">
                <button type="button" class="btn btn-info dropdown-toggle text-wrap" ngbDropdownToggle
                    data-bs-toggle="dropdown" data-bs-display="static" aria-expanded="false">
                    Left-aligned but right aligned when large screen
                </button>
                <ul ngbDropdownMenu class="dropdown-menu dropdown-menu-lg-start">
                    @for(item of dropdownitems ;track item){
                    <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a></li>
                    }
                </ul>
            </div>  `,
    Ts: `
import { Component } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-dropdowns',
  imports: [NgbDropdownModule],
  templateUrl: './dropdowns.html',
  styleUrl: './dropdowns.scss'
})
  export class DropdownsComponent {
  dropdownitems = [
   'Action','Another action','Active','Something else here'
  ]

  }

    `,

}
export let CustomDropdownMenu = {
    Html: ` <div class="btn-list">
                <div ngbDropdown class="btn-group">
                    <button class="btn btn-primary dropdown-toggle" type="button" data-bs-toggle="dropdown"
                        ngbDropdownToggle aria-expanded="false">
                        Primary
                    </button>
                    <ul ngbDropdownMenu class="dropdown-menu dropdown-menu-primary">
                        @for(item of dropdownitems ;track item){
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a>
                        </li>
                        }
                    </ul>
                </div>
                <div ngbDropdown class="btn-group">
                    <button class="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown"
                        ngbDropdownToggle aria-expanded="false">
                        secondary
                    </button>
                    <ul ngbDropdownMenu class="dropdown-menu dropdown-menu-secondary">
                        @for(item of dropdownitems ;track item){
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a>
                        </li>
                        }
                    </ul>
                </div>
                <div ngbDropdown class="btn-group">
                    <button class="btn btn-warning dropdown-toggle" type="button" data-bs-toggle="dropdown"
                        ngbDropdownToggle aria-expanded="false">
                        warning
                    </button>
                    <ul ngbDropdownMenu class="dropdown-menu dropmenu-item-warning">
                        @for(item of dropdownitems ;track item){
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a>
                        </li>
                        }
                    </ul>
                </div>
                <div ngbDropdown class="btn-group">
                    <button class="btn btn-info dropdown-toggle" type="button" data-bs-toggle="dropdown"
                        ngbDropdownToggle aria-expanded="false">
                        info
                    </button>
                    <ul ngbDropdownMenu class="dropdown-menu dropmenu-item-info">
                        @for(item of dropdownitems ;track item){
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a>
                        </li>
                        }
                    </ul>
                </div>
                <div ngbDropdown class="btn-group">
                    <button class="btn btn-success-light dropdown-toggle" type="button" ngbDropdownToggle
                        data-bs-toggle="dropdown" aria-expanded="false">
                        success
                    </button>
                    <ul ngbDropdownMenu class="dropdown-menu dropmenu-light-success">
                        @for(item of dropdownitems ;track item){
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a>
                        </li>
                        }
                    </ul>
                </div>
                <div ngbDropdown class="btn-group">
                    <button class="btn btn-danger-light dropdown-toggle" type="button" data-bs-toggle="dropdown"
                        ngbDropdownToggle aria-expanded="false">
                        danger
                    </button>
                    <ul ngbDropdownMenu class="dropdown-menu dropmenu-light-danger">
                        @for(item of dropdownitems ;track item){
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a>
                        </li>
                        }
                    </ul>
                </div>
            </div>  `,
    Ts: `
import { Component } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-dropdowns',
  imports: [NgbDropdownModule],
  templateUrl: './dropdowns.html',
  styleUrl: './dropdowns.scss'
})
  export class DropdownsComponent {
  dropdownitems = [
   'Action','Another action','Active','Something else here'
  ]

  }

    `,

}
export let GhostButtonDropdowns = {
    Html: `  <div class="btn-list">
                <div ngbDropdown class="btn-group">
                    <button type="button" class="btn btn-primary-ghost dropdown-toggle" ngbDropdownToggle
                        data-bs-toggle="dropdown" aria-expanded="false">
                        Primary
                    </button>
                    <ul ngbDropdownMenu class="dropdown-menu">
                        @for(item of dropdownitems ;track item){
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a>
                        </li>
                        }
                        <li>
                            <hr class="dropdown-divider">
                        </li>
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Separated link</a>
                        </li>
                    </ul>
                </div>
                <div ngbDropdown class="btn-group">
                    <button type="button" class="btn btn-secondary-ghost dropdown-toggle" ngbDropdownToggle
                        data-bs-toggle="dropdown" aria-expanded="false">
                        Secondary
                    </button>
                    <ul ngbDropdownMenu class="dropdown-menu">
                        @for(item of dropdownitems ;track item){
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a>
                        </li>
                        }
                        <li>
                            <hr class="dropdown-divider">
                        </li>
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Separated link</a>
                        </li>
                    </ul>
                </div>
                <div ngbDropdown class="btn-group">
                    <button type="button" class="btn btn-success-ghost dropdown-toggle" ngbDropdownToggle
                        data-bs-toggle="dropdown" aria-expanded="false">
                        Success
                    </button>
                    <ul ngbDropdownMenu class="dropdown-menu">
                        @for(item of dropdownitems ;track item){
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a>
                        </li>
                        }
                        <li>
                            <hr class="dropdown-divider">
                        </li>
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Separated link</a>
                        </li>
                    </ul>
                </div>
                <div ngbDropdown class="btn-group">
                    <button type="button" class="btn btn-info-ghost dropdown-toggle" data-bs-toggle="dropdown"
                        ngbDropdownToggle aria-expanded="false">
                        Info
                    </button>
                    <ul ngbDropdownMenu class="dropdown-menu">
                        @for(item of dropdownitems ;track item){
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a>
                        </li>
                        }
                        <li>
                            <hr class="dropdown-divider">
                        </li>
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Separated link</a>
                        </li>
                    </ul>
                </div>
                <div ngbDropdown class="btn-group">
                    <button type="button" class="btn btn-warning-ghost dropdown-toggle" ngbDropdownToggle
                        data-bs-toggle="dropdown" aria-expanded="false">
                        Warning
                    </button>
                    <ul ngbDropdownMenu class="dropdown-menu">
                        @for(item of dropdownitems ;track item){
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a>
                        </li>
                        }
                        <li>
                            <hr class="dropdown-divider">
                        </li>
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Separated link</a>
                        </li>
                    </ul>
                </div>
                <div ngbDropdown class="btn-group">
                    <button type="button" class="btn btn-danger-ghost dropdown-toggle" data-bs-toggle="dropdown"
                        ngbDropdownToggle aria-expanded="false">
                        Danger
                    </button>
                    <ul ngbDropdownMenu class="dropdown-menu">
                        @for(item of dropdownitems ;track item){
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a>
                        </li>
                        }
                        <li>
                            <hr class="dropdown-divider">
                        </li>
                        <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Separated link</a>
                        </li>
                    </ul>
                </div>
            </div> `,
    Ts: `
import { Component } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-dropdowns',
  imports: [NgbDropdownModule],
  templateUrl: './dropdowns.html',
  styleUrl: './dropdowns.scss'
})
  export class DropdownsComponent {

  }


    `,

}
export let noninteractivedropdownitems = {
    Html: ` <p class="card-title mb-3">Use <code>.dropdown-item-text.</code> to create non-interactive
                dropdown
                items.</p>
            <div class="bd-example">
                <ul class="dropdown-menu">
                    <li><span class="dropdown-item-text">Dropdown item text</span>
                    </li>
                    @for(item of dropdownitems ;track item){
                    <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a>
                    </li>
                    }
                </ul>
            </div> `,
    Ts: `
import { Component } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-dropdowns',
  imports: [NgbDropdownModule],
  templateUrl: './dropdowns.html',
  styleUrl: './dropdowns.scss'
})
  export class DropdownsComponent {

  }

    `,

}
export let DropdownHeaders = {
    Html: `  <p class="card-titlte mb-3">Add a <code>.dropdown-header</code> to label sections of actions
                in any
                dropdown menu.</p>
            <div ngbDropdown class="bd-example">
                <ul ngbDropdownMenu class="dropdown-menu">
                    <li>
                        <h6 class="dropdown-header">Dropdown header</h6>
                    </li>
                    @for(item of dropdownitems ;track item){
                    <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a></li>
                    }
                </ul>
            </div> `,
    Ts: `
import { Component } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-dropdowns',
  imports: [NgbDropdownModule],
  templateUrl: './dropdowns.html',
  styleUrl: './dropdowns.scss'
})
  export class DropdownsComponent {

  }

    `,

}
export let DropdownDividers = {
    Html: `  <div ngbDropdown class="bd-example">
                <ul ngbDropdownMenu class="dropdown-menu">
                    <li><a class="dropdown-header" href="javascript:void(0);">Heading</a></li>
                    @for(item of dropdownitems ;track item){
                    <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">{{item}}</a>
                    </li>
                    }
                    <li>
                        <hr class="dropdown-divider">
                    </li>
                    <li><a ngbDropdownItem class="dropdown-item" href="javascript:void(0);">Separated link</a>
                    </li>
                </ul>
            </div> `,
    Ts: `
import { Component } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-dropdowns',
  imports: [NgbDropdownModule],
  templateUrl: './dropdowns.html',
  styleUrl: './dropdowns.scss'
})
  export class DropdownsComponent {

  }

    `,

}
export let DropdownMenuText = {
    Html: `  <div ngbDropdown class="bd-example">
                <div ngbDropdownMenu class="dropdown-menu p-4 text-muted" style="max-width: 200px;">
                    <p>
                        Some example text that's free-flowing within the dropdown menu.
                    </p>
                    <p class="mb-0">
                        And this is more example text.
                    </p>
                </div>
            </div> `,
    Ts: `
import { Component } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-dropdowns',
  imports: [NgbDropdownModule],
  templateUrl: './dropdowns.html',
  styleUrl: './dropdowns.scss'
})
  export class DropdownsComponent {

  }

    `,

}
