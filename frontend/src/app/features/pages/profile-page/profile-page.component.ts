import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService, Session, User } from '../../../services/auth.service';
import { Subject, takeUntil } from 'rxjs';
import { ToastService } from '../../../shared/services/toast.service';
import { Title } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.scss'
})
export class ProfilePageComponent implements OnInit, OnDestroy {
  public session: Session | null = null;
  public user: User | null = null;
  private readonly destroy$ = new Subject<void>();

  // Avataaar generation options
  public currentAvatarUrl = '';
  public originalAvatarUrl = '';
  public isSaving = false;

  public topOptions = ["shortHair", "longHair", "eyepatch", "hat", "hijab", "turban", "winterHat1", "winterHat2", "winterHat3", "winterHat4"];
  public accessoryOptions = ["none", "kurt", "prescription01", "prescription02", "round", "sunglasses", "wayfarers"];
  public clothingOptions = ["blazerAndShirt", "blazerAndSweater", "collarAndSweater", "graphicShirt", "hoodie", "overall", "shirtCrewNeck", "shirtScoopNeck", "shirtVNeck"];

  public selectedTop = 0;
  public selectedAccessory = 0;
  public selectedClothing = 0;
  public selectedBgColor = "b6e3f4";

  constructor(
    private authService: AuthService,
    private toastService: ToastService,
    private titleService: Title
  ) { }

  ngOnInit(): void {
    this.titleService.setTitle('My Profile | Board Game Hub');

    this.authService.session$.pipe(takeUntil(this.destroy$)).subscribe(s => {
      this.session = s;
      if (s && s.isGuest) {
        this.currentAvatarUrl = s.avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${s.name}`;
      }
    });

    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(u => {
      this.user = u;
      if (u) {
        this.originalAvatarUrl = u.avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${u.displayName}`;

        // Only initialize state if we haven't modified it yet
        if (!this.currentAvatarUrl) {
          this.currentAvatarUrl = this.originalAvatarUrl;
          this.parseAvatarUrl(this.currentAvatarUrl);
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isGuest(): boolean {
    return this.session?.isGuest || false;
  }

  get hasChanges(): boolean {
    return this.currentAvatarUrl !== this.originalAvatarUrl;
  }

  // Parses the existing Dicebear URL to extract current selections
  parseAvatarUrl(url: string) {
    try {
      if (!url.includes('api.dicebear.com')) return;
      const urlObj = new URL(url);
      const top = urlObj.searchParams.get('top');
      if (top && this.topOptions.includes(top)) this.selectedTop = this.topOptions.indexOf(top);

      const acc = urlObj.searchParams.get('accessories');
      if (acc && this.accessoryOptions.includes(acc)) this.selectedAccessory = this.accessoryOptions.indexOf(acc);

      const clo = urlObj.searchParams.get('clothing');
      if (clo && this.clothingOptions.includes(clo)) this.selectedClothing = this.clothingOptions.indexOf(clo);

      const bg = urlObj.searchParams.get('backgroundColor');
      if (bg) this.selectedBgColor = bg.split(',')[0];
    } catch (e) { }
  }

  updatePreview() {
    if (this.isGuest) return; // Guests can't tweak

    const seed = this.user?.displayName || 'default';
    let newUrl = `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}`;

    newUrl += `&top=${this.topOptions[this.selectedTop]}`;
    newUrl += `&accessories=${this.accessoryOptions[this.selectedAccessory]}`;
    newUrl += `&clothing=${this.clothingOptions[this.selectedClothing]}`;
    newUrl += `&backgroundColor=${this.selectedBgColor}`;

    this.currentAvatarUrl = newUrl;
  }

  cycleTop(dir: number) {
    this.selectedTop = (this.selectedTop + dir + this.topOptions.length) % this.topOptions.length;
    this.updatePreview();
  }

  cycleAccessory(dir: number) {
    this.selectedAccessory = (this.selectedAccessory + dir + this.accessoryOptions.length) % this.accessoryOptions.length;
    this.updatePreview();
  }

  cycleClothing(dir: number) {
    this.selectedClothing = (this.selectedClothing + dir + this.clothingOptions.length) % this.clothingOptions.length;
    this.updatePreview();
  }

  setBgColor(hex: string) {
    this.selectedBgColor = hex;
    this.updatePreview();
  }

  randomize() {
    if (this.isGuest) return;
    this.selectedTop = Math.floor(Math.random() * this.topOptions.length);
    this.selectedAccessory = Math.floor(Math.random() * this.accessoryOptions.length);
    this.selectedClothing = Math.floor(Math.random() * this.clothingOptions.length);
    const colors = ["b6e3f4", "c0aede", "d1d4f9", "ffdfbf", "ffd5dc", "a8e6cf", "ffaaa5"];
    this.selectedBgColor = colors[Math.floor(Math.random() * colors.length)];
    this.updatePreview();
  }

  save() {
    if (this.isGuest || !this.hasChanges) return;

    this.isSaving = true;
    this.authService.updateAvatar(this.currentAvatarUrl).subscribe({
      next: () => {
        this.originalAvatarUrl = this.currentAvatarUrl;
        this.toastService.showSuccess('Avatar updated successfully!');
        this.isSaving = false;
      },
      error: () => {
        this.toastService.showError('Failed to update avatar.');
        this.isSaving = false;
      }
    });
  }
}
