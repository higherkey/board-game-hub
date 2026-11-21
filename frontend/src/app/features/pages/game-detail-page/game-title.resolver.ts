import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { GameDataService, GameDefinition } from '../../../services/game-data.service';
import { findGameBySlug } from '../../../shared/game-slug';

/** Tab title for /shelf/:slug: the game's name. The catalogue is bundled, so this resolves at once. */
export const gameTitleResolver: ResolveFn<string> = route => {
    const slug = route.paramMap.get('slug') ?? '';
    return inject(GameDataService).games$.pipe(
        filter((games): games is GameDefinition[] => !!games),
        take(1),
        map(games => findGameBySlug(games, slug)?.name ?? 'Game not found')
    );
};
