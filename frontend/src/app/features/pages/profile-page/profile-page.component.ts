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

  public topOptions = ["bob", "bun", "curly", "dreads", "frida", "frizzle", "longButNotTooLong", "miaWallace", "shavedSides", "shortFlat", "shortRound", "shortWaved", "sides", "theCaesar", "theCaesarAndSidePart", "turban", "winterHat1", "bigHair"];
  public clothingOptions = ["blazerAndShirt", "blazerAndSweater", "collarAndSweater", "graphicShirt", "hoodie", "overall", "shirtCrewNeck", "shirtScoopNeck", "shirtVNeck"];
  public mouthOptions = ["concerned", "default", "disbelief", "eating", "grimace", "sad", "screamOpen", "serious", "smile", "tongue", "twinkle", "vomit"];
  public skinColorOptions = ["614335", "ae5d29", "d08b5b", "edb98a", "f8d25c", "fd9841", "ffdbb4"];
  public eyesOptions = ["closed", "cry", "default", "eyeRoll", "happy", "hearts", "side", "squint", "surprised", "wink", "winkWacky"];
  public eyebrowsOptions = ["angry", "angryNatural", "default", "defaultNatural", "flatNatural", "frownNatural", "raisedExcited", "raisedExcitedNatural", "sadConcerned", "sadConcernedNatural", "unibrowNatural", "upDown", "upDownNatural"];
  public hairColorOptions = ["282828", "724133", "a55728", "f59797", "b58143", "d6b370", "e8e1e1", "c93305", "2c1b18", "4a312c"];
  public clothesColorOptions = ["262e33", "65c9ff", "5199e4", "25557c", "e6e6e6", "929598", "3c4f5c", "a7ffc4", "ffdeb5", "ffafb9", "ffffb1", "ff5c5c", "e32727"];

  public selectedTop = 13;
  public selectedClothing = 6;
  public selectedMouth = 8;
  public selectedSkinColor = 3;
  public selectedEyes = 2; // default
  public selectedEyebrows = 2; // default
  public selectedHairColor = 0; // 282828
  public selectedClothesColor = 0;
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

      const clo = urlObj.searchParams.get('clothing');
      if (clo && this.clothingOptions.includes(clo)) this.selectedClothing = this.clothingOptions.indexOf(clo);

      const bg = urlObj.searchParams.get('backgroundColor');
      if (bg) this.selectedBgColor = bg.split(',')[0];

      const mouth = urlObj.searchParams.get('mouth');
      if (mouth && this.mouthOptions.includes(mouth)) this.selectedMouth = this.mouthOptions.indexOf(mouth);

      const skin = urlObj.searchParams.get('skinColor');
      if (skin && this.skinColorOptions.includes(skin)) this.selectedSkinColor = this.skinColorOptions.indexOf(skin);

      const eyes = urlObj.searchParams.get('eyes');
      if (eyes && this.eyesOptions.includes(eyes)) this.selectedEyes = this.eyesOptions.indexOf(eyes);

      const eyebrows = urlObj.searchParams.get('eyebrows');
      if (eyebrows && this.eyebrowsOptions.includes(eyebrows)) this.selectedEyebrows = this.eyebrowsOptions.indexOf(eyebrows);

      const hairColor = urlObj.searchParams.get('hairColor');
      if (hairColor && this.hairColorOptions.includes(hairColor)) this.selectedHairColor = this.hairColorOptions.indexOf(hairColor);

      const clothesColor = urlObj.searchParams.get('clothesColor');
      if (clothesColor && this.clothesColorOptions.includes(clothesColor)) this.selectedClothesColor = this.clothesColorOptions.indexOf(clothesColor);
    } catch (e) { }
  }

  updatePreview() {
    if (this.isGuest) return; // Guests can't tweak

    const seed = this.user?.displayName || 'default';
    let newUrl = `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}`;

    newUrl += `&top=${this.topOptions[this.selectedTop]}`;
    newUrl += `&hairColor=${this.hairColorOptions[this.selectedHairColor]}`;
    newUrl += `&clothing=${this.clothingOptions[this.selectedClothing]}`;
    newUrl += `&clothesColor=${this.clothesColorOptions[this.selectedClothesColor]}`;
    newUrl += `&eyes=${this.eyesOptions[this.selectedEyes]}`;
    newUrl += `&eyebrows=${this.eyebrowsOptions[this.selectedEyebrows]}`;
    newUrl += `&mouth=${this.mouthOptions[this.selectedMouth]}`;
    newUrl += `&skinColor=${this.skinColorOptions[this.selectedSkinColor]}`;
    newUrl += `&backgroundColor=${this.selectedBgColor}`;

    this.currentAvatarUrl = newUrl;
  }

  randomizeHair() {
    this.selectedTop = Math.floor(Math.random() * this.topOptions.length);
    this.selectedHairColor = Math.floor(Math.random() * this.hairColorOptions.length);
    this.updatePreview();
  }

  randomizeFace() {
    this.selectedEyes = Math.floor(Math.random() * this.eyesOptions.length);
    this.selectedEyebrows = Math.floor(Math.random() * this.eyebrowsOptions.length);
    this.selectedMouth = Math.floor(Math.random() * this.mouthOptions.length);
    this.updatePreview();
  }

  randomizeClothing() {
    this.selectedClothing = Math.floor(Math.random() * this.clothingOptions.length);
    this.selectedClothesColor = Math.floor(Math.random() * this.clothesColorOptions.length);
    this.updatePreview();
  }

  setSkinColor(hex: string) {
    if (this.skinColorOptions.includes(hex)) {
      this.selectedSkinColor = this.skinColorOptions.indexOf(hex);
      this.updatePreview();
    }
  }

  setBgColor(hex: string) {
    this.selectedBgColor = hex;
    this.updatePreview();
  }

  randomize() {
    if (this.isGuest) return;
    this.selectedTop = Math.floor(Math.random() * this.topOptions.length);
    this.selectedHairColor = Math.floor(Math.random() * this.hairColorOptions.length);

    this.selectedEyes = Math.floor(Math.random() * this.eyesOptions.length);
    this.selectedEyebrows = Math.floor(Math.random() * this.eyebrowsOptions.length);
    this.selectedMouth = Math.floor(Math.random() * this.mouthOptions.length);

    this.selectedClothing = Math.floor(Math.random() * this.clothingOptions.length);
    this.selectedClothesColor = Math.floor(Math.random() * this.clothesColorOptions.length);

    this.selectedSkinColor = Math.floor(Math.random() * this.skinColorOptions.length);

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
