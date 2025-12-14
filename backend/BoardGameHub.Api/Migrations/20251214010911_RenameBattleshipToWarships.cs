using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace BoardGameHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class RenameBattleshipToWarships : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Battleship");

            migrationBuilder.DeleteData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "WordHunt");

            migrationBuilder.InsertData(
                table: "Games",
                columns: new[] { "Id", "Description", "Icon", "Name", "Status" },
                values: new object[,]
                {
                    { "Babble", "Find as many words as you can in the grid of letters before time runs out!", "🔤", "Babble", 0 },
                    { "GreatMinds", "Synchronize your minds and play cards in ascending order without speaking!", "🧠", "Great Minds", 0 },
                    { "SushiTrain", "Draft the best meal from the passing conveyor belt!", "🍣", "Sushi Train!", 0 },
                    { "Warships", "Sink your opponent's fleet before they sink yours.", "🚢", "Warships", 2 }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Babble");

            migrationBuilder.DeleteData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "GreatMinds");

            migrationBuilder.DeleteData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "SushiTrain");

            migrationBuilder.DeleteData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Warships");

            migrationBuilder.InsertData(
                table: "Games",
                columns: new[] { "Id", "Description", "Icon", "Name", "Status" },
                values: new object[,]
                {
                    { "Battleship", "Sink your opponent's fleet before they sink yours.", "🚢", "Battleship", 2 },
                    { "WordHunt", "Find as many words as you can in the grid of letters before time runs out!", "🔤", "Word Hunt", 0 }
                });
        }
    }
}
