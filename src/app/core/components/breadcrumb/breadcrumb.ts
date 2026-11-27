import { Component, Input, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { BreadcrumbService } from '../../services/breadcrumb';
import { BreadcrumbItem } from '../../models/breadcrumb.models';

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './breadcrumb.html',
  styleUrl: './breadcrumb.css'
})
export class Breadcrumb implements OnInit, OnDestroy {
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly cdr = inject(ChangeDetectorRef);
  private subscription?: Subscription;

  @Input() items?: BreadcrumbItem[];

  breadcrumbsList: BreadcrumbItem[] = [];

  ngOnInit(): void {
    if (this.items && this.items.length > 0) {
      this.breadcrumbsList = this.items;
    } else {
      this.subscription = this.breadcrumbService.breadcrumbs$.subscribe((items) => {
        this.breadcrumbsList = items;
        this.cdr.markForCheck();
      });
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
