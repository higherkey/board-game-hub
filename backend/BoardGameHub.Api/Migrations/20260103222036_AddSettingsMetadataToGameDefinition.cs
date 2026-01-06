using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BoardGameHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddSettingsMetadataToGameDefinition : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SettingsMetadataJson",
                table: "Games",
                type: "text",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Babble",
                column: "SettingsMetadataJson",
                value: "[{\"id\":\"boardSize\",\"label\":\"Board Size\",\"type\":\"select\",\"options\":[{\"label\":\"4x4 (Classic)\",\"value\":4},{\"label\":\"5x5 (Big Babble)\",\"value\":5},{\"label\":\"6x6 (Super Babble)\",\"value\":6}]}]");

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "BreakingNews",
                column: "SettingsMetadataJson",
                value: null);

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Checkers",
                column: "SettingsMetadataJson",
                value: null);

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Deepfake",
                column: "SettingsMetadataJson",
                value: null);

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "FourInARow",
                column: "SettingsMetadataJson",
                value: null);

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "GreatMinds",
                column: "SettingsMetadataJson",
                value: null);

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "NomDeCode",
                column: "SettingsMetadataJson",
                value: null);

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "OneAndOnly",
                column: "SettingsMetadataJson",
                value: null);

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Pictophone",
                column: "SettingsMetadataJson",
                value: null);

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Poppycock",
                column: "SettingsMetadataJson",
                value: null);

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Scatterbrain",
                column: "SettingsMetadataJson",
                value: "[{\"id\":\"letterMode\",\"label\":\"Letter Difficulty\",\"type\":\"select\",\"options\":[{\"label\":\"Normal (No Q, V,X, Z)\",\"value\":0},{\"label\":\"Hard (Only Q, V, X, Z...)\",\"value\":1},{\"label\":\"True Random\",\"value\":2}]}]");

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "SushiTrain",
                column: "SettingsMetadataJson",
                value: null);

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Symbology",
                column: "SettingsMetadataJson",
                value: null);

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "UniversalTranslator",
                column: "SettingsMetadataJson",
                value: null);

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Warships",
                column: "SettingsMetadataJson",
                value: null);

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Wisecrack",
                column: "SettingsMetadataJson",
                value: null);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SettingsMetadataJson",
                table: "Games");
        }
    }
}
