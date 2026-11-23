import { GameDefinition } from '../services/game-data.service';

/** URL slug for a game id: "CloverMinded" becomes "clover-minded". */
export function gameSlug(id: string): string {
    return id
        .replaceAll(/([a-z0-9])([A-Z])/g, '$1-$2')
        .replaceAll(/([A-Z])([A-Z][a-z])/g, '$1-$2') // "ARow" in FourInARow

        .replaceAll(/[^A-Za-z0-9]+/g, '-')
        .replaceAll(/^-|-$/g, '')
        .toLowerCase();
}

/** Finds a game by its slug, or by its raw id in any case so older links still resolve. */
export function findGameBySlug<T extends Pick<GameDefinition, 'id'>>(games: readonly T[], slug: string): T | undefined {
    const wanted = slug.toLowerCase();
    return games.find(g => gameSlug(g.id) === wanted || g.id.toLowerCase() === wanted);
}
