export let BasicProgress= {
  Html: ` @for (item of Basicprogess; track $index) {
            <div class="progress mb-3" role="progressbar" aria-label="Basic example" aria-valuenow="0" aria-valuemin="0"
                aria-valuemax="100">
                <div class="progress-bar" [style]="item.style"></div>
            </div>
            }  `,
  Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-progress',
  imports: [],
  templateUrl: './progress.html',
  styleUrl: './progress.scss'
})
export class ProgressComponent {
Basicprogess = [
    {
      style: 'width: 0%',
    },
    {
      style: 'width: 20%',
    },
    {
      style: 'width: 50%',
    },
    {
      style: 'width: 75%',
    },
    {
      style: 'width: 100%',
    },

  ]
}
    `,

}
export let DifferentColoredProgress= {
  Html: ` @for (item of DifferentColoredProgress; track $index) {
            <div class="progress mb-3" role="progressbar" aria-valuemin="0" aria-valuemax="100">
                <div [class]="item.progressCLass" [style]="item.style"></div>
            </div>
            }  `,
  Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-progress',
  imports: [],
  templateUrl: './progress.html',
  styleUrl: './progress.scss'
})
export class ProgressComponent {
 DifferentColoredProgress= [
    {
      style: 'width: 0%',
      progressCLass:'progress-bar bg-secondary',
    },
    {
      style: 'width: 20%',
      progressCLass:'progress-bar bg-warning',
    },
    {
      style: 'width: 50%',
      progressCLass:'progress-bar bg-info',
    },
    {
      style: 'width: 75%',
      progressCLass:'progress-bar bg-success',
    },
    {
      style: 'width: 100%',
      progressCLass:'progress-bar bg-danger',
    },

  ]
}
    `,

}
export let StripedProgress= {
  Html: ` @for (item of StripedProgress; track $index) {
            <div class="progress mb-3" role="progressbar" aria-valuemin="0" aria-valuemax="100">
                <div [class]="item.progressCLass" [style]="item.style"></div>
            </div>
            }  `,
  Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-progress',
  imports: [],
  templateUrl: './progress.html',
  styleUrl: './progress.scss'
})
export class ProgressComponent {
 StripedProgress= [
    {
      style: 'width: 0%',
      progressCLass:'progress-bar progress-bar-striped bg-secondary',
    },
    {
      style: 'width: 20%',
      progressCLass:'progress-bar progress-bar-striped bg-warning',
    },
    {
      style: 'width: 50%',
      progressCLass:'progress-bar progress-bar-striped bg-info',
    },
    {
      style: 'width: 75%',
      progressCLass:'progress-bar progress-bar-striped bg-success',
    },
    {
      style: 'width: 100%',
      progressCLass:'progress-bar progress-bar-striped bg-danger',
    },

  ]
}
    `,

}
export let ProgressHeight = {
  Html: `   <div class="progress progress-xs mb-3" role="progressbar" aria-valuenow="10" aria-valuemin="0"
                aria-valuemax="100">
                <div class="progress-bar bg-primary" style="width: 10%">
                </div>
            </div>
            <div class="progress progress-sm mb-3" role="progressbar" aria-valuenow="25" aria-valuemin="0"
                aria-valuemax="100">
                <div class="progress-bar bg-primary" style="width: 25%">
                </div>
            </div>
            <div class="progress mb-3" role="progressbar" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100">
                <div class="progress-bar bg-primary" style="width: 50%">
                </div>
            </div>
            <div class="progress progress-lg mb-3" role="progressbar" aria-valuenow="75" aria-valuemin="0"
                aria-valuemax="100">
                <div class="progress-bar bg-primary" style="width: 75%">
                </div>
            </div>
            <div class="progress progress-xl" role="progressbar" aria-valuenow="100" aria-valuemin="0"
                aria-valuemax="100">
                <div class="progress-bar bg-primary" style="width: 100%"></div>
            </div> `,
  Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-progress',
  imports: [],
  templateUrl: './progress.html',
  styleUrl: './progress.scss'
})
export class ProgressComponent {

}
    `,

}
export let  ProgressWithLabels= {
  Html: `   @for (item of ProgressWithLabels; track $index) {
            <div class="progress mb-3" role="progressbar" aria-valuemin="0" aria-valuemax="100">
                <div [class]="item.progressCLass" [style]="item.style">{{item.value}}</div>
            </div>
            } `,
  Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-progress',
  imports: [],
  templateUrl: './progress.html',
  styleUrl: './progress.scss'
})
export class ProgressComponent {
 ProgressWithLabels = [
    {
      style: 'width: 10%',
      progressCLass:'progress-bar ',
      value:'10%'


    },
    {
      style: 'width: 20%',
      progressCLass:'progress-bar bg-secondary',
      value:' 20%'

    },
    {
      style: 'width: 40%',
      progressCLass:'progress-bar bg-warning',
      value:'40%'

    },
    {
      style: 'width: 60%',
      progressCLass:'progress-bar bg-info',
      value:'60%'

    },
    {
      style: 'width: 80%',
      progressCLass:'progress-bar bg-success',
      value:'80%'

    },
 

  ]
}
    `,

}
export let MultiplebarsWithSizes= {
  Html: ` <div class="progress-stacked progress-xs mb-3">
                <div class="progress-bar" role="progressbar" style="width: 5%" aria-valuenow="5" aria-valuemin="0"
                    aria-valuemax="100"></div>
                <div class="progress-bar bg-secondary" role="progressbar" style="width: 10%" aria-valuenow="10"
                    aria-valuemin="0" aria-valuemax="100"></div>
                <div class="progress-bar bg-success" role="progressbar" style="width: 15%" aria-valuenow="15"
                    aria-valuemin="0" aria-valuemax="100"></div>
            </div>
            <div class="progress-stacked progress-sm mb-3">
                <div class="progress-bar bg-warning" role="progressbar" style="width: 10%" aria-valuenow="10"
                    aria-valuemin="0" aria-valuemax="100"></div>
                <div class="progress-bar bg-info" role="progressbar" style="width: 15%" aria-valuenow="15"
                    aria-valuemin="0" aria-valuemax="100"></div>
                <div class="progress-bar bg-danger" role="progressbar" style="width: 20%" aria-valuenow="20"
                    aria-valuemin="0" aria-valuemax="100"></div>
            </div>
            <div class="progress-stacked mb-3">
                <div class="progress-bar bg-info" role="progressbar" style="width: 15%" aria-valuenow="15"
                    aria-valuemin="0" aria-valuemax="100"></div>
                <div class="progress-bar bg-success" role="progressbar" style="width: 20%" aria-valuenow="20"
                    aria-valuemin="0" aria-valuemax="100"></div>
                <div class="progress-bar" role="progressbar" style="width: 25%" aria-valuenow="25" aria-valuemin="0"
                    aria-valuemax="100"></div>
            </div>
            <div class="progress-stacked progress-lg mb-3">
                <div class="progress-bar bg-purple" role="progressbar" style="width: 20%" aria-valuenow="20"
                    aria-valuemin="0" aria-valuemax="100"></div>
                <div class="progress-bar bg-teal" role="progressbar" style="width: 25%" aria-valuenow="25"
                    aria-valuemin="0" aria-valuemax="100"></div>
                <div class="progress-bar bg-orange" role="progressbar" style="width: 30%" aria-valuenow="30"
                    aria-valuemin="0" aria-valuemax="100"></div>
            </div>
            <div class="progress-stacked progress-xl mb-0">
                <div class="progress-bar bg-success" role="progressbar" style="width: 25%" aria-valuenow="25"
                    aria-valuemin="0" aria-valuemax="100"></div>
                <div class="progress-bar bg-danger" role="progressbar" style="width: 30%" aria-valuenow="30"
                    aria-valuemin="0" aria-valuemax="100"></div>
                <div class="progress-bar bg-warning" role="progressbar" style="width: 35%" aria-valuenow="35"
                    aria-valuemin="0" aria-valuemax="100"></div>
            </div>  `,
  Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-progress',
  imports: [],
  templateUrl: './progress.html',
  styleUrl: './progress.scss'
})
export class ProgressComponent {

}
    `,

}
export let AnimatedStrippedProgress= {
  Html: `   @for (item of AnimatedStrippedProgress; track $index) {
            <div class="progress mb-3" role="progressbar" aria-valuemin="0" aria-valuemax="100">
                <div [class]="item.progressCLass" [style]="item.style"></div>
            </div>
            }  `,
  Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-progress',
  imports: [],
  templateUrl: './progress.html',
  styleUrl: './progress.scss'
})
export class ProgressComponent {
 AnimatedStrippedProgress= [
    {
      style: 'width: 10%',
      progressCLass:'progress-bar progress-bar-striped progress-bar-animated',
    },
    {
      style: 'width: 20%',
      progressCLass:'progress-bar bg-secondary progress-bar-striped progress-bar-animated',
    },
    {
      style: 'width: 40%',
      progressCLass:'progress-bar bg-success progress-bar-striped progress-bar-animated',
    },
    {
      style: 'width: 60%',
      progressCLass:'progress-bar bg-info progress-bar-striped progress-bar-animated',
    },
    {
      style: 'width: 100%',
      progressCLass:'progress-bar bg-warning progress-bar-striped progress-bar-animated',
    },

  ]
}
    `,

}
export let GradientProgress = {
  Html: `    @for (item of GradientProgress; track $index) {
            <div class="progress mb-3" role="progressbar" aria-valuemin="0" aria-valuemax="100">
                <div [class]="item.progressCLass" [style]="item.style"></div>
            </div>
            } `,
  Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-progress',
  imports: [],
  templateUrl: './progress.html',
  styleUrl: './progress.scss'
})
export class ProgressComponent {
GradientProgress= [
    {
      style: 'width: 10%',
      progressCLass:'progress-bar  bg-primary-gradient progress-bar-striped progress-bar-animated',
    },
    {
      style: 'width: 20%',
      progressCLass:'progress-bar bg-secondary-gradient progress-bar-striped progress-bar-animated',
    },
    {
      style: 'width: 40%',
      progressCLass:'progress-bar bg-success-gradient progress-bar-striped progress-bar-animated',
    },
    {
      style: 'width: 60%',
      progressCLass:'progress-bar bg-info-gradient progress-bar-striped progress-bar-animated',
    },
    {
      style: 'width: 100%',
      progressCLass:'progress-bar bg-warning-gradient progress-bar-striped progress-bar-animated',
    },

  ]
}
    `,

}
export let CustomAnimatedProgress= {
  Html: `   @for (item of CustomAnimatedProgress; track $index) {
            <div class="progress mb-3 progress-animate" role="progressbar" aria-valuemin="0" aria-valuemax="100">
                <div [class]="item.progressCLass" [style]="item.style"></div>
            </div>
            }`,
  Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-progress',
  imports: [],
  templateUrl: './progress.html',
  styleUrl: './progress.scss'
})
export class ProgressComponent {

}
    `,

}
export let CustomProgress1= {
  Html: `<div class="progress progress-sm progress-custom mb-5 progress-animate" role="progressbar"
                aria-valuenow="50" aria-valuemin="0" aria-valuemax="100">
                <h6 class="progress-bar-title">Mobiles</h6>
                <div class="progress-bar" style="width: 50%">
                    <div class="progress-bar-value">50%</div>
                </div>
            </div>
            <div class="progress progress-sm progress-custom mb-5 progress-animate" role="progressbar"
                aria-valuenow="60" aria-valuemin="0" aria-valuemax="100">
                <h6 class="progress-bar-title bg-secondary">Watches</h6>
                <div class="progress-bar bg-secondary" style="width: 60%">
                    <div class="progress-bar-value bg-secondary">60%</div>
                </div>
            </div>
            <div class="progress progress-sm progress-custom progress-animate" role="progressbar" aria-valuenow="70"
                aria-valuemin="0" aria-valuemax="100">
                <h6 class="progress-bar-title bg-danger">Shirts</h6>
                <div class="progress-bar bg-danger" style="width: 70%">
                    <div class="progress-bar-value bg-danger">70%</div>
                </div>
            </div>  `,
  Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-progress',
  imports: [],
  templateUrl: './progress.html',
  styleUrl: './progress.scss'
})
export class ProgressComponent {

}
    `,

}
export let CustomProgress2= {
  Html: `  <div class="progress progress-sm mb-4" role="progressbar" aria-valuenow="50" aria-valuemin="0"
                aria-valuemax="100">
                <div class="progress-item-1 bg-primary"></div>
                <div class="progress-item-2"></div>
                <div class="progress-item-3"></div>
                <div class="progress-bar" style="width: 50%"></div>
            </div>
            <div class="progress progress-sm mb-4" role="progressbar" aria-valuenow="60" aria-valuemin="0"
                aria-valuemax="100">
                <div class="progress-item-1 bg-secondary"></div>
                <div class="progress-item-2 bg-secondary"></div>
                <div class="progress-item-3"></div>
                <div class="progress-bar bg-secondary" style="width: 60%"></div>
            </div>
            <div class="progress progress-sm mb-4" role="progressbar" aria-valuenow="70" aria-valuemin="0"
                aria-valuemax="100">
                <div class="progress-item-1 bg-danger"></div>
                <div class="progress-item-2 bg-danger"></div>
                <div class="progress-item-3"></div>
                <div class="progress-bar bg-danger" style="width: 70%"></div>
            </div>
            <div class="progress progress-sm mb-4" role="progressbar" aria-valuenow="80" aria-valuemin="0"
                aria-valuemax="100">
                <div class="progress-item-1 bg-info"></div>
                <div class="progress-item-2 bg-info"></div>
                <div class="progress-item-3 bg-info"></div>
                <div class="progress-bar bg-info" style="width: 80%"></div>
            </div>
            <div class="progress progress-sm" role="progressbar" aria-valuenow="90" aria-valuemin="0"
                aria-valuemax="100">
                <div class="progress-item-1 bg-warning"></div>
                <div class="progress-item-2 bg-warning"></div>
                <div class="progress-item-3 bg-warning"></div>
                <div class="progress-bar bg-warning" style="width: 90%"></div>
            </div>  `,
  Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-progress',
  imports: [],
  templateUrl: './progress.html',
  styleUrl: './progress.scss'
})
export class ProgressComponent {

}
    `,

}
export let CustomProgress3= {
  Html: ` <div class="progress progress-lg mb-4 custom-progress-3 progress-animate" role="progressbar"
                aria-valuenow="50" aria-valuemin="0" aria-valuemax="100">
                <div class="progress-bar" style="width: 50%">
                    <div class="progress-bar-value">50%</div>
                </div>
            </div>
            <div class="progress progress-lg mb-4 custom-progress-3 progress-animate" role="progressbar"
                aria-valuenow="60" aria-valuemin="0" aria-valuemax="100">
                <div class="progress-bar bg-secondary" style="width: 60%">
                    <div class="progress-bar-value secondary">60%</div>
                </div>
            </div>
            <div class="progress progress-lg custom-progress-3 progress-animate" role="progressbar" aria-valuenow="70"
                aria-valuemin="0" aria-valuemax="100">
                <div class="progress-bar bg-danger" style="width: 70%">
                    <div class="progress-bar-value danger">70%</div>
                </div>
            </div>  `,
  Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-progress',
  imports: [],
  templateUrl: './progress.html',
  styleUrl: './progress.scss'
})
export class ProgressComponent {

}
    `,

}
export let CustomProgress4= {
  Html: ` <div class="progress progress-xl mb-3 progress-animate custom-progress-4" role="progressbar"
                aria-valuenow="10" aria-valuemin="0" aria-valuemax="100">
                <div class="progress-bar bg-primary-gradient" style="width: 10%"></div>
                <div class="progress-bar-label">10%</div>
            </div>
            <div class="progress progress-xl mb-3 progress-animate custom-progress-4 secondary" role="progressbar"
                aria-valuenow="20" aria-valuemin="0" aria-valuemax="100">
                <div class="progress-bar bg-secondary-gradient" style="width: 20%"></div>
                <div class="progress-bar-label">20%</div>
            </div>
            <div class="progress progress-xl mb-3 progress-animate custom-progress-4 success" role="progressbar"
                aria-valuenow="40" aria-valuemin="0" aria-valuemax="100">
                <div class="progress-bar bg-success-gradient" style="width: 40%"></div>
                <div class="progress-bar-label">40%</div>
            </div>
            <div class="progress progress-xl mb-3 progress-animate custom-progress-4 info" role="progressbar"
                aria-valuenow="60" aria-valuemin="0" aria-valuemax="100">
                <div class="progress-bar bg-info-gradient" style="width: 60%"></div>
                <div class="progress-bar-label">60%</div>
            </div>
            <div class="progress progress-xl mb-3 progress-animate custom-progress-4 warning" role="progressbar"
                aria-valuenow="80" aria-valuemin="0" aria-valuemax="100">
                <div class="progress-bar bg-warning-gradient" style="width: 80%"></div>
                <div class="progress-bar-label">80%</div>
            </div>
            <div class="progress progress-xl progress-animate custom-progress-4 danger" role="progressbar"
                aria-valuenow="90" aria-valuemin="0" aria-valuemax="100">
                <div class="progress-bar bg-danger-gradient" style="width: 90%"></div>
                <div class="progress-bar-label">90%</div>
            </div>  `,
  Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-progress',
  imports: [],
  templateUrl: './progress.html',
  styleUrl: './progress.scss'
})
export class ProgressComponent {

}
    `,

}
export let CustomProgress5= {
  Html: ` <h6 class="fw-medium mb-2">Project Dependencies</h6>
            <div class="progress-stacked progress-xl mb-5">
                <div class="progress-bar" role="progressbar" style="width: 25%" aria-valuenow="25" aria-valuemin="0"
                    aria-valuemax="100">25%</div>
                <div class="progress-bar bg-secondary" role="progressbar" style="width: 35%" aria-valuenow="35"
                    aria-valuemin="0" aria-valuemax="100">35%</div>
                <div class="progress-bar bg-danger" role="progressbar" style="width: 40%" aria-valuenow="40"
                    aria-valuemin="0" aria-valuemax="100">40%</div>
            </div>
            <div class="row justify-content-center">
                <div class="col-xl-5">
                    <div class="border p-3">
                        <p class="fs-12 fw-medium mb-0 text-muted">Html<span
                                class="float-end fs-10 fw-normal">25%</span></p>
                        <div class="progress progress-xs mb-4 progress-animate" role="progressbar" aria-valuenow="25"
                            aria-valuemin="0" aria-valuemax="100">
                            <div class="progress-bar bg-primary" style="width: 25%">
                            </div>
                        </div>
                        <p class="fs-12 fw-medium mb-0 text-muted">Css<span class="float-end fs-10 fw-normal">35%</span>
                        </p>
                        <div class="progress progress-xs mb-4 progress-animate" role="progressbar" aria-valuenow="35"
                            aria-valuemin="0" aria-valuemax="100">
                            <div class="progress-bar bg-secondary" style="width: 35%">
                            </div>
                        </div>
                        <p class="fs-12 fw-medium mb-0 text-muted">Js<span class="float-end fs-10 fw-normal">40%</span>
                        </p>
                        <div class="progress progress-xs mb-0 progress-animate" role="progressbar" aria-valuenow="40"
                            aria-valuemin="0" aria-valuemax="100">
                            <div class="progress-bar bg-danger" style="width: 40%">
                            </div>
                        </div>
                    </div>
                </div>
            </div>  `,
  Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-progress',
  imports: [],
  templateUrl: './progress.html',
  styleUrl: './progress.scss'
})
export class ProgressComponent {

}
    `,

}

