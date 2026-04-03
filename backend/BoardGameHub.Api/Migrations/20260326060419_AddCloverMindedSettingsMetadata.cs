using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BoardGameHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCloverMindedSettingsMetadata : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "CloverMinded",
                column: "SettingsMetadataJson",
                value: "[{\"id\":\"cloverAllowPerPlayerSingleCardRotation\",\"label\":\"Per-Hand Single-Card Rotation\",\"type\":\"checkbox\",\"default\":true}]");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "CloverMinded",
                column: "SettingsMetadataJson",
                value: null);
        }
    }
}
