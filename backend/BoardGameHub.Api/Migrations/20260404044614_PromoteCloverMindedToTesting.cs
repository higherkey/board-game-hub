using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BoardGameHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class PromoteCloverMindedToTesting : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "CloverMinded",
                column: "Status",
                value: 1);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "CloverMinded",
                column: "Status",
                value: 3);
        }
    }
}
