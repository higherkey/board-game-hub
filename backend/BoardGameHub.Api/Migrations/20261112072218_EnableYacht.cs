using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BoardGameHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class EnableYacht : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Yacht",
                column: "Status",
                value: 1);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Yacht",
                column: "Status",
                value: 3);
        }
    }
}
