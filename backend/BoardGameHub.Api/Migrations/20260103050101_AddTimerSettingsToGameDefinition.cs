using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BoardGameHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTimerSettingsToGameDefinition : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DefaultRoundLengthSeconds",
                table: "Games",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TimerType",
                table: "Games",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Babble",
                columns: new[] { "DefaultRoundLengthSeconds", "Status", "TimerType" },
                values: new object[] { 180, 1, 2 });

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "BreakingNews",
                columns: new[] { "DefaultRoundLengthSeconds", "Status", "TimerType" },
                values: new object[] { 60, 1, 2 });

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Checkers",
                columns: new[] { "DefaultRoundLengthSeconds", "TimerType" },
                values: new object[] { 0, 0 });

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Deepfake",
                columns: new[] { "DefaultRoundLengthSeconds", "Status", "TimerType" },
                values: new object[] { 0, 1, 1 });

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "FourInARow",
                columns: new[] { "DefaultRoundLengthSeconds", "TimerType" },
                values: new object[] { 0, 0 });

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "GreatMinds",
                columns: new[] { "DefaultRoundLengthSeconds", "Status", "TimerType" },
                values: new object[] { 0, 1, 0 });

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "NomDeCode",
                columns: new[] { "DefaultRoundLengthSeconds", "TimerType" },
                values: new object[] { 0, 1 });

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "OneAndOnly",
                columns: new[] { "DefaultRoundLengthSeconds", "Status", "TimerType" },
                values: new object[] { 0, 1, 0 });

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Pictophone",
                columns: new[] { "DefaultRoundLengthSeconds", "Status", "TimerType" },
                values: new object[] { 60, 1, 2 });

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Poppycock",
                columns: new[] { "DefaultRoundLengthSeconds", "Status", "TimerType" },
                values: new object[] { 0, 1, 0 });

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Scatterbrain",
                columns: new[] { "DefaultRoundLengthSeconds", "Status", "TimerType" },
                values: new object[] { 180, 1, 2 });

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "SushiTrain",
                columns: new[] { "DefaultRoundLengthSeconds", "Status", "TimerType" },
                values: new object[] { 0, 1, 0 });

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Symbology",
                columns: new[] { "DefaultRoundLengthSeconds", "Status", "TimerType" },
                values: new object[] { 0, 1, 1 });

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "UniversalTranslator",
                columns: new[] { "DefaultRoundLengthSeconds", "Status", "TimerType" },
                values: new object[] { 0, 1, 1 });

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Warships",
                columns: new[] { "DefaultRoundLengthSeconds", "TimerType" },
                values: new object[] { 0, 0 });

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Wisecrack",
                columns: new[] { "DefaultRoundLengthSeconds", "Status", "TimerType" },
                values: new object[] { 90, 1, 2 });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DefaultRoundLengthSeconds",
                table: "Games");

            migrationBuilder.DropColumn(
                name: "TimerType",
                table: "Games");

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Babble",
                column: "Status",
                value: 0);

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "BreakingNews",
                column: "Status",
                value: 0);

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Deepfake",
                column: "Status",
                value: 0);

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "GreatMinds",
                column: "Status",
                value: 0);

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "OneAndOnly",
                column: "Status",
                value: 0);

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Pictophone",
                column: "Status",
                value: 0);

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Poppycock",
                column: "Status",
                value: 0);

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Scatterbrain",
                column: "Status",
                value: 0);

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "SushiTrain",
                column: "Status",
                value: 0);

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Symbology",
                column: "Status",
                value: 0);

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "UniversalTranslator",
                column: "Status",
                value: 0);

            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Wisecrack",
                column: "Status",
                value: 0);
        }
    }
}
