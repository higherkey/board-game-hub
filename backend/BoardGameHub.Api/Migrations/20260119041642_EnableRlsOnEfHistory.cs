using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace BoardGameHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class EnableRlsOnEfHistory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("ALTER TABLE \"__EFMigrationsHistory\" ENABLE ROW LEVEL SECURITY;");
            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "BreakingNews",
                column: "Status",
                value: 2);

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Deepfake",
                column: "Status",
                value: 2);

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "GreatMinds",
                column: "Status",
                value: 2);

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "OneAndOnly",
                column: "Status",
                value: 2);

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Pictophone",
                column: "Status",
                value: 2);

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Poppycock",
                column: "Status",
                value: 2);

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Scatterbrain",
                column: "Status",
                value: 2);

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "SushiTrain",
                column: "Status",
                value: 2);

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Symbology",
                column: "Status",
                value: 2);

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "UniversalTranslator",
                column: "Status",
                value: 2);

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Wisecrack",
                column: "Status",
                value: 2);

            migrationBuilder.InsertData(
                table: "Games",
                columns: new[] { "Id", "AveragePlayTime", "CodeKey", "Complexity", "DefaultRoundLengthSeconds", "Description", "Icon", "MaxPlayers", "MinPlayers", "Name", "SettingsMetadataJson", "Status", "Tags", "TimerType" },
                values: new object[,]
                {
                    { "CloverMinded", 25, null, 2, 0, "Work together to associate keywords on your clover board.", "🍀", 6, 3, "Clover-Minded", null, 3, "Cooperative,Word,Party", 0 },
                    { "CodeBreaker", 15, null, 2, 0, "Hack the system by deducing the secret color sequence.", "🔐", 6, 2, "Code Breaker", null, 3, "Logic,Deduction,Puzzle", 0 },
                    { "Courtship", 20, null, 2, 0, "Get your love letter delivered while exposing your rivals.", "💌", 4, 2, "Courtship", null, 3, "Deduction,Cards,Risk", 0 },
                    { "Farkle", 20, null, 1, 0, "Push your luck with six dice to score 10,000 points!", "🎲", 8, 1, "Farkle", null, 3, "Dice,Party,Luck", 0 },
                    { "FoleyArtist", 20, null, 1, 60, "Make sound effects for silent clips and have your friends guess the scene.", "🎤", 8, 3, "Foley Artist", null, 3, "Audio,Party,Creative", 2 },
                    { "LostInTranslation", 15, null, 1, 60, "Identify famous phrases garbled by too many translations.", "🗣️", 12, 3, "Lost in Translation", null, 3, "Word,Humor,Puzzle", 2 },
                    { "SilentHeist", 10, null, 3, 180, "Coordinate moves in silence to rob a secure facility.", "🤫", 8, 1, "Silent Heist", null, 3, "Coop,Real-time,Puzzle", 2 },
                    { "Spectrum", 30, null, 2, 0, "Read your team's mind on a scale of polar opposites.", "🌈", 12, 2, "Spectrum", null, 3, "Social,Party,Team", 0 },
                    { "Terminal", 20, null, 3, 300, "One Hacker. Four Agents. Keep talking to survive the infiltration.", "📟", 5, 2, "Terminal", null, 3, "Cooperative,Asymmetric,Real-Time", 2 },
                    { "Yacht", 30, null, 1, 0, "Classic dice rolling strategy. Get five of a kind!", "⛵", 8, 1, "Yacht", null, 3, "Dice,Strategy,Classic", 0 }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "CloverMinded");

            migrationBuilder.DeleteData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "CodeBreaker");

            migrationBuilder.DeleteData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Courtship");

            migrationBuilder.DeleteData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Farkle");

            migrationBuilder.DeleteData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "FoleyArtist");

            migrationBuilder.DeleteData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "LostInTranslation");

            migrationBuilder.DeleteData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "SilentHeist");

            migrationBuilder.DeleteData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Spectrum");

            migrationBuilder.DeleteData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Terminal");

            migrationBuilder.DeleteData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Yacht");

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "BreakingNews",
                column: "Status",
                value: 1);

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Deepfake",
                column: "Status",
                value: 1);

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "GreatMinds",
                column: "Status",
                value: 1);

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "OneAndOnly",
                column: "Status",
                value: 1);

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Pictophone",
                column: "Status",
                value: 1);

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Poppycock",
                column: "Status",
                value: 1);

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Scatterbrain",
                column: "Status",
                value: 1);

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "SushiTrain",
                column: "Status",
                value: 1);

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Symbology",
                column: "Status",
                value: 1);

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "UniversalTranslator",
                column: "Status",
                value: 1);

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Wisecrack",
                column: "Status",
                value: 1);
        }
    }
}
