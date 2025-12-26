using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BoardGameHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddGameAttributes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AveragePlayTime",
                table: "Games",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "CodeKey",
                table: "Games",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Complexity",
                table: "Games",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "MaxPlayers",
                table: "Games",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "MinPlayers",
                table: "Games",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Tags",
                table: "Games",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Babble",
                columns: new[] { "AveragePlayTime", "CodeKey", "Complexity", "MaxPlayers", "MinPlayers", "Tags" },
                values: new object[] { 10, null, 2, 8, 1, "Word,Puzzle,Timed" });

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "BreakingNews",
                columns: new[] { "AveragePlayTime", "CodeKey", "Complexity", "MaxPlayers", "MinPlayers", "Tags" },
                values: new object[] { 15, null, 1, 10, 3, "Humor,Social,Party,Timed" });

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Checkers",
                columns: new[] { "AveragePlayTime", "CodeKey", "Complexity", "MaxPlayers", "MinPlayers", "Tags" },
                values: new object[] { 15, null, 2, 2, 2, "Strategy,Classic" });

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Deepfake",
                columns: new[] { "AveragePlayTime", "CodeKey", "Complexity", "MaxPlayers", "MinPlayers", "Tags" },
                values: new object[] { 20, null, 2, 10, 4, "Social Deduction,Drawing,AI" });

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "FourInARow",
                columns: new[] { "AveragePlayTime", "CodeKey", "Complexity", "MaxPlayers", "MinPlayers", "Tags" },
                values: new object[] { 5, null, 1, 2, 2, "Strategy,Puzzle" });

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "GreatMinds",
                columns: new[] { "AveragePlayTime", "CodeKey", "Complexity", "Icon", "MaxPlayers", "MinPlayers", "Tags" },
                values: new object[] { 20, null, 2, "🌟", 4, 2, "Cooperative,Card Game,Social" });

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "NomDeCode",
                columns: new[] { "AveragePlayTime", "CodeKey", "Complexity", "MaxPlayers", "MinPlayers", "Tags" },
                values: new object[] { 25, null, 2, 8, 4, "Teams,Word,Social" });

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "OneAndOnly",
                columns: new[] { "AveragePlayTime", "CodeKey", "Complexity", "MaxPlayers", "MinPlayers", "Tags" },
                values: new object[] { 20, null, 1, 7, 3, "Cooperative,Word,Social" });

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Pictophone",
                columns: new[] { "AveragePlayTime", "CodeKey", "Complexity", "MaxPlayers", "MinPlayers", "Tags" },
                values: new object[] { 30, null, 1, 12, 4, "Drawing,Party,Humor" });

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Poppycock",
                columns: new[] { "AveragePlayTime", "CodeKey", "Complexity", "MaxPlayers", "MinPlayers", "Tags" },
                values: new object[] { 30, null, 2, 8, 3, "Bluffing,Word,Social" });

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Scatterbrain",
                columns: new[] { "AveragePlayTime", "CodeKey", "Complexity", "MaxPlayers", "MinPlayers", "Tags" },
                values: new object[] { 15, null, 1, 10, 2, "Word,Party,Timed" });

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "SushiTrain",
                columns: new[] { "AveragePlayTime", "CodeKey", "Complexity", "MaxPlayers", "MinPlayers", "Tags" },
                values: new object[] { 25, null, 2, 5, 2, "Drafting,Card Game,Family" });

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Symbology",
                columns: new[] { "AveragePlayTime", "CodeKey", "Complexity", "MaxPlayers", "MinPlayers", "Tags" },
                values: new object[] { 20, null, 2, 8, 3, "Cooperative,Communication,Icons" });

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "UniversalTranslator",
                columns: new[] { "AveragePlayTime", "CodeKey", "Complexity", "MaxPlayers", "MinPlayers", "Tags" },
                values: new object[] { 45, null, 3, 8, 4, "Social Deduction,Sci-Fi,Bluffing" });

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Warships",
                columns: new[] { "AveragePlayTime", "CodeKey", "Complexity", "MaxPlayers", "MinPlayers", "Tags" },
                values: new object[] { 15, null, 2, 2, 2, "Strategy,Combat" });

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Wisecrack",
                columns: new[] { "AveragePlayTime", "CodeKey", "Complexity", "MaxPlayers", "MinPlayers", "Tags" },
                values: new object[] { 20, null, 1, 8, 3, "Humor,Social,Party" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AveragePlayTime",
                table: "Games");

            migrationBuilder.DropColumn(
                name: "CodeKey",
                table: "Games");

            migrationBuilder.DropColumn(
                name: "Complexity",
                table: "Games");

            migrationBuilder.DropColumn(
                name: "MaxPlayers",
                table: "Games");

            migrationBuilder.DropColumn(
                name: "MinPlayers",
                table: "Games");

            migrationBuilder.DropColumn(
                name: "Tags",
                table: "Games");

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "GreatMinds",
                column: "Icon",
                value: "🧠");
        }
    }
}
