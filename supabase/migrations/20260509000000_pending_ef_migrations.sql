START TRANSACTION;


DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260119041642_EnableRlsOnEfHistory') THEN
    ALTER TABLE "__EFMigrationsHistory" ENABLE ROW LEVEL SECURITY;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260119041642_EnableRlsOnEfHistory') THEN
    UPDATE "Games" SET "Status" = 2
    WHERE "Id" = 'BreakingNews';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260119041642_EnableRlsOnEfHistory') THEN
    UPDATE "Games" SET "Status" = 2
    WHERE "Id" = 'Deepfake';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260119041642_EnableRlsOnEfHistory') THEN
    UPDATE "Games" SET "Status" = 2
    WHERE "Id" = 'GreatMinds';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260119041642_EnableRlsOnEfHistory') THEN
    UPDATE "Games" SET "Status" = 2
    WHERE "Id" = 'OneAndOnly';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260119041642_EnableRlsOnEfHistory') THEN
    UPDATE "Games" SET "Status" = 2
    WHERE "Id" = 'Pictophone';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260119041642_EnableRlsOnEfHistory') THEN
    UPDATE "Games" SET "Status" = 2
    WHERE "Id" = 'Poppycock';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260119041642_EnableRlsOnEfHistory') THEN
    UPDATE "Games" SET "Status" = 2
    WHERE "Id" = 'Scatterbrain';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260119041642_EnableRlsOnEfHistory') THEN
    UPDATE "Games" SET "Status" = 2
    WHERE "Id" = 'SushiTrain';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260119041642_EnableRlsOnEfHistory') THEN
    UPDATE "Games" SET "Status" = 2
    WHERE "Id" = 'Symbology';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260119041642_EnableRlsOnEfHistory') THEN
    UPDATE "Games" SET "Status" = 2
    WHERE "Id" = 'UniversalTranslator';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260119041642_EnableRlsOnEfHistory') THEN
    UPDATE "Games" SET "Status" = 2
    WHERE "Id" = 'Wisecrack';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260119041642_EnableRlsOnEfHistory') THEN
    INSERT INTO "Games" ("Id", "AveragePlayTime", "CodeKey", "Complexity", "DefaultRoundLengthSeconds", "Description", "Icon", "MaxPlayers", "MinPlayers", "Name", "SettingsMetadataJson", "Status", "Tags", "TimerType")
    VALUES ('CloverMinded', 25, NULL, 2, 0, 'Work together to associate keywords on your clover board.', '🍀', 6, 3, 'Clover-Minded', NULL, 3, 'Cooperative,Word,Party', 0);
    INSERT INTO "Games" ("Id", "AveragePlayTime", "CodeKey", "Complexity", "DefaultRoundLengthSeconds", "Description", "Icon", "MaxPlayers", "MinPlayers", "Name", "SettingsMetadataJson", "Status", "Tags", "TimerType")
    VALUES ('CodeBreaker', 15, NULL, 2, 0, 'Hack the system by deducing the secret color sequence.', '🔐', 6, 2, 'Code Breaker', NULL, 3, 'Logic,Deduction,Puzzle', 0);
    INSERT INTO "Games" ("Id", "AveragePlayTime", "CodeKey", "Complexity", "DefaultRoundLengthSeconds", "Description", "Icon", "MaxPlayers", "MinPlayers", "Name", "SettingsMetadataJson", "Status", "Tags", "TimerType")
    VALUES ('Courtship', 20, NULL, 2, 0, 'Get your love letter delivered while exposing your rivals.', '💌', 4, 2, 'Courtship', NULL, 3, 'Deduction,Cards,Risk', 0);
    INSERT INTO "Games" ("Id", "AveragePlayTime", "CodeKey", "Complexity", "DefaultRoundLengthSeconds", "Description", "Icon", "MaxPlayers", "MinPlayers", "Name", "SettingsMetadataJson", "Status", "Tags", "TimerType")
    VALUES ('Farkle', 20, NULL, 1, 0, 'Push your luck with six dice to score 10,000 points!', '🎲', 8, 1, 'Farkle', NULL, 3, 'Dice,Party,Luck', 0);
    INSERT INTO "Games" ("Id", "AveragePlayTime", "CodeKey", "Complexity", "DefaultRoundLengthSeconds", "Description", "Icon", "MaxPlayers", "MinPlayers", "Name", "SettingsMetadataJson", "Status", "Tags", "TimerType")
    VALUES ('FoleyArtist', 20, NULL, 1, 60, 'Make sound effects for silent clips and have your friends guess the scene.', '🎤', 8, 3, 'Foley Artist', NULL, 3, 'Audio,Party,Creative', 2);
    INSERT INTO "Games" ("Id", "AveragePlayTime", "CodeKey", "Complexity", "DefaultRoundLengthSeconds", "Description", "Icon", "MaxPlayers", "MinPlayers", "Name", "SettingsMetadataJson", "Status", "Tags", "TimerType")
    VALUES ('LostInTranslation', 15, NULL, 1, 60, 'Identify famous phrases garbled by too many translations.', '🗣️', 12, 3, 'Lost in Translation', NULL, 3, 'Word,Humor,Puzzle', 2);
    INSERT INTO "Games" ("Id", "AveragePlayTime", "CodeKey", "Complexity", "DefaultRoundLengthSeconds", "Description", "Icon", "MaxPlayers", "MinPlayers", "Name", "SettingsMetadataJson", "Status", "Tags", "TimerType")
    VALUES ('SilentHeist', 10, NULL, 3, 180, 'Coordinate moves in silence to rob a secure facility.', '🤫', 8, 1, 'Silent Heist', NULL, 3, 'Coop,Real-time,Puzzle', 2);
    INSERT INTO "Games" ("Id", "AveragePlayTime", "CodeKey", "Complexity", "DefaultRoundLengthSeconds", "Description", "Icon", "MaxPlayers", "MinPlayers", "Name", "SettingsMetadataJson", "Status", "Tags", "TimerType")
    VALUES ('Spectrum', 30, NULL, 2, 0, 'Read your team''s mind on a scale of polar opposites.', '🌈', 12, 2, 'Spectrum', NULL, 3, 'Social,Party,Team', 0);
    INSERT INTO "Games" ("Id", "AveragePlayTime", "CodeKey", "Complexity", "DefaultRoundLengthSeconds", "Description", "Icon", "MaxPlayers", "MinPlayers", "Name", "SettingsMetadataJson", "Status", "Tags", "TimerType")
    VALUES ('Terminal', 20, NULL, 3, 300, 'One Hacker. Four Agents. Keep talking to survive the infiltration.', '📟', 5, 2, 'Terminal', NULL, 3, 'Cooperative,Asymmetric,Real-Time', 2);
    INSERT INTO "Games" ("Id", "AveragePlayTime", "CodeKey", "Complexity", "DefaultRoundLengthSeconds", "Description", "Icon", "MaxPlayers", "MinPlayers", "Name", "SettingsMetadataJson", "Status", "Tags", "TimerType")
    VALUES ('Yacht', 30, NULL, 1, 0, 'Classic dice rolling strategy. Get five of a kind!', '⛵', 8, 1, 'Yacht', NULL, 3, 'Dice,Strategy,Classic', 0);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260119041642_EnableRlsOnEfHistory') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260119041642_EnableRlsOnEfHistory', '8.0.0');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;


DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260125052304_RemoveCheckersAndPromoteGames') THEN
    DELETE FROM "Games"
    WHERE "Id" = 'Checkers';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260125052304_RemoveCheckersAndPromoteGames') THEN
    UPDATE "Games" SET "Status" = 1
    WHERE "Id" = 'BreakingNews';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260125052304_RemoveCheckersAndPromoteGames') THEN
    UPDATE "Games" SET "Tags" = 'Deduction,Cards,Risk'
    WHERE "Id" = 'Courtship';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260125052304_RemoveCheckersAndPromoteGames') THEN
    UPDATE "Games" SET "Status" = 1
    WHERE "Id" = 'Deepfake';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260125052304_RemoveCheckersAndPromoteGames') THEN
    UPDATE "Games" SET "Tags" = 'Dice,Party,Luck'
    WHERE "Id" = 'Farkle';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260125052304_RemoveCheckersAndPromoteGames') THEN
    UPDATE "Games" SET "Status" = 1
    WHERE "Id" = 'FourInARow';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260125052304_RemoveCheckersAndPromoteGames') THEN
    UPDATE "Games" SET "Status" = 1
    WHERE "Id" = 'GreatMinds';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260125052304_RemoveCheckersAndPromoteGames') THEN
    UPDATE "Games" SET "Status" = 1
    WHERE "Id" = 'NomDeCode';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260125052304_RemoveCheckersAndPromoteGames') THEN
    UPDATE "Games" SET "Status" = 1
    WHERE "Id" = 'OneAndOnly';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260125052304_RemoveCheckersAndPromoteGames') THEN
    UPDATE "Games" SET "Status" = 1
    WHERE "Id" = 'Pictophone';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260125052304_RemoveCheckersAndPromoteGames') THEN
    UPDATE "Games" SET "Status" = 1
    WHERE "Id" = 'Poppycock';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260125052304_RemoveCheckersAndPromoteGames') THEN
    UPDATE "Games" SET "Status" = 1
    WHERE "Id" = 'Scatterbrain';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260125052304_RemoveCheckersAndPromoteGames') THEN
    UPDATE "Games" SET "Tags" = 'Coop,Real-time,Puzzle'
    WHERE "Id" = 'SilentHeist';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260125052304_RemoveCheckersAndPromoteGames') THEN
    UPDATE "Games" SET "Tags" = 'Social,Party,Team'
    WHERE "Id" = 'Spectrum';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260125052304_RemoveCheckersAndPromoteGames') THEN
    UPDATE "Games" SET "Status" = 1
    WHERE "Id" = 'SushiTrain';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260125052304_RemoveCheckersAndPromoteGames') THEN
    UPDATE "Games" SET "Status" = 1
    WHERE "Id" = 'Symbology';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260125052304_RemoveCheckersAndPromoteGames') THEN
    UPDATE "Games" SET "Status" = 1
    WHERE "Id" = 'UniversalTranslator';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260125052304_RemoveCheckersAndPromoteGames') THEN
    UPDATE "Games" SET "Status" = 1
    WHERE "Id" = 'Warships';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260125052304_RemoveCheckersAndPromoteGames') THEN
    UPDATE "Games" SET "Status" = 1
    WHERE "Id" = 'Wisecrack';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260125052304_RemoveCheckersAndPromoteGames') THEN
    UPDATE "Games" SET "Description" = 'Classic dice rolling strategy. Get five of a kind!', "Tags" = 'Dice,Strategy,Classic'
    WHERE "Id" = 'Yacht';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260125052304_RemoveCheckersAndPromoteGames') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260125052304_RemoveCheckersAndPromoteGames', '8.0.0');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;


DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260130053101_RevertTestingGamesToDev') THEN
    UPDATE "Games" SET "Status" = 2
    WHERE "Id" = 'BreakingNews';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260130053101_RevertTestingGamesToDev') THEN
    UPDATE "Games" SET "Status" = 2
    WHERE "Id" = 'Deepfake';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260130053101_RevertTestingGamesToDev') THEN
    UPDATE "Games" SET "Status" = 2
    WHERE "Id" = 'FourInARow';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260130053101_RevertTestingGamesToDev') THEN
    UPDATE "Games" SET "Status" = 2
    WHERE "Id" = 'GreatMinds';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260130053101_RevertTestingGamesToDev') THEN
    UPDATE "Games" SET "Status" = 2
    WHERE "Id" = 'NomDeCode';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260130053101_RevertTestingGamesToDev') THEN
    UPDATE "Games" SET "Status" = 2
    WHERE "Id" = 'OneAndOnly';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260130053101_RevertTestingGamesToDev') THEN
    UPDATE "Games" SET "Status" = 2
    WHERE "Id" = 'Pictophone';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260130053101_RevertTestingGamesToDev') THEN
    UPDATE "Games" SET "Status" = 2
    WHERE "Id" = 'Poppycock';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260130053101_RevertTestingGamesToDev') THEN
    UPDATE "Games" SET "Status" = 2
    WHERE "Id" = 'Scatterbrain';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260130053101_RevertTestingGamesToDev') THEN
    UPDATE "Games" SET "Status" = 2
    WHERE "Id" = 'SushiTrain';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260130053101_RevertTestingGamesToDev') THEN
    UPDATE "Games" SET "Status" = 2
    WHERE "Id" = 'Symbology';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260130053101_RevertTestingGamesToDev') THEN
    UPDATE "Games" SET "Status" = 2
    WHERE "Id" = 'UniversalTranslator';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260130053101_RevertTestingGamesToDev') THEN
    UPDATE "Games" SET "Status" = 2
    WHERE "Id" = 'Warships';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260130053101_RevertTestingGamesToDev') THEN
    UPDATE "Games" SET "Status" = 2
    WHERE "Id" = 'Wisecrack';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260130053101_RevertTestingGamesToDev') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260130053101_RevertTestingGamesToDev', '8.0.0');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;


DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260304060725_RestoreEmojisToIcons') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260304060725_RestoreEmojisToIcons', '8.0.0');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;


DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260304155016_ForceRefreshEmojis') THEN
    UPDATE "Games" SET "Icon" = '🧠'
    WHERE "Id" = 'Scatterbrain';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260304155016_ForceRefreshEmojis') THEN
    UPDATE "Games" SET "Icon" = '🔤'
    WHERE "Id" = 'Babble';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260304155016_ForceRefreshEmojis') THEN
    UPDATE "Games" SET "Icon" = '🃏'
    WHERE "Id" = 'OneAndOnly';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260304155016_ForceRefreshEmojis') THEN
    UPDATE "Games" SET "Icon" = '🕵️‍♀️'
    WHERE "Id" = 'NomDeCode';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260304155016_ForceRefreshEmojis') THEN
    UPDATE "Games" SET "Icon" = '🚢'
    WHERE "Id" = 'Warships';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260304155016_ForceRefreshEmojis') THEN
    UPDATE "Games" SET "Icon" = '🔴'
    WHERE "Id" = 'FourInARow';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260304155016_ForceRefreshEmojis') THEN
    UPDATE "Games" SET "Icon" = '👽'
    WHERE "Id" = 'UniversalTranslator';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260304155016_ForceRefreshEmojis') THEN
    UPDATE "Games" SET "Icon" = '🎨'
    WHERE "Id" = 'Pictophone';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260304155016_ForceRefreshEmojis') THEN
    UPDATE "Games" SET "Icon" = '💬'
    WHERE "Id" = 'Wisecrack';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260304155016_ForceRefreshEmojis') THEN
    UPDATE "Games" SET "Icon" = '🤥'
    WHERE "Id" = 'Poppycock';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260304155016_ForceRefreshEmojis') THEN
    UPDATE "Games" SET "Icon" = '💡'
    WHERE "Id" = 'Symbology';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260304155016_ForceRefreshEmojis') THEN
    UPDATE "Games" SET "Icon" = '📰'
    WHERE "Id" = 'BreakingNews';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260304155016_ForceRefreshEmojis') THEN
    UPDATE "Games" SET "Icon" = '🤖'
    WHERE "Id" = 'Deepfake';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260304155016_ForceRefreshEmojis') THEN
    UPDATE "Games" SET "Icon" = '🍣'
    WHERE "Id" = 'SushiTrain';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260304155016_ForceRefreshEmojis') THEN
    UPDATE "Games" SET "Icon" = '🌟'
    WHERE "Id" = 'GreatMinds';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260304155016_ForceRefreshEmojis') THEN
    UPDATE "Games" SET "Icon" = '🎲'
    WHERE "Id" = 'Farkle';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260304155016_ForceRefreshEmojis') THEN
    UPDATE "Games" SET "Icon" = '🌈'
    WHERE "Id" = 'Spectrum';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260304155016_ForceRefreshEmojis') THEN
    UPDATE "Games" SET "Icon" = '💌'
    WHERE "Id" = 'Courtship';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260304155016_ForceRefreshEmojis') THEN
    UPDATE "Games" SET "Icon" = '🤫'
    WHERE "Id" = 'SilentHeist';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260304155016_ForceRefreshEmojis') THEN
    UPDATE "Games" SET "Icon" = '🎤'
    WHERE "Id" = 'FoleyArtist';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260304155016_ForceRefreshEmojis') THEN
    UPDATE "Games" SET "Icon" = '🗣️'
    WHERE "Id" = 'LostInTranslation';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260304155016_ForceRefreshEmojis') THEN
    UPDATE "Games" SET "Icon" = '🔐'
    WHERE "Id" = 'CodeBreaker';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260304155016_ForceRefreshEmojis') THEN
    UPDATE "Games" SET "Icon" = '⛵'
    WHERE "Id" = 'Yacht';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260304155016_ForceRefreshEmojis') THEN
    UPDATE "Games" SET "Icon" = '📟'
    WHERE "Id" = 'Terminal';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260304155016_ForceRefreshEmojis') THEN
    UPDATE "Games" SET "Icon" = '🍀'
    WHERE "Id" = 'CloverMinded';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260304155016_ForceRefreshEmojis') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260304155016_ForceRefreshEmojis', '8.0.0');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;


DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260326060419_AddCloverMindedSettingsMetadata') THEN
    UPDATE "Games" SET "SettingsMetadataJson" = '[{"id":"cloverAllowPerPlayerSingleCardRotation","label":"Per-Hand Single-Card Rotation","type":"checkbox","default":true}]'
    WHERE "Id" = 'CloverMinded';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260326060419_AddCloverMindedSettingsMetadata') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260326060419_AddCloverMindedSettingsMetadata', '8.0.0');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;


DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260404044614_PromoteCloverMindedToTesting') THEN
    UPDATE "Games" SET "Status" = 1
    WHERE "Id" = 'CloverMinded';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260404044614_PromoteCloverMindedToTesting') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260404044614_PromoteCloverMindedToTesting', '8.0.0');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;


DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260426211257_UpdateFarkleStatus') THEN
    UPDATE "Games" SET "Status" = 1
    WHERE "Id" = 'Farkle';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260426211257_UpdateFarkleStatus') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260426211257_UpdateFarkleStatus', '8.0.0');
    END IF;
END $EF$;
COMMIT;

