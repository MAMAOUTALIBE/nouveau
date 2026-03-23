import { Component } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import * as prismCode from '../../../shared/data/prism/ui-elements/progress';
import { ShowcodeCard } from '../../../shared/components/showcode-card/showcode-card';
import { SpkProgressbar } from "../../../@spk/reusable-ui-elements/spk-progressbar/spk-progressbar";


@Component({
    selector: 'app-progress',
    imports: [ NgbModule, ShowcodeCard, SpkProgressbar],
    templateUrl: './progress.html',
    styleUrls: ['./progress.scss']
})
export class Progress {
   prismCodeData = prismCode

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
  DifferentColoredProgress = [
    {
      style: 'width: 0%',
      progressCLass: 'progress-bar bg-secondary',
    },
    {
      style: 'width: 20%',
      progressCLass: 'progress-bar bg-warning',
    },
    {
      style: 'width: 50%',
      progressCLass: 'progress-bar bg-info',
    },
    {
      style: 'width: 75%',
      progressCLass: 'progress-bar bg-success',
    },
    {
      style: 'width: 100%',
      progressCLass: 'progress-bar bg-danger',
    },

  ]
  StripedProgress = [
    {
      style: 'width: 0%',
      progressCLass: 'progress-bar progress-bar-striped bg-secondary',
    },
    {
      style: 'width: 20%',
      progressCLass: 'progress-bar progress-bar-striped bg-warning',
    },
    {
      style: 'width: 50%',
      progressCLass: 'progress-bar progress-bar-striped bg-info',
    },
    {
      style: 'width: 75%',
      progressCLass: 'progress-bar progress-bar-striped bg-success',
    },
    {
      style: 'width: 100%',
      progressCLass: 'progress-bar progress-bar-striped bg-danger',
    },

  ]


  ProgressWithLabels = [
    {
      style: 'width: 10%',
      progressCLass: 'progress-bar ',
      value: '10%'


    },
    {
      style: 'width: 20%',
      progressCLass: 'progress-bar bg-secondary',
      value: ' 20%'

    },
    {
      style: 'width: 40%',
      progressCLass: 'progress-bar bg-warning',
      value: '40%'

    },
    {
      style: 'width: 60%',
      progressCLass: 'progress-bar bg-info',
      value: '60%'

    },
    {
      style: 'width: 80%',
      progressCLass: 'progress-bar bg-success',
      value: '80%'

    },


  ]

  AnimatedStrippedProgress = [
    {
      style: 'width: 10%',
      progressCLass: 'progress-bar progress-bar-striped progress-bar-animated',
    },
    {
      style: 'width: 20%',
      progressCLass: 'progress-bar bg-secondary progress-bar-striped progress-bar-animated',
    },
    {
      style: 'width: 40%',
      progressCLass: 'progress-bar bg-success progress-bar-striped progress-bar-animated',
    },
    {
      style: 'width: 60%',
      progressCLass: 'progress-bar bg-info progress-bar-striped progress-bar-animated',
    },
    {
      style: 'width: 100%',
      progressCLass: 'progress-bar bg-warning progress-bar-striped progress-bar-animated',
    },

  ]
  GradientProgress = [
    {
      style: 'width: 10%',
      progressCLass: 'progress-bar  bg-primary-gradient progress-bar-striped progress-bar-animated',
    },
    {
      style: 'width: 20%',
      progressCLass: 'progress-bar bg-secondary-gradient progress-bar-striped progress-bar-animated',
    },
    {
      style: 'width: 40%',
      progressCLass: 'progress-bar bg-success-gradient progress-bar-striped progress-bar-animated',
    },
    {
      style: 'width: 60%',
      progressCLass: 'progress-bar bg-info-gradient progress-bar-striped progress-bar-animated',
    },
    {
      style: 'width: 100%',
      progressCLass: 'progress-bar bg-warning-gradient progress-bar-striped progress-bar-animated',
    },

  ]
  CustomAnimatedProgress = [
    {
      style: 'width: 10%',
      progressCLass: 'progress-bar  bg-primary-gradient progress-bar-striped progress-bar-animated',
    },
    {
      style: 'width: 20%',
      progressCLass: 'progress-bar bg-secondary-gradient progress-bar-striped progress-bar-animated',
    },
    {
      style: 'width: 40%',
      progressCLass: 'progress-bar bg-success-gradient progress-bar-striped progress-bar-animated',
    },
    {
      style: 'width: 60%',
      progressCLass: 'progress-bar bg-info-gradient progress-bar-striped progress-bar-animated',
    },
    {
      style: 'width: 100%',
      progressCLass: 'progress-bar bg-warning-gradient progress-bar-striped progress-bar-animated',
    },

  ]
}


