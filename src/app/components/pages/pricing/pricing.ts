import { Component } from '@angular/core';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { SpkPricingCard2 } from "../../../@spk/pages/spk-pricing-card2/spk-pricing-card2";
import { SpkPricingCard } from "../../../@spk/pages/spk-pricing-card/spk-pricing-card";

@Component({
  selector: 'app-pricing',
  imports: [NgbNavModule,  SpkPricingCard2, SpkPricingCard],
  templateUrl: './pricing.html',
  styleUrl: './pricing.scss'
})
export class Pricing {



  pricingPlans2 = [
    {
      name: 'Business',
      subTitle: 'For Basic Business purpose !',
      bestPrice: '$29',
      vatTax: '$10',
      total: '$29',
      buttonText: 'Select',
      features: [
        { label: 'Storage Capacity', badge: '1Tb', price: '$12', isSelected: true },
        { label: 'Daily Updates', badge: 'Unlimited', price: '$9', isSelected: true },
        { label: 'Visitors Monitoring', price: 'Free', isSelected: true },
        { label: 'Online Support', badge: '24/7', price: '24/7', isSelected: false },
        { label: 'Email Account', badge: '365 d', price: '$10', isSelected: false },
        { label: 'Ios & Android ready', price: 'Free', isSelected: true }
      ]
    },
    {
      name: 'Advanced',
      subTitle: 'For Advanced business purpose !',
      bestPrice: '$599',
      vatTax: '$10',
      total: '$599',
      buttonText: 'Select',
      isAdvanced: true, // Triggers border-primary
      statusBadge: 'New',
      features: [
        { label: 'Storage Capacity', badge: '5 TB', price: '$140', isSelected: true, isPrimary: true },
        { label: 'Daily Updates', badge: 'Unlimited', price: '$100', isSelected: true },
        { label: 'Visitors Monitoring', price: 'Free', isSelected: true },
        { label: 'Online Support', badge: '24/7', price: '$245', isSelected: true, isPrimary: true },
        { label: 'Email Account', badge: '365 d', price: '$154', isSelected: true },
        { label: 'Ios & Android ready', price: 'Free', isSelected: true }
      ]
    },
    {
      name: 'Regular',
      subTitle: 'For Regular business purpose !',
      bestPrice: '$79',
      vatTax: '$10',
      total: '$79',
      buttonText: 'Purchase',
      features: [
        { label: 'Storage Capacity', badge: '2 TB', price: '$29', isSelected: true },
        { label: 'Daily Updates', badge: 'Unlimited', price: '$10', isSelected: true },
        { label: 'Visitors Monitoring', price: 'Free', isSelected: true },
        { label: 'Online Support', badge: '24/7', price: '$30', isSelected: false },
        { label: 'Email Account', badge: '365 d', price: '$10', isSelected: true },
        { label: 'Ios & Android ready', price: 'Free', isSelected: true }
      ]
    },
    {
      name: 'Premium',
      subTitle: 'For Premium business purpose !',
      bestPrice: '$129',
      vatTax: '$10',
      total: '$129',
      buttonText: 'Purchase',
      features: [
        { label: 'Storage Capacity', badge: '3 TB', price: '$59', isSelected: true },
        { label: 'Daily Updates', badge: 'Unlimited', price: '$20', isSelected: true },
        { label: 'Visitors Monitoring', price: 'Free', isSelected: true },
        { label: 'Online Support', badge: '24/7', price: '$40', isSelected: false },
        { label: 'Email Account', badge: '365 d', price: '$20', isSelected: true },
        { label: 'Ios & Android ready', price: 'Free', isSelected: true }
      ]
    }
  ];




  // Unified pricing data
  pricing = [
    {
      name: 'Basic',
      monthlyPrice: '0',
      yearlyPrice: '0',
      description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Iure quos debitis aliquam.',
      isPopular: false,
      domains: '2 Free',
      apps: 3,
      databases: 1,
      billedText: 'on regular basis!'
    },
    {
      name: 'Advanced',
      monthlyPrice: '59',
      yearlyPrice: '699',
      description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Iure quos debitis aliquam.',
      isPopular: true,
      domains: '5 Free',
      apps: 5,
      databases: 3,
      billedText: 'on regular basis!'
    },
    {
      name: 'Regular',
      monthlyPrice: '79',
      yearlyPrice: '899',
      description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Iure quos debitis aliquam.',
      isPopular: false,
      domains: '1 Free',
      apps: 4,
      databases: 2,
      billedText: 'on regular basis!'
    },
    {
      name: 'Premium',
      monthlyPrice: '129',
      yearlyPrice: '1,299',
      description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Iure quos debitis aliquam.',
      isPopular: false,
      domains: '1 Free',
      apps: 5,
      databases: 3,
      billedText: 'on regular basis!'
    }
  ];
}


