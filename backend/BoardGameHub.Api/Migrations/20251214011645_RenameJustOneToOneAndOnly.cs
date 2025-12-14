using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BoardGameHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class RenameJustOneToOneAndOnly : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "JustOne");

            migrationBuilder.InsertData(
                table: "Games",
                columns: new[] { "Id", "Description", "Icon", "Name", "Status" },
                values: new object[] { "OneAndOnly", "Work together to guess the mystery word by writing unique one-word clues.", "🃏", "One & Only", 0 });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "OneAndOnly");

            migrationBuilder.InsertData(
                table: "Games",
                columns: new[] { "Id", "Description", "Icon", "Name", "Status" },
                values: new object[] { "JustOne", "Work together to guess the mystery word by writing unique one-word clues.", "🃏", "Just One", 0 });
        }
    }
}
