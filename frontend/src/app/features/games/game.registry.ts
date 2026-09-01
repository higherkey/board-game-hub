import { Type } from '@angular/core';

import { BabbleComponent } from './babble/babble-game/babble.component';
import { ScatterbrainComponent } from './scatterbrain/scatterbrain-game/scatterbrain.component';
import { ScatterbrainHandComponent } from './scatterbrain/scatterbrain-hand/scatterbrain-hand.component';
import { OneAndOnlyGameComponent } from './one-and-only/one-and-only-game/one-and-only-game.component';
import { GreatMindsGameComponent } from './great-minds/great-minds-game/great-minds.component';
import { BreakingNewsComponent } from './breaking-news/breaking-news-game/breaking-news.component';
import { UniversalTranslatorComponent } from './universal-translator/universal-translator-game/universal-translator.component';
import { SymbologyComponent } from './symbology/symbology-game/symbology.component';
import { PoppycockGameComponent } from './poppycock/poppycock-game/poppycock-game.component';
import { PoppycockPlayerComponent } from './poppycock/poppycock-player/poppycock-player.component';
import { WisecrackGameComponent } from './wisecrack/wisecrack-game/wisecrack-game.component';
import { WisecrackPlayerComponent } from './wisecrack/wisecrack-player/wisecrack-player.component';
import { PictophoneGameComponent } from './pictophone/pictophone-game/pictophone-game.component';
import { PictophoneHandComponent } from './pictophone/pictophone-hand/pictophone-hand.component';
import { DeepfakeGameComponent } from './deepfake-game/deepfake-game/deepfake-game.component';
import { SushiTrainComponent } from './sushi-train/sushi-train-game/sushi-train.component';
import { FarkleTableComponent } from './farkle/farkle-table/farkle-table';
import { FarkleHandComponent } from './farkle/farkle-hand/farkle-hand';

// Clover-Minded
import { CloverMindedTableComponent } from './clover-minded/clover-minded-table/clover-minded-table.component';
import { CloverMindedHandComponent } from './clover-minded/clover-minded-hand/clover-minded-hand.component';

// Backlog Stubs
import { NomDeCodeGameComponent } from './nom-de-code/nom-de-code-game/nom-de-code-game.component';
import { WarshipsGameComponent } from './warships/warships-game/warships-game.component';
import { FourInARowGameComponent } from './four-in-a-row/four-in-a-row-game/four-in-a-row-game.component';

export interface GameConfig {
    tableComponent: Type<any>;
    handComponent?: Type<any>;
}

export const GAME_REGISTRY: Record<string, GameConfig> = {
    'Babble': {
        tableComponent: BabbleComponent
    },
    'Scatterbrain': {
        tableComponent: ScatterbrainComponent,
        handComponent: ScatterbrainHandComponent
    },
    'OneAndOnly': {
        tableComponent: OneAndOnlyGameComponent
    },
    'GreatMinds': {
        tableComponent: GreatMindsGameComponent
    },
    'BreakingNews': {
        tableComponent: BreakingNewsComponent
    },
    'UniversalTranslator': {
        tableComponent: UniversalTranslatorComponent
    },
    'Poppycock': {
        tableComponent: PoppycockGameComponent,
        handComponent: PoppycockPlayerComponent
    },
    'Symbology': {
        tableComponent: SymbologyComponent
    },
    'Wisecrack': {
        tableComponent: WisecrackGameComponent,
        handComponent: WisecrackPlayerComponent
    },
    'Pictophone': {
        tableComponent: PictophoneGameComponent,
        handComponent: PictophoneHandComponent
    },
    'Deepfake': {
        tableComponent: DeepfakeGameComponent
    },
    'SushiTrain': {
        tableComponent: SushiTrainComponent
    },
    'CloverMinded': {
        tableComponent: CloverMindedTableComponent,
        handComponent: CloverMindedHandComponent
    },
    'NomDeCode': {
        tableComponent: NomDeCodeGameComponent
    },
    'Warships': {
        tableComponent: WarshipsGameComponent
    },
    'FourInARow': {
        tableComponent: FourInARowGameComponent
    },
    'Farkle': {
        tableComponent: FarkleTableComponent,
        handComponent: FarkleHandComponent
    }
};
