using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BoardGameHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class RenameConnect4ToFourInARow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Connect4");

            migrationBuilder.InsertData(
                table: "Games",
                columns: new[] { "Id", "Description", "Icon", "Name", "Status" },
                values: new object[] { "FourInARow", "Connect four of your checkers in a row.", "🔴", "Four in a Row", 2 });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "FourInARow");

            migrationBuilder.InsertData(
                table: "Games",
                columns: new[] { "Id", "Description", "Icon", "Name", "Status" },
                values: new object[] { "Connect4", "Connect four of your checkers in a row.", "🔴", "Connect 4", 2 });
        }
    }
}
