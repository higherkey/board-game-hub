import { Type } from '@angular/core';

// Game Imports
import { BabbleComponent } from './babble/babble.component';
import { ScatterbrainComponent } from './scatterbrain/scatterbrain.component';
import { OneAndOnlyBoardComponent } from './one-and-only/one-and-only-board.component';
import { OneAndOnlyPlayerComponent } from './one-and-only/one-and-only-player.component';
import { GreatMindsGameComponent } from './great-minds/great-minds.component';
import { BreakingNewsComponent } from './breaking-news/breaking-news.component';
import { UniversalTranslatorComponent } from './universal-translator/universal-translator.component';
import { PoppycockBoardComponent } from './poppycock/poppycock-board.component';
import { PoppycockPlayerComponent } from './poppycock/poppycock-player.component';
import { SymbologyComponent } from './symbology/symbology.component';
import { WisecrackGameComponent } from './wisecrack/wisecrack-game.component';
import { PictophoneGameComponent } from './pictophone/pictophone-game.component';
import { DeepfakeGameComponent } from './deepfake-game/deepfake-game.component';
import { SushiTrainComponent } from './sushi-train/sushi-train.component';
import { SushiTrainPlayerComponent } from './sushi-train/sushi-train-player.component';

export interface GameConfig {
    hostComponent: Type<any>;
    playerComponent?: Type<any>; // If undefined, uses hostComponent for both
}

export const GAME_REGISTRY: Record<string, GameConfig> = {
    'Babble': {
        hostComponent: BabbleComponent
    },
    'Scatterbrain': {
        hostComponent: ScatterbrainComponent
    },
    'OneAndOnly': {
        hostComponent: OneAndOnlyBoardComponent,
        playerComponent: OneAndOnlyPlayerComponent
    },
    'GreatMinds': {
        hostComponent: GreatMindsGameComponent
    },
    'BreakingNews': {
        hostComponent: BreakingNewsComponent
    },
    'UniversalTranslator': {
        hostComponent: UniversalTranslatorComponent
    },
    'Poppycock': {
        hostComponent: PoppycockBoardComponent,
        playerComponent: PoppycockPlayerComponent
    },
    'Symbology': {
        hostComponent: SymbologyComponent
    },
    'Wisecrack': {
        hostComponent: WisecrackGameComponent
    },
    'Pictophone': {
        hostComponent: PictophoneGameComponent
    },
    'Deepfake': {
        hostComponent: DeepfakeGameComponent
    },
    'SushiTrain': {
        hostComponent: SushiTrainComponent,
        playerComponent: SushiTrainPlayerComponent
    }
};
