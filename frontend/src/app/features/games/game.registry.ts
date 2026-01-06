import { Type } from '@angular/core';

// Game Imports
import { BabbleComponent } from './babble/babble-game/babble.component';
import { ScatterbrainComponent } from './scatterbrain/scatterbrain-game/scatterbrain.component';
import { OneAndOnlyGameComponent } from './one-and-only/one-and-only-game/one-and-only-game.component';
import { GreatMindsGameComponent } from './great-minds/great-minds-game/great-minds.component';
import { BreakingNewsComponent } from './breaking-news/breaking-news-game/breaking-news.component';
import { UniversalTranslatorComponent } from './universal-translator/universal-translator-game/universal-translator.component';
import { SymbologyComponent } from './symbology/symbology-game/symbology.component';
import { PoppycockGameComponent } from './poppycock/poppycock-game/poppycock-game.component';
import { WisecrackGameComponent } from './wisecrack/wisecrack-game/wisecrack-game.component';
import { PictophoneGameComponent } from './pictophone/pictophone-game/pictophone-game.component';
import { DeepfakeGameComponent } from './deepfake-game/deepfake-game/deepfake-game.component';
import { SushiTrainComponent } from './sushi-train/sushi-train-game/sushi-train.component';

// Backlog Stubs
import { NomDeCodeGameComponent } from './nom-de-code/nom-de-code-game/nom-de-code-game.component';
import { WarshipsGameComponent } from './warships/warships-game/warships-game.component';
import { FourInARowGameComponent } from './four-in-a-row/four-in-a-row-game/four-in-a-row-game.component';
import { CheckersGameComponent } from './checkers/checkers-game/checkers-game.component';

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
        hostComponent: OneAndOnlyGameComponent
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
        hostComponent: PoppycockGameComponent
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
        hostComponent: SushiTrainComponent
    },
    'NomDeCode': {
        hostComponent: NomDeCodeGameComponent
    },
    'Warships': {
        hostComponent: WarshipsGameComponent
    },
    'FourInARow': {
        hostComponent: FourInARowGameComponent
    },
    'Checkers': {
        hostComponent: CheckersGameComponent
    }
};
